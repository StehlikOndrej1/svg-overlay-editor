import { useCallback, useEffect, useMemo, useState } from 'react';

const OUTER_RING_INDEX = -1;
const DRAFT_GEOMETRY_ID = '__draft__';

function updateRingPoints(element, ringIndex, nextPoints) {
  if (!element) return element;
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
  activeGroupId,
  currentPoints,
  draftElement,
  editGeomId,
  elements,
  getSVGPoint,
  imgRef,
  imgSize,
  isDrawing,
  isPanning,
  setCurrentPoints,
  setDraftElement,
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
  const isDrawingHole = drawingHoleForId != null;
  const isDrawingDraftHole = drawingHoleForId === DRAFT_GEOMETRY_ID;

  const resetDraftPoints = useCallback(() => {
    setCurrentPoints([]);
    setIsDrawing(false);
  }, [setCurrentPoints, setIsDrawing]);

  const beginDraftElement = useCallback((points) => {
    setDraftElement({
      points: [...points],
      holes: [],
      attributes: [],
      groupId: activeGroupId || null,
      groupName: activeGroup ? activeGroup.name : null,
    });
    resetDraftPoints();
    setActiveRingIndex(OUTER_RING_INDEX);
    setSelectedId(null);
    setSidebarTab('elements');
  }, [activeGroup, activeGroupId, resetDraftPoints, setDraftElement, setSelectedId, setSidebarTab]);

  const finishHole = useCallback((points) => {
    if (!drawingHoleForId) return;

    let insertedRingIndex = OUTER_RING_INDEX;

    if (drawingHoleForId === DRAFT_GEOMETRY_ID) {
      setDraftElement(prev => {
        if (!prev) return prev;
        const holes = [...(prev.holes || []), [...points]];
        insertedRingIndex = holes.length - 1;
        return { ...prev, holes };
      });
    } else {
      setElements(prev => prev.map(el => {
        if (el.id !== drawingHoleForId) return el;
        const holes = [...(el.holes || []), [...points]];
        insertedRingIndex = holes.length - 1;
        return { ...el, holes };
      }));
      setSelectedId(drawingHoleForId);
    }

    resetDraftPoints();
    setActiveRingIndex(insertedRingIndex);
    setDrawingHoleForId(null);
  }, [drawingHoleForId, resetDraftPoints, setDraftElement, setElements, setSelectedId]);

  const completeCurrentRing = useCallback(() => {
    if (currentPoints.length < 3) return false;
    if (isDrawingHole) {
      finishHole(currentPoints);
      return true;
    }
    beginDraftElement(currentPoints);
    return true;
  }, [beginDraftElement, currentPoints, finishHole, isDrawingHole]);

  const handleCanvasClick = useCallback((e) => {
    if (isPanning.current || e.ctrlKey) return;
    const allowGeometryDraft = isDrawingHole && editGeomId;
    if (editGeomId && !allowGeometryDraft) return;
    if (draftElement && !isDrawingHole) return;
    if (['polygon', 'path'].includes(e.target.tagName) && !isDrawing && !allowGeometryDraft && !isDrawingDraftHole) return;

    const pt = getSVGPoint(e);
    if (!pt) return;

    if (currentPoints.length >= 3) {
      const first = currentPoints[0];
      const dist = Math.sqrt((pt.x - first.x) ** 2 + (pt.y - first.y) ** 2);
      const rect = imgRef.current?.getBoundingClientRect();
      if (rect && dist < 25 * (imgSize.w / rect.width)) {
        completeCurrentRing();
        return;
      }
    }

    setCurrentPoints(prev => [...prev, pt]);
    setIsDrawing(true);
  }, [completeCurrentRing, currentPoints, draftElement, editGeomId, getSVGPoint, imgRef, imgSize, isDrawing, isDrawingDraftHole, isDrawingHole, isPanning, setCurrentPoints, setIsDrawing]);

  const handleDoubleClick = useCallback((e) => {
    e.preventDefault();
    completeCurrentRing();
  }, [completeCurrentRing]);

  const startGeomEdit = useCallback((elId) => {
    setEditId(null);
    setSelectedId(elId);
    setSidebarTab('elements');
    setActiveRingIndex(OUTER_RING_INDEX);
    setDrawingHoleForId(null);
    resetDraftPoints();
  }, [resetDraftPoints, setEditId, setSelectedId, setSidebarTab]);

  const selectGeomRing = useCallback((ringIndex) => {
    setActiveRingIndex(ringIndex);
    resetDraftPoints();
    setDrawingHoleForId(null);
  }, [resetDraftPoints]);

  const startHoleDrawing = useCallback((elId = DRAFT_GEOMETRY_ID) => {
    setSelectedId(elId === DRAFT_GEOMETRY_ID ? null : elId);
    setActiveRingIndex(OUTER_RING_INDEX);
    setDrawingHoleForId(elId);
    resetDraftPoints();
  }, [resetDraftPoints, setSelectedId]);

  const cancelRingDrawing = useCallback(() => {
    setDrawingHoleForId(null);
    resetDraftPoints();
  }, [resetDraftPoints]);

  const undoLastPoint = useCallback(() => {
    setCurrentPoints(prev => {
      const next = prev.slice(0, -1);
      if (next.length === 0) setIsDrawing(false);
      return next;
    });
  }, [setCurrentPoints, setIsDrawing]);

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
    if (elId === DRAFT_GEOMETRY_ID) {
      setDraftElement(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          holes: (prev.holes || []).filter((_, index) => index !== holeIndex),
        };
      });
    } else {
      setElements(prev => prev.map(el => {
        if (el.id !== elId) return el;
        return {
          ...el,
          holes: (el.holes || []).filter((_, index) => index !== holeIndex),
        };
      }));
    }

    setActiveRingIndex(current => {
      if (current === holeIndex) return OUTER_RING_INDEX;
      if (current > holeIndex) return current - 1;
      return current;
    });
    setDrawingHoleForId(null);
    resetDraftPoints();
  }, [resetDraftPoints, setDraftElement, setElements]);



  return {
    DRAFT_GEOMETRY_ID,
    OUTER_RING_INDEX,
    activeRingIndex,
    addVertex,
    beginDraftElement,
    cancelRingDrawing,
    completeCurrentRing,
    draggingVertex,
    editGeomEl,
    handleCanvasClick,
    handleDoubleClick,
    handleVertexMouseDown,
    isDrawingDraftHole,
    isDrawingHole,
    removeHole,
    removeVertex,
    selectGeomRing,
    setDraggingVertex,
    startGeomEdit,
    startHoleDrawing,
    undoLastPoint,
  };
}
