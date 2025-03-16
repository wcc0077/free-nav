import * as React from 'react';
import { NodePosition } from '../types';

// 节点位置钩子 - 从DOM获取实际节点位置
export function useNodePositions(nodeRefs: React.MutableRefObject<{[id: string]: React.RefObject<HTMLDivElement>}>): Map<string, NodePosition> {
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