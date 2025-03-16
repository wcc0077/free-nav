import * as React from 'react';
import { CanvasProps } from '../types';
import { useDragAndZoom } from '../hooks';
import { canvasContainerStyle, canvasContentStyle } from '../styles/theme';

// 拖拽和缩放容器
export const Canvas: React.FC<CanvasProps> = React.memo(({ children, colors }) => {
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
      style={canvasContainerStyle(colors, isDragging)}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      <div
        className="canvas-content"
        style={canvasContentStyle(position, scale, isDragging)}
      >
        {children}
      </div>
    </div>
  );
}); 