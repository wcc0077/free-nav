import { ThemeColors } from '../types';

// 默认主题颜色
export const defaultColors: ThemeColors = {
  background: '#ffffff',
  fileNodeBg: '#e3f2fd',
  fileNodeBorder: '#42a5f5',
  dirNodeBg: '#e8f5e9',
  dirNodeBorder: '#66bb6a',
  foreground: '#333333',
  lineColor: '#cccccc',
  hoverBackground: 'rgba(0,0,0,0.1)',
  shadow: 'rgba(0,0,0,0.2)'
};

// 文件节点样式
export const fileNodeStyle = (colors: ThemeColors, isSelected: boolean) => ({
  padding: '6px 10px',  // 增加内边距
  cursor: 'pointer',
  borderLeft: `2px solid ${colors.fileNodeBorder}`,
  backgroundColor: isSelected ? colors.hoverBackground : colors.fileNodeBg,
  borderRadius: '3px',
  fontSize: '12px',
  transition: 'all 0.2s',
  boxShadow: isSelected ? `0 1px 3px ${colors.shadow}` : 'none',
  color: colors.foreground,
  margin: '4px 0',  // 增加外边距
  display: 'inline-block',
  minWidth: '100px',  // 设置最小宽度
  maxWidth: '250px',  // 增加最大宽度
  wordBreak: 'break-word' as const,
  userSelect: 'none' as const,  // 防止文本选择
});

// 目录节点样式
export const directoryNodeStyle = (colors: ThemeColors, isSelected: boolean) => ({
  padding: '6px 10px',  // 增加内边距
  cursor: 'pointer',
  borderLeft: `2px solid ${colors.dirNodeBorder}`,
  backgroundColor: isSelected ? colors.hoverBackground : colors.dirNodeBg,
  borderRadius: '3px',
  fontSize: '12px',
  transition: 'all 0.2s',
  boxShadow: isSelected ? `0 1px 3px ${colors.shadow}` : 'none',
  color: colors.foreground,
  margin: '4px 0',  // 增加外边距
  display: 'inline-block',
  minWidth: '100px',  // 设置最小宽度
  maxWidth: '250px',  // 增加最大宽度
  wordBreak: 'break-word' as const,
  userSelect: 'none' as const,  // 防止文本选择
});

// 画布容器样式
export const canvasContainerStyle = (colors: ThemeColors, isDragging: boolean) => ({
  position: 'relative' as const,
  overflow: 'hidden' as const,
  width: '100%',
  height: '100vh',
  cursor: isDragging ? 'grabbing' : 'grab',
  backgroundColor: colors.background,
  userSelect: 'none' as const
});

// 画布内容样式
export const canvasContentStyle = (position: {x: number, y: number}, scale: number, isDragging: boolean) => ({
  position: 'absolute' as const,
  transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
  transformOrigin: '0 0',
  transition: isDragging ? 'none' : 'transform 0.1s ease',
  padding: '20px'
});

// 连接线SVG样式
export const connectionsSvgStyle = {
  position: 'absolute' as const,
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  pointerEvents: 'none' as const,
  zIndex: -1
};

// 信息面板样式
export const infoPanelStyle = (colors: ThemeColors) => ({
  position: 'absolute' as const, 
  top: '10px', 
  right: '10px', 
  zIndex: 1000,
  background: colors.background,
  padding: '10px',
  borderRadius: '4px',
  boxShadow: `0 2px 8px ${colors.shadow}`,
  fontSize: '12px',
  opacity: 0.9,
  minWidth: '180px'
});

// 加载动画样式
export const loaderContainerStyle = (colors: ThemeColors) => ({
  display: 'flex' as const, 
  flexDirection: 'column' as const,
  justifyContent: 'center' as const, 
  alignItems: 'center' as const, 
  height: '100vh',
  color: colors.foreground,
  backgroundColor: colors.background
});

export const loaderSpinnerStyle = (colors: ThemeColors) => ({
  width: '40px',
  height: '40px',
  border: `3px solid ${colors.lineColor}`,
  borderTop: `3px solid ${colors.fileNodeBorder}`,
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
  marginBottom: '16px'
}); 