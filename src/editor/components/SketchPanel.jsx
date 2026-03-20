function ringLabel(ringIndex) {
  return ringIndex === -1 ? 'Obrys' : `Hole ${ringIndex + 1}`;
}

export default function SketchPanel({
  activeRingIndex,
  cancelDraft,
  cancelRingDrawing,
  closeCurrentRing,
  currentPoints,
  draftElement,
  isDrawing,
  isDrawingHole,
  removeHole,
  saveDraft,
  selectRing,
  startHoleDrawing,
  undoLastPoint,
}) {
  const outerCount = draftElement?.points?.length || 0;
  const holeCount = draftElement?.holes?.length || 0;
  const canCloseRing = currentPoints.length >= 3;

  return (
    <div style={{ animation: 'fadeIn 0.2s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div className="form-label" style={{ marginBottom: 4 }}>Tvorba prvku</div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>Sketch polygonu</div>
        </div>
        <span className="badge badge-orange">draft</span>
      </div>

      <div className="geom-hint" style={{ marginBottom: 14 }}>
        {!draftElement ? (
          <>
            Začni klikáním do plátna pro <strong>obrys</strong> nového polygonu.<br/>
            Po uzavření obrysu můžeš přidat jeden nebo více <strong>hole ringů</strong> a teprve potom prvek uložit.
          </>
        ) : isDrawingHole ? (
          <>
            Kreslíš nový <strong>hole ring</strong> do draftu. Použij <strong>Undo</strong>, <strong>Uzavřít ring</strong> nebo <strong>Zrušit hole</strong>.
          </>
        ) : isDrawing ? (
          <>
            Dokonči aktuální ring a přejdi do <strong>review</strong> režimu, kde můžeš přidat holes nebo prvek potvrdit.
          </>
        ) : (
          <>
            Draft je připravený k revizi. Vyber ring, přidej další hole nebo potvrď geometrii přes <strong>Uložit prvek</strong>.
          </>
        )}
      </div>

      <div style={{ display: 'grid', gap: 8, marginBottom: 14 }}>
        <div className="element-item" style={{ cursor: 'default' }}>
          <div className="el-info">
            <div className="el-id">Stav draftu</div>
            <div className="el-points">
              {draftElement ? `${outerCount} bodů v obrysu · ${holeCount} holes` : `${currentPoints.length} bodů v kreslení`}
            </div>
          </div>
          {(isDrawing || isDrawingHole) ? <span className="badge badge-orange">drawing</span> : draftElement ? <span className="badge badge-green">review</span> : <span className="badge badge-blue">outer</span>}
        </div>
      </div>

      {(isDrawing || isDrawingHole) && (
        <div style={{ display: 'grid', gap: 8, marginBottom: 14 }}>
          <button className="btn btn-sm" style={{ justifyContent: 'center' }} onClick={undoLastPoint} disabled={currentPoints.length === 0}>
            ↶ Undo posledního bodu
          </button>
          <button className="btn btn-sm btn-primary" style={{ justifyContent: 'center' }} onClick={closeCurrentRing} disabled={!canCloseRing}>
            ✓ Uzavřít ring
          </button>
          <button className="btn btn-sm" style={{ justifyContent: 'center' }} onClick={isDrawingHole ? cancelRingDrawing : cancelDraft}>
            {isDrawingHole ? 'Zrušit hole' : 'Zrušit draft'}
          </button>
        </div>
      )}

      {draftElement && !isDrawing && !isDrawingHole && (
        <>
          <div className="divider" />
          <div className="form-label" style={{ marginBottom: 8 }}>Review geometrie</div>
          <div style={{ display: 'grid', gap: 8, marginBottom: 14 }}>
            <button
              className={`btn btn-sm ${activeRingIndex === -1 ? 'btn-orange' : ''}`}
              style={{ justifyContent: 'center' }}
              onClick={() => selectRing(-1)}
            >
              {ringLabel(-1)} · {outerCount} bodů
            </button>
            {(draftElement.holes || []).map((holePoints, holeIndex) => (
              <div key={`draft-hole-${holeIndex}`} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }}>
                <button
                  className={`btn btn-sm ${activeRingIndex === holeIndex ? 'btn-orange' : ''}`}
                  style={{ justifyContent: 'center' }}
                  onClick={() => selectRing(holeIndex)}
                >
                  {ringLabel(holeIndex)} · {holePoints.length} bodů
                </button>
                <button className="btn btn-xs btn-danger" onClick={() => removeHole(holeIndex)}>
                  ×
                </button>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gap: 8 }}>
            <button className="btn btn-sm btn-orange" style={{ justifyContent: 'center' }} onClick={startHoleDrawing}>
              + Přidat hole
            </button>
            <button className="btn btn-primary" style={{ justifyContent: 'center' }} onClick={saveDraft}>
              Uložit prvek
            </button>
            <button className="btn" style={{ justifyContent: 'center' }} onClick={cancelDraft}>
              Zahodit draft
            </button>
          </div>
        </>
      )}
    </div>
  );
}
