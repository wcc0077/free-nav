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

// 文件系统项目类型
interface FileSystemItem {
  id: string;
  type: 'file' | 'directory';
  name: string;
  path: string;
  children?: FileSystemItem[];
}

// 文件系统节点组件
interface FileSystemNodeProps {
  item: FileSystemItem;
  level: number;
}

const FileNode: React.FC<FileSystemNodeProps> = ({ item, level }) => {
  const handleClick = () => {
    if (item.type === 'file') {
      vscode.postMessage({
        command: 'openFile',
        path: item.path
      });
    }
  };

  return (
    <div 
      className={`file-node`}
      style={{ 
        padding: '8px',
        paddingLeft: `${level * 20 + 10}px`,
        cursor: 'pointer',
        borderLeft: '4px solid #42a5f5',
        marginBottom: '4px',
        backgroundColor: '#e3f2fd',
        borderRadius: '4px',
        fontSize: '12px',
        transition: 'all 0.2s',
      }}
      onClick={handleClick}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span style={{ marginRight: '5px' }}>📄</span>
        <span>{item.name}</span>
      </div>
    </div>
  );
};

const DirectoryNode: React.FC<FileSystemNodeProps> = ({ item, level }) => {
  const [isOpen, setIsOpen] = React.useState(level === 0); // 只有根目录默认打开
  
  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div>
      <div 
        className={`directory-node`}
        style={{ 
          padding: '8px',
          paddingLeft: `${level * 20 + 10}px`,
          cursor: 'pointer',
          borderLeft: '4px solid #66bb6a',
          marginBottom: '4px',
          backgroundColor: '#e8f5e9',
          borderRadius: '4px',
          fontSize: '12px',
          transition: 'all 0.2s',
        }}
        onClick={toggleOpen}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ marginRight: '5px' }}>{isOpen ? '📂' : '📁'}</span>
          <span>{item.name}</span>
        </div>
      </div>
      
      {isOpen && item.children && (
        <div style={{ marginLeft: '10px' }}>
          {item.children.map(child => (
            <FileSystemNodeWrapper 
              key={child.id} 
              item={child} 
              level={level + 1} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

const FileSystemNodeWrapper: React.FC<FileSystemNodeProps> = ({ item, level }) => {
  if (item.type === 'file') {
    return <FileNode item={item} level={level} />;
  } else {
    return <DirectoryNode item={item} level={level} />;
  }
};

// 拖拽容器
const DraggableContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = React.useState(false);
  const [startPos, setStartPos] = React.useState({ x: 0, y: 0 });
  
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartPos({ x: e.clientX - position.x, y: e.clientY - position.y });
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
      style={{
        position: 'relative',
        overflow: 'hidden',
        width: '100%',
        height: '100vh',
        cursor: isDragging ? 'grabbing' : 'grab'
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
  const [loading, setLoading] = React.useState(true);

  // 监听VSCode消息
  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      
      switch (message.command) {
        case 'fileSystemData':
          setFiles(message.data);
          setLoading(false);
          break;
      }
    };

    window.addEventListener('message', handleMessage);

    // 请求文件系统数据
    vscode.postMessage({
      command: 'getWorkspaceFiles'
    });

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>加载文件系统...</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <div style={{ 
        position: 'absolute', 
        top: '10px', 
        right: '10px', 
        zIndex: 1000,
        background: 'white',
        padding: '8px',
        borderRadius: '4px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
        fontSize: '12px'
      }}>
        <p style={{ margin: '0 0 5px 0' }}>
          <span style={{ color: '#42a5f5', fontWeight: 'bold' }}>📄 文件</span>
          <span style={{ marginLeft: '10px' }}>点击打开</span>
        </p>
        <p style={{ margin: '0' }}>
          <span style={{ color: '#66bb6a', fontWeight: 'bold' }}>📁 文件夹</span>
          <span style={{ marginLeft: '10px' }}>点击展开</span>
        </p>
        <p style={{ margin: '5px 0 0 0', fontSize: '10px', color: '#888' }}>
          按住鼠标拖动整个视图
        </p>
      </div>
      
      <DraggableContainer>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {files.map(file => (
            <FileSystemNodeWrapper key={file.id} item={file} level={0} />
          ))}
        </div>
      </DraggableContainer>
    </div>
  );
};

// 使用React 18 API渲染
const root = document.getElementById('root');
if (root) {
  ReactDOM.createRoot(root).render(<App />);
}
