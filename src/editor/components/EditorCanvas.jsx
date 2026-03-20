import { geometryToPathData, getRingPoints, ringToPathData } from '../../shared/lib/geometry.js';

export default function EditorCanvas({
  activeRingRef,
  addVertex,
  closeDotRadius,
  currentRingPoints,
  dotRadius,
  draftGeometry,
  drawingMode,
  editGeomEl,
  editGeomId,
  elements,
  getDisplayedImgSize,
  handleCanvasClick,
  handleDoubleClick,
  handleShapeClick,
  handleVertexMouseDown,
  image,
  imgRef,
  imgSize,
  midpointR,
  pan,
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
}) {
  if (phase !== 'canvas') return null;

  const activeEditRing = editGeomEl ? getRingPoints(editGeomEl.geometry, activeRingRef) : [];
  const draftPathData = draftGeometry ? geometryToPathData(draftGeometry) : '';
  const draftRingPreview = currentRingPoints.length >= 3 ? ringToPathData(currentRingPoints) : '';

  return (
    <>
      <div style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: '0 0' }}>
        <div className="canvas-wrapper">
          <img ref={imgRef} src={image} alt="Base" draggable={false} style={{ maxWidth: '70vw', maxHeight: '75vh' }} />
          <svg
            ref={svgRef}
            className={editGeomId || drawingMode === 'hole' || drawingMode === 'edit-hole' ? '' : 'drawing-svg'}
            viewBox={`0 0 ${imgSize.w} ${imgSize.h}`}
            onClick={handleCanvasClick}
            onDoubleClick={handleDoubleClick}
            style={(editGeomId || drawingMode === 'hole' || drawingMode === 'edit-hole') ? { cursor: 'default' } : {}}
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
                  d={geometryToPathData(el.geometry)}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={isGeomEdit ? strokeW * 1.5 : strokeW}
                  strokeLinejoin="round"
                  fillRule="evenodd"
                  onClick={(e) => handleShapeClick(e, el.id)}
                />
              );
            })}

            {draftGeometry && (
              <path
                d={draftPathData}
                fill="rgba(250,204,21,0.14)"
                stroke="var(--polygon-active-stroke)"
                strokeWidth={strokeW}
                strokeLinejoin="round"
                fillRule="evenodd"
                pointerEvents="none"
              />
            )}

            {draftRingPreview && (
              <path
                d={draftRingPreview}
                fill="rgba(250,204,21,0.12)"
                stroke="var(--success)"
                strokeWidth={strokeW * 0.8}
                strokeLinejoin="round"
                fillRule="evenodd"
                opacity="0.8"
                pointerEvents="none"
              />
            )}

            {editGeomEl && activeEditRing.map((point, index) => (
              <g key={`v-${index}`}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={vertexR}
                  fill="var(--vertex-edit)"
                  stroke="var(--bg-primary)"
                  strokeWidth={strokeW * 0.5}
                  style={{ cursor: 'move' }}
                  onMouseDown={(e) => handleVertexMouseDown(e, editGeomEl.id, index)}
                />
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={vertexR * 1.8}
                  fill="transparent"
                  stroke="none"
                  style={{ cursor: 'move' }}
                  onMouseDown={(e) => handleVertexMouseDown(e, editGeomEl.id, index)}
                  onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); removeVertex(editGeomEl.id, index); }}
                />
                {(() => {
                  const next = activeEditRing[(index + 1) % activeEditRing.length];
                  const mx = (point.x + next.x) / 2;
                  const my = (point.y + next.y) / 2;
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
                      onClick={(e) => { e.stopPropagation(); addVertex(editGeomEl.id, index); }}
                    />
                  );
                })()}
              </g>
            ))}

            {currentRingPoints.length >= 2 && (
              <polyline
                points={currentRingPoints.map(point => `${point.x},${point.y}`).join(' ')}
                fill="none"
                stroke={drawingMode === 'exterior' ? 'var(--polygon-active-stroke)' : 'var(--warning)'}
                strokeWidth={strokeW}
                strokeDasharray={`${strokeW * 3} ${strokeW * 2}`}
                strokeLinejoin="round"
              />
            )}
            {currentRingPoints.length >= 3 && (
              <line
                x1={currentRingPoints[currentRingPoints.length - 1].x}
                y1={currentRingPoints[currentRingPoints.length - 1].y}
                x2={currentRingPoints[0].x}
                y2={currentRingPoints[0].y}
                stroke="var(--success)"
                strokeWidth={strokeW * 0.8}
                strokeDasharray={`${strokeW * 2} ${strokeW * 2}`}
                opacity="0.6"
              />
            )}
            {currentRingPoints.map((point, index) => {
              const isFirst = index === 0 && currentRingPoints.length >= 3;
              return (
                <g key={`dp-${index}`}>
                  {isFirst && <circle cx={point.x} cy={point.y} r={closeDotRadius * 2.5} fill="transparent" stroke="none" style={{ cursor: 'pointer' }} />}
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={isFirst ? closeDotRadius : dotRadius}
                    fill={isFirst ? 'var(--success)' : (drawingMode === 'exterior' ? 'var(--polygon-active-stroke)' : 'var(--warning)')}
                    stroke="var(--bg-primary)"
                    strokeWidth={strokeW * 0.6}
                    style={isFirst ? { cursor: 'pointer', filter: `drop-shadow(0 0 ${8 / zoom}px rgba(16,185,129,0.7))` } : {}}
                  />
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
