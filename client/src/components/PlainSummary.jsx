import React from 'react';

export default function PlainSummary({ summary }) {
  const plainEnglish = summary?.plainEnglish || 'Summary unavailable in extracted text.';
  const coreIssues = Array.isArray(summary?.coreIssues) ? summary.coreIssues : [];

  return (
    <div className="section-card">
      <div className="card-header">
        <h2 className="card-title">Plain-English summary</h2>
        <span className="card-eyebrow">Overview & Core Issues</span>
      </div>

      <p className="summary-text">{plainEnglish}</p>

      {coreIssues.length > 0 && (
        <div>
          <h3 className="issues-heading">Main Legal Issue(s) Framed</h3>
          <ul className="issues-list">
            {coreIssues.map((issue, idx) => (
              <li key={idx}>{issue}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
