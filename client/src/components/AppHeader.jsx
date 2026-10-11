import React from 'react';

export default function AppHeader({ currentView, filename, onReset }) {
  return (
    <header className="app-header">
      <div className="container header-inner">
        <a href="#home" onClick={(e) => { e.preventDefault(); onReset(); }} className="brand-mark" title="CASEDECODER Home">
          <span>CASE</span><span className="brand-accent">DECODER</span>
        </a>

        {currentView === 'results' && (
          <div className="header-center">
            {filename && (
              <span className="doc-pill" title={filename}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
                {filename}
              </span>
            )}
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onReset}
              style={{ fontSize: '13px', padding: '6px 12px' }}
            >
              Analyze another document
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
