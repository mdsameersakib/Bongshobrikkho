import { useState, useCallback, useEffect, useRef } from 'react';

export default function useTreeControls(containerRef, userNodeId) {
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 0.6 });
  const isPanning = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  const onMouseDown = useCallback((e) => {
    isPanning.current = true;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  }, []);

  const onMouseUp = useCallback(() => {
    isPanning.current = false;
  }, []);

  const onMouseMove = useCallback((e) => {
    if (!isPanning.current) return;
    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
    setTransform(t => ({ ...t, x: t.x + dx, y: t.y + dy }));
  }, []);

  const onWheel = useCallback((e) => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const scaleMultiplier = e.deltaY > 0 ? 0.9 : 1.1;
    
    setTransform(t => {
      const newScale = Math.max(0.2, Math.min(2, t.scale * scaleMultiplier));
      // Zoom towards the mouse pointer
      const newX = mouseX - (mouseX - t.x) * (newScale / t.scale);
      const newY = mouseY - (mouseY - t.y) * (newScale / t.scale);
      return { x: newX, y: newY, scale: newScale };
    });
  }, [containerRef]);

  const zoom = useCallback((direction) => {
    const container = containerRef.current;
    if (!container) return;
    const { width, height } = container.getBoundingClientRect();
    // The unused variable has been removed from the line below
    // Zoom towards the center of the viewport by simulating a wheel event
    onWheel({ clientX: width/2, clientY: height/2, deltaY: direction === 'out' ? 1 : -1, preventDefault: () => {} });
  }, [containerRef, onWheel]);
  
  const centerOnNode = useCallback(() => {
    const container = containerRef.current;
    if (!container || !userNodeId) return;
    const userNode = document.getElementById(userNodeId);
    if (!userNode) return;
    const containerRect = container.getBoundingClientRect();
    // Read original layout coordinates (before transform) from data attributes
    const baseX = parseFloat(userNode.getAttribute('data-x')) || 0;
    const baseY = parseFloat(userNode.getAttribute('data-y')) || 0;
    const nodeWidth = userNode.offsetWidth;
    const nodeHeight = userNode.offsetHeight;
    setTransform(cur => {
      const scale = cur.scale; // keep current scale (or adjust if needed)
      const centerTargetX = baseX + nodeWidth / 2;
      const centerTargetY = baseY + nodeHeight / 2;
      return {
        ...cur,
        x: containerRect.width / 2 - centerTargetX * scale,
        y: containerRect.height / 2 - centerTargetY * scale
      };
    });
  }, [containerRef, userNodeId]);
  
  // Center on initial load
  useEffect(() => {
    if (userNodeId) {
      centerOnNode();
    }
  }, [userNodeId, centerOnNode]);

  return { zoom, centerOnNode, transform, eventHandlers: { onMouseDown, onMouseUp, onMouseMove, onWheel, onMouseLeave: onMouseUp } };
}