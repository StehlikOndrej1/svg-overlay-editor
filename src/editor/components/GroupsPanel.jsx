export default function GroupsPanel({
  activeGroupId,
  deleteGroup,
  editingGroup,
  groupForm,
  groups,
  saveGroup,
  setEditingGroup,
  setGroupForm,
  startEditGroup,
  startNewGroup,
}) {
  if (editingGroup) {
    return (
      <div style={{ animation: 'fadeIn 0.2s ease' }}>
        <div className="form-group">
          <label className="form-label">Název skupiny</label>
          <input
            className="form-input"
            value={groupForm.name}
            onChange={e => setGroupForm({ ...groupForm, name: e.target.value })}
            placeholder="např. Budova, Park, Silnice…"
          />
        </div>
        <div className="divider" />
        <label className="form-label" style={{ marginBottom: 10 }}>Názvy atributů (klíče)</label>
        {groupForm.attrKeys.map((key, i) => (
          <div key={i} className="attr-row">
            <input
              className="form-input"
              placeholder="název atributu"
              value={key}
              onChange={e => {
                const next = [...groupForm.attrKeys];
                next[i] = e.target.value;
                setGroupForm({ ...groupForm, attrKeys: next });
              }}
            />
            <button className="remove-attr" onClick={() => {
              if (groupForm.attrKeys.length > 1) {
                setGroupForm({ ...groupForm, attrKeys: groupForm.attrKeys.filter((_, j) => j !== i) });
              }
            }}>×</button>
          </div>
        ))}
        <button className="btn btn-sm" style={{ marginTop: 4, width: '100%', justifyContent: 'center' }} onClick={() => setGroupForm({ ...groupForm, attrKeys: [...groupForm.attrKeys, ''] })}>
          + Přidat atribut
        </button>
        <div className="divider" />
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-purple" style={{ flex: 1, justifyContent: 'center' }} onClick={saveGroup}>Uložit skupinu</button>
          <button className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setEditingGroup(null)}>Zrušit</button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="hint-box" style={{ marginBottom: 16 }}>
        Skupiny definují <strong>šablony atributů</strong>. Vytvoř skupinu, aktivuj ji přes rozbalovací menu v záložce Prvky.
      </div>
      <button className="btn btn-purple" style={{ width: '100%', justifyContent: 'center', marginBottom: 16 }} onClick={startNewGroup}>
        + Nová skupina
      </button>
      {groups.map(g => (
        <div key={g.id} className={`group-card ${activeGroupId === g.id ? 'active-group' : ''}`}>
          <div className="group-name">
            <span>{g.name}</span>
            {activeGroupId === g.id && <span className="badge badge-purple">aktivní</span>}
          </div>
          <div className="group-attrs">Atributy: {g.attrKeys.join(', ')}</div>
          <div className="group-actions">
            <button className="btn btn-sm" onClick={() => startEditGroup(g)}>Upravit</button>
            <button className="btn btn-sm btn-danger" onClick={() => deleteGroup(g.id)}>Smazat</button>
          </div>
        </div>
      ))}
    </>
  );
}
