export default function SidebarActions({ exportLibrary, exportSVG, goBack }) {
  return (
    <div className="sidebar-actions">
      <button className="btn btn-primary btn-sm" onClick={exportSVG}>↓ Exportovat SVG</button>
      <button className="btn btn-sm" onClick={exportLibrary}>↓ JS knihovna</button>
      <button className="btn btn-sm" style={{ fontSize: 10, color: 'var(--text-muted)' }} onClick={goBack}>← Nový projekt</button>
    </div>
  );
}
