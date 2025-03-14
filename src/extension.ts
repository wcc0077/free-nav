import * as vscode from 'vscode';
import { join } from 'path';
import { HelloWorldPanel } from './HelloWorldPanel';

export function activate(context: vscode.ExtensionContext) {
  console.log('插件 "free-nav" 已激活 123');

  // 注册Hello World命令
  const helloWorldCommand = vscode.commands.registerCommand('free-nav.helloWorld', () => {
    vscode.window.showInformationMessage('Hello World from Free Nav!');
  });

  // 注册一个命令，用于在侧边栏点击时打开面板
  const openPanelCommand = vscode.commands.registerCommand('freeNavView.open', () => {
    HelloWorldPanel.createOrShow(context.extensionUri);
  });

  // 注册视图提供者
  const freeNavViewProvider = new FreeNavViewProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('freeNavView', freeNavViewProvider)
  );

  context.subscriptions.push(helloWorldCommand, openPanelCommand);
}

class FreeNavViewProvider implements vscode.WebviewViewProvider {
  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    webviewView.webview.options = {
      // 启用JavaScript
      enableScripts: true,
      // 限制可访问的资源
      localResourceRoots: [this._extensionUri]
    };

    // 设置HTML内容
    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
  }

  private _getHtmlForWebview(webview: vscode.Webview): string {
    // 获取webview.js文件的路径
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview.js')
    );

    // 使用nonce提高安全性
    const nonce = getNonce();

    return `<!DOCTYPE html>
      <html lang="zh-CN">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}';">
        <title>Free Nav</title>
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
