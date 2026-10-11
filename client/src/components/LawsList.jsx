import React from 'react';

export default function LawsList({ laws }) {
  const lawsList = Array.isArray(laws) ? laws : [];

  const getContextClass = (context) => {
    const lower = (context || '').toLowerCase();
    if (lower.includes('applied') || lower.includes('relied')) return 'context-applied';
    if (lower.includes('discussed')) return 'context-discussed';
    return 'context-mentioned';
  };

  if (lawsList.length === 0) {
    return (
      <div className="section-card">
        <div className="card-header">
          <h2 className="card-title">Laws and provisions</h2>
          <span className="card-eyebrow">Statutory Citations</span>
        </div>
        <p className="not-found">No specific statutes or sections referenced in extracted text.</p>
      </div>
    );
  }

  return (
    <div className="section-card">
      <div className="card-header">
        <h2 className="card-title">Laws and provisions</h2>
        <span className="card-eyebrow">Statutory Citations</span>
      </div>

      <div className="laws-grid">
        {lawsList.map((law, idx) => {
          const badgeClass = getContextClass(law.context);
          return (
            <div key={idx} className="law-item">
              <div className="law-top">
                <span className="law-name">
                  {law.act} {law.section ? `· ${law.section}` : ''}
                </span>
                <span className={`law-context-tag ${badgeClass}`}>
                  {law.context || 'Mentioned'}
                </span>
              </div>
              {law.explanation && (
                <p className="law-explanation">{law.explanation}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
