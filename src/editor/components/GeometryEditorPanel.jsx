function ringLabel(ringIndex) {
  return ringIndex === -1 ? 'Obrys' : `Hole ${ringIndex + 1}`;
}

export default function GeometryEditorPanel({
  activeRingIndex,
  cancelRingDrawing,
  editGeomEl,
  isDrawingHole,
  removeHole,
  selectGeomRing,
  startHoleDrawing,
  stopGeomEdit,
}) {
  return (
    <div style={{ animation: 'fadeIn 0.2s ease' }}>
      <div style={{ marginBottom: 12 }}>
        <div className="form-label" style={{ marginBottom: 4 }}>Úprava hotového prvku</div>
        <div style={{ fontSize: 16, fontWeight: 700 }}>{editGeomEl?.id || 'Geometrie'}</div>
      </div>
      <div className="geom-hint">
        Přetahuj <strong>oranžové body</strong> pro přesun.<br/>
        Klikni na <strong>malé body na hranách</strong> pro přidání bodu.<br/>
        <strong>Pravý klik</strong> na bod pro odebrání (min. 3).<br/>
        {isDrawingHole ? <>Kreslíš nový <strong>hole ring</strong> – uzavři ho bodem, tlačítkem nebo dvojklikem.<br/></> : <>Vyber ring pro editaci nebo přidej nový hole.<br/></>}
        <strong>Esc</strong> pro ukončení.
      </div>

      {editGeomEl && (
        <>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
            {editGeomEl.points.length} bodů v obrysu · {(editGeomEl.holes || []).length} holes
          </div>

          <div style={{ display: 'grid', gap: 8, marginBottom: 14 }}>
            <button
              className={`btn btn-sm ${activeRingIndex === -1 && !isDrawingHole ? 'btn-orange' : ''}`}
              style={{ justifyContent: 'center' }}
              onClick={() => selectGeomRing(-1)}
            >
              {ringLabel(-1)} · {editGeomEl.points.length} bodů
            </button>

            {(editGeomEl.holes || []).map((holePoints, holeIndex) => (
              <div key={`hole-control-${holeIndex}`} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }}>
                <button
                  className={`btn btn-sm ${activeRingIndex === holeIndex && !isDrawingHole ? 'btn-orange' : ''}`}
                  style={{ justifyContent: 'center' }}
                  onClick={() => selectGeomRing(holeIndex)}
                >
                  {ringLabel(holeIndex)} · {holePoints.length} bodů
                </button>
                <button
                  className="btn btn-xs btn-danger"
                  title="Smazat hole"
                  onClick={() => removeHole(editGeomEl.id, holeIndex)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gap: 8, marginBottom: 12 }}>
            {isDrawingHole ? (
              <button className="btn btn-sm" style={{ justifyContent: 'center' }} onClick={cancelRingDrawing}>
                Zrušit kreslení hole
              </button>
            ) : (
              <button className="btn btn-sm btn-orange" style={{ justifyContent: 'center' }} onClick={() => startHoleDrawing(editGeomEl.id)}>
                + Přidat hole
              </button>
            )}
          </div>
        </>
      )}

      <button className="btn" style={{ width: '100%', justifyContent: 'center' }} onClick={stopGeomEdit}>
        ✓ Hotovo
      </button>
    </div>
  );
}
