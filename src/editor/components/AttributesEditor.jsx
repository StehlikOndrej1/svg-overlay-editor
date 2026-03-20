import GroupSwitcher from './GroupSwitcher.jsx';

export default function AttributesEditor({
  editAttrs,
  editElId,
  groups,
  activeGroupId,
  setActiveGroupId,
  setEditAttrs,
  setEditElId,
  saveAttributes,
  cancelEdit,
}) {
  return (
    <div style={{ animation: 'fadeIn 0.2s ease' }}>
      <div style={{ marginBottom: 12 }}>
        <div className="form-label" style={{ marginBottom: 4 }}>Atributy</div>
        <div style={{ fontSize: 16, fontWeight: 700 }}>Konfigurace prvku</div>
      </div>
      <GroupSwitcher groups={groups} activeGroupId={activeGroupId} setActiveGroupId={setActiveGroupId} />
      <div className="form-group">
        <label className="form-label">ID prvku</label>
        <input className="form-input" value={editElId} onChange={e => setEditElId(e.target.value)} placeholder="unikátní identifikátor" />
      </div>
      <div className="divider" />
      <label className="form-label" style={{ marginBottom: 10 }}>Atributy</label>
      {editAttrs.map((attr, i) => (
        <div key={i} className="attr-row">
          <input
            className="form-input"
            placeholder="klíč"
            value={attr.key}
            onChange={e => {
              const next = [...editAttrs];
              next[i] = { ...next[i], key: e.target.value };
              setEditAttrs(next);
            }}
          />
          <input
            className="form-input"
            placeholder="hodnota"
            value={attr.value}
            onChange={e => {
              const next = [...editAttrs];
              next[i] = { ...next[i], value: e.target.value };
              setEditAttrs(next);
            }}
          />
          <button className="remove-attr" onClick={() => { if (editAttrs.length > 1) setEditAttrs(editAttrs.filter((_, j) => j !== i)); }}>×</button>
        </div>
      ))}
      <button className="btn btn-sm" style={{ marginTop: 4, width: '100%', justifyContent: 'center' }} onClick={() => setEditAttrs([...editAttrs, { key: '', value: '' }])}>
        + Přidat atribut
      </button>
      <div className="divider" />
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={saveAttributes}>Uložit</button>
        <button className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={cancelEdit}>Zrušit</button>
      </div>
    </div>
  );
}
