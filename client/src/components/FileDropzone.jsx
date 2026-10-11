import React, { useRef, useState } from 'react';

export default function FileDropzone({ onFileSelected, selectedFile, onRemoveFile, onAnalyze, onSelectSample, isProcessing }) {
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateAndProcess = (file) => {
    setErrorMsg(null);
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setErrorMsg('Please choose a PDF file. Scanned/image-only PDFs are not supported in this prototype.');
      return;
    }

    if (file.size === 0) {
      setErrorMsg('The selected PDF file is empty. Please choose a valid document.');
      return;
    }

    // 20 MB limit
    if (file.size > 20 * 1024 * 1024) {
      setErrorMsg('File size exceeds the 20MB limit. Please upload a smaller judgment document.');
      return;
    }

    onFileSelected(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndProcess(e.target.files[0]);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="upload-card">
      <h2 className="upload-heading">Start with a judgment</h2>
      <p className="upload-helper">
        Choose a text-based PDF from your device. Scanned/image-only PDFs are not supported in this prototype.
      </p>

      {errorMsg && (
        <div className="status-msg status-msg-error" role="alert">
          <div>{errorMsg}</div>
        </div>
      )}

      {!selectedFile ? (
        <div 
          className={`dropzone ${dragActive ? 'drag-active' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current && fileInputRef.current.click()}
        >
          <input 
            ref={fileInputRef}
            type="file" 
            accept=".pdf,application/pdf" 
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <svg className="dropzone-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <path d="M12 18v-6"></path>
            <path d="m9 15 3-3 3 3"></path>
          </svg>
          <div className="dropzone-text"><strong>Choose PDF</strong> or drag and drop a PDF here</div>
          <div className="dropzone-subtext">English text-based judgments or orders up to 20MB</div>
        </div>
      ) : (
        <div className="file-selected-box">
          <div className="file-info">
            <svg className="file-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <path d="M10 12h4"></path>
              <path d="M10 16h4"></path>
            </svg>
            <div className="file-details">
              <span className="filename" title={selectedFile.name}>{selectedFile.name}</span>
              <span className="filesize">{formatFileSize(selectedFile.size)}</span>
              <span className="status-tag-ready">✓ Ready to analyze</span>
            </div>
          </div>
          <button 
            type="button" 
            className="btn btn-text" 
            onClick={onRemoveFile}
            disabled={isProcessing}
            style={{ color: 'var(--red-700)', fontSize: '13px' }}
          >
            Remove
          </button>
        </div>
      )}

      <div className="upload-actions">
        <button 
          type="button" 
          className="btn btn-primary"
          style={{ width: '100%', height: '46px' }}
          onClick={onAnalyze}
          disabled={!selectedFile || isProcessing}
        >
          {isProcessing ? 'Analyzing document…' : 'Analyze document'}
        </button>
      </div>

      <div className="demo-pills">
        <span className="demo-pills-label">Or try a pre-tested public judgment</span>
        <div className="pills-group">
          <button 
            type="button" 
            className="pill-btn" 
            onClick={() => onSelectSample('criminal')}
            disabled={isProcessing}
          >
            📄 Criminal Appeal (SC Acquittal)
          </button>
          <button 
            type="button" 
            className="pill-btn" 
            onClick={() => onSelectSample('civil')}
            disabled={isProcessing}
          >
            📄 Civil Writ (HC Land Acquisition)
          </button>
        </div>
      </div>

      <p className="file-privacy-note">
        Note: Use public judgments for demonstration. Do not upload confidential legal documents.
      </p>
    </div>
  );
}
