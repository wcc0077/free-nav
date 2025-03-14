// 简化版的ReactFlow组件预构建
window.ReactFlowComponents = {
  // 创建一个简单的节点
  Node: function(props) {
    return React.createElement('div', {
      style: {
        position: 'absolute',
        left: props.position.x,
        top: props.position.y,
        background: '#fff',
        border: '1px solid #ddd',
        borderRadius: '5px',
        padding: '10px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
        width: 'auto',
        minWidth: '150px'
      }
    }, props.data.label);
  },
  
  // 简单的连线
  Edge: function(props) {
    // 简化版不实现实际的连线
    return null;
  },
  
  // 主画布组件
  Canvas: function(props) {
    const [state, setState] = React.useState({
      scale: 1,
      position: { x: 0, y: 0 }
    });
    
    const containerStyle = {
      position: 'relative',
      width: '100%',
      height: '100%',
      overflow: 'hidden'
    };
    
    const viewportStyle = {
      position: 'absolute',
      width: '100%',
      height: '100%',
      transformOrigin: '0 0',
      transform: `translate(${state.position.x}px, ${state.position.y}px) scale(${state.scale})`
    };
    
    // 渲染所有节点
    const nodes = props.nodes.map(node => {
      return React.createElement(props.nodeTypes[node.type] || ReactFlowComponents.Node, {
        key: node.id,
        ...node
      });
    });
    
    return React.createElement('div', { style: containerStyle }, 
      React.createElement('div', { style: viewportStyle }, nodes)
    );
  }
}; 