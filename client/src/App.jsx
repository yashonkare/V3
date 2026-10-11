import React, { useState, useEffect } from 'react';
import AppHeader from './components/AppHeader';
import FileDropzone from './components/FileDropzone';
import LoadingIndicator from './components/LoadingIndicator';
import StatusMessage from './components/StatusMessage';
import CaseAtAGlance from './components/CaseAtAGlance';
import PlainSummary from './components/PlainSummary';
import PartiesTable from './components/PartiesTable';
import LawsList from './components/LawsList';
import FindingsPanels from './components/FindingsPanels';
import EvidenceList from './components/EvidenceList';
import Disclaimer from './components/Disclaimer';
import RecentUploads from './components/RecentUploads';
import { SAMPLE_JUDGMENT_BRIEF, SAMPLE_CIVIL_BRIEF } from './utils/sampleData';
import { saveActiveBrief, loadActiveBrief, clearActiveBrief } from './utils/storage';

export default function App() {
  const [currentView, setCurrentView] = useState('home'); // 'home' | 'results' | 'recent'
  const [selectedFile, setSelectedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [errorState, setErrorState] = useState(null);
  const [briefData, setBriefData] = useState(null);

  // Restore cached brief from localStorage on initial mount if available
  useEffect(() => {
    const cached = loadActiveBrief();
    if (cached) {
      setBriefData(cached);
      setCurrentView('results');
    }
  }, []);

  const handleFileSelected = (file) => {
    setSelectedFile(file);
    setErrorState(null);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setErrorState(null);
  };

  const handleReset = () => {
    clearActiveBrief();
    setBriefData(null);
    setSelectedFile(null);
    setErrorState(null);
    setIsProcessing(false);
    setCurrentView('home');
  };

  // Reopen saved analysis for a document from recent uploads
  const handleOpenRecentDocument = async (docId) => {
    setIsProcessing(true);
    setProcessingStep('Loading saved analysis and case brief…');
    setCurrentView('home'); // brief loading overlay

    try {
      const res = await fetch(`/api/documents/${docId}`);
      if (!res.ok) {
        throw new Error('Could not load the saved document analysis.');
      }
      const doc = await res.json();
      if (!doc.analysis) {
        throw new Error('This document has no saved analysis or processing failed.');
      }

      setBriefData(doc.analysis);
      saveActiveBrief(doc.analysis);
      setCurrentView('results');
    } catch (err) {
      console.error('Error reopening document:', err);
      setErrorState({
        title: 'Document Retrieval Note',
        message: err.message,
        retryable: false
      });
      setCurrentView('recent');
    } finally {
      setIsProcessing(false);
    }
  };

  // Trigger analysis for live uploaded file
  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setErrorState(null);
    setProcessingStep('Extracting text and verifying page boundaries…');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      // Transition step message for user clarity
      const stepTimer = setTimeout(() => {
        setProcessingStep('Analyzing legal context, parties, and findings with Gemini…');
      }, 900);

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      clearTimeout(stepTimer);

      if (!response.ok) {
        let errMessage = 'We could not complete the analysis. Please check your document and try again.';
        try {
          const errData = await response.json();
          if (errData && errData.message) {
            errMessage = errData.message;
          }
        } catch (_) {}
        throw new Error(errMessage);
      }

      const data = await response.json();
      setBriefData(data);
      saveActiveBrief(data);
      setCurrentView('results');
    } catch (err) {
      console.warn('Backend endpoint unavailable or returned error:', err.message);
      setErrorState({
        title: 'Analysis Notice',
        message: `${err.message} (Tip: Select one of the pre-tested public judgments below for instant verification.)`,
        retryable: true
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Immediate demonstration with pre-tested public judgment
  const handleSelectSample = (sampleType) => {
    setIsProcessing(true);
    setErrorState(null);
    setProcessingStep('Loading sample judgment and preparing case brief…');

    setTimeout(() => {
      const sample = sampleType === 'civil' ? SAMPLE_CIVIL_BRIEF : SAMPLE_JUDGMENT_BRIEF;
      setBriefData(sample);
      saveActiveBrief(sample);
      setIsProcessing(false);
      setCurrentView('results');
    }, 450);
  };

  return (
    <div className="app-shell">
      <AppHeader 
        currentView={currentView}
        filename={briefData?.documentMetadata?.filename || selectedFile?.name}
        onReset={handleReset}
        onNavigateRecent={() => setCurrentView('recent')}
        onNavigateHome={() => setCurrentView('home')}
      />

      <main className="container">
        {currentView === 'recent' ? (
          <RecentUploads 
            onOpenDocument={handleOpenRecentDocument}
            onNavigateUpload={() => setCurrentView('home')}
          />
        ) : currentView === 'home' ? (
          <div>
            <div className="hero-grid">
              <div className="hero-content">
                <div className="eyebrow">INDIAN COURT DOCUMENTS, MADE CLEARER</div>
                <h1 className="hero-headline">A long judgment.<br />A clearer first read.</h1>
                <p className="hero-supporting">
                  Upload an English-language Indian court judgment or order to organize the case type, parties, laws discussed, key issues, and final outcome—where the document makes it clear.
                </p>

                <div className="value-props">
                  <span className="value-props-heading">From dense legal text to a useful first brief</span>
                  <div className="props-list">
                    <div className="prop-item">
                      <strong>• Case at a glance:</strong>
                      <span>Likely category, court, case number, and coram.</span>
                    </div>
                    <div className="prop-item">
                      <strong>• People & provisions:</strong>
                      <span>Parties with roles, and substantive Acts cited.</span>
                    </div>
                    <div className="prop-item">
                      <strong>• Outcome with evidence:</strong>
                      <span>Plain-English explanation with verbatim source excerpts and page references.</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="upload-section">
                {errorState && (
                  <StatusMessage 
                    type="warning"
                    title={errorState.title}
                    message={errorState.message}
                    onRetry={errorState.retryable ? handleAnalyze : null}
                  />
                )}

                {isProcessing ? (
                  <LoadingIndicator stepText={processingStep} />
                ) : (
                  <FileDropzone 
                    onFileSelected={handleFileSelected}
                    selectedFile={selectedFile}
                    onRemoveFile={handleRemoveFile}
                    onAnalyze={handleAnalyze}
                    onSelectSample={handleSelectSample}
                    isProcessing={isProcessing}
                  />
                )}
              </div>
            </div>

            <Disclaimer />
          </div>
        ) : (
          <div className="results-page">
            <div className="results-header-banner">
              <div className="results-title-group">
                <div className="eyebrow">CASE BRIEF</div>
                <h1>Your case brief</h1>
                <div className="results-status-badge">
                  <span>AI-generated</span>
                  <span>•</span>
                  <span>Verify against source</span>
                  {briefData?.documentMetadata?.totalPages && (
                    <>
                      <span>•</span>
                      <span>{briefData.documentMetadata.totalPages} pages processed</span>
                    </>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setCurrentView('recent')}
                >
                  View Recent Uploads
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={handleReset}
                >
                  ← Analyze another document
                </button>
              </div>
            </div>

            <div className="brief-layout">
              <div className="report-column">
                <CaseAtAGlance 
                  caseCategory={briefData?.caseCategory}
                  courtMetadata={briefData?.courtMetadata}
                />

                <PlainSummary 
                  summary={briefData?.summary}
                />

                <PartiesTable 
                  parties={briefData?.parties}
                />

                <LawsList 
                  laws={briefData?.laws}
                />

                <FindingsPanels 
                  analysis={briefData?.analysis}
                />
              </div>

              <div className="evidence-column">
                <EvidenceList 
                  evidence={briefData?.evidence}
                  uncertainties={briefData?.uncertainties}
                />
              </div>
            </div>

            <Disclaimer />
          </div>
        )}
      </main>

      <footer className="site-footer">
        <div className="container">
          CASEDECODER — Prototype developed for initial Indian court document review. Not legal advice.
        </div>
      </footer>
    </div>
  );
}
