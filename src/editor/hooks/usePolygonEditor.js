import { useCallback, useEffect, useState } from 'react';
import {
  addHoleToGeometry,
  createGeometry,
  getRingPoints,
  updateRingPoints,
  validateHoleRing,
} from '../../shared/lib/geometry.js';

export function usePolygonEditor({
  activeGroup,
  activeRingRef,
  currentRingPoints,
  draftGeometry,
  drawingMode,
  editGeomId,
  getSVGPoint,
  imgRef,
  imgSize,
  isPanning,
  setActiveRingRef,
  setCurrentRingPoints,
  setDraftGeometry,
  setDrawingMode,
  setEditAttrs,
  setEditElId,
  setEditGeomId,
  setEditId,
  setElements,
  setNotice,
  setSelectedId,
  setSidebarTab,
}) {
  const [draggingVertex, setDraggingVertex] = useState(null);

  const resetDraftState = useCallback(() => {
    setDraftGeometry(null);
    setCurrentRingPoints([]);
    setDrawingMode(null);
  }, [setCurrentRingPoints, setDraftGeometry, setDrawingMode]);

  const commitNewElement = useCallback((geometry) => {
    const newId = `element_${Date.now()}`;
    const attrs = activeGroup
      ? activeGroup.attrKeys.map(key => ({ key, value: '' }))
      : [{ key: '', value: '' }];

    setElements(prev => [
      ...prev,
      { id: newId, geometry, attributes: [], groupName: activeGroup ? activeGroup.name : null },
    ]);
    setSelectedId(newId);
    setEditId(newId);
    setEditElId(newId);
    setEditAttrs(attrs);
    setSidebarTab('elements');
    resetDraftState();
    setNotice('Polygon uložen.');
  }, [activeGroup, resetDraftState, setEditAttrs, setEditElId, setEditId, setElements, setNotice, setSelectedId, setSidebarTab]);

  const finishCurrentRing = useCallback((points) => {
    if (drawingMode === 'exterior') {
      setDraftGeometry(createGeometry([...points], []));
      setCurrentRingPoints([]);
      setDrawingMode(null);
      setSidebarTab('elements');
      setNotice('Exterior ring je hotový. Můžeš dokončit polygon nebo přidat díru.');
      return;
    }

    if (drawingMode === 'hole' && draftGeometry) {
      const result = validateHoleRing(draftGeometry, points);
      if (!result.ok) {
        setNotice(result.reason);
        return;
      }
      setDraftGeometry(addHoleToGeometry(draftGeometry, [...points]));
      setCurrentRingPoints([]);
      setDrawingMode(null);
      setNotice('Interior ring přidán do rozpracovaného polygonu.');
      return;
    }

    if (drawingMode === 'edit-hole' && editGeomId) {
      let nextHoleIndex = null;
      let validation = { ok: true };
      setElements(prev => prev.map(el => {
        if (el.id !== editGeomId) return el;
        validation = validateHoleRing(el.geometry, points);
        if (!validation.ok) return el;
        nextHoleIndex = el.geometry.holes.length;
        return { ...el, geometry: addHoleToGeometry(el.geometry, [...points]) };
      }));
      if (!validation.ok) {
        setNotice(validation.reason);
        return;
      }
      setCurrentRingPoints([]);
      setDrawingMode(null);
      setActiveRingRef({ type: 'hole', holeIndex: nextHoleIndex });
      setNotice('Interior ring přidán do polygonu.');
    }
  }, [draftGeometry, drawingMode, editGeomId, setActiveRingRef, setCurrentRingPoints, setDraftGeometry, setDrawingMode, setElements, setNotice, setSidebarTab]);

  const handleCanvasClick = useCallback((e) => {
    if (isPanning.current || e.ctrlKey) return;
    if (!drawingMode) {
      if (!draftGeometry && !editGeomId) {
        setDrawingMode('exterior');
      } else {
        return;
      }
    }

    if (['path', 'polygon'].includes(e.target.tagName) && drawingMode === 'exterior' && !draftGeometry) return;

    const pt = getSVGPoint(e);
    if (!pt) return;

    if (currentRingPoints.length >= 3) {
      const first = currentRingPoints[0];
      const dist = Math.sqrt((pt.x - first.x) ** 2 + (pt.y - first.y) ** 2);
      const rect = imgRef.current?.getBoundingClientRect();
      if (rect && dist < 25 * (imgSize.w / rect.width)) {
        finishCurrentRing(currentRingPoints);
        return;
      }
    }

    setCurrentRingPoints(prev => [...prev, pt]);
  }, [currentRingPoints, draftGeometry, drawingMode, editGeomId, finishCurrentRing, getSVGPoint, imgRef, imgSize, isPanning, setCurrentRingPoints, setDrawingMode]);

  const handleDoubleClick = useCallback((e) => {
    e.preventDefault();
    if (currentRingPoints.length >= 3) finishCurrentRing(currentRingPoints);
  }, [currentRingPoints, finishCurrentRing]);

  const finishDraftPolygon = useCallback(() => {
    if (!draftGeometry?.exterior?.length) return;
    commitNewElement(draftGeometry);
  }, [commitNewElement, draftGeometry]);

  const startHoleDraft = useCallback(() => {
    if (draftGeometry?.exterior?.length) {
      setDrawingMode('hole');
      setCurrentRingPoints([]);
      setNotice('Kreslíš interior ring rozpracovaného polygonu.');
      return;
    }

    if (editGeomId) {
      setDrawingMode('edit-hole');
      setCurrentRingPoints([]);
      setNotice('Kreslíš novou díru do vybraného polygonu.');
    }
  }, [draftGeometry, editGeomId, setCurrentRingPoints, setDrawingMode, setNotice]);

  const startGeomEdit = useCallback((elId) => {
    setEditGeomId(elId);
    setEditId(null);
    setSelectedId(elId);
    setSidebarTab('elements');
    setActiveRingRef({ type: 'exterior' });
    setNotice('Režim úpravy geometrie.');
  }, [setActiveRingRef, setEditGeomId, setEditId, setNotice, setSelectedId, setSidebarTab]);

  const handleVertexMouseDown = useCallback((e, elId, pointIdx) => {
    e.stopPropagation();
    e.preventDefault();
    setDraggingVertex({ elId, pointIdx, ringRef: activeRingRef });
  }, [activeRingRef]);

  const handleVertexDrag = useCallback((e) => {
    if (!draggingVertex) return;
    const pt = getSVGPoint(e);
    if (!pt) return;

    setElements(prev => prev.map(el => {
      if (el.id !== draggingVertex.elId) return el;
      const ringPoints = [...getRingPoints(el.geometry, draggingVertex.ringRef)];
      ringPoints[draggingVertex.pointIdx] = pt;
      return { ...el, geometry: updateRingPoints(el.geometry, draggingVertex.ringRef, ringPoints) };
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
      const ringPoints = [...getRingPoints(el.geometry, activeRingRef)];
      const p1 = ringPoints[afterIdx];
      const p2 = ringPoints[(afterIdx + 1) % ringPoints.length];
      const mid = {
        x: Math.round(((p1.x + p2.x) / 2) * 100) / 100,
        y: Math.round(((p1.y + p2.y) / 2) * 100) / 100,
      };
      ringPoints.splice(afterIdx + 1, 0, mid);
      return { ...el, geometry: updateRingPoints(el.geometry, activeRingRef, ringPoints) };
    }));
  }, [activeRingRef, setElements]);

  const removeVertex = useCallback((elId, idx) => {
    setElements(prev => prev.map(el => {
      if (el.id !== elId) return el;
      const ringPoints = getRingPoints(el.geometry, activeRingRef);
      if (ringPoints.length <= 3) return el;
      return {
        ...el,
        geometry: updateRingPoints(el.geometry, activeRingRef, ringPoints.filter((_, index) => index !== idx)),
      };
    }));
  }, [activeRingRef, setElements]);

  const removeHole = useCallback((elId, holeIndex) => {
    setElements(prev => prev.map(el => {
      if (el.id !== elId) return el;
      return {
        ...el,
        geometry: {
          ...el.geometry,
          holes: el.geometry.holes.filter((_, index) => index !== holeIndex),
        },
      };
    }));
    setActiveRingRef({ type: 'exterior' });
    setNotice('Díra byla odstraněna.');
  }, [setActiveRingRef, setElements, setNotice]);

  const cancelCurrentDrawing = useCallback(() => {
    setCurrentRingPoints([]);
    if (drawingMode === 'hole' || drawingMode === 'edit-hole') {
      setDrawingMode(null);
      setNotice('Kreslení interior ringu zrušeno.');
      return;
    }
    if (drawingMode === 'exterior') {
      resetDraftState();
      setNotice('Kreslení polygonu zrušeno.');
    }
  }, [drawingMode, resetDraftState, setCurrentRingPoints, setDrawingMode, setNotice]);

  return {
    addVertex,
    cancelCurrentDrawing,
    finishDraftPolygon,
    handleCanvasClick,
    handleDoubleClick,
    handleVertexMouseDown,
    removeHole,
    removeVertex,
    resetDraftState,
    startGeomEdit,
    startHoleDraft,
  };
}
