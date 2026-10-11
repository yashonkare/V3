import React, { useState, useEffect } from 'react';
import DocumentCard from './DocumentCard';

export default function RecentUploads({ onOpenDocument, onNavigateUpload }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'completed' | 'processing' | 'failed'

  const fetchDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append('q', searchQuery.trim());
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const url = `/api/documents${params.toString() ? '?' + params.toString() : ''}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error('Failed to retrieve recent uploads.');
      }
      const data = await res.json();
      setDocuments(data);
    } catch (err) {
      console.error('Error loading documents:', err);
      setError('Could not load recent uploads. Please verify the backend service is running.');
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch when filter or debounced query changes
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchDocuments();
    }, 200);

    return () => clearTimeout(handler);
  }, [searchQuery, statusFilter]);

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        throw new Error('Could not delete document.');
      }
      // Remove from local list immediately
      setDocuments(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete document. Please try again.');
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
  };

  return (
    <div className="recent-uploads-view">
      <div className="recent-header">
        <div>
          <div className="eyebrow">SAVED CASE BRIEFS & DOCUMENTS</div>
          <h1 className="recent-heading">Recent Uploads</h1>
          <p className="recent-subheading">
            View, search, or reopen court judgments and orders you have previously analyzed.
          </p>
        </div>

        <button 
          type="button" 
          className="btn btn-primary"
          onClick={onNavigateUpload}
        >
          + Upload New Judgment
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="recent-controls-bar">
        <div className="search-input-wrapper">
          <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input 
            type="text" 
            className="recent-search-input"
            placeholder="Search by filename, case title, or issue…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              type="button" 
              className="search-clear-btn" 
              onClick={() => setSearchQuery('')}
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        <div className="status-filter-pills">
          <button 
            type="button" 
            className={`filter-pill ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            All
          </button>
          <button 
            type="button" 
            className={`filter-pill ${statusFilter === 'completed' ? 'active' : ''}`}
            onClick={() => setStatusFilter('completed')}
          >
            Completed
          </button>
          <button 
            type="button" 
            className={`filter-pill ${statusFilter === 'processing' ? 'active' : ''}`}
            onClick={() => setStatusFilter('processing')}
          >
            Processing
          </button>
          <button 
            type="button" 
            className={`filter-pill ${statusFilter === 'failed' ? 'active' : ''}`}
            onClick={() => setStatusFilter('failed')}
          >
            Failed
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="skeleton-grid">
          {[1, 2, 3, 4].map(idx => (
            <div key={idx} className="skeleton-card">
              <div className="skeleton-line skeleton-title" />
              <div className="skeleton-line skeleton-meta" />
              <div className="skeleton-line skeleton-body" />
              <div className="skeleton-line skeleton-body-short" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="status-msg status-msg-error" style={{ marginTop: '24px' }}>
          <div>{error}</div>
          <button 
            type="button" 
            className="btn btn-secondary btn-sm" 
            onClick={fetchDocuments}
            style={{ marginLeft: 'auto' }}
          >
            Retry
          </button>
        </div>
      ) : documents.length === 0 ? (
        searchQuery || statusFilter !== 'all' ? (
          /* Search Empty State */
          <div className="empty-state-card">
            <svg className="empty-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              <line x1="8" y1="11" x2="14" y2="11"></line>
            </svg>
            <h3>No matching documents</h3>
            <p>We couldn't find any uploaded documents matching your active search or filters.</p>
            <button 
              type="button" 
              className="btn btn-secondary btn-sm"
              onClick={handleResetFilters}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          /* General Empty State */
          <div className="empty-state-card">
            <svg className="empty-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="12" y1="18" x2="12" y2="12"></line>
              <line x1="9" y1="15" x2="15" y2="15"></line>
            </svg>
            <h3>No recent uploads yet</h3>
            <p>Court judgments and orders you upload will appear here with their saved summaries and case briefs.</p>
            <button 
              type="button" 
              className="btn btn-primary"
              onClick={onNavigateUpload}
            >
              Upload your first judgment
            </button>
          </div>
        )
      ) : (
        <div className="recent-docs-grid">
          {documents.map(doc => (
            <DocumentCard 
              key={doc.id}
              doc={doc}
              onOpen={onOpenDocument}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
