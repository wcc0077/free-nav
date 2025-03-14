import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export function activate(context: vscode.ExtensionContext) {
  console.log('插件 "free-nav" 已激活');

  // 注册Hello World命令
  const helloWorldCommand = vscode.commands.registerCommand('free-nav.helloWorld', () => {
    vscode.window.showInformationMessage('Hello World from Free Nav!');
  });

  // 注册视图提供者
  const freeNavViewProvider = new FreeNavViewProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('freeNavView', freeNavViewProvider)
  );

  context.subscriptions.push(helloWorldCommand);
}

// 视图提供者类
class FreeNavViewProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri]
    };

    // 设置HTML内容
    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    // 处理来自webview的消息
    const messageListener = webviewView.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.command) {
          case 'getWorkspaceFiles':
            await this._getWorkspaceFiles(webviewView.webview);
            return;
          case 'openFile':
            if (message.path) {
              const document = await vscode.workspace.openTextDocument(message.path);
              await vscode.window.showTextDocument(document);
            }
            return;
          case 'getThemeColors':
            this._sendThemeColors(webviewView.webview);
            return;
        }
      }
    );

    // 初始加载时发送文件系统数据
    if (this._view) {
      this._getWorkspaceFiles(this._view.webview);
    }
  }

  // 获取VSCode主题颜色并发送到webview
  private _sendThemeColors(webview: vscode.Webview) {
    const themeColors = {
      // 背景颜色
      background: this._getColor('editor.background'),
      // 节点颜色
      fileNodeBg: this._getColor('editorGroup.dropBackground', '#e3f2fd'),
      fileNodeBorder: this._getColor('statusBarItem.remoteBackground', '#42a5f5'),
      dirNodeBg: this._getColor('activityBar.dropBackground', '#e8f5e9'),
      dirNodeBorder: this._getColor('statusBar.background', '#66bb6a'),
      // 文本颜色
      foreground: this._getColor('editor.foreground'),
      // 连接线颜色
      lineColor: this._getColor('editorIndentGuide.background', '#ccc'),
      // 高亮颜色
      hoverBackground: this._getColor('list.hoverBackground'),
      // 阴影颜色
      shadow: this._getColor('widget.shadow', 'rgba(0,0,0,0.2)'),
    };

    webview.postMessage({ 
      command: 'themeColors', 
      colors: themeColors 
    });
  }

  // 获取主题颜色，带默认值
  private _getColor(colorId: string, defaultColor: string = '#ffffff'): string {
    const color = vscode.window.activeColorTheme.getColor(colorId);
    if (color) {
      return color.toString();
    }
    return defaultColor;
  }

  // 获取工作区文件并发送到webview
  private async _getWorkspaceFiles(webview: vscode.Webview) {
    if (!vscode.workspace.workspaceFolders) {
      webview.postMessage({ command: 'fileSystemData', data: [] });
      return;
    }

    // 获取当前工作区的根目录
    const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
    
    try {
      // 递归获取文件系统结构
      const fileStructure = await this._getDirectoryStructure(workspaceRoot, workspaceRoot);
      
      // 发送数据到webview
      webview.postMessage({ 
        command: 'fileSystemData', 
        data: fileStructure 
      });

      // 发送主题颜色
      this._sendThemeColors(webview);
    } catch (error) {
      console.error('获取文件系统数据失败:', error);
      webview.postMessage({ 
        command: 'error', 
        message: '获取文件系统数据失败' 
      });
    }
  }

  // 递归获取目录结构
  private async _getDirectoryStructure(rootPath: string, currentPath: string): Promise<any[]> {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });
    const result = [];

    for (const entry of entries) {
      // 跳过隐藏文件和node_modules
      if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist') {
        continue;
      }

      const fullPath = path.join(currentPath, entry.name);
      const relativePath = path.relative(rootPath, fullPath);
      
      if (entry.isDirectory()) {
        const children = await this._getDirectoryStructure(rootPath, fullPath);
        result.push({
          id: relativePath || entry.name,
          type: 'directory',
          name: entry.name,
          path: fullPath,
          children
        });
      } else {
        result.push({
          id: relativePath || entry.name,
          type: 'file',
          name: entry.name,
          path: fullPath
        });
      }
    }

    return result;
  }

  private _getHtmlForWebview(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview.js')
    );

    // 添加样式
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'dist', 'style.css')
    );

    const nonce = getNonce();

    return `<!DOCTYPE html>
      <html lang="zh-CN">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
        <title>文件系统导航</title>
        <style>
          body, html {
            height: 100%;
            margin: 0;
            padding: 0;
            overflow: hidden;
          }
          #root {
            width: 100%;
            height: 100%;
          }
        </style>
      </head>
      <body>
        <div id="root"></div>
        <script nonce="${nonce}" src="${scriptUri}"></script>
      </body>
      </html>`;
  }
}

// 生成随机nonce值
function getNonce() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

export function deactivate() {}
