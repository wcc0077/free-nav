import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as vscode from 'vscode';

export class HelloWorldPanel implements vscode.WebviewViewProvider {
  public static readonly viewType = 'free-nav.helloWorldView';

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(webviewView: vscode.WebviewView) {
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri]
    };

    webviewView.webview.html = `
      <!DOCTYPE html>
      <html>
        <body>
          <div id="root"></div>
          <script>
            const root = document.getElementById('root');
            ReactDOM.render(
              React.createElement('h1', null, 'Hello World'),
              root
            );
          </script>
        </body>
      </html>
    `;
  }
}