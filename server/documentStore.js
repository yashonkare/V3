import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const DB_FILE = path.join(DATA_DIR, 'documents.json');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify([], null, 2), 'utf-8');
}

/**
 * Read all document records from disk
 */
export function getAllDocuments() {
  try {
    if (!fs.existsSync(DB_FILE)) return [];
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(content || '[]');
  } catch (err) {
    console.error('[DocumentStore] Error reading documents database:', err);
    return [];
  }
}

/**
 * Write documents array to disk safely
 */
function writeDocuments(docs) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(docs, null, 2), 'utf-8');
  } catch (err) {
    console.error('[DocumentStore] Error writing documents database:', err);
  }
}

/**
 * Save original PDF buffer to disk with sanitized safe name
 */
export function saveUploadedPdf(docId, originalName, buffer) {
  try {
    const ext = path.extname(originalName) || '.pdf';
    const safeFilename = `${docId}${ext}`;
    const filePath = path.join(UPLOADS_DIR, safeFilename);
    fs.writeFileSync(filePath, buffer);
    return safeFilename;
  } catch (err) {
    console.error('[DocumentStore] Error saving PDF file to disk:', err);
    return null;
  }
}

/**
 * Create a new document entry in processing status
 */
export function createDocument({ id, filename, fileSize, mimeType, fileReference }) {
  const docs = getAllDocuments();
  const newDoc = {
    id,
    filename,
    fileSize,
    mimeType: mimeType || 'application/pdf',
    uploadedAt: new Date().toISOString(),
    status: 'Processing',
    caseTitle: null,
    summaryPreview: null,
    analysis: null,
    fileReference,
    errorMessage: null
  };

  docs.unshift(newDoc);
  writeDocuments(docs);
  return newDoc;
}

/**
 * Update document status and analysis result
 */
export function updateDocument(id, updates) {
  const docs = getAllDocuments();
  const index = docs.findIndex(d => d.id === id);
  if (index === -1) return null;

  docs[index] = {
    ...docs[index],
    ...updates,
    updatedAt: new Date().toISOString()
  };

  writeDocuments(docs);
  return docs[index];
}

/**
 * Get document by ID
 */
export function getDocumentById(id) {
  const docs = getAllDocuments();
  return docs.find(d => d.id === id) || null;
}

/**
 * Delete a document by ID and remove its stored PDF from disk
 */
export function deleteDocument(id) {
  const docs = getAllDocuments();
  const docIndex = docs.findIndex(d => d.id === id);
  if (docIndex === -1) return false;

  const doc = docs[docIndex];
  if (doc.fileReference) {
    const safePath = path.join(UPLOADS_DIR, path.basename(doc.fileReference));
    if (fs.existsSync(safePath)) {
      try {
        fs.unlinkSync(safePath);
      } catch (err) {
        console.error('[DocumentStore] Failed to unlink stored PDF:', err);
      }
    }
  }

  docs.splice(docIndex, 1);
  writeDocuments(docs);
  return true;
}
