import React, { useEffect, useMemo, useRef, useState } from 'react';

export default function TreeCanvas({ layout, centerNodeId }) {
  const { nodes, edges, marriageLines, width: contentW, height: contentH } = layout;

  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // Helpers
  const clampScale = (s) => Math.min(2.5, Math.max(0.3, s));

  const fitView = () => {
    const el = containerRef.current;
    if (!el) return;
    const cw = el.clientWidth;
    const ch = el.clientHeight;
    const s = Math.min(cw / (contentW + 200), ch / (contentH + 200), 1);
    setScale(s);
    setPan({
      x: (cw - contentW * s) / 2,
      y: Math.max(20, (ch - contentH * s) / 2),
    });
  };

  const centerOnNode = (nodeId) => {
    const el = containerRef.current;
    if (!el) return;
    const n = nodes.find(nn => nn.id === nodeId);
    if (!n) return fitView();
    const cw = el.clientWidth;
    const ch = el.clientHeight;
    // Keep a reasonable initial zoom
    const s = Math.min(Math.max(cw / 600, 0.5), 1.1);
    setScale(s);
    setPan({
      x: cw / 2 - (n.x + n.w / 2) * s,
      y: Math.max(20, ch / 2 - (n.y + n.h / 2) * s),
    });
  };

  // Initial center on user (if provided), else fit
  useEffect(() => {
    const id = centerNodeId;
    if (id) centerOnNode(id);
    else fitView();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentW, contentH, centerNodeId, nodes.length]);

  // Mouse drag panning
  const dragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const onMouseDown = (e) => {
    dragging.current = true;
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };
  const onMouseMove = (e) => {
    if (!dragging.current) return;
    setPan({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
  };
  const onMouseUp = () => (dragging.current = false);

  // Wheel zoom/pan
  const onWheel = (e) => {
    const el = containerRef.current;
    if (!el) return;
    if (e.ctrlKey || e.metaKey) {
      // Zoom around cursor
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const prev = scale;
      const next = clampScale(prev * (e.deltaY < 0 ? 1.1 : 1 / 1.1));

      // Adjust pan to keep cursor world point stable
      const worldX = (cx - pan.x) / prev;
      const worldY = (cy - pan.y) / prev;
      const newPanX = cx - worldX * next;
      const newPanY = cy - worldY * next;

      setScale(next);
      setPan({ x: newPanX, y: newPanY });
    } else {
      // Trackpad/mouse wheel pan
      e.preventDefault();
      const factor = 1; // raw deltas suffice
      setPan(({ x, y }) => ({ x: x - e.deltaX * factor, y: y - e.deltaY * factor }));
    }
  };

  // Touch pinch/drag
  const touchState = useRef({ touching: false, lastDist: 0, startPan: { x: 0, y: 0 }, startScale: 1, center: { x: 0, y: 0 } });
  const getDist = (t1, t2) => Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
  const getMid = (t1, t2) => ({ x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 });

  const onTouchStart = (e) => {
    if (e.touches.length === 1) {
      dragging.current = true;
      dragStart.current = { x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y };
    } else if (e.touches.length === 2) {
      touchState.current.touching = true;
      touchState.current.lastDist = getDist(e.touches[0], e.touches[1]);
      touchState.current.startPan = { ...pan };
      touchState.current.startScale = scale;
      touchState.current.center = getMid(e.touches[0], e.touches[1]);
    }
  };

  const onTouchMove = (e) => {
    if (e.touches.length === 1 && dragging.current) {
      setPan({ x: e.touches[0].clientX - dragStart.current.x, y: e.touches[0].clientY - dragStart.current.y });
    } else if (e.touches.length === 2 && touchState.current.touching) {
      e.preventDefault();
      const dist = getDist(e.touches[0], e.touches[1]);
      const mid = getMid(e.touches[0], e.touches[1]);
      const prev = touchState.current.startScale;
      const next = clampScale(prev * (dist / touchState.current.lastDist));

      // Zoom toward pinch center
      const el = containerRef.current;
      const rect = el.getBoundingClientRect();
      const cx = mid.x - rect.left;
      const cy = mid.y - rect.top;

      const worldX = (cx - touchState.current.startPan.x) / prev;
      const worldY = (cy - touchState.current.startPan.y) / prev;
      const newPanX = cx - worldX * next;
      const newPanY = cy - worldY * next;

      setScale(next);
      setPan({ x: newPanX, y: newPanY });
    }
  };

  const onTouchEnd = () => {
    dragging.current = false;
    touchState.current.touching = false;
  };

  const zoomIn = () => setScale(s => clampScale(s * 1.2));
  const zoomOut = () => setScale(s => clampScale(s / 1.2));

  const meNode = useMemo(() => nodes.find(n => (n.relationship || '').toLowerCase() === 'you'), [nodes]);
  const centerMe = () => centerOnNode(meNode?.id);

  return (
    <div className="relative w-full h-[80vh] rounded-lg bg-white border overflow-hidden select-none">
      {/* Controls */}
      <div className="absolute top-3 right-3 z-10 bg-white/90 backdrop-blur p-2 rounded-lg shadow flex gap-2">
        <button onClick={zoomIn} className="h-9 w-9 flex items-center justify-center rounded-md hover:bg-gray-100" title="Zoom In">+</button>
        <button onClick={zoomOut} className="h-9 w-9 flex items-center justify-center rounded-md hover:bg-gray-100" title="Zoom Out">−</button>
        <button onClick={fitView} className="h-9 px-2 rounded-md hover:bg-gray-100" title="Fit">Fit</button>
        <button onClick={centerMe} className="h-9 px-2 rounded-md hover:bg-gray-100" title="Center on Me">Me</button>
      </div>

      {/* Mobile hint */}
      <div className="absolute bottom-3 left-3 z-10 bg-white/90 text-xs text-gray-600 px-2 py-1 rounded md:hidden">
        Pinch to zoom • Drag to pan
      </div>

      {/* Grid background */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onWheel={onWheel}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          backgroundImage:
            'radial-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(#f8fafc 1px, transparent 1px), linear-gradient(90deg, #f8fafc 1px, transparent 1px)',
          backgroundSize: '20px 20px, 40px 40px, 40px 40px',
        }}
      >
        <div
          className="relative"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            transformOrigin: '0 0',
            width: contentW + 200,
            height: contentH + 200,
          }}
        >
          {/* Lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {edges.map(e => (
              <path
                key={e.id}
                d={`M ${e.x1} ${e.y1} L ${e.x1} ${e.y1 + 12} L ${e.x2} ${e.y1 + 12} L ${e.x2} ${e.y2}`}
                fill="none"
                stroke="#94a3b8"
                strokeWidth="2"
                strokeLinecap="round"
              />
            ))}
            {marriageLines.map(m => (
              <line
                key={m.id}
                x1={m.x1}
                y1={m.y1}
                x2={m.x2}
                y2={m.y2}
                stroke="#475569"
                strokeWidth="3"
                strokeLinecap="round"
              />
            ))}
          </svg>

          {/* Person nodes */}
          {nodes.map(n => (
            <div
              key={n.id}
              className={`absolute bg-white border border-gray-200 rounded-lg shadow-sm px-3 py-2 text-center`}
              style={{ left: n.x, top: n.y, width: n.w, height: n.h }}
            >
              <div className="text-sm font-semibold text-gray-800 truncate">
                {n.person.firstName} {n.person.lastName || ''}
              </div>
              {n.person.birthDate ? (
                <div className="text-[11px] text-gray-500 mt-1 truncate">Born: {n.person.birthDate}</div>
              ) : null}
              {n.relationship ? (
                <div className="text-[11px] text-teal-700 mt-1 truncate">{n.relationship}</div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}