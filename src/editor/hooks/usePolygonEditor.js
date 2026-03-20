import { useCallback, useEffect, useMemo, useState } from 'react';

const OUTER_RING_INDEX = -1;

function updateRingPoints(element, ringIndex, nextPoints) {
  if (ringIndex === OUTER_RING_INDEX) return { ...element, points: nextPoints };

  const holes = element.holes ? [...element.holes] : [];
  holes[ringIndex] = nextPoints;
  return { ...element, holes };
}

function getRingPoints(element, ringIndex) {
  if (!element) return [];
  if (ringIndex === OUTER_RING_INDEX) return element.points || [];
  return element.holes?.[ringIndex] || [];
}

export function usePolygonEditor({
  activeGroup,
  currentPoints,
  editGeomId,
  elements,
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
  const [activeRingIndex, setActiveRingIndex] = useState(OUTER_RING_INDEX);
  const [drawingHoleForId, setDrawingHoleForId] = useState(null);

  const editGeomEl = useMemo(() => elements.find(el => el.id === editGeomId) || null, [editGeomId, elements]);
  const isDrawingHole = drawingHoleForId != null && drawingHoleForId === editGeomId;

  const resetDraft = useCallback(() => {
    setCurrentPoints([]);
    setIsDrawing(false);
  }, [setCurrentPoints, setIsDrawing]);

  const finishPolygon = useCallback((points) => {
    const newId = `element_${Date.now()}`;
    const attrs = activeGroup
      ? activeGroup.attrKeys.map(key => ({ key, value: '' }))
      : [{ key: '', value: '' }];

    setElements(prev => [
      ...prev,
      {
        id: newId,
        points: [...points],
        holes: [],
        attributes: [],
        groupName: activeGroup ? activeGroup.name : null,
      },
    ]);
    resetDraft();
    setSelectedId(newId);
    setEditId(newId);
    setEditElId(newId);
    setEditAttrs(attrs);
    setSidebarTab('elements');
  }, [activeGroup, resetDraft, setEditAttrs, setEditElId, setEditId, setElements, setSelectedId, setSidebarTab]);

  const finishHole = useCallback((points) => {
    if (!drawingHoleForId) return;

    let insertedRingIndex = OUTER_RING_INDEX;
    setElements(prev => prev.map(el => {
      if (el.id !== drawingHoleForId) return el;
      const holes = [...(el.holes || []), [...points]];
      insertedRingIndex = holes.length - 1;
      return { ...el, holes };
    }));
    resetDraft();
    setSelectedId(drawingHoleForId);
    setActiveRingIndex(insertedRingIndex);
    setDrawingHoleForId(null);
  }, [drawingHoleForId, resetDraft, setElements, setSelectedId]);

  const handleCanvasClick = useCallback((e) => {
    if (isPanning.current || e.ctrlKey) return;
    const allowGeometryDraft = isDrawingHole && editGeomId;
    if (editGeomId && !allowGeometryDraft) return;
    if (['polygon', 'path'].includes(e.target.tagName) && !isDrawing && !allowGeometryDraft) return;

    const pt = getSVGPoint(e);
    if (!pt) return;

    if (currentPoints.length >= 3) {
      const first = currentPoints[0];
      const dist = Math.sqrt((pt.x - first.x) ** 2 + (pt.y - first.y) ** 2);
      const rect = imgRef.current?.getBoundingClientRect();
      if (rect && dist < 25 * (imgSize.w / rect.width)) {
        if (allowGeometryDraft) finishHole(currentPoints);
        else finishPolygon(currentPoints);
        return;
      }
    }

    setCurrentPoints(prev => [...prev, pt]);
    setIsDrawing(true);
  }, [currentPoints, editGeomId, finishHole, finishPolygon, getSVGPoint, imgRef, imgSize, isDrawing, isDrawingHole, isPanning, setCurrentPoints, setIsDrawing]);

  const handleDoubleClick = useCallback((e) => {
    e.preventDefault();
    if (currentPoints.length < 3) return;
    if (isDrawingHole && editGeomId) {
      finishHole(currentPoints);
      return;
    }
    finishPolygon(currentPoints);
  }, [currentPoints, editGeomId, finishHole, finishPolygon, isDrawingHole]);

  const startGeomEdit = useCallback((elId) => {
    setEditId(null);
    setSelectedId(elId);
    setSidebarTab('elements');
    setActiveRingIndex(OUTER_RING_INDEX);
    setDrawingHoleForId(null);
    resetDraft();
  }, [resetDraft, setEditId, setSelectedId, setSidebarTab]);

  const selectGeomRing = useCallback((ringIndex) => {
    setActiveRingIndex(ringIndex);
    resetDraft();
    setDrawingHoleForId(null);
  }, [resetDraft]);

  const startHoleDrawing = useCallback((elId) => {
    setSelectedId(elId);
    setActiveRingIndex(OUTER_RING_INDEX);
    setDrawingHoleForId(elId);
    resetDraft();
  }, [resetDraft, setSelectedId]);

  const cancelRingDrawing = useCallback(() => {
    setDrawingHoleForId(null);
    resetDraft();
  }, [resetDraft]);

  const handleVertexMouseDown = useCallback((e, elId, ringIndex, pointIdx) => {
    e.stopPropagation();
    e.preventDefault();
    setDraggingVertex({ elId, ringIndex, pointIdx });
  }, []);

  const handleVertexDrag = useCallback((e) => {
    if (!draggingVertex) return;
    const pt = getSVGPoint(e);
    if (!pt) return;

    setElements(prev => prev.map(el => {
      if (el.id !== draggingVertex.elId) return el;
      const ring = [...getRingPoints(el, draggingVertex.ringIndex)];
      ring[draggingVertex.pointIdx] = pt;
      return updateRingPoints(el, draggingVertex.ringIndex, ring);
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

  const addVertex = useCallback((elId, ringIndex, afterIdx) => {
    setElements(prev => prev.map(el => {
      if (el.id !== elId) return el;
      const ring = [...getRingPoints(el, ringIndex)];
      const p1 = ring[afterIdx];
      const p2 = ring[(afterIdx + 1) % ring.length];
      const mid = {
        x: Math.round(((p1.x + p2.x) / 2) * 100) / 100,
        y: Math.round(((p1.y + p2.y) / 2) * 100) / 100,
      };
      ring.splice(afterIdx + 1, 0, mid);
      return updateRingPoints(el, ringIndex, ring);
    }));
  }, [setElements]);

  const removeVertex = useCallback((elId, ringIndex, idx) => {
    setElements(prev => prev.map(el => {
      if (el.id !== elId) return el;
      const ring = getRingPoints(el, ringIndex);
      if (ring.length <= 3) return el;
      const nextPoints = ring.filter((_, pointIndex) => pointIndex !== idx);
      return updateRingPoints(el, ringIndex, nextPoints);
    }));
  }, [setElements]);

  const removeHole = useCallback((elId, holeIndex) => {
    setElements(prev => prev.map(el => {
      if (el.id !== elId) return el;
      return {
        ...el,
        holes: (el.holes || []).filter((_, index) => index !== holeIndex),
      };
    }));
    setActiveRingIndex(current => {
      if (current === holeIndex) return OUTER_RING_INDEX;
      if (current > holeIndex) return current - 1;
      return current;
    });
    setDrawingHoleForId(null);
    resetDraft();
  }, [resetDraft, setElements]);

  return {
    OUTER_RING_INDEX,
    activeRingIndex,
    addVertex,
    cancelRingDrawing,
    draggingVertex,
    editGeomEl,
    finishPolygon,
    handleCanvasClick,
    handleDoubleClick,
    handleVertexMouseDown,
    isDrawingHole,
    removeHole,
    removeVertex,
    selectGeomRing,
    setDraggingVertex,
    startGeomEdit,
    startHoleDrawing,
  };
}
