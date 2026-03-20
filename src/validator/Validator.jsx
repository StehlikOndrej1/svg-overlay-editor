import { useCallback, useEffect, useRef, useState } from 'react';
import { parsePathData } from '../editor/lib/svgUtils.js';
import { useZoomPan } from '../shared/hooks/useZoomPan.js';

function parseValidatorElements(text) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, 'image/svg+xml');
  const overlays = doc.querySelectorAll('[data-overlay-id]');

  return Array.from(overlays).map(node => {
    const attrs = {};
    Array.from(node.attributes).forEach(attribute => {
      if (attribute.name.startsWith('data-') && attribute.name !== 'data-overlay-id') {
        attrs[attribute.name.replace('data-', '')] = attribute.value;
      }
    });

    const tag = node.tagName.toLowerCase();
    const pathData = tag === 'path' ? (node.getAttribute('d') || '') : null;
    const rings = tag === 'path' ? parsePathData(pathData) : [];
    const points = tag === 'polygon' ? (node.getAttribute('points') || '') : pathData;

    return {
      id: node.getAttribute('data-overlay-id'),
      points,
      tag,
      attrs,
      rings,
      holeCount: Math.max(rings.length - 1, 0),
      pointCount: tag === 'path'
        ? rings.reduce((sum, ring) => sum + ring.length, 0)
        : (node.getAttribute('points') || '').split(/\s+/).filter(Boolean).length,
    };
  });
}

function formatGeometrySummary(element) {
  if (!element) return '';
  if (element.tag !== 'path') return element.points;

  const outerCount = element.rings[0]?.length || 0;
  return `outer: ${outerCount} bodů · holes: ${element.holeCount}\n${element.points}`;
}

export default function Validator() {
  const [image, setImage] = useState(null);
  const [svgContent, setSvgContent] = useState(null);
  const [svgElements, setSvgElements] = useState([]);
  const [selectedEl, setSelectedEl] = useState(null);
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  const fileRefImg = useRef(null);
  const fileRefSvg = useRef(null);
  const wrapperRef = useRef(null);
  const canvasAreaRef = useRef(null);
  const { zoom, pan, resetView, centerOn, zoomIn, zoomOut } = useZoomPan(canvasAreaRef, !image || !svgContent);

  const getDisplayedImgSize = useCallback(() => {
    if (!imgSize.w || !imgSize.h) return { w: 0, h: 0 };
    const maxW = window.innerWidth * 0.7;
    const maxH = window.innerHeight * 0.75;
    const scale = Math.min(maxW / imgSize.w, maxH / imgSize.h, 1);
    return { w: imgSize.w * scale, h: imgSize.h * scale };
  }, [imgSize]);

  const bothLoaded = !!(image && svgContent);
  const prevBothLoaded = useRef(false);
  useEffect(() => {
    if (bothLoaded && !prevBothLoaded.current) {
      const ds = getDisplayedImgSize();
      requestAnimationFrame(() => centerOn(ds.w, ds.h));
    }
    prevBothLoaded.current = bothLoaded;
  }, [bothLoaded, centerOn, getDisplayedImgSize]);

  const handleImageUpload = (file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { setImgSize({ w: img.naturalWidth, h: img.naturalHeight }); setImage(url); };
    img.src = url;
  };

  const handleSVGUpload = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      setSvgContent(text);
      setSvgElements(parseValidatorElements(text));
      setSelectedEl(null);
    };
    reader.readAsText(file);
  };

  const handleOverlayClick = (e) => {
    if (['path', 'polygon', 'rect', 'circle'].includes(e.target.tagName)) {
      const id = e.target.getAttribute('data-overlay-id');
      if (id) {
        setSelectedEl(svgElements.find(x => x.id === id) || null);
        return;
      }
    }
    setSelectedEl(null);
  };

  useEffect(() => {
    if (!wrapperRef.current || !svgContent) return;
    const container = wrapperRef.current.querySelector('.validator-svg-container');
    if (!container) return;
    container.innerHTML = svgContent;
    const svg = container.querySelector('svg');
    if (svg) {
      svg.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;cursor:pointer;';
      svg.querySelectorAll('[data-overlay-id]').forEach(el => {
        el.style.cursor = 'pointer';
        el.style.pointerEvents = 'all';
        el.style.transition = 'fill 0.15s';
        if (el.tagName.toLowerCase() === 'path') {
          el.setAttribute('fill-rule', 'evenodd');
        }
        el.addEventListener('mouseenter', () => el.setAttribute('fill', 'rgba(250,204,21,0.35)'));
        el.addEventListener('mouseleave', () => {
          const isSel = selectedEl && selectedEl.id === el.getAttribute('data-overlay-id');
          el.setAttribute('fill', isSel ? 'rgba(250,204,21,0.35)' : 'rgba(59,130,246,0.25)');
        });
      });
    }
  }, [svgContent, selectedEl]);

  return (
    <>
      <div className="workspace">
        <div className="canvas-area" ref={canvasAreaRef} style={(image && svgContent) ? { alignItems: 'flex-start', justifyContent: 'flex-start' } : {}}>
          {(!image || !svgContent) ? (
            <div style={{ display: 'flex', gap: 24, alignItems: 'start' }}>
              <div className="upload-zone" onClick={() => fileRefImg.current?.click()} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); handleImageUpload(e.dataTransfer.files[0]); }}>
                <input ref={fileRefImg} type="file" accept="image/*" hidden onChange={e => handleImageUpload(e.target.files[0])} />
                {image ? <><span className="badge badge-green">✓</span><p style={{ marginTop: 8 }}>OK</p></> : <><h3>1. Obrázek</h3><p>PNG, JPEG…</p></>}
              </div>
              <div className="upload-zone" onClick={() => fileRefSvg.current?.click()} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); handleSVGUpload(e.dataTransfer.files[0]); }}>
                <input ref={fileRefSvg} type="file" accept=".svg" hidden onChange={e => handleSVGUpload(e.target.files[0])} />
                {svgContent ? <><span className="badge badge-green">✓</span><p style={{ marginTop: 8 }}>{svgElements.length} prvků</p></> : <><h3>2. SVG</h3><p>.svg soubor</p></>}
              </div>
            </div>
          ) : (
            <>
              <div style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: '0 0' }}>
                <div className="canvas-wrapper" ref={wrapperRef} onClick={handleOverlayClick}>
                  <img src={image} alt="Base" draggable={false} style={{ display: 'block', maxWidth: '70vw', maxHeight: '75vh' }} />
                  <div className="validator-svg-container" />
                </div>
              </div>
              <div className="zoom-controls">
                <button className="zoom-btn" onClick={zoomOut}>−</button>
                <div className="zoom-info">{Math.round(zoom * 100)}%</div>
                <button className="zoom-btn" onClick={zoomIn}>+</button>
                <button className="zoom-btn" onClick={() => { const ds = getDisplayedImgSize(); resetView(ds.w, ds.h); }}>⌂</button>
              </div>
            </>
          )}
        </div>
        <div className="sidebar">
          <div className="sidebar-tabs"><button className="sidebar-tab active">Validátor</button></div>
          <div className="sidebar-content">
            {!image || !svgContent ? (
              <div className="hint-box">Nahraj obrázek a SVG pro validaci.</div>
            ) : selectedEl ? (
              <div style={{ animation: 'fadeIn 0.2s ease' }}>
                <div className="form-group">
                  <label className="form-label">ID</label>
                  <div className="form-input" style={{ background: 'var(--bg-tertiary)' }}>{selectedEl.id}</div>
                </div>
                <div className="form-group">
                  <label className="form-label">Geometrie</label>
                  <div className="form-input" style={{ background: 'var(--bg-tertiary)', fontSize: 11, wordBreak: 'break-all', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{formatGeometrySummary(selectedEl)}</div>
                </div>
                {selectedEl.tag === 'path' && (
                  <div className="form-group">
                    <label className="form-label">Rings</label>
                    <div className="form-input" style={{ background: 'var(--bg-tertiary)' }}>
                      {selectedEl.rings.length} ringů · {selectedEl.holeCount} holes · {selectedEl.pointCount} bodů
                    </div>
                  </div>
                )}
                {Object.keys(selectedEl.attrs).length > 0 && (
                  <>
                    <div className="divider" />
                    <label className="form-label">Atributy</label>
                    <table className="validator-attrs-table"><tbody>
                      {Object.entries(selectedEl.attrs).map(([k, v]) => (<tr key={k}><td>{k}</td><td>{v}</td></tr>))}
                    </tbody></table>
                  </>
                )}
              </div>
            ) : (
              <>
                <div className="hint-box" style={{ marginBottom: 16 }}>Klikni na prvek v mapě.</div>
                <label className="form-label">Prvky ({svgElements.length})</label>
                {svgElements.map(el => (
                  <div key={el.id} className="element-item" onClick={() => setSelectedEl(el)}>
                    <div className="el-info">
                      <div className="el-id">{el.id}</div>
                      <div className="el-points">{el.pointCount} bodů · {el.holeCount} holes · {Object.keys(el.attrs).length} attr</div>
                    </div>
                    <span className="badge badge-blue">{el.tag}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
      <div className="statusbar">
        <span><span className={`status-dot ${image && svgContent ? 'green' : 'yellow'}`} />{image && svgContent ? 'Validace' : 'Čeká na soubory'}</span>
        {svgElements.length > 0 && <span>{svgElements.length} prvků</span>}
        {selectedEl && <span>Vybrán: {selectedEl.id}</span>}
        {selectedEl?.holeCount > 0 && <span>{selectedEl.holeCount} holes</span>}
        {zoom !== 1 && <span>{Math.round(zoom * 100)}%</span>}
      </div>
    </>
  );
}
