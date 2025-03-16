// VS Code API 类型定义
declare global {
  interface Window {
    acquireVsCodeApi: () => {
      postMessage: (message: any) => void;
      getState: () => any;
      setState: (state: any) => void;
    };
  }
}

// 主题颜色类型
export interface ThemeColors {
  background: string;
  fileNodeBg: string;
  fileNodeBorder: string;
  dirNodeBg: string;
  dirNodeBorder: string;
  foreground: string;
  lineColor: string;
  hoverBackground: string;
  shadow: string;
}

// 文件系统项目类型
export interface FileSystemItem {
  id: string;
  type: 'file' | 'directory';
  name: string;
  path: string;
  children?: FileSystemItem[];
  parentId?: string; // 添加父节点标识
}

// 思维导图节点位置类型
export interface NodePosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

// 思维导图的边
export interface Edge {
  id: string;
  sourceId: string;
  targetId: string;
}

// 文件节点组件Props
export interface FileNodeProps {
  item: FileSystemItem;
  onSelect: (id: string) => void;
  isSelected: boolean;
  colors: ThemeColors;
  nodeRef: React.RefObject<HTMLDivElement>;
}

// 目录节点组件Props
export interface DirectoryNodeProps {
  item: FileSystemItem;
  onSelect: (id: string) => void;
  isSelected: boolean;
  colors: ThemeColors;
  nodeRef: React.RefObject<HTMLDivElement>;
  expanded: Set<string>;
  toggleExpand: (id: string) => void;
  children?: React.ReactNode;
}

// 递归渲染文件系统树Props
export interface FileSystemTreeProps {
  items: FileSystemItem[];
  level: number;
  onSelect: (id: string) => void;
  selected: string | null;
  colors: ThemeColors;
  nodeRefs: React.MutableRefObject<{[id: string]: React.RefObject<HTMLDivElement>}>;
  parentId?: string;
  expanded: Set<string>;
  toggleExpand: (id: string) => void;
}

// 连接线组件Props
export interface ConnectionsProps {
  connections: Edge[];
  nodePositions: Map<string, NodePosition>;
  colors: ThemeColors;
}

// 拖拽和缩放容器Props
export interface CanvasProps {
  children: React.ReactNode;
  colors: ThemeColors;
}

// 信息提示面板Props
export interface InfoPanelProps {
  colors: ThemeColors;
}

// 加载指示器Props
export interface LoaderProps {
  colors: ThemeColors;
}

// 错误边界Props
export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
}

// 错误边界状态
export interface ErrorBoundaryState {
  hasError: boolean;
} 