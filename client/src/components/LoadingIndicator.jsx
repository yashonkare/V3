import React from 'react';

export default function LoadingIndicator({ stepText }) {
  return (
    <div className="loading-box" role="status" aria-live="polite">
      <div className="spinner" aria-hidden="true"></div>
      <h3 className="loading-title">Analyzing document…</h3>
      <p className="loading-step">
        {stepText || 'Extracting text, identifying parties and preparing your structured case brief…'}
      </p>
    </div>
  );
}
