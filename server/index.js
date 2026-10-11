import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { extractTextWithPages } from './pdfExtractor.js';
import { analyzeJudgmentWithGemini } from './geminiService.js';
import { SAMPLE_JUDGMENT_BRIEF, SAMPLE_CIVIL_BRIEF } from './sampleData.js';

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

// In-memory multer upload for safe processing without persistent disk clutter
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
 * Main Analysis Endpoint
 * POST /api/analyze
 * multipart/form-data with field: file
 */
app.post('/api/analyze', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'NO_FILE_UPLOADED',
        message: 'Please choose a PDF file to analyze.'
      });
    }

    const filename = req.file.originalname || 'uploaded_document.pdf';
    const buffer = req.file.buffer;

    console.log(`[CASEDECODER] Processing upload: ${filename} (${buffer.length} bytes)`);

    // Step 1: Extract text and page boundaries
    let extraction;
    try {
      extraction = await extractTextWithPages(buffer);
    } catch (parseErr) {
      console.error('[CASEDECODER] PDF parsing error:', parseErr);
      return res.status(422).json({
        error: 'PDF_PARSE_FAILED',
        message: "We couldn't read this PDF. This file may be scanned, protected, empty, or damaged. Try a text-based PDF judgment."
      });
    }

    const { totalPages, pages, fullText } = extraction;

    // Step 2: Check minimum text threshold
    if (!fullText || fullText.trim().length < 150) {
      return res.status(422).json({
        error: 'TEXT_TOO_SHORT',
        message: "We couldn't extract enough readable text to analyze this document reliably. Scanned/image-only PDFs are not supported in this prototype."
      });
    }

    console.log(`[CASEDECODER] Extracted ${fullText.length} characters across ${totalPages} pages for ${filename}`);

    // Step 3: Run AI / structured analysis
    const brief = await analyzeJudgmentWithGemini(fullText, pages, filename);

    return res.json(brief);

  } catch (err) {
    console.error('[CASEDECODER] Server error during analysis:', err);
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
