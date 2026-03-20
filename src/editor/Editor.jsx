import { useCallback, useEffect, useRef, useState } from 'react';
import AttributesEditor from './components/AttributesEditor.jsx';
import DraftPolygonPanel from './components/DraftPolygonPanel.jsx';
import EditorCanvas from './components/EditorCanvas.jsx';
import ElementsPanel from './components/ElementsPanel.jsx';
import GeometryEditorPanel from './components/GeometryEditorPanel.jsx';
import GroupsPanel from './components/GroupsPanel.jsx';
import SidebarActions from './components/SidebarActions.jsx';
import { usePolygonEditor } from './hooks/usePolygonEditor.js';
import { generateSVG, parseSVGFile } from './lib/svgUtils.js';
import { JS_LIBRARY } from '../shared/lib/jsLibrary.js';
import { useZoomPan } from '../shared/hooks/useZoomPan.js';
import { countGeometryPoints } from '../shared/lib/geometry.js';

export default function Editor() {
  const [phase, setPhase] = useState('choose');
  const [image, setImage] = useState(null);
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  const [elements, setElements] = useState([]);
  const [currentRingPoints, setCurrentRingPoints] = useState([]);
  const [drawingMode, setDrawingMode] = useState(null);
  const [draftGeometry, setDraftGeometry] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [editId, setEditId] = useState(null);
  const [editAttrs, setEditAttrs] = useState([{ key: '', value: '' }]);
  const [editElId, setEditElId] = useState('');
  const [sidebarTab, setSidebarTab] = useState('elements');
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [editGeomId, setEditGeomId] = useState(null);
  const [activeRingRef, setActiveRingRef] = useState({ type: 'exterior' });
  const [groups, setGroups] = useState([]);
  const [activeGroupId, setActiveGroupId] = useState(null);
  const [editingGroup, setEditingGroup] = useState(null);
  const [groupForm, setGroupForm] = useState({ name: '', attrKeys: [''] });
  const [editModeSvgLoaded, setEditModeSvgLoaded] = useState(false);
  const [renderedW, setRenderedW] = useState(1);
  const [notice, setNotice] = useState('');

  const svgRef = useRef(null);
  const imgRef = useRef(null);
  const fileRef = useRef(null);
  const editImgRef = useRef(null);
  const editSvgRef = useRef(null);
  const canvasAreaRef = useRef(null);
  const renameInputRef = useRef(null);
  const { zoom, pan, resetView, centerOn, zoomIn, zoomOut, isPanning } = useZoomPan(canvasAreaRef, phase !== 'canvas');

  const activeGroup = groups.find(group => group.id === activeGroupId) || null;
  const editGeomEl = editGeomId ? elements.find(element => element.id === editGeomId) : null;
  const isDrawing = !!drawingMode;

  const getDisplayedImgSize = useCallback(() => {
    if (!imgSize.w || !imgSize.h) return { w: 0, h: 0 };
    const maxW = window.innerWidth * 0.7;
    const maxH = window.innerHeight * 0.75;
    const scale = Math.min(maxW / imgSize.w, maxH / imgSize.h, 1);
    return { w: imgSize.w * scale, h: imgSize.h * scale };
  }, [imgSize]);

  useEffect(() => {
    if (phase === 'canvas' && imgSize.w > 0) {
      const ds = getDisplayedImgSize();
      requestAnimationFrame(() => centerOn(ds.w, ds.h));
    }
  }, [phase, imgSize, centerOn, getDisplayedImgSize]);

  useEffect(() => {
    if (phase !== 'canvas') return;
    const updateRenderedWidth = () => {
      if (imgRef.current?.clientWidth) setRenderedW(imgRef.current.clientWidth);
      else if (imgSize.w) setRenderedW(imgSize.w);
    };
    updateRenderedWidth();
    window.addEventListener('resize', updateRenderedWidth);
    return () => window.removeEventListener('resize', updateRenderedWidth);
  }, [phase, imgSize.w, image]);

  const resetEditorState = useCallback(() => {
    setElements([]);
    setCurrentRingPoints([]);
    setDrawingMode(null);
    setDraftGeometry(null);
    setSelectedId(null);
    setEditId(null);
    setEditGeomId(null);
    setActiveRingRef({ type: 'exterior' });
    setNotice('');
  }, []);

  const handleImageUpload = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
      setImage(url);
      resetEditorState();
      setPhase('canvas');
    };
    img.src = url;
  };

  const handleEditImageUpload = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { setImgSize({ w: img.naturalWidth, h: img.naturalHeight }); setImage(url); };
    img.src = url;
  };

  const handleEditSvgUpload = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const parsed = parseSVGFile(e.target.result);
      setElements(parsed);
      setEditModeSvgLoaded(true);
      setNotice('SVG overlay načten.');
      const groupNames = [...new Set(parsed.map(p => p.groupName).filter(Boolean))];
      if (groupNames.length > 0 && groups.length === 0) {
        setGroups(groupNames.map(name => {
          const sample = parsed.find(p => p.groupName === name);
          return { id: `grp_${Date.now()}_${name}`, name, attrKeys: sample ? sample.attributes.map(a => a.key) : [] };
        }));
      }
    };
    reader.readAsText(file);
  };

  const startEditCanvas = () => {
    if (image && editModeSvgLoaded) {
      setPhase('canvas');
      setCurrentRingPoints([]);
      setDrawingMode(null);
      setDraftGeometry(null);
      setSelectedId(null);
      setNotice('Overlay otevřen v editoru.');
    }
  };

  const goBack = () => {
    setPhase('choose');
    setImage(null);
    resetEditorState();
    setEditModeSvgLoaded(false);
  };

  const getSVGPoint = useCallback((e) => {
    if (!svgRef.current || !imgRef.current) return null;
    const rect = imgRef.current.getBoundingClientRect();
    return {
      x: Math.round((e.clientX - rect.left) * (imgSize.w / rect.width) * 100) / 100,
      y: Math.round((e.clientY - rect.top) * (imgSize.h / rect.height) * 100) / 100,
    };
  }, [imgSize]);

  const {
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
  } = usePolygonEditor({
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
  });

  const handleShapeClick = (e, elId) => {
    e.stopPropagation();
    if (isDrawing) return;
    if (editGeomId && editGeomId !== elId) return;
    setSelectedId(elId);
  };

  const startEditAttrs = (elId) => {
    const el = elements.find(item => item.id === elId);
    if (!el) return;
    setEditId(elId);
    setEditElId(el.id);
    setEditAttrs(el.attributes.length > 0 ? [...el.attributes] : [{ key: '', value: '' }]);
    setEditGeomId(null);
    setSidebarTab('elements');
    setNotice('Úprava atributů.');
  };

  const saveAttributes = () => {
    if (!editId) return;
    setElements(prev => prev.map(el => el.id === editId ? { ...el, id: editElId || el.id, attributes: editAttrs.filter(attr => attr.key.trim()) } : el));
    if (editElId && editElId !== editId) setSelectedId(editElId);
    setEditId(null);
    setNotice('Atributy uloženy.');
  };

  const deleteElement = useCallback((elId) => {
    setElements(prev => prev.filter(element => element.id !== elId));
    if (selectedId === elId) setSelectedId(null);
    if (editId === elId) setEditId(null);
    if (editGeomId === elId) setEditGeomId(null);
    setNotice('Prvek odstraněn.');
  }, [editGeomId, editId, selectedId]);

  const startRename = (elId) => {
    setRenamingId(elId);
    setRenameValue(elId);
    setTimeout(() => renameInputRef.current?.select(), 0);
  };

  const commitRename = () => {
    if (!renamingId) return;
    const newName = renameValue.trim() || renamingId;
    setElements(prev => prev.map(el => el.id === renamingId ? { ...el, id: newName } : el));
    if (selectedId === renamingId) setSelectedId(newName);
    if (editId === renamingId) { setEditId(newName); setEditElId(newName); }
    if (editGeomId === renamingId) setEditGeomId(newName);
    setRenamingId(null);
    setNotice('Prvek přejmenován.');
  };

  const cancelRename = () => setRenamingId(null);
  const stopGeomEdit = () => {
    setEditGeomId(null);
    setActiveRingRef({ type: 'exterior' });
    setCurrentRingPoints([]);
    setDrawingMode(null);
    setNotice('Úprava geometrie ukončena.');
  };

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') {
        if (currentRingPoints.length > 0 || drawingMode) {
          cancelCurrentDrawing();
          return;
        }
        if (draftGeometry) {
          resetDraftState();
          setNotice('Rozpracovaný polygon zrušen.');
          return;
        }
        if (editGeomId) {
          stopGeomEdit();
        }
        return;
      }

      if (e.key === 'F2' && selectedId && !editId && !renamingId) {
        e.preventDefault();
        startRename(selectedId);
      }
      if (e.key === 'Delete' && selectedId && !editId && !renamingId) {
        deleteElement(selectedId);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [cancelCurrentDrawing, deleteElement, draftGeometry, drawingMode, editGeomId, editId, renamingId, resetDraftState, selectedId, currentRingPoints.length]);

  const exportSVG = () => downloadFile(generateSVG(elements, imgSize.w, imgSize.h), 'overlay.svg', 'image/svg+xml');
  const exportLibrary = () => downloadFile(JS_LIBRARY, 'svg-overlay-map.js', 'text/javascript');

  const downloadFile = (content, name, type) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const startNewGroup = () => { setEditingGroup('new'); setGroupForm({ name: '', attrKeys: [''] }); };
  const startEditGroup = (group) => { setEditingGroup(group.id); setGroupForm({ name: group.name, attrKeys: [...group.attrKeys] }); };
  const saveGroup = () => {
    const name = groupForm.name.trim();
    const attrKeys = groupForm.attrKeys.filter(key => key.trim());
    if (!name || attrKeys.length === 0) return;
    if (editingGroup === 'new') {
      const nextGroup = { id: `grp_${Date.now()}`, name, attrKeys };
      setGroups(prev => [...prev, nextGroup]);
      setActiveGroupId(nextGroup.id);
    } else {
      setGroups(prev => prev.map(group => group.id === editingGroup ? { ...group, name, attrKeys } : group));
    }
    setEditingGroup(null);
    setNotice('Skupina uložena.');
  };
  const deleteGroup = (groupId) => {
    setGroups(prev => prev.filter(group => group.id !== groupId));
    if (activeGroupId === groupId) setActiveGroupId(null);
    setNotice('Skupina odstraněna.');
  };

  const displayScale = imgSize.w / (renderedW || imgSize.w || 1);
  const dotRadius = (7 * displayScale) / zoom;
  const strokeW = (2.5 * displayScale) / zoom;
  const closeDotRadius = dotRadius * 1.5;
  const vertexR = (6 * displayScale) / zoom;
  const midpointR = vertexR * 0.6;

  return (
    <>
      <div className="workspace">
        <div className="canvas-area" ref={canvasAreaRef} style={phase === 'canvas' ? { alignItems: 'flex-start', justifyContent: 'flex-start' } : {}}>
          {phase === 'choose' && (
            <div className="mode-selector">
              <h2>Editor SVG Overlay</h2>
              <p>Vyber režim práce</p>
              <div className="mode-cards">
                <div className="mode-card" onClick={() => setPhase('new')}>
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                    <rect x="4" y="4" width="40" height="40" rx="8" stroke="#3b82f6" strokeWidth="2" strokeDasharray="4 3"/>
                    <path d="M24 16v16M16 24h16" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round"/>
                  </svg>
                  <h3>Nové SVG</h3>
                  <p>Nahraj podkladový obrázek a začni kreslit nový overlay</p>
                </div>
                <div className="mode-card" onClick={() => { setPhase('upload-edit'); setEditModeSvgLoaded(false); }}>
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                    <rect x="4" y="4" width="40" height="40" rx="8" stroke="#f59e0b" strokeWidth="2"/>
                    <path d="M16 28l6-8 4 5 4-3 6 6" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M30 14l4 4-12 12H18v-4L30 14z" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <h3>Upravit existující</h3>
                  <p>Nahraj obrázek a vyexportované SVG pro úpravy</p>
                </div>
              </div>
            </div>
          )}

          {phase === 'new' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <div className="upload-zone" onClick={() => fileRef.current?.click()} onDragOver={e => { e.preventDefault(); }} onDrop={e => { e.preventDefault(); handleImageUpload(e.dataTransfer.files[0]); }}>
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => handleImageUpload(e.target.files[0])} />
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ margin: '0 auto 16px' }}>
                  <rect x="4" y="4" width="40" height="40" rx="8" stroke="#3b82f6" strokeWidth="2" strokeDasharray="4 3"/>
                  <path d="M24 16v16M16 24h16" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <h3>Nahraj podkladový obrázek</h3>
                <p>PNG, JPEG nebo jiný rastrový formát</p>
              </div>
              <button className="btn btn-sm" onClick={goBack}>← Zpět</button>
            </div>
          )}

          {phase === 'upload-edit' && (
            <div className="edit-upload-step">
              <h3>Nahraj soubory pro úpravu</h3>
              <div className="edit-upload-row">
                <div className="upload-zone-mini" onClick={() => editImgRef.current?.click()} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); handleEditImageUpload(e.dataTransfer.files[0]); }}>
                  <input ref={editImgRef} type="file" accept="image/*" hidden onChange={e => handleEditImageUpload(e.target.files[0])} />
                  {image ? <><span className="badge badge-green">✓</span><p style={{ marginTop: 6 }}>Obrázek OK</p></> : <><h4>1. Obrázek</h4><p>PNG, JPEG…</p></>}
                </div>
                <div className="upload-zone-mini" onClick={() => editSvgRef.current?.click()} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); handleEditSvgUpload(e.dataTransfer.files[0]); }}>
                  <input ref={editSvgRef} type="file" accept=".svg" hidden onChange={e => handleEditSvgUpload(e.target.files[0])} />
                  {editModeSvgLoaded ? <><span className="badge badge-green">✓</span><p style={{ marginTop: 6 }}>{elements.length} prvků</p></> : <><h4>2. SVG</h4><p>.svg soubor</p></>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn btn-sm" onClick={goBack}>← Zpět</button>
                <button className="btn btn-primary" disabled={!image || !editModeSvgLoaded} onClick={startEditCanvas} style={{ opacity: (!image || !editModeSvgLoaded) ? 0.4 : 1 }}>
                  Otevřít v editoru →
                </button>
              </div>
            </div>
          )}

          <EditorCanvas
            activeRingRef={activeRingRef}
            addVertex={addVertex}
            closeDotRadius={closeDotRadius}
            currentRingPoints={currentRingPoints}
            dotRadius={dotRadius}
            draftGeometry={draftGeometry}
            drawingMode={drawingMode}
            editGeomEl={editGeomEl}
            editGeomId={editGeomId}
            elements={elements}
            getDisplayedImgSize={getDisplayedImgSize}
            handleCanvasClick={handleCanvasClick}
            handleDoubleClick={handleDoubleClick}
            handleShapeClick={handleShapeClick}
            handleVertexMouseDown={handleVertexMouseDown}
            image={image}
            imgRef={imgRef}
            imgSize={imgSize}
            midpointR={midpointR}
            pan={pan}
            phase={phase}
            removeVertex={removeVertex}
            resetView={resetView}
            selectedId={selectedId}
            strokeW={strokeW}
            svgRef={svgRef}
            vertexR={vertexR}
            zoom={zoom}
            zoomIn={zoomIn}
            zoomOut={zoomOut}
          />
        </div>

        <div className="sidebar">
          <div className="sidebar-tabs">
            <button className={`sidebar-tab ${sidebarTab === 'elements' ? 'active' : ''}`} onClick={() => setSidebarTab('elements')}>
              Prvky {elements.length > 0 && <span className="badge badge-blue" style={{ marginLeft: 6 }}>{elements.length}</span>}
            </button>
            <button className={`sidebar-tab ${sidebarTab === 'groups' ? 'active' : ''}`} onClick={() => setSidebarTab('groups')}>
              Skupiny {groups.length > 0 && <span className="badge badge-purple" style={{ marginLeft: 6 }}>{groups.length}</span>}
            </button>
          </div>
          <div className="sidebar-content">
            {sidebarTab === 'elements' ? (
              editId ? (
                <AttributesEditor
                  activeGroupId={activeGroupId}
                  cancelEdit={() => setEditId(null)}
                  editAttrs={editAttrs}
                  editElId={editElId}
                  groups={groups}
                  saveAttributes={saveAttributes}
                  setActiveGroupId={setActiveGroupId}
                  setEditAttrs={setEditAttrs}
                  setEditElId={setEditElId}
                />
              ) : editGeomId ? (
                <GeometryEditorPanel
                  activeRingRef={activeRingRef}
                  editGeomEl={editGeomEl}
                  isDrawingHole={drawingMode === 'edit-hole'}
                  removeHole={(holeIndex) => removeHole(editGeomEl.id, holeIndex)}
                  selectRing={setActiveRingRef}
                  startHoleDraft={startHoleDraft}
                  stopGeomEdit={stopGeomEdit}
                />
              ) : draftGeometry ? (
                <DraftPolygonPanel
                  canAddHole={draftGeometry.exterior.length >= 3}
                  canFinish={draftGeometry.exterior.length >= 3 && drawingMode !== 'hole'}
                  draftGeometry={draftGeometry}
                  drawingMode={drawingMode}
                  finishDraftPolygon={finishDraftPolygon}
                  startHoleDraft={startHoleDraft}
                  cancelDraftPolygon={() => { resetDraftState(); setNotice('Rozpracovaný polygon zrušen.'); }}
                />
              ) : (
                <ElementsPanel
                  activeGroupId={activeGroupId}
                  cancelRename={cancelRename}
                  commitRename={commitRename}
                  deleteElement={deleteElement}
                  elements={elements}
                  groups={groups}
                  phase={phase}
                  renameInputRef={renameInputRef}
                  renameValue={renameValue}
                  renamingId={renamingId}
                  selectedId={selectedId}
                  setActiveGroupId={setActiveGroupId}
                  setRenameValue={setRenameValue}
                  setSelectedId={setSelectedId}
                  startEditAttrs={startEditAttrs}
                  startGeomEdit={startGeomEdit}
                  startRename={startRename}
                />
              )
            ) : (
              <GroupsPanel
                activeGroupId={activeGroupId}
                deleteGroup={deleteGroup}
                editingGroup={editingGroup}
                groupForm={groupForm}
                groups={groups}
                saveGroup={saveGroup}
                setEditingGroup={setEditingGroup}
                setGroupForm={setGroupForm}
                startEditGroup={startEditGroup}
                startNewGroup={startNewGroup}
              />
            )}
          </div>

          {phase === 'canvas' && elements.length > 0 && !editId && !editGeomId && !draftGeometry && sidebarTab === 'elements' && (
            <SidebarActions exportLibrary={exportLibrary} exportSVG={exportSVG} goBack={goBack} />
          )}
        </div>
      </div>

      <div className="statusbar">
        <span><span className={`status-dot ${phase === 'canvas' ? 'green' : 'yellow'}`} />{phase === 'canvas' ? 'Editor' : phase === 'choose' ? 'Výběr režimu' : 'Nahrávání'}</span>
        {imgSize.w > 0 && <span>{imgSize.w}×{imgSize.h}</span>}
        <span>{elements.length} prvků</span>
        {isDrawing && <span><span className="status-dot blue" />Kreslení · {drawingMode === 'exterior' ? 'exterior' : 'interior'} · {currentRingPoints.length} bodů</span>}
        {draftGeometry && <span><span className="status-dot yellow" />Rozpracovaný polygon · {1 + draftGeometry.holes.length} rings</span>}
        {editGeomEl && <span><span className="status-dot orange" />Úprava geometrie · {countGeometryPoints(editGeomEl.geometry)} bodů</span>}
        {activeGroup && <span style={{ color: 'var(--group-purple)' }}>⬡ {activeGroup.name}</span>}
        {notice && <span style={{ color: 'var(--text-secondary)' }}>{notice}</span>}
        {zoom !== 1 && <span>{Math.round(zoom * 100)}%</span>}
      </div>
    </>
  );
}
