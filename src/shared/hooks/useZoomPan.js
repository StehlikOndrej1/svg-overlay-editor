import { useCallback, useEffect, useRef, useState } from 'react';

export function useZoomPan(canvasRef, disabled = false) {
  const [view, setView] = useState({ zoom: 1, panX: 0, panY: 0 });
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const panStartView = useRef({ panX: 0, panY: 0 });
  const disabledRef = useRef(disabled);

  useEffect(() => {
    disabledRef.current = disabled;
  }, [disabled]);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    if (disabledRef.current) return;
    const el = canvasRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    setView(prev => {
      const newZoom = Math.min(10, Math.max(0.1, prev.zoom * factor));
      const scale = newZoom / prev.zoom;
      return {
        zoom: newZoom,
        panX: mx - scale * (mx - prev.panX),
        panY: my - scale * (my - prev.panY),
      };
    });
  }, [canvasRef]);

  const handleMouseDown = useCallback((e) => {
    if (disabledRef.current) return;
    if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
      e.preventDefault();
      isPanning.current = true;
      panStart.current = { x: e.clientX, y: e.clientY };
      setView(prev => {
        panStartView.current = { panX: prev.panX, panY: prev.panY };
        return prev;
      });
      if (canvasRef.current) canvasRef.current.style.cursor = 'grabbing';
    }
  }, [canvasRef]);

  const handleMouseMove = useCallback((e) => {
    if (!isPanning.current) return;
    const dx = e.clientX - panStart.current.x;
    const dy = e.clientY - panStart.current.y;
    setView(prev => ({ ...prev, panX: panStartView.current.panX + dx, panY: panStartView.current.panY + dy }));
  }, []);

  const handleMouseUp = useCallback(() => {
    isPanning.current = false;
    if (canvasRef.current) canvasRef.current.style.cursor = '';
  }, [canvasRef]);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    el.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      el.removeEventListener('wheel', handleWheel);
      el.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [canvasRef, handleWheel, handleMouseDown, handleMouseMove, handleMouseUp]);

  const centerOn = useCallback((contentW, contentH) => {
    const el = canvasRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setView({ zoom: 1, panX: (rect.width - contentW) / 2, panY: (rect.height - contentH) / 2 });
  }, [canvasRef]);

  const resetView = useCallback((contentW, contentH) => { centerOn(contentW, contentH); }, [centerOn]);

  const zoomIn = useCallback(() => {
    const el = canvasRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    setView(prev => {
      const newZ = Math.min(10, prev.zoom * 1.3);
      const s = newZ / prev.zoom;
      return { zoom: newZ, panX: cx - s * (cx - prev.panX), panY: cy - s * (cy - prev.panY) };
    });
  }, [canvasRef]);

  const zoomOut = useCallback(() => {
    const el = canvasRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    setView(prev => {
      const newZ = Math.max(0.1, prev.zoom / 1.3);
      const s = newZ / prev.zoom;
      return { zoom: newZ, panX: cx - s * (cx - prev.panX), panY: cy - s * (cy - prev.panY) };
    });
  }, [canvasRef]);

  const zoom = view.zoom;
  const pan = { x: view.panX, y: view.panY };
  return { zoom, pan, resetView, centerOn, zoomIn, zoomOut, isPanning };
}
