import { buildElementPathData, pointsToPathSegment } from '../lib/svgUtils.js';

function getActiveRingPoints(element, ringIndex) {
  if (!element) return [];
  if (ringIndex === -1) return element.points || [];
  return element.holes?.[ringIndex] || [];
}

export default function EditorCanvas({
  activeRingIndex,
  addVertex,
  closeDotRadius,
  currentPoints,
  dotRadius,
  draftElement,
  draftGeometryId,
  editGeomEl,
  editGeomId,
  elements,
  getDisplayedImgSize,
  handleCanvasClick,
  handleDoubleClick,
  handlePolygonClick,
  handleVertexMouseDown,
  image,
  imgRef,
  imgSize,
  isDrawingHole,
  midpointR,
  phase,
  removeVertex,
  resetView,
  selectedId,
  strokeW,
  svgRef,
  vertexR,
  zoom,
  zoomIn,
  zoomOut,
  pan,
}) {
  if (phase !== 'canvas') return null;

  const activeRingPoints = getActiveRingPoints(editGeomEl, activeRingIndex);
  const draftActiveRingPoints = getActiveRingPoints(draftElement, activeRingIndex);

  return (
    <>
      <div style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: '0 0' }}>
        <div className="canvas-wrapper">
          <img ref={imgRef} src={image} alt="Base" draggable={false} style={{ maxWidth: '70vw', maxHeight: '75vh' }} />
          <svg
            ref={svgRef}
            className={editGeomId || draftElement ? '' : 'drawing-svg'}
            viewBox={`0 0 ${imgSize.w} ${imgSize.h}`}
            onClick={handleCanvasClick}
            onDoubleClick={handleDoubleClick}
            style={(editGeomId || draftElement) && !isDrawingHole ? { cursor: 'default' } : {}}
          >
            {elements.map(el => {
              const isSelected = selectedId === el.id;
              const isGeomEdit = editGeomId === el.id;
              let fill = 'var(--polygon-fill)';
              let stroke = 'var(--polygon-stroke)';
              if (isGeomEdit) {
                fill = 'rgba(249,115,22,0.15)';
                stroke = 'var(--vertex-edit)';
              } else if (isSelected) {
                fill = 'var(--polygon-selected-fill)';
                stroke = 'var(--polygon-selected-stroke)';
              }

              return (
                <path
                  key={el.id}
                  d={buildElementPathData(el)}
                  fill={fill}
                  fillRule="evenodd"
                  stroke={stroke}
                  strokeWidth={isGeomEdit ? strokeW * 1.5 : strokeW}
                  strokeLinejoin="round"
                  onClick={(e) => handlePolygonClick(e, el.id)}
                />
              );
            })}

            {draftElement && (
              <path
                d={buildElementPathData(draftElement)}
                fill="rgba(250,204,21,0.12)"
                fillRule="evenodd"
                stroke="var(--warning)"
                strokeWidth={strokeW * 1.25}
                strokeLinejoin="round"
                strokeDasharray={`${strokeW * 2} ${strokeW * 1.5}`}
                onClick={(e) => handlePolygonClick(e, draftGeometryId)}
              />
            )}

            {draftElement && draftActiveRingPoints.length >= 3 && !isDrawingHole && (
              <path
                d={pointsToPathSegment(draftActiveRingPoints)}
                fill="none"
                stroke="var(--warning)"
                strokeWidth={strokeW * 1.4}
                strokeDasharray={`${strokeW * 2} ${strokeW * 1.5}`}
              />
            )}

            {editGeomEl && (
              <>
                <path
                  d={pointsToPathSegment(editGeomEl.points || [])}
                  fill="none"
                  stroke={activeRingIndex === -1 ? 'var(--vertex-edit)' : 'rgba(249,115,22,0.4)'}
                  strokeWidth={activeRingIndex === -1 ? strokeW * 1.4 : strokeW * 0.9}
                  strokeDasharray={activeRingIndex === -1 ? undefined : `${strokeW * 2} ${strokeW * 1.5}`}
                />
                {(editGeomEl.holes || []).map((holePoints, holeIndex) => {
                  const isActiveHole = activeRingIndex === holeIndex;
                  return (
                    <path
                      key={`hole-outline-${holeIndex}`}
                      d={pointsToPathSegment(holePoints)}
                      fill="none"
                      stroke={isActiveHole ? 'var(--vertex-edit)' : 'rgba(249,115,22,0.4)'}
                      strokeWidth={isActiveHole ? strokeW * 1.25 : strokeW * 0.9}
                      strokeDasharray={`${strokeW * 2} ${strokeW * 1.5}`}
                    />
                  );
                })}
              </>
            )}

            {editGeomEl && !isDrawingHole && activeRingPoints.map((p, i) => (
              <g key={`v-${activeRingIndex}-${i}`}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={vertexR}
                  fill="var(--vertex-edit)"
                  stroke="var(--bg-primary)"
                  strokeWidth={strokeW * 0.5}
                  style={{ cursor: 'move' }}
                  onMouseDown={(e) => handleVertexMouseDown(e, editGeomEl.id, activeRingIndex, i)}
                />
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={vertexR * 1.8}
                  fill="transparent"
                  stroke="none"
                  style={{ cursor: 'move' }}
                  onMouseDown={(e) => handleVertexMouseDown(e, editGeomEl.id, activeRingIndex, i)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    removeVertex(editGeomEl.id, activeRingIndex, i);
                  }}
                />
                {(() => {
                  const next = activeRingPoints[(i + 1) % activeRingPoints.length];
                  const mx = (p.x + next.x) / 2;
                  const my = (p.y + next.y) / 2;
                  return (
                    <circle
                      cx={mx}
                      cy={my}
                      r={midpointR}
                      fill="var(--bg-tertiary)"
                      stroke="var(--vertex-edit)"
                      strokeWidth={strokeW * 0.4}
                      opacity="0.6"
                      style={{ cursor: 'pointer' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        addVertex(editGeomEl.id, activeRingIndex, i);
                      }}
                    />
                  );
                })()}
              </g>
            ))}

            {currentPoints.length >= 2 && (
              <polyline
                points={currentPoints.map(p => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke={isDrawingHole ? 'var(--vertex-edit)' : 'var(--polygon-active-stroke)'}
                strokeWidth={strokeW}
                strokeDasharray={`${strokeW * 3} ${strokeW * 2}`}
                strokeLinejoin="round"
              />
            )}
            {currentPoints.length >= 3 && (
              <line
                x1={currentPoints[currentPoints.length - 1].x}
                y1={currentPoints[currentPoints.length - 1].y}
                x2={currentPoints[0].x}
                y2={currentPoints[0].y}
                stroke={isDrawingHole ? 'var(--vertex-edit)' : 'var(--success)'}
                strokeWidth={strokeW * 0.8}
                strokeDasharray={`${strokeW * 2} ${strokeW * 2}`}
                opacity="0.6"
              />
            )}
            {currentPoints.map((p, i) => {
              const isFirst = i === 0 && currentPoints.length >= 3;
              return (
                <g key={`dp-${i}`}>
                  {isFirst && <circle cx={p.x} cy={p.y} r={closeDotRadius * 2.5} fill="transparent" stroke="none" style={{ cursor: 'pointer' }} />}
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={isFirst ? closeDotRadius : dotRadius}
                    fill={isFirst ? (isDrawingHole ? 'var(--vertex-edit)' : 'var(--success)') : (isDrawingHole ? 'var(--vertex-edit)' : 'var(--polygon-active-stroke)')}
                    stroke="var(--bg-primary)"
                    strokeWidth={strokeW * 0.6}
                    style={isFirst ? { cursor: 'pointer', filter: `drop-shadow(0 0 ${8 / zoom}px ${isDrawingHole ? 'rgba(249,115,22,0.55)' : 'rgba(16,185,129,0.7)'})` } : {}}
                  />
                  {isFirst && (
                    <circle cx={p.x} cy={p.y} r={closeDotRadius * 1.8} fill="none" stroke={isDrawingHole ? 'var(--vertex-edit)' : 'var(--success)'} strokeWidth={strokeW * 0.4} opacity="0.4">
                      <animate attributeName="r" from={closeDotRadius * 1.4} to={closeDotRadius * 2.5} dur="1.5s" repeatCount="indefinite" />
                      <animate attributeName="opacity" from="0.5" to="0" dur="1.5s" repeatCount="indefinite" />
                    </circle>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>
      <div className="zoom-controls">
        <button className="zoom-btn" onClick={zoomOut}>−</button>
        <div className="zoom-info">{Math.round(zoom * 100)}%</div>
        <button className="zoom-btn" onClick={zoomIn}>+</button>
        <button className="zoom-btn" onClick={() => { const ds = getDisplayedImgSize(); resetView(ds.w, ds.h); }}>⌂</button>
      </div>
    </>
  );
}
