import { useEffect, useRef, useState } from 'react';

export default function GroupSwitcher({ groups, activeGroupId, setActiveGroupId }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const activeGroup = groups.find(g => g.id === activeGroupId) || null;

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (groups.length === 0) return null;

  return (
    <div className="group-switcher" ref={ref}>
      <button className={`group-switcher-btn ${activeGroup ? 'has-group' : ''}`} onClick={() => setOpen(!open)}>
        <div className="gs-label">
          {activeGroup ? (
            <>
              <div className="gs-dot" />
              <span className="gs-name">{activeGroup.name}</span>
            </>
          ) : (
            <span className="gs-placeholder">Žádná aktivní skupina</span>
          )}
        </div>
        <span className={`gs-arrow ${open ? 'open' : ''}`}>▼</span>
      </button>
      {open && (
        <div className="group-dropdown">
          <div className="group-dropdown-none" onClick={() => { setActiveGroupId(null); setOpen(false); }}>— Bez skupiny —</div>
          {groups.map(g => (
            <div
              key={g.id}
              className={`group-dropdown-item ${activeGroupId === g.id ? 'active-item' : ''}`}
              onClick={() => { setActiveGroupId(g.id); setOpen(false); }}
            >
              <div>
                <div className="gdi-name">{g.name}</div>
                <div className="gdi-attrs">{g.attrKeys.join(', ')}</div>
              </div>
              {activeGroupId === g.id && <span className="gdi-check">✓</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
