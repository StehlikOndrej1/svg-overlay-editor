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
      <GroupSwitcher groups={groups} activeGroupId={activeGroupId} setActiveGroupId={setActiveGroupId} />
      {phase !== 'canvas' && <div className="hint-box">Vyber režim editoru a nahraj soubory.</div>}
      {phase === 'canvas' && elements.length === 0 && (
        <div className="hint-box">
          <strong>Jak kreslit:</strong><br />
          Klikej na plátno pro body polygonu.<br />
          Klikni na <span style={{ color: 'var(--success)' }}>zelený bod</span> nebo dvojklik pro uzavření.<br />
          V režimu geometrie můžeš přidávat i <strong>holes</strong> uvnitř polygonu.<br />
          <span style={{ color: 'var(--text-muted)' }}>Kolečko</span> = zoom, <span style={{ color: 'var(--text-muted)' }}>Ctrl+tah</span> = posun<br />
          <span style={{ color: 'var(--text-muted)' }}>F2</span> = přejmenovat, <span style={{ color: 'var(--text-muted)' }}>Del</span> = smazat
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
