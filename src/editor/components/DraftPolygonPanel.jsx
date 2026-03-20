export default function DraftPolygonPanel({
  canAddHole,
  canFinish,
  draftGeometry,
  drawingMode,
  finishDraftPolygon,
  startHoleDraft,
  cancelDraftPolygon,
}) {
  return (
    <div style={{ animation: 'fadeIn 0.2s ease' }}>
      <div className="hint-box" style={{ marginBottom: 12 }}>
        <strong>Rozpracovaný polygon</strong><br />
        Exterior: {draftGeometry.exterior.length} bodů<br />
        Díry: {draftGeometry.holes.length}
        {drawingMode === 'hole' && <><br /><span style={{ color: 'var(--warning)' }}>Právě kreslíš interior ring.</span></>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={finishDraftPolygon} disabled={!canFinish}>
          Dokončit polygon
        </button>
        <button className="btn btn-orange" style={{ width: '100%', justifyContent: 'center' }} onClick={startHoleDraft} disabled={!canAddHole || drawingMode === 'hole'}>
          + Přidat díru
        </button>
        <button className="btn" style={{ width: '100%', justifyContent: 'center' }} onClick={cancelDraftPolygon}>
          Zrušit rozpracovaný polygon
        </button>
      </div>
    </div>
  );
}
