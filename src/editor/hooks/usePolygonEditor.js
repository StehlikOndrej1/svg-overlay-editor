import { useCallback, useEffect, useState } from 'react';

export function usePolygonEditor({
  activeGroup,
  currentPoints,
  editGeomId,
  getSVGPoint,
  imgRef,
  imgSize,
  isDrawing,
  isPanning,
  setCurrentPoints,
  setEditAttrs,
  setEditElId,
  setEditId,
  setElements,
  setIsDrawing,
  setSelectedId,
  setSidebarTab,
}) {
  const [draggingVertex, setDraggingVertex] = useState(null);

  const finishPolygon = useCallback((points) => {
    const newId = `element_${Date.now()}`;
    const attrs = activeGroup
      ? activeGroup.attrKeys.map(k => ({ key: k, value: '' }))
      : [{ key: '', value: '' }];

    setElements(prev => [
      ...prev,
      { id: newId, points: [...points], attributes: [], groupName: activeGroup ? activeGroup.name : null },
    ]);
    setCurrentPoints([]);
    setIsDrawing(false);
    setSelectedId(newId);
    setEditId(newId);
    setEditElId(newId);
    setEditAttrs(attrs);
    setSidebarTab('elements');
  }, [activeGroup, setCurrentPoints, setEditAttrs, setEditElId, setEditId, setElements, setIsDrawing, setSelectedId, setSidebarTab]);

  const handleCanvasClick = useCallback((e) => {
    if (isPanning.current || e.ctrlKey) return;
    if (editGeomId) return;
    if (e.target.tagName === 'polygon' && !isDrawing) return;
    const pt = getSVGPoint(e);
    if (!pt) return;
    if (currentPoints.length >= 3) {
      const first = currentPoints[0];
      const dist = Math.sqrt((pt.x - first.x) ** 2 + (pt.y - first.y) ** 2);
      const rect = imgRef.current?.getBoundingClientRect();
      if (rect && dist < 25 * (imgSize.w / rect.width)) {
        finishPolygon(currentPoints);
        return;
      }
    }
    setCurrentPoints(prev => [...prev, pt]);
    setIsDrawing(true);
  }, [currentPoints, editGeomId, finishPolygon, getSVGPoint, imgRef, imgSize, isDrawing, isPanning, setCurrentPoints, setIsDrawing]);

  const handleDoubleClick = useCallback((e) => {
    e.preventDefault();
    if (currentPoints.length >= 3) finishPolygon(currentPoints);
  }, [currentPoints, finishPolygon]);

  const startGeomEdit = useCallback((elId) => {
    setEditId(null);
    setSelectedId(elId);
    setSidebarTab('elements');
  }, [setEditId, setSelectedId, setSidebarTab]);

  const handleVertexMouseDown = useCallback((e, elId, pointIdx) => {
    e.stopPropagation();
    e.preventDefault();
    setDraggingVertex({ elId, pointIdx });
  }, []);

  const handleVertexDrag = useCallback((e) => {
    if (!draggingVertex) return;
    const pt = getSVGPoint(e);
    if (!pt) return;
    setElements(prev => prev.map(el => {
      if (el.id !== draggingVertex.elId) return el;
      const newPts = [...el.points];
      newPts[draggingVertex.pointIdx] = pt;
      return { ...el, points: newPts };
    }));
  }, [draggingVertex, getSVGPoint, setElements]);

  const handleVertexMouseUp = useCallback(() => {
    setDraggingVertex(null);
  }, []);

  useEffect(() => {
    if (!draggingVertex) return;
    window.addEventListener('mousemove', handleVertexDrag);
    window.addEventListener('mouseup', handleVertexMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleVertexDrag);
      window.removeEventListener('mouseup', handleVertexMouseUp);
    };
  }, [draggingVertex, handleVertexDrag, handleVertexMouseUp]);

  const addVertex = useCallback((elId, afterIdx) => {
    setElements(prev => prev.map(el => {
      if (el.id !== elId) return el;
      const pts = [...el.points];
      const p1 = pts[afterIdx];
      const p2 = pts[(afterIdx + 1) % pts.length];
      const mid = {
        x: Math.round(((p1.x + p2.x) / 2) * 100) / 100,
        y: Math.round(((p1.y + p2.y) / 2) * 100) / 100,
      };
      pts.splice(afterIdx + 1, 0, mid);
      return { ...el, points: pts };
    }));
  }, [setElements]);

  const removeVertex = useCallback((elId, idx) => {
    setElements(prev => prev.map(el => {
      if (el.id !== elId || el.points.length <= 3) return el;
      return { ...el, points: el.points.filter((_, i) => i !== idx) };
    }));
  }, [setElements]);

  return {
    addVertex,
    draggingVertex,
    finishPolygon,
    handleCanvasClick,
    handleDoubleClick,
    handleVertexMouseDown,
    removeVertex,
    setDraggingVertex,
    startGeomEdit,
  };
}
