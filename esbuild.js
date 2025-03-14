const esbuild = require('esbuild');
const { join } = require('path');
const fs = require('fs');

// 检查是否为监听模式
const watchMode = process.argv.includes('--watch');

// 确保dist目录存在
if (!fs.existsSync(join(__dirname, 'dist'))) {
  fs.mkdirSync(join(__dirname, 'dist'), { recursive: true });
}

// 复制ReactFlow CSS到dist目录
const cssContent = `
/* 基本样式 */
.react-flow__container {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
}

.react-flow__pane {
  z-index: 1;
  cursor: grab;
}

.react-flow__pane.selection {
  cursor: pointer;
}

.react-flow__pane.dragging {
  cursor: grabbing;
}

.react-flow__viewport {
  transform-origin: 0 0;
  z-index: 2;
  pointer-events: none;
}

.react-flow__renderer {
  z-index: 4;
}

.react-flow__selection {
  z-index: 6;
}

.react-flow__nodesselection-rect:focus,
.react-flow__nodesselection-rect:focus-visible {
  outline: none;
}

.react-flow .react-flow__edges {
  pointer-events: none;
  overflow: visible;
}

.react-flow__edge-path,
.react-flow__connection-path {
  stroke: #b1b1b7;
  stroke-width: 1;
  fill: none;
}

.react-flow__edge {
  pointer-events: visibleStroke;
  cursor: pointer;
}

.react-flow__edge.animated path {
  stroke-dasharray: 5;
  animation: dashdraw 0.5s linear infinite;
}

.react-flow__edge.animated path.react-flow__edge-interaction {
  stroke-dasharray: none;
  animation: none;
}

.react-flow__edge.inactive {
  pointer-events: none;
}

.react-flow__edge.selected,
.react-flow__edge:focus,
.react-flow__edge:focus-visible {
  outline: none;
}

.react-flow__edge.selected .react-flow__edge-path,
.react-flow__edge:focus .react-flow__edge-path,
.react-flow__edge:focus-visible .react-flow__edge-path {
  stroke: #555;
}

.react-flow__edge-textwrapper {
  pointer-events: all;
}

.react-flow__edge-text {
  pointer-events: none;
  user-select: none;
}

.react-flow__connection {
  pointer-events: none;
}

.react-flow__connection .animated {
  stroke-dasharray: 5;
  animation: dashdraw 0.5s linear infinite;
}

.react-flow__connectionline {
  z-index: 1001;
}

.react-flow__nodes {
  pointer-events: none;
  transform-origin: 0 0;
}

.react-flow__node {
  position: absolute;
  user-select: none;
  pointer-events: all;
  transform-origin: 0 0;
  box-sizing: border-box;
  cursor: grab;
}

.react-flow__node.dragging {
  cursor: grabbing;
}

.react-flow__nodesselection {
  z-index: 3;
  transform-origin: left top;
  pointer-events: none;
}

.react-flow__nodesselection-rect {
  position: absolute;
  pointer-events: all;
  cursor: grab;
}

.react-flow__handle {
  position: absolute;
  pointer-events: none;
  min-width: 5px;
  min-height: 5px;
}

.react-flow__handle.connectable {
  pointer-events: all;
  cursor: crosshair;
}

.react-flow__handle-bottom {
  top: auto;
  left: 50%;
  bottom: -4px;
  transform: translate(-50%, 0);
}

.react-flow__handle-top {
  left: 50%;
  top: -4px;
  transform: translate(-50%, 0);
}

.react-flow__handle-left {
  top: 50%;
  left: -4px;
  transform: translate(0, -50%);
}

.react-flow__handle-right {
  right: -4px;
  top: 50%;
  transform: translate(0, -50%);
}

.react-flow__edgeupdater {
  cursor: move;
  pointer-events: all;
}

.react-flow__panel {
  position: absolute;
  z-index: 5;
  margin: 15px;
}

.react-flow__panel.top {
  top: 0;
}

.react-flow__panel.bottom {
  bottom: 0;
}

.react-flow__panel.left {
  left: 0;
}

.react-flow__panel.right {
  right: 0;
}

.react-flow__panel.center {
  left: 50%;
  transform: translateX(-50%);
}

.react-flow__attribution {
  font-size: 10px;
  background: rgba(255, 255, 255, 0.5);
  padding: 2px 3px;
  margin: 0;
}

.react-flow__attribution a {
  text-decoration: none;
  color: #999;
}

@keyframes dashdraw {
  from {
    stroke-dashoffset: 10;
  }
}

/* 额外的自定义样式 */
.fs-node {
  transition: all 0.2s;
}

.fs-node:hover {
  box-shadow: 0 4px 10px rgba(0,0,0,0.2);
  transform: translateY(-2px);
}

.file-node:hover {
  background-color: #bbdefb !important;
}

.directory-node:hover {
  background-color: #c8e6c9 !important;
}
`;

fs.writeFileSync(join(__dirname, 'dist/style.css'), cssContent);

// 构建配置
const configs = [
  // 扩展部分
  {
    entryPoints: [join(__dirname, 'src/extension.ts')],
    bundle: true,
    outfile: join(__dirname, 'dist/extension.js'),
    external: ['vscode'],
    format: 'cjs',
    platform: 'node',
    target: 'node12',
  },
  // WebView部分 - 添加外部依赖
  {
    entryPoints: [join(__dirname, 'src/webview/index.tsx')],
    bundle: true,
    outfile: join(__dirname, 'dist/webview.js'),
    minify: true,
    format: 'iife',
    target: 'es2020',
    // 将React和ReactFlow标记为外部依赖 - 改为捆绑一切
    loader: {
      '.ts': 'tsx',
      '.tsx': 'tsx',
    },
    define: {
      'process.env.NODE_ENV': '"production"'
    }
  }
];

// 构建函数
async function build() {
  try {
    if (watchMode) {
      // 监听模式
      console.log('启动监听模式...');
      
      // 创建构建上下文并启动监听
      const contexts = await Promise.all(configs.map(config => esbuild.context(config)));
      await Promise.all(contexts.map(ctx => ctx.rebuild()));
      await Promise.all(contexts.map(ctx => ctx.watch()));
      
      console.log('构建完成，正在监听文件变化...');
    } else {
      // 标准构建
      await Promise.all(configs.map(config => esbuild.build(config)));
      console.log('构建完成!');
    }
  } catch (err) {
    console.error('构建失败:', err);
    process.exit(1);
  }
}

build();
