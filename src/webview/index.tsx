import * as React from 'react';
import * as ReactDOM from 'react-dom/client';

//=============================================================================
// 类型定义
//=============================================================================

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

// 使用VSCode API
const vscode = window.acquireVsCodeApi();

// 主题颜色类型
interface ThemeColors {
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

// 默认主题颜色
const defaultColors: ThemeColors = {
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

// 文件系统项目类型
interface FileSystemItem {
  id: string;
  type: 'file' | 'directory';
  name: string;
  path: string;
  children?: FileSystemItem[];
  parentId?: string; // 添加父节点标识
}

// 思维导图节点位置类型
interface NodePosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

// 思维导图的边
interface Edge {
  id: string;
  sourceId: string;
  targetId: string;
}

//=============================================================================
// 自定义钩子函数
//=============================================================================

// 计算连接线的钩子
function useNodeConnections(
  files: FileSystemItem[], 
  expanded: Set<string>
): Edge[] {
  const [connections, setConnections] = React.useState<Edge[]>([]);
  
  React.useEffect(() => {
    const edges: Edge[] = [];
    
    // 递归处理文件结构，生成父子节点连接关系
    const processConnections = (items: FileSystemItem[], parentId?: string) => {
      items.forEach(item => {
        if (parentId) {
          edges.push({
            id: `edge-${parentId}-${item.id}`,
            sourceId: parentId,
            targetId: item.id
          });
        }
        
        if (item.children && item.children.length > 0 && expanded.has(item.id)) {
          processConnections(item.children, item.id);
        }
      });
    };
    
    processConnections(files);
    setConnections(edges);
  }, [files, expanded]);
  
  return connections;
}

// 节点位置钩子 - 从DOM获取实际节点位置
function useNodePositions(nodeRefs: React.MutableRefObject<{[id: string]: React.RefObject<HTMLDivElement>}>): Map<string, NodePosition> {
  const [positions, setPositions] = React.useState<Map<string, NodePosition>>(new Map());
  
  const updatePositions = React.useCallback(() => {
    const newPositions = new Map<string, NodePosition>();
    
    Object.entries(nodeRefs.current).forEach(([id, ref]) => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        const containerEl = document.getElementById('root');
        const containerRect = containerEl ? containerEl.getBoundingClientRect() : { left: 0, top: 0 };
        
        newPositions.set(id, {
          x: rect.left - containerRect.left,
          y: rect.top - containerRect.top,
          width: rect.width,
          height: rect.height
        });
      }
    });
    
    setPositions(newPositions);
  }, [nodeRefs]);
  
  // 添加resize观察器，当窗口大小变化时更新位置
  React.useEffect(() => {
    // 延迟执行以确保DOM已完全渲染
    const timeoutId = setTimeout(() => {
      updatePositions();
    }, 100);
    
    const observer = new ResizeObserver(() => {
      updatePositions();
    });
    
    const container = document.getElementById('root');
    if (container) {
      observer.observe(container);
    }
    
    window.addEventListener('resize', updatePositions);
    
    // 定期更新位置，以防DOM变化但没有触发resize事件
    const intervalId = setInterval(updatePositions, 1000);
    
    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
      observer.disconnect();
      window.removeEventListener('resize', updatePositions);
    };
  }, [updatePositions]);
  
  return positions;
}

// 拖拽和缩放功能钩子
function useDragAndZoom() {
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const [scale, setScale] = React.useState(1);
  const [isDragging, setIsDragging] = React.useState(false);
  const [startPos, setStartPos] = React.useState({ x: 0, y: 0 });
  const lastClickTime = React.useRef<number>(0);
  const dragThreshold = 5; // 像素
  const dragStartPos = React.useRef<{x: number, y: number} | null>(null);
  
  const handleMouseDown = React.useCallback((e: React.MouseEvent) => {
    // 保存拖拽开始位置
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    
    // 如果是点击文件或文件夹节点，不启动拖拽
    const target = e.target as HTMLElement;
    if (target.closest('.file-node') || target.closest('.directory-node')) {
      return;
    }
    
    setIsDragging(true);
    setStartPos({ x: e.clientX - position.x, y: e.clientY - position.y });
    e.preventDefault();
  }, [position]);
  
  const handleMouseMove = React.useCallback((e: React.MouseEvent) => {
    if (!isDragging && dragStartPos.current) {
      // 检查是否超过拖拽阈值
      const dx = Math.abs(e.clientX - dragStartPos.current.x);
      const dy = Math.abs(e.clientY - dragStartPos.current.y);
      
      if (dx > dragThreshold || dy > dragThreshold) {
        setIsDragging(true);
        setStartPos({ x: e.clientX - position.x, y: e.clientY - position.y });
      }
      return;
    }
    
    if (isDragging) {
      setPosition({
        x: e.clientX - startPos.x,
        y: e.clientY - startPos.y
      });
      e.preventDefault();
    }
  }, [isDragging, position, startPos]);
  
  const handleMouseUp = React.useCallback((e: React.MouseEvent) => {
    setIsDragging(false);
    dragStartPos.current = null;
    
    // 检测是否是点击而不是拖拽
    const now = Date.now();
    if (now - lastClickTime.current < 300) {
      // 双击，将视图重置到中心
      setPosition({ x: 0, y: 0 });
      setScale(1);
    }
    lastClickTime.current = now;
  }, []);
  
  const handleWheel = React.useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    
    // 计算缩放因子 (0.1 = 10% 缩放)
    const zoomFactor = 0.1;
    const delta = e.deltaY < 0 ? zoomFactor : -zoomFactor;
    const newScale = Math.max(0.5, Math.min(2, scale + delta));
    
    // 更新缩放级别
    setScale(newScale);
    
    // 调整位置以保持鼠标位置不变
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    
    // 计算鼠标相对于当前变换原点的位置
    const containerEl = document.getElementById('root');
    const rect = containerEl?.getBoundingClientRect() || { left: 0, top: 0, width: 0, height: 0 };
    const originX = rect.left + position.x;
    const originY = rect.top + position.y;
    
    // 计算鼠标相对于原点的偏移
    const mouseOffsetX = mouseX - originX;
    const mouseOffsetY = mouseY - originY;
    
    // 计算新位置以保持鼠标位置不变
    const scaleFactor = newScale / scale;
    const newPosition = {
      x: position.x - mouseOffsetX * (scaleFactor - 1),
      y: position.y - mouseOffsetY * (scaleFactor - 1)
    };
    
    setPosition(newPosition);
  }, [scale, position]);
  
  return {
    position,
    scale,
    isDragging,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel
  };
}

// 使用主题和消息通信钩子
function useVSCodeThemeAndMessages() {
  const [files, setFiles] = React.useState<FileSystemItem[]>([]);
  const [themeColors, setThemeColors] = React.useState<ThemeColors>(defaultColors);
  const [loading, setLoading] = React.useState(true);
  
  // 监听VSCode消息
  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      console.log('收到消息:', message);
      
      switch (message.command) {
        case 'fileSystemData':
          console.log('设置文件系统数据', message.data);
          setFiles(message.data);
          setLoading(false);
          break;
        case 'themeColors':
          console.log('应用主题颜色', message.data);
          setThemeColors(message.data);
          break;
      }
    };

    window.addEventListener('message', handleMessage);

    // 请求文件系统数据
    vscode.postMessage({
      command: 'getWorkspaceFiles'
    });
    
    // 请求主题颜色
    vscode.postMessage({
      command: 'getThemeColors'
    });

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);
  
  return { files, themeColors, loading };
}

//=============================================================================
// UI组件
//=============================================================================

// 文件节点组件Props
interface FileNodeProps {
  item: FileSystemItem;
  onSelect: (id: string) => void;
  isSelected: boolean;
  colors: ThemeColors;
  nodeRef: React.RefObject<HTMLDivElement>;
}

// 文件节点组件
const FileNode: React.FC<FileNodeProps> = React.memo(({ 
  item, 
  onSelect, 
  isSelected,
  colors,
  nodeRef
}) => {
  const handleClick = React.useCallback(() => {
    onSelect(item.id);
    vscode.postMessage({
      command: 'openFile',
      path: item.path
    });
  }, [item.id, item.path, onSelect]);

  return (
    <div 
      ref={nodeRef}
      className={`file-node ${isSelected ? 'selected' : ''}`}
      style={{ 
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
        wordBreak: 'break-word',
        userSelect: 'none',  // 防止文本选择
      }}
      onClick={handleClick}
      data-id={item.id}
      data-type="file"
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span style={{ marginRight: '8px', fontSize: '14px' }}>📄</span>
        <span style={{ fontSize: '12px' }}>{item.name}</span>
      </div>
    </div>
  );
});

// 目录节点组件Props
interface DirectoryNodeProps {
  item: FileSystemItem;
  onSelect: (id: string) => void;
  isSelected: boolean;
  colors: ThemeColors;
  nodeRef: React.RefObject<HTMLDivElement>;
  expanded: Set<string>;
  toggleExpand: (id: string) => void;
  children?: React.ReactNode;
}

// 目录节点组件
const DirectoryNode: React.FC<DirectoryNodeProps> = React.memo(({ 
  item, 
  onSelect, 
  isSelected,
  colors,
  nodeRef,
  children,
  expanded,
  toggleExpand
}) => {
  const isOpen = expanded.has(item.id);
  
  const handleClick = React.useCallback((e: React.MouseEvent) => {
    onSelect(item.id);
  }, [item.id, onSelect]);
  
  const handleToggle = React.useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    toggleExpand(item.id);
  }, [item.id, toggleExpand]);

  return (
    <div className="directory-container" data-id={item.id}>
      <div 
        ref={nodeRef}
        className={`directory-node ${isSelected ? 'selected' : ''}`}
        style={{ 
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
          wordBreak: 'break-word',
          userSelect: 'none',  // 防止文本选择
        }}
        onClick={handleClick}
        data-id={item.id}
        data-type="directory"
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span 
            style={{ marginRight: '8px', fontSize: '14px', cursor: 'pointer' }}
            onClick={handleToggle}
          >
            {isOpen ? '📂' : '📁'}
          </span>
          <span style={{ fontSize: '12px' }}>{item.name}</span>
        </div>
      </div>
      
      {children}
    </div>
  );
});

// 递归渲染文件系统树
interface FileSystemTreeProps {
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

const FileSystemTree: React.FC<FileSystemTreeProps> = React.memo(({
  items,
  level,
  onSelect,
  selected,
  colors,
  nodeRefs,
  parentId,
  expanded,
  toggleExpand
}) => {
  // 创建或获取节点引用
  const getNodeRef = React.useCallback((id: string) => {
    if (!nodeRefs.current[id]) {
      nodeRefs.current[id] = React.createRef<HTMLDivElement>();
    }
    return nodeRefs.current[id];
  }, [nodeRefs]);
  
  if (!items || items.length === 0) {
    return null;
  }
  
  return (
    <div className="tree-level" style={{ 
      marginLeft: level > 0 ? '20px' : '0',
    }}>
      {items.map(item => {
        if (item.type === 'file') {
          return (
            <div key={item.id} className="node-wrapper" style={{ marginBottom: '6px' }}>
              <FileNode
                item={item}
                onSelect={onSelect}
                isSelected={selected === item.id}
                colors={colors}
                nodeRef={getNodeRef(item.id)}
              />
            </div>
          );
        } else {
          const isOpen = expanded.has(item.id);
          return (
            <div key={item.id} className="node-wrapper" style={{ marginBottom: '8px' }}>
              <DirectoryNode
                item={item}
                onSelect={onSelect}
                isSelected={selected === item.id}
                colors={colors}
                nodeRef={getNodeRef(item.id)}
                expanded={expanded}
                toggleExpand={toggleExpand}
              >
                {isOpen && item.children && item.children.length > 0 && (
                  <FileSystemTree
                    items={item.children}
                    level={level + 1}
                    onSelect={onSelect}
                    selected={selected}
                    colors={colors}
                    nodeRefs={nodeRefs}
                    parentId={item.id}
                    expanded={expanded}
                    toggleExpand={toggleExpand}
                  />
                )}
              </DirectoryNode>
            </div>
          );
        }
      })}
    </div>
  );
});

// 连接线组件
interface ConnectionsProps {
  connections: Edge[];
  nodePositions: Map<string, NodePosition>;
  colors: ThemeColors;
}

const Connections: React.FC<ConnectionsProps> = React.memo(({ connections, nodePositions, colors }) => {
  if (connections.length === 0 || nodePositions.size === 0) {
    return null;
  }

  // 计算SVG的尺寸
  const positions = Array.from(nodePositions.values());
  const maxX = Math.max(...positions.map(p => p.x + p.width)) + 100;
  const maxY = Math.max(...positions.map(p => p.y + p.height)) + 100;
  
  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: -1
      }}
      width={maxX}
      height={maxY}
      data-testid="connections-svg"
    >
      {connections.map(conn => {
        const source = nodePositions.get(conn.sourceId);
        const target = nodePositions.get(conn.targetId);
        
        if (!source || !target) return null;
        
        // 计算连接线的起点和终点
        const startX = source.x + source.width;
        const startY = source.y + source.height / 2;
        const endX = target.x;
        const endY = target.y + target.height / 2;
        
        // 计算贝塞尔曲线的控制点
        const controlX = startX + (endX - startX) * 0.5;
        
        return (
          <path
            key={conn.id}
            d={`M ${startX} ${startY} C ${controlX} ${startY}, ${controlX} ${endY}, ${endX} ${endY}`}
            fill="none"
            stroke={colors.lineColor}
            strokeWidth="1.5"
            strokeDasharray="4 2"
          />
        );
      })}
    </svg>
  );
});

// 拖拽和缩放容器
interface CanvasProps {
  children: React.ReactNode;
  colors: ThemeColors;
}

const Canvas: React.FC<CanvasProps> = React.memo(({ children, colors }) => {
  const {
    position,
    scale,
    isDragging,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel
  } = useDragAndZoom();
  
  return (
    <div 
      className="canvas-container"
      style={{
        position: 'relative',
        overflow: 'hidden',
        width: '100%',
        height: '100vh',
        cursor: isDragging ? 'grabbing' : 'grab',
        backgroundColor: colors.background,
        userSelect: 'none'
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      <div
        className="canvas-content"
        style={{
          position: 'absolute',
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          transformOrigin: '0 0',
          transition: isDragging ? 'none' : 'transform 0.1s ease',
          padding: '20px'
        }}
      >
        {children}
      </div>
    </div>
  );
});

// 信息提示面板
interface InfoPanelProps {
  colors: ThemeColors;
}

const InfoPanel: React.FC<InfoPanelProps> = React.memo(({ colors }) => {
  return (
    <div style={{ 
      position: 'absolute', 
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
    }}>
      <p style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}>
        文件系统导航
      </p>
      <p style={{ margin: '0 0 5px 0', display: 'flex', alignItems: 'center' }}>
        <span style={{ color: colors.fileNodeBorder, fontWeight: 'bold', marginRight: '8px' }}>📄</span>
        <span>点击文件打开</span>
      </p>
      <p style={{ margin: '0 0 5px 0', display: 'flex', alignItems: 'center' }}>
        <span style={{ color: colors.dirNodeBorder, fontWeight: 'bold', marginRight: '8px' }}>📁</span>
        <span>点击图标展开文件夹</span>
      </p>
      <p style={{ margin: '8px 0 0 0', fontSize: '11px', color: `${colors.foreground}99` }}>
        拖动画布移动 · 滚轮缩放 · 双击重置
      </p>
    </div>
  );
});

// 加载指示器
interface LoaderProps {
  colors: ThemeColors;
}

const Loader: React.FC<LoaderProps> = React.memo(({ colors }) => {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      color: colors.foreground,
      backgroundColor: colors.background
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: `3px solid ${colors.lineColor}`,
        borderTop: `3px solid ${colors.fileNodeBorder}`,
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginBottom: '16px'
      }} />
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <p>加载文件系统...</p>
    </div>
  );
});

//=============================================================================
// 主应用组件
//=============================================================================

// 主App组件
const App: React.FC = () => {
  // 使用钩子获取文件和主题数据
  const { files, themeColors, loading } = useVSCodeThemeAndMessages();
  
  // 状态管理
  const [selected, setSelected] = React.useState<string | null>(null);
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());
  const nodeRefs = React.useRef<{[id: string]: React.RefObject<HTMLDivElement>}>({});
  
  // 切换展开/折叠状态
  const toggleExpand = React.useCallback((id: string) => {
    setExpanded(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(id)) {
        newExpanded.delete(id);
      } else {
        newExpanded.add(id);
      }
      return newExpanded;
    });
  }, []);
  
  // 处理节点选择
  const handleSelect = React.useCallback((id: string) => {
    setSelected(id);
  }, []);
  
  // 计算节点连接线
  const connections = useNodeConnections(files, expanded);
  
  // 计算节点位置
  const nodePositions = useNodePositions(nodeRefs);

  // 使用错误边界处理渲染错误
  const [hasError, setHasError] = React.useState(false);
  
  React.useEffect(() => {
    window.addEventListener('error', () => {
      setHasError(true);
    });
    
    return () => {
      window.removeEventListener('error', () => {
        setHasError(true);
      });
    };
  }, []);

  if (hasError) {
    return (
      <div style={{ 
        padding: '20px', 
        color: 'red', 
        backgroundColor: themeColors.background 
      }}>
        渲染出错。请刷新页面重试。
      </div>
    );
  }

  if (loading) {
    return <Loader colors={themeColors} />;
  }

  return (
    <div style={{ 
      width: '100%', 
      height: '100vh',
      backgroundColor: themeColors.background,
      color: themeColors.foreground,
      overflow: 'hidden',
      position: 'relative'
    }}>
      <InfoPanel colors={themeColors} />
      
      <Canvas colors={themeColors}>
        <Connections 
          connections={connections} 
          nodePositions={nodePositions} 
          colors={themeColors} 
        />
        
        <FileSystemTree
          items={files}
          level={0}
          onSelect={handleSelect}
          selected={selected}
          colors={themeColors}
          nodeRefs={nodeRefs}
          expanded={expanded}
          toggleExpand={toggleExpand}
        />
      </Canvas>
    </div>
  );
};

//=============================================================================
// 应用渲染
//=============================================================================

// 错误边界组件
class ErrorBoundary extends React.Component<
  { children: React.ReactNode, fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode, fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('组件渲染错误:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// 使用React 18 API渲染
const root = document.getElementById('root');
if (root) {
  ReactDOM.createRoot(root).render(
    <ErrorBoundary fallback={<div style={{padding: '20px', color: 'red'}}>渲染出错，请刷新页面</div>}>
      <App />
    </ErrorBoundary>
  );
}
