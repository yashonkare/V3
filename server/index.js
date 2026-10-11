import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import crypto from 'crypto';
import { extractTextWithPages } from './pdfExtractor.js';
import { analyzeJudgmentWithGemini } from './geminiService.js';
import { SAMPLE_JUDGMENT_BRIEF, SAMPLE_CIVIL_BRIEF } from './sampleData.js';
import { 
  getAllDocuments, 
  getDocumentById, 
  createDocument, 
  updateDocument, 
  deleteDocument, 
  saveUploadedPdf 
} from './documentStore.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// In-memory multer upload for safe processing with size and type validation
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024 // 20 MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('INVALID_FILE_TYPE: Only text-based PDF documents are supported.'));
    }
  }
});

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'CASEDECODER API', timestamp: new Date().toISOString() });
});

/**
 * Pre-tested sample briefs endpoint for instant demo testing
 */
app.get('/api/samples/:type', (req, res) => {
  const type = req.params.type;
  if (type === 'civil') {
    return res.json(SAMPLE_CIVIL_BRIEF);
  }
  return res.json(SAMPLE_JUDGMENT_BRIEF);
});

/**
 * GET /api/documents
 * List all recent uploads with optional search and status filtering
 */
app.get('/api/documents', (req, res) => {
  try {
    const { q, status } = req.query;
    let docs = getAllDocuments();

    // Filter by status if requested
    if (status && status !== 'all') {
      docs = docs.filter(d => d.status?.toLowerCase() === status.toLowerCase());
    }

    // Filter by query (filename or caseTitle)
    if (q && q.trim()) {
      const term = q.trim().toLowerCase();
      docs = docs.filter(d => 
        (d.filename && d.filename.toLowerCase().includes(term)) ||
        (d.caseTitle && d.caseTitle.toLowerCase().includes(term)) ||
        (d.summaryPreview && d.summaryPreview.toLowerCase().includes(term))
      );
    }

    // Return metadata without giant raw analysis payloads to keep list responses snappy
    const lightweightList = docs.map(d => ({
      id: d.id,
      filename: d.filename,
      fileSize: d.fileSize,
      mimeType: d.mimeType,
      uploadedAt: d.uploadedAt,
      status: d.status,
      caseTitle: d.caseTitle,
      summaryPreview: d.summaryPreview,
      errorMessage: d.errorMessage,
      hasAnalysis: Boolean(d.analysis)
    }));

    res.json(lightweightList);
  } catch (err) {
    console.error('[CASEDECODER] Error fetching recent documents:', err);
    res.status(500).json({ error: 'FETCH_DOCUMENTS_FAILED', message: 'Could not fetch recent uploads.' });
  }
});

/**
 * GET /api/documents/:id
 * Retrieve a specific document and its saved analysis
 */
app.get('/api/documents/:id', (req, res) => {
  try {
    const doc = getDocumentById(req.params.id);
    if (!doc) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Document not found.' });
    }
    res.json(doc);
  } catch (err) {
    console.error('[CASEDECODER] Error fetching document by ID:', err);
    res.status(500).json({ error: 'FETCH_DOC_FAILED', message: 'Could not fetch document details.' });
  }
});

/**
 * DELETE /api/documents/:id
 * Delete a document record and its associated stored PDF file
 */
app.delete('/api/documents/:id', (req, res) => {
  try {
    const deleted = deleteDocument(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Document not found or already deleted.' });
    }
    res.json({ success: true, message: 'Document and stored file removed.' });
  } catch (err) {
    console.error('[CASEDECODER] Error deleting document:', err);
    res.status(500).json({ error: 'DELETE_FAILED', message: 'Could not delete document.' });
  }
});

/**
 * Main Analysis Endpoint
 * POST /api/analyze
 * multipart/form-data with field: file
 */
app.post('/api/analyze', upload.single('file'), async (req, res) => {
  let docId = null;
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'NO_FILE_UPLOADED',
        message: 'Please choose a PDF file to analyze.'
      });
    }

    const filename = req.file.originalname || 'uploaded_document.pdf';
    const buffer = req.file.buffer;
    const fileSize = buffer.length;

    console.log(`[CASEDECODER] Processing upload: ${filename} (${fileSize} bytes)`);

    // 1. Create unique document record and persist original PDF
    docId = 'doc_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex');
    const storedPdfRef = saveUploadedPdf(docId, filename, buffer);

    createDocument({
      id: docId,
      filename,
      fileSize,
      mimeType: req.file.mimetype || 'application/pdf',
      fileReference: storedPdfRef
    });

    // 2. Extract text and page boundaries
    let extraction;
    try {
      extraction = await extractTextWithPages(buffer);
    } catch (parseErr) {
      console.error('[CASEDECODER] PDF parsing error:', parseErr);
      const errMsg = "We couldn't read this PDF. This file may be scanned, protected, empty, or damaged. Try a text-based PDF judgment.";
      updateDocument(docId, { status: 'Failed', errorMessage: errMsg });
      return res.status(422).json({
        error: 'PDF_PARSE_FAILED',
        message: errMsg,
        documentId: docId
      });
    }

    const { totalPages, pages, fullText } = extraction;

    // 3. Check minimum text threshold
    if (!fullText || fullText.trim().length < 150) {
      const errMsg = "We couldn't extract enough readable text to analyze this document reliably. Scanned/image-only PDFs are not supported in this prototype.";
      updateDocument(docId, { status: 'Failed', errorMessage: errMsg });
      return res.status(422).json({
        error: 'TEXT_TOO_SHORT',
        message: errMsg,
        documentId: docId
      });
    }

    console.log(`[CASEDECODER] Extracted ${fullText.length} characters across ${totalPages} pages for ${filename}`);

    // 4. Run AI / structured analysis
    const brief = await analyzeJudgmentWithGemini(fullText, pages, filename);

    // Derive concise case title and summary preview for recent uploads list
    const party1 = brief.parties?.[0]?.name;
    const party2 = brief.parties?.[1]?.name;
    const derivedCaseTitle = (party1 && party2) 
      ? `${party1} v. ${party2}` 
      : (brief.courtMetadata?.caseNumber !== 'Not found in extracted text' ? brief.courtMetadata?.caseNumber : brief.caseCategory?.category || filename);

    const summaryPreview = brief.summary?.plainEnglish?.slice(0, 180) + '...' || null;

    // Update document record to Completed with full analysis and preview metadata
    updateDocument(docId, {
      status: 'Completed',
      caseTitle: derivedCaseTitle,
      summaryPreview,
      analysis: brief
    });

    // Attach documentId to response
    return res.json({
      ...brief,
      documentId: docId
    });

  } catch (err) {
    console.error('[CASEDECODER] Server error during analysis:', err);
    if (docId) {
      updateDocument(docId, {
        status: 'Failed',
        errorMessage: 'The document could not be analyzed right now.'
      });
    }
    return res.status(500).json({
      error: 'ANALYSIS_FAILED',
      message: 'The document could not be analyzed right now. Please try again in a moment.'
    });
  }
});

// Multer error handling middleware
app.use((err, req, res, next) => {
  if (err && err.message && err.message.includes('INVALID_FILE_TYPE')) {
    return res.status(400).json({
      error: 'INVALID_FILE_TYPE',
      message: 'Please choose a PDF file. Scanned/image-only PDFs are not supported in this prototype.'
    });
  }
  if (err && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      error: 'FILE_TOO_LARGE',
      message: 'The file exceeds the 20MB limit. Please upload a smaller document.'
    });
  }
  next(err);
});

app.listen(PORT, () => {
  console.log(`[CASEDECODER] Backend server listening on port ${PORT}`);
});
