import { useState, useCallback, useEffect } from 'react';

export default function useTreeControls(containerRef, viewportRef, userNodeId) {
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 0.6 });

  // This is the core function that applies the pan and zoom
  const updateTransform = useCallback(() => {
    if (viewportRef.current) {
      viewportRef.current.style.transform = `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`;
    }
  }, [transform, viewportRef]);

  useEffect(() => {
    updateTransform();
  }, [transform, updateTransform]);

  const zoom = useCallback((direction) => {
    setTransform(current => {
      const scaleChange = direction === 'in' ? 1.1 : 1 / 1.1;
      const newScale = Math.max(0.3, Math.min(1.5, current.scale * scaleChange));
      return { ...current, scale: newScale };
    });
  }, []);

  const centerOnNode = useCallback(() => {
    const container = containerRef.current;
    if (!container || !userNodeId) return;
    
    const userNode = document.getElementById(userNodeId);
    if (!userNode) return;

    const containerRect = container.getBoundingClientRect();
    const nodeX = userNode.offsetLeft + (userNode.offsetWidth / 2);
    const nodeY = userNode.offsetTop + (userNode.offsetHeight / 2);
    
    setTransform(current => ({
      ...current,
      x: (containerRect.width / 2) - (nodeX * current.scale),
      y: (containerRect.height / 2) - (nodeY * current.scale),
    }));
  }, [containerRef, userNodeId]);
  
  // Center on initial load
  useEffect(() => {
    if (userNodeId) {
        // A small delay ensures the node is rendered before we try to find it
        const timer = setTimeout(centerOnNode, 100);
        return () => clearTimeout(timer);
    }
  }, [userNodeId, centerOnNode]);

  return { zoom, centerOnNode, transform, setTransform };
}
