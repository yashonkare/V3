import React from 'react';

export default function FindingsPanels({ analysis }) {
  const partyArguments = Array.isArray(analysis?.partyArguments) ? analysis.partyArguments : [];
  const courtReasoning = Array.isArray(analysis?.courtReasoning) ? analysis.courtReasoning : [];
  const finalOutcome = analysis?.finalOutcome || null;

  return (
    <div className="section-card">
      <div className="card-header">
        <h2 className="card-title">Arguments, findings & outcome</h2>
        <span className="card-eyebrow">Distinct Legal Analysis</span>
      </div>

      <div className="tri-panels">
        {/* Panel 1: Parties' Arguments */}
        <div className="finding-subpanel panel-arguments">
          <h3 className="subpanel-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            Parties' Arguments (Allegations & Submissions)
          </h3>
          {partyArguments.length > 0 ? (
            partyArguments.map((arg, idx) => (
              <div key={idx} className="argument-entry">
                <strong>{arg.party ? `${arg.party}: ` : 'Contention: '}</strong>
                <span>{arg.argument}</span>
              </div>
            ))
          ) : (
            <p className="not-found">No party arguments specifically partitioned in extracted text.</p>
          )}
        </div>

        {/* Panel 2: Court's Reasoning & Observations */}
        <div className="finding-subpanel panel-court">
          <h3 className="subpanel-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            Court's Reasoning & Findings
          </h3>
          {courtReasoning.length > 0 ? (
            <ul className="court-bullet-list">
              {courtReasoning.map((r, idx) => (
                <li key={idx}>{r}</li>
              ))}
            </ul>
          ) : (
            <p className="not-found">No court reasoning points identified in extracted text.</p>
          )}
        </div>

        {/* Panel 3: Final Operative Outcome */}
        <div className="finding-subpanel panel-outcome">
          <h3 className="subpanel-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            Final Operative Outcome / Order
          </h3>
          {finalOutcome?.order ? (
            <div>
              <p className="outcome-text">{finalOutcome.order}</p>
              {finalOutcome.isInterim && (
                <span className="outcome-interim-note">⚠ Interim / Pending Order</span>
              )}
            </div>
          ) : (
            <p className="not-found">Outcome unclear from the available text.</p>
          )}
        </div>
      </div>
    </div>
  );
}
