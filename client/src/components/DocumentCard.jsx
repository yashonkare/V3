import React, { useState } from 'react';

export default function DocumentCard({ doc, onOpen, onDelete }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'status-badge-completed';
      case 'processing':
        return 'status-badge-processing';
      case 'failed':
        return 'status-badge-failed';
      default:
        return 'status-badge-neutral';
    }
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    setShowConfirm(true);
  };

  const handleConfirmDelete = async (e) => {
    e.stopPropagation();
    setIsDeleting(true);
    try {
      await onDelete(doc.id);
    } finally {
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  const handleCancelDelete = (e) => {
    e.stopPropagation();
    setShowConfirm(false);
  };

  const handleCardClick = () => {
    if (doc.status === 'Completed') {
      onOpen(doc.id);
    }
  };

  return (
    <div 
      className={`recent-doc-card ${doc.status === 'Completed' ? 'clickable' : ''}`}
      onClick={handleCardClick}
      role={doc.status === 'Completed' ? 'button' : 'region'}
      tabIndex={doc.status === 'Completed' ? 0 : undefined}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          if (doc.status === 'Completed') onOpen(doc.id);
        }
      }}
    >
      <div className="doc-card-header">
        <div className="doc-card-title-group">
          <div className="doc-type-icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
          </div>
          <div className="doc-card-names">
            <h3 className="doc-filename" title={doc.filename}>{doc.filename}</h3>
            {doc.caseTitle && (
              <span className="doc-case-title" title={doc.caseTitle}>
                {doc.caseTitle}
              </span>
            )}
          </div>
        </div>

        <div className="doc-card-badge-group">
          <span className={`status-pill ${getStatusBadgeClass(doc.status)}`}>
            {doc.status === 'Processing' && <span className="status-dot-pulse" />}
            {doc.status}
          </span>
        </div>
      </div>

      <div className="doc-card-meta">
        <span>{formatDate(doc.uploadedAt)}</span>
        <span>•</span>
        <span>{formatFileSize(doc.fileSize)}</span>
        <span>•</span>
        <span>PDF</span>
      </div>

      {doc.summaryPreview && (
        <p className="doc-summary-preview">
          "{doc.summaryPreview}"
        </p>
      )}

      {doc.status === 'Failed' && doc.errorMessage && (
        <div className="doc-error-note">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>{doc.errorMessage}</span>
        </div>
      )}

      {doc.status === 'Processing' && (
        <div className="doc-processing-bar">
          <div className="processing-bar-fill" />
          <span>Analyzing judgment text and extracting legal context…</span>
        </div>
      )}

      <div className="doc-card-actions">
        {doc.status === 'Completed' ? (
          <button 
            type="button" 
            className="btn btn-secondary btn-sm"
            onClick={(e) => {
              e.stopPropagation();
              onOpen(doc.id);
            }}
          >
            Open Analysis →
          </button>
        ) : (
          <span className="action-inactive-hint">
            {doc.status === 'Processing' ? 'Processing…' : 'Analysis Unavailable'}
          </span>
        )}

        <button 
          type="button" 
          className="btn-icon-delete"
          onClick={handleDeleteClick}
          title="Delete from recent uploads"
          aria-label={`Delete ${doc.filename}`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>

      {showConfirm && (
        <div className="delete-confirm-overlay" onClick={(e) => e.stopPropagation()}>
          <div className="delete-confirm-box">
            <h4>Delete Document?</h4>
            <p>
              This will remove <strong>{doc.filename}</strong> and its stored AI-generated analysis from your recent uploads.
            </p>
            <div className="delete-confirm-actions">
              <button 
                type="button" 
                className="btn btn-secondary btn-sm"
                onClick={handleCancelDelete}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-danger btn-sm"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
