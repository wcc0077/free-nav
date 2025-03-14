import * as React from 'react';
import * as ReactDOM from 'react-dom/client';

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

// 文件系统节点组件Props
interface FileSystemNodeProps {
  item: FileSystemItem;
  level: number;
  onSelect: (id: string) => void;
  isSelected: boolean;
  colors: ThemeColors;
  nodeRef: React.RefObject<HTMLDivElement>;
  parentId?: string;
  expanded: Set<string>;
  toggleExpand: (id: string) => void;
  children?: React.ReactNode; // 添加children属性
}

// 计算连接线的钩子
function useNodeConnections(
  files: FileSystemItem[], 
  expanded: Set<string>
) {
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
function useNodePositions(nodeRefs: React.MutableRefObject<{[id: string]: React.RefObject<HTMLDivElement>}>) {
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
    updatePositions();
    
    const observer = new ResizeObserver(() => {
      updatePositions();
    });
    
    const container = document.getElementById('root');
    if (container) {
      observer.observe(container);
    }
    
    window.addEventListener('resize', updatePositions);
    
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updatePositions);
    };
  }, [updatePositions]);
  
  return positions;
}

// 文件节点组件
const FileNode: React.FC<FileSystemNodeProps> = ({ 
  item, 
  onSelect, 
  isSelected,
  colors,
  nodeRef,
  expanded,
  toggleExpand
}) => {
  const handleClick = () => {
    onSelect(item.id);
    vscode.postMessage({
      command: 'openFile',
      path: item.path
    });
  };

  return (
    <div 
      ref={nodeRef}
      className={`file-node ${isSelected ? 'selected' : ''}`}
      style={{ 
        padding: '3px 6px',
        cursor: 'pointer',
        borderLeft: `2px solid ${colors.fileNodeBorder}`,
        backgroundColor: isSelected ? colors.hoverBackground : colors.fileNodeBg,
        borderRadius: '3px',
        fontSize: '12px',
        transition: 'all 0.2s',
        boxShadow: isSelected ? `0 1px 3px ${colors.shadow}` : 'none',
        color: colors.foreground,
        margin: '2px 0',
        display: 'inline-block',
        maxWidth: '200px',
        wordBreak: 'break-word',
      }}
      onClick={handleClick}
      data-id={item.id}
      data-type="file"
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span style={{ marginRight: '4px', fontSize: '12px' }}>📄</span>
        <span style={{ fontSize: '12px' }}>{item.name}</span>
      </div>
    </div>
  );
};

// 目录节点组件
const DirectoryNode: React.FC<FileSystemNodeProps> = ({ 
  item, 
  level, 
  onSelect, 
  isSelected,
  colors,
  nodeRef,
  parentId,
  children,
  expanded,
  toggleExpand
}) => {
  const isOpen = expanded.has(item.id);
  
  const handleClick = (e: React.MouseEvent) => {
    onSelect(item.id);
  };
  
  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleExpand(item.id);
  };

  return (
    <div className="directory-container" data-parent-id={parentId} data-id={item.id}>
      <div 
        ref={nodeRef}
        className={`directory-node ${isSelected ? 'selected' : ''}`}
        style={{ 
          padding: '3px 6px',
          cursor: 'pointer',
          borderLeft: `2px solid ${colors.dirNodeBorder}`,
          backgroundColor: isSelected ? colors.hoverBackground : colors.dirNodeBg,
          borderRadius: '3px',
          fontSize: '12px',
          transition: 'all 0.2s',
          boxShadow: isSelected ? `0 1px 3px ${colors.shadow}` : 'none',
          color: colors.foreground,
          margin: '2px 0',
          display: 'inline-block',
          maxWidth: '200px',
          wordBreak: 'break-word',
        }}
        onClick={handleClick}
        data-id={item.id}
        data-type="directory"
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span 
            style={{ marginRight: '4px', fontSize: '12px', cursor: 'pointer' }}
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
};

// 递归渲染文件系统树
const FileSystemTree: React.FC<{
  items: FileSystemItem[];
  level: number;
  onSelect: (id: string) => void;
  selected: string | null;
  colors: ThemeColors;
  nodeRefs: React.MutableRefObject<{[id: string]: React.RefObject<HTMLDivElement>}>;
  parentId?: string;
  expanded: Set<string>;
  toggleExpand: (id: string) => void;
}> = ({
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
  const getNodeRef = (id: string) => {
    if (!nodeRefs.current[id]) {
      nodeRefs.current[id] = React.createRef<HTMLDivElement>();
    }
    return nodeRefs.current[id];
  };
  
  return (
    <div className="tree-level" style={{ marginLeft: level > 0 ? '20px' : '0' }}>
      {items.map(item => {
        if (item.type === 'file') {
          return (
            <div key={item.id} className="node-wrapper" style={{ marginBottom: '4px' }}>
              <FileNode
                item={item}
                level={level}
                onSelect={onSelect}
                isSelected={selected === item.id}
                colors={colors}
                nodeRef={getNodeRef(item.id)}
                parentId={parentId}
                expanded={expanded}
                toggleExpand={toggleExpand}
              />
            </div>
          );
        } else {
          const isOpen = expanded.has(item.id);
          return (
            <div key={item.id} className="node-wrapper" style={{ marginBottom: '8px' }}>
              <DirectoryNode
                item={item}
                level={level}
                onSelect={onSelect}
                isSelected={selected === item.id}
                colors={colors}
                nodeRef={getNodeRef(item.id)}
                parentId={parentId}
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
};

// 连接线组件
const Connections: React.FC<{
  connections: Edge[];
  nodePositions: Map<string, NodePosition>;
  colors: ThemeColors;
}> = ({ connections, nodePositions, colors }) => {
  if (connections.length === 0 || nodePositions.size === 0) {
    return null;
  }

  // 计算SVG的尺寸
  const positions = Array.from(nodePositions.values());
  const maxX = Math.max(...positions.map(p => p.x + p.width)) + 50;
  const maxY = Math.max(...positions.map(p => p.y + p.height)) + 50;
  
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
};

// 拖拽容器
const ZoomablePanContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = React.useState(false);
  const [startPos, setStartPos] = React.useState({ x: 0, y: 0 });
  
  const handleMouseDown = (e: React.MouseEvent) => {
    // 只有在点击容器背景时才开始拖拽
    if ((e.target as HTMLElement).classList.contains('drag-container')) {
      setIsDragging(true);
      setStartPos({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - startPos.x,
        y: e.clientY - startPos.y
      });
    }
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  return (
    <div 
      className="drag-container"
      style={{
        position: 'relative',
        overflow: 'hidden',
        width: '100%',
        height: '100vh',
        cursor: isDragging ? 'grabbing' : 'grab',
        backgroundColor: 'transparent'
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div
        style={{
          position: 'absolute',
          transform: `translate(${position.x}px, ${position.y}px)`,
          transition: isDragging ? 'none' : 'transform 0.1s ease',
          padding: '20px'
        }}
      >
        {children}
      </div>
    </div>
  );
};

// 主App组件
const App: React.FC = () => {
  const [files, setFiles] = React.useState<FileSystemItem[]>([]);
  const [themeColors, setThemeColors] = React.useState<ThemeColors>(defaultColors);
  const [loading, setLoading] = React.useState(true);
  const [selected, setSelected] = React.useState<string | null>(null);
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());
  const nodeRefs = React.useRef<{[id: string]: React.RefObject<HTMLDivElement>}>({});
  
  // 切换展开/折叠状态
  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpanded(newExpanded);
  };
  
  // 计算节点连接线
  const connections = useNodeConnections(files, expanded);
  
  // 计算节点位置
  const nodePositions = useNodePositions(nodeRefs);

  // 监听VSCode消息
  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      
      switch (message.command) {
        case 'fileSystemData':
          setFiles(message.data);
          setLoading(false);
          break;
        case 'themeColors':
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

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        color: themeColors.foreground,
        backgroundColor: themeColors.background
      }}>
        <p>加载文件系统...</p>
      </div>
    );
  }

  return (
    <div style={{ 
      width: '100%', 
      height: '100vh',
      backgroundColor: themeColors.background,
      color: themeColors.foreground
    }}>
      <div style={{ 
        position: 'absolute', 
        top: '10px', 
        right: '10px', 
        zIndex: 1000,
        background: themeColors.background,
        padding: '8px',
        borderRadius: '4px',
        boxShadow: `0 2px 5px ${themeColors.shadow}`,
        fontSize: '12px',
        opacity: 0.9
      }}>
        <p style={{ margin: '0 0 5px 0' }}>
          <span style={{ color: themeColors.fileNodeBorder, fontWeight: 'bold' }}>📄 文件</span>
          <span style={{ marginLeft: '10px' }}>点击打开</span>
        </p>
        <p style={{ margin: '0' }}>
          <span style={{ color: themeColors.dirNodeBorder, fontWeight: 'bold' }}>📁 文件夹</span>
          <span style={{ marginLeft: '10px' }}>点击展开</span>
        </p>
        <p style={{ margin: '5px 0 0 0', fontSize: '10px', color: themeColors.foreground }}>
          按住鼠标拖动整个视图
        </p>
      </div>
      
      <ZoomablePanContainer>
        <Connections 
          connections={connections} 
          nodePositions={nodePositions} 
          colors={themeColors} 
        />
        
        <FileSystemTree
          items={files}
          level={0}
          onSelect={setSelected}
          selected={selected}
          colors={themeColors}
          nodeRefs={nodeRefs}
          expanded={expanded}
          toggleExpand={toggleExpand}
        />
      </ZoomablePanContainer>
    </div>
  );
};

// 使用React 18 API渲染
const root = document.getElementById('root');
if (root) {
  ReactDOM.createRoot(root).render(<App />);
}
