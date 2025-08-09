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

  // Touch support (pan + pinch zoom)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let pinch = null; // {distance, centerX, centerY}
    const getPoint = (t) => ({ x: t.clientX, y: t.clientY });
    const dist = (a,b) => Math.hypot(a.x-b.x, a.y-b.y);
    const mid = (a,b) => ({ x:(a.x+b.x)/2, y:(a.y+b.y)/2 });

    const onTouchStart = (e) => {
      if (e.touches.length === 1) {
        isPanning.current = true;
        lastMousePos.current = getPoint(e.touches[0]);
      } else if (e.touches.length === 2) {
        isPanning.current = false;
        const p1 = getPoint(e.touches[0]);
        const p2 = getPoint(e.touches[1]);
        const m = mid(p1,p2);
        pinch = { distance: dist(p1,p2), centerX: m.x, centerY: m.y };
      }
    };
    const onTouchMove = (e) => {
      if (pinch && e.touches.length === 2) {
        e.preventDefault();
        const p1 = getPoint(e.touches[0]);
        const p2 = getPoint(e.touches[1]);
        const newDist = dist(p1,p2);
        const scaleFactor = newDist / pinch.distance;
        const rect = el.getBoundingClientRect();
        const localX = pinch.centerX - rect.left;
        const localY = pinch.centerY - rect.top;
        setTransform(t => {
          const newScale = Math.max(0.2, Math.min(2, t.scale * scaleFactor));
          const newX = localX - (localX - t.x) * (newScale / t.scale);
            const newY = localY - (localY - t.y) * (newScale / t.scale);
          return { x: newX, y: newY, scale: newScale };
        });
        pinch.distance = newDist;
      } else if (isPanning.current && e.touches.length === 1) {
        const p = getPoint(e.touches[0]);
        const dx = p.x - lastMousePos.current.x;
        const dy = p.y - lastMousePos.current.y;
        lastMousePos.current = p;
        setTransform(t => ({ ...t, x: t.x + dx, y: t.y + dy }));
      }
    };
    const onTouchEnd = () => { isPanning.current = false; pinch = null; };
    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd);
    el.addEventListener('touchcancel', onTouchEnd);
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [containerRef]);

  return { zoom, centerOnNode, transform, eventHandlers: { onMouseDown, onMouseUp, onMouseMove, onWheel, onMouseLeave: onMouseUp } };
}