import React, { useState } from 'react';

export default function VerificationModal({ isOpen, onClose, onVerifyCurrent, isVerifying, verificationResult, documentName }) {
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'diagnostics' | 'entities'

  if (!isOpen) return null;

  const diagnostics = verificationResult?.diagnostics || {};
  const meta = diagnostics.metadata_check || {};
  const entities = diagnostics.extracted_entities || {};
  const external = diagnostics.external_api_grounding || {};
  const semanticScore = diagnostics.semantic_similarity_score ?? 1.0;
  const decision = verificationResult?.decision || 'Pending';

  const getBadgeStyle = (status) => {
    switch (status) {
      case 'Allowed':
        return { bg: '#e6f7ed', text: '#0e703c', border: '#b7eb8f', label: '✓ Document Allowed / Verified' };
      case 'Flagged for Manual Review':
        return { bg: '#fffbe6', text: '#d48806', border: '#ffe58f', label: '⚠ Flagged for Manual Review' };
      case 'Rejected':
        return { bg: '#fff1f0', text: '#cf1322', border: '#ffa39e', label: '✕ Document Rejected / Anomalies Found' };
      default:
        return { bg: '#f5f5f5', text: '#595959', border: '#d9d9d9', label: status };
    }
  };

  const badgeInfo = getBadgeStyle(decision);

  return (
    <div className="verification-modal-overlay" onClick={onClose}>
      <div className="verification-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="verification-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="verification-shield-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--ink-900)' }}>
                Document Authenticity & Verification
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--ink-700)' }}>
                {documentName ? `Target: ${documentName}` : 'Tamper analysis, CNR grounding & semantic quote integrity'}
              </p>
            </div>
          </div>
          <button className="verification-modal-close" onClick={onClose} aria-label="Close modal">×</button>
        </div>

        {/* Action bar if no result loaded yet */}
        {!verificationResult && !isVerifying && (
          <div style={{ padding: '24px', textAlign: 'center' }}>
            <p style={{ marginBottom: '16px', color: 'var(--ink-700)' }}>
              Run cryptographic tamper detection, OCR fallback, InLegalBERT entity extraction, and CNR eCourts verification.
            </p>
            <button 
              type="button" 
              className="btn btn-primary"
              onClick={onVerifyCurrent}
            >
              Run Document Verification Check
            </button>
          </div>
        )}

        {isVerifying && (
          <div style={{ padding: '36px', textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 16px', width: '32px', height: '32px' }}></div>
            <p style={{ fontWeight: 500, color: 'var(--ink-900)' }}>Verifying document authenticity...</p>
            <p style={{ fontSize: '13px', color: 'var(--slate-600)', marginTop: '6px' }}>
              Computing SHA-256 hash, verifying digital signature, running NER & querying CNR records...
            </p>
          </div>
        )}

        {verificationResult && !isVerifying && (
          <div className="verification-modal-body">
            {/* Top Decision Banner */}
            <div 
              style={{
                backgroundColor: badgeInfo.bg,
                borderColor: badgeInfo.border,
                color: badgeInfo.text,
                borderWidth: '1px',
                borderStyle: 'solid',
                borderRadius: '8px',
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '20px'
              }}
            >
              <div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, display: 'block', opacity: 0.85 }}>
                  DECISION ENGINE RESULT
                </span>
                <span style={{ fontSize: '17px', fontWeight: 700 }}>
                  {badgeInfo.label}
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '12px', display: 'block' }}>Tamper Score</span>
                <span style={{ fontSize: '18px', fontWeight: 700 }}>{meta.tamper_score ?? 0} / 100</span>
              </div>
            </div>

            {/* Modal Tabs */}
            <div className="verification-tabs">
              <button 
                type="button"
                className={`verification-tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
                onClick={() => setActiveTab('summary')}
              >
                Verification Summary
              </button>
              <button 
                type="button"
                className={`verification-tab-btn ${activeTab === 'entities' ? 'active' : ''}`}
                onClick={() => setActiveTab('entities')}
              >
                Extracted Legal Entities ({entities.cnr_numbers?.length || 0} CNRs)
              </button>
              <button 
                type="button"
                className={`verification-tab-btn ${activeTab === 'diagnostics' ? 'active' : ''}`}
                onClick={() => setActiveTab('diagnostics')}
              >
                Technical Diagnostics & Crypto
              </button>
            </div>

            {/* Tab 1: Summary */}
            {activeTab === 'summary' && (
              <div className="verification-tab-content">
                <div className="verification-grid">
                  <div className="verification-card">
                    <span className="v-card-label">Digital Signature</span>
                    <span className={`v-card-val ${meta.is_signed ? 'val-good' : 'val-warn'}`}>
                      {meta.is_signed ? '✓ Digitally Signed' : '⚠ Missing Digital Signature'}
                    </span>
                    <p className="v-card-sub">Checked against document signature dictionary flags.</p>
                  </div>

                  <div className="verification-card">
                    <span className="v-card-label">Semantic Quote Similarity</span>
                    <span className={`v-card-val ${semanticScore >= 0.75 ? 'val-good' : 'val-warn'}`}>
                      {Math.round(semanticScore * 100)}% Match
                    </span>
                    <p className="v-card-sub">InLegal-SBERT embedding cosine similarity against legal canon.</p>
                  </div>

                  <div className="verification-card">
                    <span className="v-card-label">CNR Numbers Identified</span>
                    <span className="v-card-val">
                      {entities.cnr_numbers?.length ? `${entities.cnr_numbers.length} Record(s)` : 'None detected'}
                    </span>
                    <p className="v-card-sub">Standard 16-character eCourts case records.</p>
                  </div>

                  <div className="verification-card">
                    <span className="v-card-label">PDF Producer</span>
                    <span className="v-card-val" style={{ fontSize: '13px', wordBreak: 'break-all' }}>
                      {meta.generator || 'Unknown'}
                    </span>
                    <p className="v-card-sub">Creator/application metadata tag.</p>
                  </div>
                </div>

                {/* External CNR verification records */}
                <div style={{ marginTop: '18px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: 'var(--ink-900)' }}>
                    External eCourts Grounding Status
                  </h4>
                  {Object.keys(external).length === 0 ? (
                    <p style={{ fontSize: '13px', color: 'var(--slate-600)', fontStyle: 'italic' }}>
                      No 16-character CNR numbers were found in this document to query against eCourts registry.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {Object.entries(external).map(([cnr, res]) => (
                        <div key={cnr} className="cnr-status-box">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <code style={{ fontWeight: 600, color: 'var(--teal-800)' }}>{cnr}</code>
                            <span className={`status-pill ${res.status === 'Verified' ? 'status-pill-success' : 'status-pill-warn'}`}>
                              {res.status}
                            </span>
                          </div>
                          {res.data && (
                            <pre style={{ fontSize: '11px', marginTop: '6px', background: '#f8faf9', padding: '6px', borderRadius: '4px' }}>
                              {JSON.stringify(res.data, null, 2)}
                            </pre>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab 2: Entities */}
            {activeTab === 'entities' && (
              <div className="verification-tab-content">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <h4 style={{ fontSize: '13px', textTransform: 'uppercase', color: 'var(--slate-600)', marginBottom: '6px' }}>
                      Judges Extracted (NER)
                    </h4>
                    {entities.judges?.length ? (
                      <div className="tag-cloud">
                        {entities.judges.map((j, i) => (
                          <span key={i} className="entity-tag entity-judge">⚖ {j}</span>
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: '13px', color: 'var(--slate-600)' }}>No judge entities detected in sampled chunk.</p>
                    )}
                  </div>

                  <div>
                    <h4 style={{ fontSize: '13px', textTransform: 'uppercase', color: 'var(--slate-600)', marginBottom: '6px' }}>
                      Advocates / Counsel Extracted (NER)
                    </h4>
                    {entities.advocates?.length ? (
                      <div className="tag-cloud">
                        {entities.advocates.map((a, i) => (
                          <span key={i} className="entity-tag entity-advocate">👤 {a}</span>
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: '13px', color: 'var(--slate-600)' }}>No advocate entities detected in sampled chunk.</p>
                    )}
                  </div>

                  <div>
                    <h4 style={{ fontSize: '13px', textTransform: 'uppercase', color: 'var(--slate-600)', marginBottom: '6px' }}>
                      Statutory Citations Extracted
                    </h4>
                    {entities.citations?.length ? (
                      <div className="tag-cloud">
                        {entities.citations.map((c, i) => (
                          <span key={i} className="entity-tag entity-citation">📖 {c}</span>
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: '13px', color: 'var(--slate-600)' }}>No standardized law report citations detected in sampled chunk.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Diagnostics */}
            {activeTab === 'diagnostics' && (
              <div className="verification-tab-content">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div className="diag-row">
                    <span className="diag-key">SHA-256 Hash:</span>
                    <code className="diag-code">{meta.hash_sha256 || 'N/A'}</code>
                  </div>
                  <div className="diag-row">
                    <span className="diag-key">Creation Date:</span>
                    <span className="diag-val">{meta.creation_date || 'Missing (Anomaly flag +20)'}</span>
                  </div>
                  <div className="diag-row">
                    <span className="diag-key">Modification Date:</span>
                    <span className="diag-val">{meta.mod_date || 'Not recorded'}</span>
                  </div>
                  <div className="diag-row">
                    <span className="diag-key">Digital Signature Flag:</span>
                    <span className="diag-val">{meta.is_signed ? 'Present' : 'Not Present (+30 penalty)'}</span>
                  </div>
                  <div className="diag-row">
                    <span className="diag-key">Semantic Quote Score:</span>
                    <span className="diag-val">{semanticScore} (Threshold: 0.75)</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="verification-modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          {verificationResult && onVerifyCurrent && (
            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={onVerifyCurrent}
              disabled={isVerifying}
            >
              Re-Verify Document
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
