export default function GeometryEditorPanel({ editGeomEl, stopGeomEdit }) {
  return (
    <div style={{ animation: 'fadeIn 0.2s ease' }}>
      <div className="geom-hint">
        <strong>Úprava geometrie:</strong> {editGeomEl?.id}<br/>
        Přetahuj <strong>oranžové body</strong> pro přesun.<br/>
        Klikni na <strong>malé body na hranách</strong> pro přidání bodu.<br/>
        <strong>Pravý klik</strong> na bod pro odebrání (min. 3).<br/>
        <strong>Esc</strong> pro ukončení.
      </div>
      {editGeomEl && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
          {editGeomEl.points.length} bodů
        </div>
      )}
      <button className="btn" style={{ width: '100%', justifyContent: 'center' }} onClick={stopGeomEdit}>
        ✓ Hotovo
      </button>
    </div>
  );
}
