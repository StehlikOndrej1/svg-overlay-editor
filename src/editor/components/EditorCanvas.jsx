export default function EditorCanvas({
  addVertex,
  currentPoints,
  dotRadius,
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
  closeDotRadius,
  pan,
}) {
  if (phase !== 'canvas') return null;

  return (
    <>
      <div style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: '0 0' }}>
        <div className="canvas-wrapper">
          <img ref={imgRef} src={image} alt="Base" draggable={false} style={{ maxWidth: '70vw', maxHeight: '75vh' }} />
          <svg
            ref={svgRef}
            className={editGeomId ? '' : 'drawing-svg'}
            viewBox={`0 0 ${imgSize.w} ${imgSize.h}`}
            onClick={handleCanvasClick}
            onDoubleClick={handleDoubleClick}
            style={editGeomId ? { cursor: 'default' } : {}}
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
                <polygon
                  key={el.id}
                  points={el.points.map(p => `${p.x},${p.y}`).join(' ')}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={isGeomEdit ? strokeW * 1.5 : strokeW}
                  strokeLinejoin="round"
                  onClick={(e) => handlePolygonClick(e, el.id)}
                />
              );
            })}

            {editGeomEl && editGeomEl.points.map((p, i) => (
              <g key={`v-${i}`}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={vertexR}
                  fill="var(--vertex-edit)"
                  stroke="var(--bg-primary)"
                  strokeWidth={strokeW * 0.5}
                  style={{ cursor: 'move' }}
                  onMouseDown={(e) => handleVertexMouseDown(e, editGeomEl.id, i)}
                />
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={vertexR * 1.8}
                  fill="transparent"
                  stroke="none"
                  style={{ cursor: 'move' }}
                  onMouseDown={(e) => handleVertexMouseDown(e, editGeomEl.id, i)}
                  onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); removeVertex(editGeomEl.id, i); }}
                />
                {(() => {
                  const next = editGeomEl.points[(i + 1) % editGeomEl.points.length];
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
                      onClick={(e) => { e.stopPropagation(); addVertex(editGeomEl.id, i); }}
                    />
                  );
                })()}
              </g>
            ))}

            {currentPoints.length >= 2 && (
              <polyline
                points={currentPoints.map(p => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke="var(--polygon-active-stroke)"
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
                stroke="var(--success)"
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
                    fill={isFirst ? 'var(--success)' : 'var(--polygon-active-stroke)'}
                    stroke="var(--bg-primary)"
                    strokeWidth={strokeW * 0.6}
                    style={isFirst ? { cursor: 'pointer', filter: `drop-shadow(0 0 ${8 / zoom}px rgba(16,185,129,0.7))` } : {}}
                  />
                  {isFirst && (
                    <circle cx={p.x} cy={p.y} r={closeDotRadius * 1.8} fill="none" stroke="var(--success)" strokeWidth={strokeW * 0.4} opacity="0.4">
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
