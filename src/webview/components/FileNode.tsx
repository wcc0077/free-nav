import * as React from 'react';
import { FileNodeProps } from '../types';
import { fileNodeStyle } from '../styles/theme';
import { openFile } from '../utils/vscode';

// 文件节点组件
export const FileNode: React.FC<FileNodeProps> = React.memo(({ 
  item, 
  onSelect, 
  isSelected,
  colors,
  nodeRef
}) => {
  const handleClick = React.useCallback(() => {
    onSelect(item.id);
    openFile(item.path);
  }, [item.id, item.path, onSelect]);

  return (
    <div 
      ref={nodeRef}
      className={`file-node ${isSelected ? 'selected' : ''}`}
      style={fileNodeStyle(colors, isSelected)}
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