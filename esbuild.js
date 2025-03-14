const esbuild = require('esbuild');
const { join } = require('path');

// 检查是否为监听模式
const watchMode = process.argv.includes('--watch');

// 扩展部分构建配置
const extensionConfig = {
  entryPoints: [join(__dirname, 'src/extension.ts')],
  bundle: true,
  outfile: join(__dirname, 'dist/extension.js'),
  external: ['vscode'],
  format: 'cjs',
  platform: 'node',
  target: 'node12',
};

// WebView部分构建配置
const webviewConfig = {
  entryPoints: [join(__dirname, 'src/webview/index.tsx')],
  bundle: true,
  outfile: join(__dirname, 'dist/webview.js'),
  minify: true,
  format: 'iife',
  target: 'es2020',
};

// 构建函数
async function build() {
  try {
    if (watchMode) {
      // 使用context API进行监听模式
      console.log('启动监听模式...');
      
      // 为扩展部分创建上下文
      const extensionCtx = await esbuild.context(extensionConfig);
      // 为WebView部分创建上下文
      const webviewCtx = await esbuild.context(webviewConfig);
      
      // 首次构建
      await extensionCtx.rebuild();
      await webviewCtx.rebuild();
      
      // 启动监听
      await extensionCtx.watch();
      await webviewCtx.watch();
      
      console.log('构建完成，正在监听文件变化...');
    } else {
      // 正常构建模式
      await esbuild.build(extensionConfig);
      await esbuild.build(webviewConfig);
      console.log('构建完成!');
    }
  } catch (err) {
    console.error('构建失败:', err);
    process.exit(1);
  }
}

build();
