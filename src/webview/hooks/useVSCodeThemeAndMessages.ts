import * as React from 'react';
import { FileSystemItem, ThemeColors } from '../types';
import { defaultColors } from '../styles/theme';
import { requestFileSystemData, requestThemeColors } from '../utils/vscode';

// 使用主题和消息通信钩子
export function useVSCodeThemeAndMessages() {
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

    // 请求文件系统数据和主题颜色
    requestFileSystemData();
    requestThemeColors();

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);
  
  return { files, themeColors, loading };
} 