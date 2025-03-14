import * as vscode from 'vscode';

export class HelloWorldPanel {
  public static currentPanel: HelloWorldPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];

  public static createOrShow(extensionUri: vscode.Uri) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    // 如果已经有面板存在，则显示它
    if (HelloWorldPanel.currentPanel) {
      HelloWorldPanel.currentPanel._panel.reveal(column);
      return;
    }

    // 否则，创建一个新的面板
    const panel = vscode.window.createWebviewPanel(
      'helloWorldPanel',
      'Hello World',
      column || vscode.ViewColumn.One,
      {
        // 启用JavaScript
        enableScripts: true,
        // 限制可加载的资源
        localResourceRoots: [extensionUri]
      }
    );

    HelloWorldPanel.currentPanel = new HelloWorldPanel(panel, extensionUri);
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;

    // 设置HTML内容
    this._panel.webview.html = this._getHtmlForWebview(this._panel.webview, extensionUri);

    // 监听面板关闭事件
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
  }

  private _getHtmlForWebview(webview: vscode.Webview, extensionUri: vscode.Uri): string {
    // 获取webview.js文件的路径
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(extensionUri, 'dist', 'webview.js')
    );

    // 使用nonce提高安全性
    const nonce = getNonce();

    return `<!DOCTYPE html>
      <html lang="zh-CN">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}';">
        <title>Hello World</title>
      </head>
      <body>
        <div id="root"></div>
        <script nonce="${nonce}" src="${scriptUri}"></script>
      </body>
      </html>`;
  }

  public dispose() {
    HelloWorldPanel.currentPanel = undefined;

    // 清理资源
    this._panel.dispose();

    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
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