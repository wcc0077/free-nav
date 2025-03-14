import * as React from 'react';
import * as ReactDOM from 'react-dom/client';

// 主App组件
const App: React.FC = () => {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Hello World</h1>
    </div>
  );
};

// 样式
const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  title: {
    fontSize: '24px',
    color: '#333',
  },
};

// 使用React 18的新API
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<App />);
}
