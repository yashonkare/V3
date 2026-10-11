import React from 'react';

export default function CaseAtAGlance({ caseCategory, courtMetadata }) {
  const category = caseCategory?.category || 'Unclear';
  const reason = caseCategory?.reason || 'Reason unclear from available text.';

  const court = courtMetadata?.courtName || 'Not found in extracted text';
  const caseNumber = courtMetadata?.caseNumber || 'Not found in extracted text';
  const date = courtMetadata?.dateOfJudgment || 'Not found in extracted text';
  const judges = Array.isArray(courtMetadata?.judges) && courtMetadata.judges.length > 0
    ? courtMetadata.judges.join(', ')
    : 'Not found in extracted text';

  return (
    <div className="section-card">
      <div className="card-header">
        <h2 className="card-title">Case at a glance</h2>
        <span className="card-eyebrow">Classification & Metadata</span>
      </div>

      <div className="glance-category">
        <span className="category-chip">{category}</span>
        <span className="category-reason">{reason}</span>
      </div>

      <div className="meta-grid">
        <div className="meta-item">
          <span className="meta-label">Court</span>
          <span className={`meta-value ${court.includes('Not found') ? 'not-found' : ''}`}>
            {court}
          </span>
        </div>

        <div className="meta-item">
          <span className="meta-label">Case Number</span>
          <span className={`meta-value ${caseNumber.includes('Not found') ? 'not-found' : ''}`}>
            {caseNumber}
          </span>
        </div>

        <div className="meta-item">
          <span className="meta-label">Date of Judgment</span>
          <span className={`meta-value ${date.includes('Not found') ? 'not-found' : ''}`}>
            {date}
          </span>
        </div>

        <div className="meta-item">
          <span className="meta-label">Coram / Judge(s)</span>
          <span className={`meta-value ${judges.includes('Not found') ? 'not-found' : ''}`}>
            {judges}
          </span>
        </div>
      </div>
    </div>
  );
}
