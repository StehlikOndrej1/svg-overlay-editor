const FONT_LINK = "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap";

export const appStyles = `
  @import url('${FONT_LINK}');
  * { margin:0; padding:0; box-sizing:border-box; }
  :root {
    --bg-primary: #0a0e17;
    --bg-secondary: #111827;
    --bg-tertiary: #1a2235;
    --bg-hover: #243049;
    --border: #2a3654;
    --border-active: #3b82f6;
    --text-primary: #e2e8f0;
    --text-secondary: #94a3b8;
    --text-muted: #64748b;
    --accent: #3b82f6;
    --accent-glow: rgba(59,130,246,0.3);
    --danger: #ef4444;
    --success: #10b981;
    --warning: #f59e0b;
    --polygon-fill: rgba(59,130,246,0.2);
    --polygon-stroke: #3b82f6;
    --polygon-active-fill: rgba(250,204,21,0.25);
    --polygon-active-stroke: #facc15;
    --polygon-selected-fill: rgba(16,185,129,0.2);
    --polygon-selected-stroke: #10b981;
    --group-purple: #a78bfa;
    --group-purple-bg: rgba(167,139,250,0.1);
    --vertex-edit: #f97316;
  }
  body { font-family:'DM Sans',sans-serif; background:var(--bg-primary); color:var(--text-primary); overflow:hidden; height:100vh; }
  .app { display:flex; flex-direction:column; height:100vh; }

  .topbar {
    display:flex; align-items:center; justify-content:space-between;
    padding:0 20px; height:56px; min-height:56px;
    background:var(--bg-secondary); border-bottom:1px solid var(--border); z-index:100;
  }
  .topbar-brand { display:flex; align-items:center; gap:10px; font-family:'JetBrains Mono',monospace; font-weight:700; font-size:15px; letter-spacing:-0.5px; }
  .topbar-brand svg { flex-shrink:0; }
  .topbar-tabs { display:flex; gap:2px; background:var(--bg-primary); border-radius:8px; padding:3px; }
  .topbar-tab {
    padding:6px 20px; border-radius:6px; border:none; cursor:pointer;
    font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600;
    background:transparent; color:var(--text-muted); transition:all 0.2s;
  }
  .topbar-tab:hover { color:var(--text-secondary); }
  .topbar-tab.active { background:var(--accent); color:white; }

  .btn {
    padding:7px 16px; border-radius:6px; border:1px solid var(--border);
    font-family:'DM Sans',sans-serif; font-size:12px; font-weight:600;
    cursor:pointer; transition:all 0.15s; display:inline-flex; align-items:center; gap:6px;
    background:var(--bg-tertiary); color:var(--text-primary);
  }
  .btn:hover { border-color:var(--text-muted); background:var(--bg-hover); }
  .btn-primary { background:var(--accent); border-color:var(--accent); color:white; }
  .btn-primary:hover { background:#2563eb; }
  .btn-danger { border-color:var(--danger); color:var(--danger); }
  .btn-danger:hover { background:rgba(239,68,68,0.1); }
  .btn-sm { padding:4px 10px; font-size:11px; }
  .btn-xs { padding:2px 6px; font-size:10px; }
  .btn-purple { background:rgba(167,139,250,0.15); border-color:var(--group-purple); color:var(--group-purple); }
  .btn-purple:hover { background:rgba(167,139,250,0.25); }
  .btn-orange { border-color:var(--vertex-edit); color:var(--vertex-edit); }
  .btn-orange:hover { background:rgba(249,115,22,0.1); }

  .workspace { display:flex; flex:1; overflow:hidden; }
  .canvas-area {
    flex:1; display:flex; align-items:center; justify-content:center;
    background:var(--bg-primary); position:relative; overflow:hidden;
    background-image:radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0);
    background-size:24px 24px;
  }
  .sidebar {
    width:360px; min-width:360px; background:var(--bg-secondary);
    border-left:1px solid var(--border); display:flex; flex-direction:column; overflow:hidden;
  }
  .sidebar-tabs { display:flex; border-bottom:1px solid var(--border); }
  .sidebar-tab {
    flex:1; padding:10px 12px; border:none; cursor:pointer;
    font-family:'JetBrains Mono',monospace; font-size:11px; font-weight:600;
    text-transform:uppercase; letter-spacing:0.5px;
    background:transparent; color:var(--text-muted); transition:all 0.15s;
    border-bottom:2px solid transparent;
  }
  .sidebar-tab:hover { color:var(--text-secondary); }
  .sidebar-tab.active { color:var(--accent); border-bottom-color:var(--accent); }
  .sidebar-content { flex:1; overflow-y:auto; padding:16px 20px; }

  /* Fixed action bar at bottom of sidebar */
  .sidebar-actions {
    padding:12px 20px; border-top:1px solid var(--border);
    background:var(--bg-secondary); display:flex; flex-direction:column; gap:6px;
    flex-shrink:0;
  }
  .sidebar-actions .btn { width:100%; justify-content:center; }

  .canvas-wrapper { position:relative; display:inline-block; box-shadow:0 0 60px rgba(0,0,0,0.5); }
  .canvas-wrapper img { display:block; user-select:none; -webkit-user-drag:none; }
  .canvas-wrapper svg { position:absolute; top:0; left:0; width:100%; height:100%; }
  .drawing-svg { cursor:crosshair; }
  .drawing-svg polygon { cursor:pointer; transition:fill 0.15s; }
  .drawing-svg polygon:hover { fill:rgba(59,130,246,0.35) !important; }

  .upload-zone {
    border:2px dashed var(--border); border-radius:12px;
    padding:60px 40px; text-align:center; cursor:pointer; transition:all 0.2s; max-width:480px;
  }
  .upload-zone:hover { border-color:var(--accent); background:rgba(59,130,246,0.05); }
  .upload-zone h3 { font-size:16px; margin-bottom:8px; }
  .upload-zone p { font-size:13px; color:var(--text-muted); }

  .mode-selector { display:flex; flex-direction:column; align-items:center; gap:24px; max-width:600px; }
  .mode-selector h2 { font-family:'JetBrains Mono',monospace; font-size:18px; font-weight:700; }
  .mode-selector > p { font-size:13px; color:var(--text-muted); margin-top:-16px; }
  .mode-cards { display:flex; gap:20px; }
  .mode-card {
    width:260px; padding:32px 24px; border-radius:12px; border:1px solid var(--border);
    background:var(--bg-secondary); cursor:pointer; transition:all 0.2s; text-align:center;
  }
  .mode-card:hover { border-color:var(--accent); background:var(--bg-tertiary); transform:translateY(-2px); box-shadow:0 8px 30px rgba(0,0,0,0.3); }
  .mode-card svg { margin-bottom:16px; }
  .mode-card h3 { font-size:15px; font-weight:700; margin-bottom:6px; }
  .mode-card p { font-size:12px; color:var(--text-muted); line-height:1.5; }

  .edit-upload-step { display:flex; flex-direction:column; align-items:center; gap:20px; max-width:600px; }
  .edit-upload-step h3 { font-family:'JetBrains Mono',monospace; font-size:15px; margin-bottom:4px; }
  .edit-upload-row { display:flex; gap:20px; }
  .upload-zone-mini {
    border:2px dashed var(--border); border-radius:12px;
    padding:32px 28px; text-align:center; cursor:pointer; transition:all 0.2s; width:240px;
  }
  .upload-zone-mini:hover { border-color:var(--accent); background:rgba(59,130,246,0.05); }
  .upload-zone-mini h4 { font-size:13px; margin-bottom:4px; }
  .upload-zone-mini p { font-size:11px; color:var(--text-muted); }

  .form-group { margin-bottom:14px; }
  .form-label {
    display:block; font-size:11px; font-weight:600; margin-bottom:5px;
    color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px;
    font-family:'JetBrains Mono',monospace;
  }
  .form-input {
    width:100%; padding:8px 12px; border-radius:6px;
    border:1px solid var(--border); background:var(--bg-primary);
    color:var(--text-primary); font-size:13px; font-family:'DM Sans',sans-serif;
    transition:border-color 0.15s; outline:none;
  }
  .form-input:focus { border-color:var(--accent); box-shadow:0 0 0 2px var(--accent-glow); }
  .form-input::placeholder { color:var(--text-muted); }

  .attr-row { display:flex; gap:6px; align-items:center; margin-bottom:8px; animation:fadeIn 0.15s ease; }
  .attr-row .form-input { flex:1; }
  .remove-attr {
    width:28px; height:28px; border-radius:4px; border:none; cursor:pointer;
    background:transparent; color:var(--danger); font-size:16px;
    display:flex; align-items:center; justify-content:center;
    transition:background 0.15s; flex-shrink:0;
  }
  .remove-attr:hover { background:rgba(239,68,68,0.1); }

  .element-item {
    padding:8px 12px; border-radius:8px; margin-bottom:4px;
    border:1px solid var(--border); cursor:pointer; transition:all 0.15s;
    display:flex; align-items:center; gap:8px;
  }
  .element-item:hover { border-color:var(--text-muted); background:var(--bg-tertiary); }
  .element-item.selected { border-color:var(--success); background:rgba(16,185,129,0.06); }
  .element-item .el-info { flex:1; min-width:0; }
  .element-item .el-id {
    font-family:'JetBrains Mono',monospace; font-size:12px; font-weight:500;
    white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
  }
  .element-item .el-points { font-size:10px; color:var(--text-muted); }
  .element-item .el-actions { display:flex; gap:3px; flex-shrink:0; }
  .inline-rename {
    font-family:'JetBrains Mono',monospace; font-size:12px; font-weight:500;
    background:var(--bg-primary); border:1px solid var(--accent); border-radius:4px;
    color:var(--text-primary); padding:2px 6px; outline:none; width:100%;
    box-shadow:0 0 0 2px var(--accent-glow);
  }

  .group-card {
    padding:12px; border-radius:8px; margin-bottom:8px;
    border:1px solid var(--border); transition:all 0.15s;
  }
  .group-card.active-group { border-color:var(--group-purple); background:var(--group-purple-bg); }
  .group-card .group-name {
    font-family:'JetBrains Mono',monospace; font-size:13px; font-weight:600;
    margin-bottom:4px; display:flex; align-items:center; justify-content:space-between;
  }
  .group-card .group-attrs { font-size:11px; color:var(--text-muted); line-height:1.6; }
  .group-card .group-actions { display:flex; gap:4px; margin-top:8px; }

  .group-switcher { position:relative; margin-bottom:14px; }
  .group-switcher-btn {
    width:100%; padding:8px 12px; border-radius:6px; border:1px solid var(--border);
    background:var(--bg-primary); color:var(--text-primary); font-size:12px;
    font-family:'DM Sans',sans-serif; cursor:pointer; transition:all 0.15s;
    display:flex; align-items:center; justify-content:space-between;
  }
  .group-switcher-btn:hover { border-color:var(--text-muted); }
  .group-switcher-btn.has-group { border-color:var(--group-purple); background:var(--group-purple-bg); }
  .group-switcher-btn .gs-label { display:flex; align-items:center; gap:8px; }
  .group-switcher-btn .gs-dot { width:8px; height:8px; border-radius:50%; background:var(--group-purple); flex-shrink:0; }
  .group-switcher-btn .gs-name { font-family:'JetBrains Mono',monospace; font-weight:600; color:var(--group-purple); }
  .group-switcher-btn .gs-placeholder { color:var(--text-muted); }
  .group-switcher-btn .gs-arrow { color:var(--text-muted); font-size:10px; transition:transform 0.15s; }
  .group-switcher-btn .gs-arrow.open { transform:rotate(180deg); }

  .group-dropdown {
    position:absolute; top:calc(100% + 4px); left:0; right:0; z-index:50;
    background:var(--bg-secondary); border:1px solid var(--border); border-radius:8px;
    box-shadow:0 12px 40px rgba(0,0,0,0.5); max-height:220px; overflow-y:auto;
    animation:fadeIn 0.12s ease;
  }
  .group-dropdown-item {
    padding:10px 14px; cursor:pointer; transition:all 0.1s;
    display:flex; align-items:center; justify-content:space-between;
    border-bottom:1px solid var(--border); font-size:12px;
  }
  .group-dropdown-item:last-child { border-bottom:none; }
  .group-dropdown-item:hover { background:var(--bg-hover); }
  .group-dropdown-item.active-item { background:var(--group-purple-bg); }
  .group-dropdown-item .gdi-name { font-family:'JetBrains Mono',monospace; font-weight:600; }
  .group-dropdown-item .gdi-attrs { font-size:10px; color:var(--text-muted); margin-top:2px; }
  .group-dropdown-item .gdi-check { color:var(--group-purple); font-weight:700; }
  .group-dropdown-none {
    padding:10px 14px; cursor:pointer; transition:all 0.1s;
    color:var(--text-muted); font-size:12px; border-bottom:1px solid var(--border);
  }
  .group-dropdown-none:hover { background:var(--bg-hover); }

  .statusbar {
    height:32px; min-height:32px; display:flex; align-items:center;
    padding:0 20px; background:var(--bg-secondary);
    border-top:1px solid var(--border);
    font-family:'JetBrains Mono',monospace; font-size:11px; color:var(--text-muted); gap:20px;
  }
  .status-dot { width:6px; height:6px; border-radius:50%; display:inline-block; margin-right:6px; }
  .status-dot.green { background:var(--success); }
  .status-dot.yellow { background:var(--warning); }
  .status-dot.blue { background:var(--accent); }
  .status-dot.orange { background:var(--vertex-edit); }

  .badge {
    display:inline-flex; align-items:center; padding:2px 8px;
    border-radius:4px; font-size:10px; font-weight:600;
    font-family:'JetBrains Mono',monospace;
  }
  .badge-blue { background:rgba(59,130,246,0.15); color:var(--accent); }
  .badge-green { background:rgba(16,185,129,0.15); color:var(--success); }
  .badge-purple { background:rgba(167,139,250,0.15); color:var(--group-purple); }
  .badge-orange { background:rgba(249,115,22,0.15); color:var(--vertex-edit); }

  .divider { height:1px; background:var(--border); margin:16px 0; }
  .hint-box {
    padding:12px; border-radius:8px; background:rgba(59,130,246,0.06);
    border:1px solid rgba(59,130,246,0.15); font-size:12px; color:var(--text-secondary); line-height:1.6;
  }

  .validator-attrs-table { width:100%; font-size:12px; border-collapse:collapse; }
  .validator-attrs-table td { padding:6px 10px; border-bottom:1px solid var(--border); }
  .validator-attrs-table td:first-child { font-family:'JetBrains Mono',monospace; font-weight:600; color:var(--accent); width:40%; }

  .zoom-controls {
    position:absolute; bottom:16px; right:16px; display:flex; gap:4px; z-index:10;
  }
  .zoom-btn {
    width:36px; height:36px; border-radius:8px; border:1px solid var(--border);
    background:var(--bg-secondary); color:var(--text-primary);
    font-size:18px; cursor:pointer; display:flex; align-items:center; justify-content:center;
    transition:all 0.15s;
  }
  .zoom-btn:hover { background:var(--bg-hover); border-color:var(--text-muted); }
  .zoom-info {
    height:36px; padding:0 12px; border-radius:8px; border:1px solid var(--border);
    background:var(--bg-secondary); color:var(--text-muted);
    font-family:'JetBrains Mono',monospace; font-size:11px; display:flex; align-items:center;
  }

  .geom-hint {
    padding:8px 12px; border-radius:6px; background:rgba(249,115,22,0.08);
    border:1px solid rgba(249,115,22,0.2); font-size:11px; color:var(--vertex-edit);
    margin-bottom:12px; line-height:1.5;
  }

  @keyframes fadeIn { from { opacity:0; transform:translateY(-4px); } to { opacity:1; transform:translateY(0); } }
  @keyframes pulse-ring { 0% { transform:scale(1); opacity:0.5; } 100% { transform:scale(1.6); opacity:0; } }
  ::-webkit-scrollbar { width:6px; }
  ::-webkit-scrollbar-track { background:transparent; }
  ::-webkit-scrollbar-thumb { background:var(--border); border-radius:3px; }
  ::-webkit-scrollbar-thumb:hover { background:var(--text-muted); }
`;
