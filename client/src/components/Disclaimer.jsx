import React from 'react';

export default function Disclaimer() {
  return (
    <div className="disclaimer-banner">
      <div className="disclaimer-icon" aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </div>
      <div>
        <strong>Legal Information Notice:</strong> CASEDECODER is an AI-assisted document organization tool. It may misinterpret legal language or omit details. Verify important findings against the original document. This does not constitute legal advice.
      </div>
    </div>
  );
}
