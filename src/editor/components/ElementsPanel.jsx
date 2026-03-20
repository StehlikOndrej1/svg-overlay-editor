import GroupSwitcher from './GroupSwitcher.jsx';

export default function ElementsPanel({
  elements,
  groups,
  activeGroupId,
  setActiveGroupId,
  phase,
  renamingId,
  renameInputRef,
  renameValue,
  selectedId,
  setRenameValue,
  setSelectedId,
  commitRename,
  cancelRename,
  startRename,
  startGeomEdit,
  startEditAttrs,
  deleteElement,
}) {
  return (
    <>
      <div style={{ marginBottom: 12 }}>
        <div className="form-label" style={{ marginBottom: 4 }}>Prvky</div>
        <div style={{ fontSize: 16, fontWeight: 700 }}>Seznam overlayů</div>
      </div>
      <GroupSwitcher groups={groups} activeGroupId={activeGroupId} setActiveGroupId={setActiveGroupId} />
      {phase !== 'canvas' && <div className="hint-box">Vyber režim editoru a nahraj soubory.</div>}
      {phase === 'canvas' && elements.length === 0 && (
        <div className="hint-box">
          <strong>Jak kreslit:</strong><br />
          Klikej na plátno pro body polygonu.<br />
          Klikni na <span style={{ color: 'var(--success)' }}>zelený bod</span>, tlačítko <strong>Uzavřít ring</strong> nebo dvojklik pro uzavření.<br />
          Nový prvek se teď skládá ve <strong>Sketch panelu</strong>: nejdřív obrys, pak volitelné holes a až nakonec uložení.<br />
          <span style={{ color: 'var(--text-muted)' }}>Kolečko</span> = zoom, <span style={{ color: 'var(--text-muted)' }}>Ctrl+tah</span> = posun<br />
          <span style={{ color: 'var(--text-muted)' }}>Enter</span> = uzavřít ring, <span style={{ color: 'var(--text-muted)' }}>Ctrl/Cmd+Z</span> = undo bodu
        </div>
      )}
      {elements.map(el => (
        <div key={el.id} className={`element-item ${selectedId === el.id ? 'selected' : ''}`} onClick={() => setSelectedId(el.id)}>
          <div className="el-info">
            {renamingId === el.id ? (
              <input
                ref={renameInputRef}
                className="inline-rename"
                value={renameValue}
                onChange={e => setRenameValue(e.target.value)}
                onBlur={commitRename}
                onKeyDown={e => {
                  if (e.key === 'Enter') commitRename();
                  if (e.key === 'Escape') cancelRename();
                }}
                onClick={e => e.stopPropagation()}
                autoFocus
              />
            ) : (
              <div className="el-id" onDoubleClick={(e) => { e.stopPropagation(); startRename(el.id); }}>
                {el.id}
              </div>
            )}
            <div className="el-points">
              {el.points.length} bodů · {(el.holes || []).length} holes · {el.attributes.length} attr
              {el.groupName && <span className="badge badge-purple" style={{ marginLeft: 4 }}>{el.groupName}</span>}
            </div>
          </div>
          <div className="el-actions">
            <button className="btn btn-xs btn-orange" title="Upravit geometrii" onClick={(e) => { e.stopPropagation(); startGeomEdit(el.id); }}>
              ⬡
            </button>
            <button className="btn btn-xs" title="Upravit atributy" onClick={(e) => { e.stopPropagation(); startEditAttrs(el.id); }}>
              ✎
            </button>
            <button className="btn btn-xs btn-danger" title="Smazat" onClick={(e) => { e.stopPropagation(); deleteElement(el.id); }}>
              ×
            </button>
          </div>
        </div>
      ))}
    </>
  );
}
