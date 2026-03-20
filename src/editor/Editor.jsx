import { useCallback, useEffect, useRef, useState } from 'react';
import AttributesEditor from './components/AttributesEditor.jsx';
import EditorCanvas from './components/EditorCanvas.jsx';
import ElementsPanel from './components/ElementsPanel.jsx';
import GeometryEditorPanel from './components/GeometryEditorPanel.jsx';
import GroupsPanel from './components/GroupsPanel.jsx';
import SidebarActions from './components/SidebarActions.jsx';
import { usePolygonEditor } from './hooks/usePolygonEditor.js';
import { generateSVG, parseSVGFile } from './lib/svgUtils.js';
import { JS_LIBRARY } from '../shared/lib/jsLibrary.js';
import { useZoomPan } from '../shared/hooks/useZoomPan.js';

export default function Editor() {
  const [phase, setPhase] = useState('choose');
  const [image, setImage] = useState(null);
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  const [elements, setElements] = useState([]);
  const [currentPoints, setCurrentPoints] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [editId, setEditId] = useState(null);
  const [editAttrs, setEditAttrs] = useState([{ key: '', value: '' }]);
  const [editElId, setEditElId] = useState('');
  const [sidebarTab, setSidebarTab] = useState('elements');
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [editGeomId, setEditGeomId] = useState(null);
  const [groups, setGroups] = useState([]);
  const [activeGroupId, setActiveGroupId] = useState(null);
  const [editingGroup, setEditingGroup] = useState(null);
  const [groupForm, setGroupForm] = useState({ name: '', attrKeys: [''] });
  const [editModeSvgLoaded, setEditModeSvgLoaded] = useState(false);
  const [renderedW, setRenderedW] = useState(1);

  const svgRef = useRef(null);
  const imgRef = useRef(null);
  const fileRef = useRef(null);
  const editImgRef = useRef(null);
  const editSvgRef = useRef(null);
  const canvasAreaRef = useRef(null);
  const renameInputRef = useRef(null);
  const { zoom, pan, resetView, centerOn, zoomIn, zoomOut, isPanning } = useZoomPan(canvasAreaRef, phase !== 'canvas');

  const activeGroup = groups.find(g => g.id === activeGroupId) || null;

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

  const handleImageUpload = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
      setImage(url);
      setElements([]);
      setCurrentPoints([]);
      setIsDrawing(false);
      setSelectedId(null);
      setEditId(null);
      setEditGeomId(null);
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
      setCurrentPoints([]);
      setIsDrawing(false);
      setSelectedId(null);
    }
  };

  const goBack = () => {
    setPhase('choose');
    setImage(null);
    setElements([]);
    setCurrentPoints([]);
    setIsDrawing(false);
    setSelectedId(null);
    setEditId(null);
    setEditGeomId(null);
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
    handleCanvasClick,
    handleDoubleClick,
    handleVertexMouseDown,
    removeVertex,
    startGeomEdit: startGeomEditBase,
  } = usePolygonEditor({
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
  });

  const handlePolygonClick = (e, elId) => {
    e.stopPropagation();
    if (isDrawing) return;
    if (editGeomId && editGeomId !== elId) return;
    setSelectedId(elId);
  };

  const startEditAttrs = (elId) => {
    const el = elements.find(x => x.id === elId);
    if (!el) return;
    setEditId(elId);
    setEditElId(el.id);
    setEditAttrs(el.attributes.length > 0 ? [...el.attributes] : [{ key: '', value: '' }]);
    setEditGeomId(null);
    setSidebarTab('elements');
  };

  const saveAttributes = () => {
    if (!editId) return;
    setElements(prev => prev.map(el => el.id === editId ? { ...el, id: editElId || el.id, attributes: editAttrs.filter(a => a.key.trim()) } : el));
    if (editElId && editElId !== editId) setSelectedId(editElId);
    setEditId(null);
  };

  const deleteElement = useCallback((elId) => {
    setElements(prev => prev.filter(e => e.id !== elId));
    if (selectedId === elId) setSelectedId(null);
    if (editId === elId) setEditId(null);
    if (editGeomId === elId) setEditGeomId(null);
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
  };

  const cancelRename = () => setRenamingId(null);
  const startGeomEdit = (elId) => {
    setEditGeomId(elId);
    startGeomEditBase(elId);
  };
  const stopGeomEdit = () => setEditGeomId(null);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') {
        if (editGeomId) { stopGeomEdit(); return; }
        setCurrentPoints([]);
        setIsDrawing(false);
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
  }, [deleteElement, editGeomId, editId, renamingId, selectedId]);

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
  const startEditGroup = (g) => { setEditingGroup(g.id); setGroupForm({ name: g.name, attrKeys: [...g.attrKeys] }); };
  const saveGroup = () => {
    const name = groupForm.name.trim();
    const attrKeys = groupForm.attrKeys.filter(k => k.trim());
    if (!name || attrKeys.length === 0) return;
    if (editingGroup === 'new') {
      const ng = { id: `grp_${Date.now()}`, name, attrKeys };
      setGroups(prev => [...prev, ng]);
      setActiveGroupId(ng.id);
    } else {
      setGroups(prev => prev.map(g => g.id === editingGroup ? { ...g, name, attrKeys } : g));
    }
    setEditingGroup(null);
  };
  const deleteGroup = (gId) => {
    setGroups(prev => prev.filter(g => g.id !== gId));
    if (activeGroupId === gId) setActiveGroupId(null);
  };

  const displayScale = imgSize.w / (renderedW || imgSize.w || 1);
  const dotRadius = (7 * displayScale) / zoom;
  const strokeW = (2.5 * displayScale) / zoom;
  const closeDotRadius = dotRadius * 1.5;
  const vertexR = (6 * displayScale) / zoom;
  const midpointR = vertexR * 0.6;
  const editGeomEl = editGeomId ? elements.find(e => e.id === editGeomId) : null;

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
            addVertex={addVertex}
            closeDotRadius={closeDotRadius}
            currentPoints={currentPoints}
            dotRadius={dotRadius}
            editGeomEl={editGeomEl}
            editGeomId={editGeomId}
            elements={elements}
            getDisplayedImgSize={getDisplayedImgSize}
            handleCanvasClick={handleCanvasClick}
            handleDoubleClick={handleDoubleClick}
            handlePolygonClick={handlePolygonClick}
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
                <GeometryEditorPanel editGeomEl={editGeomEl} stopGeomEdit={stopGeomEdit} />
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

          {phase === 'canvas' && elements.length > 0 && !editId && !editGeomId && sidebarTab === 'elements' && (
            <SidebarActions exportLibrary={exportLibrary} exportSVG={exportSVG} goBack={goBack} />
          )}
        </div>
      </div>

      <div className="statusbar">
        <span><span className={`status-dot ${phase === 'canvas' ? 'green' : 'yellow'}`} />{phase === 'canvas' ? 'Editor' : phase === 'choose' ? 'Výběr režimu' : 'Nahrávání'}</span>
        {imgSize.w > 0 && <span>{imgSize.w}×{imgSize.h}</span>}
        <span>{elements.length} prvků</span>
        {isDrawing && <span><span className="status-dot blue" />Kreslení · {currentPoints.length} bodů</span>}
        {editGeomId && <span><span className="status-dot orange" />Úprava geometrie</span>}
        {activeGroup && <span style={{ color: 'var(--group-purple)' }}>⬡ {activeGroup.name}</span>}
        {zoom !== 1 && <span>{Math.round(zoom * 100)}%</span>}
      </div>
    </>
  );
}
