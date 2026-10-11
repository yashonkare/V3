import React from 'react';

export default function EvidenceList({ evidence, uncertainties }) {
  const evidenceList = Array.isArray(evidence) ? evidence : [];
  const uncertaintyList = Array.isArray(uncertainties) ? uncertainties : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Evidence Panel */}
      <div className="evidence-card">
        <div className="card-header">
          <h2 className="card-title">Supporting evidence</h2>
          <span className="card-eyebrow">Source Excerpts</span>
        </div>

        {evidenceList.length === 0 ? (
          <p className="not-found">No verbatim excerpts could be directly mapped.</p>
        ) : (
          evidenceList.map((item, idx) => (
            <div key={idx} className="evidence-item">
              <div className="evidence-header">
                <span className="evidence-claim">{item.supportsFinding || 'Key Finding'}</span>
                <span className="evidence-page-tag">
                  {item.pageNumber ? `Page ${item.pageNumber}` : 'Page ref unavailable'}
                </span>
              </div>
              <blockquote className="evidence-quote">
                “{item.quote}”
              </blockquote>
            </div>
          ))
        )}
      </div>

      {/* Honest Uncertainty Panel */}
      {uncertaintyList.length > 0 && (
        <div className="uncertainties-box">
          <h3 className="uncertainties-title">
            ⚠ Missing Information / Unclear Notes
          </h3>
          <ul className="uncertainties-list">
            {uncertaintyList.map((note, idx) => (
              <li key={idx}>{note}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
