export default function GeometryEditorPanel({
  activeRingRef,
  editGeomEl,
  isDrawingHole,
  removeHole,
  selectRing,
  startHoleDraft,
  stopGeomEdit,
}) {
  if (!editGeomEl) return null;

  return (
    <div style={{ animation: 'fadeIn 0.2s ease' }}>
      <div className="geom-hint">
        <strong>Úprava geometrie:</strong> {editGeomEl.id}<br/>
        Přetahuj <strong>oranžové body</strong> pro přesun.<br/>
        Klikni na <strong>malé body na hranách</strong> pro přidání bodu.<br/>
        <strong>Pravý klik</strong> na bod pro odebrání (min. 3).<br/>
        Interior ring přidáš přes tlačítko níže.<br/>
        <strong>Esc</strong> pro ukončení.
      </div>

      <label className="form-label">Rings</label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
        <button className={`element-item ${activeRingRef?.type === 'exterior' ? 'selected' : ''}`} onClick={() => selectRing({ type: 'exterior' })}>
          <div className="el-info">
            <div className="el-id">Exterior</div>
            <div className="el-points">{editGeomEl.geometry.exterior.length} bodů</div>
          </div>
        </button>
        {editGeomEl.geometry.holes.map((hole, index) => (
          <div key={index} className={`element-item ${activeRingRef?.type === 'hole' && activeRingRef?.holeIndex === index ? 'selected' : ''}`} onClick={() => selectRing({ type: 'hole', holeIndex: index })}>
            <div className="el-info">
              <div className="el-id">Díra {index + 1}</div>
              <div className="el-points">{hole.length} bodů</div>
            </div>
            <div className="el-actions">
              <button className="btn btn-xs btn-danger" onClick={(e) => { e.stopPropagation(); removeHole(index); }}>×</button>
            </div>
          </div>
        ))}
      </div>

      <button className="btn btn-orange" style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }} onClick={startHoleDraft} disabled={isDrawingHole}>
        + Přidat díru
      </button>
      <button className="btn" style={{ width: '100%', justifyContent: 'center' }} onClick={stopGeomEdit}>
        ✓ Hotovo
      </button>
    </div>
  );
}
