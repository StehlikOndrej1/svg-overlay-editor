import { useState } from 'react';
import Editor from './editor/Editor.jsx';
import Validator from './validator/Validator.jsx';
import Logo from './shared/components/Logo.jsx';
import { appStyles } from './shared/styles/appStyles.js';

export default function App() {
  const [mode, setMode] = useState('editor');

  return (
    <>
      <style>{appStyles}</style>
      <div className="app">
        <div className="topbar">
          <div className="topbar-brand"><Logo /><span>SVG Overlay Editor</span></div>
          <div className="topbar-tabs">
            <button className={`topbar-tab ${mode === 'editor' ? 'active' : ''}`} onClick={() => setMode('editor')}>Editor</button>
            <button className={`topbar-tab ${mode === 'validator' ? 'active' : ''}`} onClick={() => setMode('validator')}>Validátor</button>
          </div>
          <div style={{ width: 160 }} />
        </div>
        <div style={{ display: mode === 'editor' ? 'contents' : 'none' }}><Editor /></div>
        <div style={{ display: mode === 'validator' ? 'contents' : 'none' }}><Validator /></div>
      </div>
    </>
  );
}
