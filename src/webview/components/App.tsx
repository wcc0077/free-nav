import * as React from 'react';
import { FileSystemTree } from './FileSystemTree';
import { Connections } from './Connections';
import { Canvas } from './Canvas';
import { InfoPanel } from './InfoPanel';
import { Loader } from './Loader';
import { useNodeConnections, useNodePositions, useVSCodeThemeAndMessages } from '../hooks';

// 主App组件
export const App: React.FC = () => {
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
    const errorListener = () => {
      setHasError(true);
    };
    
    window.addEventListener('error', errorListener);
    
    return () => {
      window.removeEventListener('error', errorListener);
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