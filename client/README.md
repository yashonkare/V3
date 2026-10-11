# CASEDECODER

> **AI-powered Indian court document analyzer** — Upload a PDF judgment, get a clear, structured case brief in seconds.

Built for a hackathon by first-year college students using **Google Gemini** and **Google Antigravity**.

---

## What It Does

Indian court judgments are long, dense, and written in specialized legal English. CASEDECODER turns any text-based English court judgment or order PDF into a structured case brief — showing:

- **Case at a Glance** — Likely case category, court name, case number, and coram (bench of judges)
- **Plain-English Summary** — What the case is about, without the legalese
- **Parties & Roles** — Petitioner, respondent, appellant, and other key actors
- **Laws & Provisions** — Substantive Acts cited, with context for each
- **Court Findings** — Key issues, the court's reasoning, and the final operative outcome
- **Evidence Panel** — Verbatim source excerpts and page references so you can verify claims yourself
- **Uncertainty Labels** — Missing or unclear fields are labelled *"Not found"* — never silently guessed

CASEDECODER supports a faster initial review. It does **not** replace reading the original document or professional legal advice.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite 8 |
| Styling | Vanilla CSS (custom design system) |
| Backend | Node.js + Express |
| AI / Analysis | Google Gemini API (`@google/genai`) |
| PDF Extraction | `pdf-parse` |
| File Uploads | `multer` (in-memory, no disk storage) |
| Linting | Oxlint |

---

## Project Structure

```
V3/
├── client/                  # React + Vite frontend
│   ├── src/
│   │   ├── components/      # UI components (see below)
│   │   ├── utils/           # sampleData, localStorage helpers
│   │   ├── App.jsx          # Root component & state management
│   │   ├── index.css        # Full design system (tokens, layout, components)
│   │   └── main.jsx         # React entry point
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── server/                  # Express API backend
│   ├── index.js             # Server entry point & routes
│   ├── geminiService.js     # Gemini API integration & prompt logic
│   ├── pdfExtractor.js      # pdf-parse wrapper (page-boundary aware)
│   ├── sampleData.js        # Pre-analyzed sample judgment briefs
│   ├── .env.example         # Environment variable template
│   └── package.json
│
└── docs/                    # Design & planning artifacts
    ├── PRD.md               # Product Requirements Document
    ├── design.md            # UI/UX design decisions
    └── implementation_plan.md
```

### UI Components (`client/src/components/`)

| Component | Purpose |
|---|---|
| `AppHeader` | Top navigation bar with app name and reset action |
| `FileDropzone` | PDF drag-and-drop / file picker with sample shortcuts |
| `LoadingIndicator` | Animated step-by-step processing status |
| `StatusMessage` | Error, warning, and info banners with optional retry |
| `CaseAtAGlance` | Case category card with court metadata |
| `PlainSummary` | Plain-English narrative summary panel |
| `PartiesTable` | Table of parties and their roles |
| `LawsList` | List of Acts/provisions cited, with context |
| `FindingsPanels` | Issues, court reasoning, and operative outcome |
| `EvidenceList` | Verbatim excerpts with page numbers + uncertainty notes |
| `Disclaimer` | Persistent legal disclaimer banner |

---

## Getting Started

### Prerequisites

- **Node.js** v18 or later
- A **Google Gemini API key** from [Google AI Studio](https://aistudio.google.com/)  
  *(The app runs in offline/mock mode without one — great for frontend demos)*

---

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd V3
```

---

### 2. Set up the Backend

```bash
cd server
npm install
```

Copy the environment template and add your API key:

```bash
cp .env.example .env
```

Edit `.env`:

```env
PORT=5000
GEMINI_API_KEY=your_key_here

# Set to true to always return the sample brief (no Gemini call needed)
USE_OFFLINE_MOCK=false
```

Start the server:

```bash
npm start
# → Server listening on http://localhost:5000
```

---

### 3. Set up the Frontend

Open a new terminal:

```bash
cd client
npm install
npm run dev
# → Vite dev server at http://localhost:5173
```

The Vite config proxies `/api/*` requests to the backend at `localhost:5000` automatically.

---

### 4. Using the App

1. Open `http://localhost:5173` in your browser
2. **Upload a PDF** — drag and drop or click to select a text-based English Indian court judgment
3. Click **Analyze** and wait ~5–15 seconds for Gemini to process the document
4. Review your structured **case brief**

> **No PDF handy?** Click one of the sample judgment buttons (criminal or civil) on the upload screen for an instant pre-analyzed demo — no backend required.

---

## API Reference

The backend exposes three endpoints:

### `GET /api/health`
Returns server status.
```json
{ "status": "ok", "service": "CASEDECODER API", "timestamp": "..." }
```

---

### `GET /api/samples/:type`
Returns a pre-analyzed sample brief.  
`:type` is `civil` or `judgment` (criminal).

---

### `POST /api/analyze`
Analyzes an uploaded PDF.

- **Content-Type:** `multipart/form-data`
- **Field name:** `file` — the PDF (max **20 MB**, text-based only)

**Success — `200 OK`** — returns a structured brief JSON object (see schema below).

**Error responses:**

| HTTP | `error` code | Meaning |
|---|---|---|
| `400` | `NO_FILE_UPLOADED` | No file was attached to the request |
| `400` | `INVALID_FILE_TYPE` | Only PDF files are accepted |
| `400` | `FILE_TOO_LARGE` | File exceeds the 20 MB limit |
| `422` | `PDF_PARSE_FAILED` | File is scanned, protected, or damaged |
| `422` | `TEXT_TOO_SHORT` | Not enough extractable text (image-only PDF) |
| `500` | `ANALYSIS_FAILED` | Unexpected server error during analysis |

---

## Brief JSON Schema

The `/api/analyze` and `/api/samples/:type` endpoints return an object with this shape:

```jsonc
{
  "documentMetadata": {
    "filename": "judgment.pdf",
    "totalPages": 42
  },
  "caseCategory": {
    "category": "Criminal Appeal",
    "reason": "Brief explanation of how the category was determined"
  },
  "courtMetadata": {
    "courtName": "Supreme Court of India",
    "caseNumber": "Criminal Appeal No. 123 of 2024",
    "coram": ["Hon'ble Mr. Justice X", "Hon'ble Mr. Justice Y"],
    "dateOfJudgment": "15 January 2025"
  },
  "summary": "Plain-English narrative of the case and what happened...",
  "parties": [
    { "name": "State of Maharashtra", "role": "Appellant" },
    { "name": "Ramesh Kumar", "role": "Respondent / Accused" }
  ],
  "laws": [
    {
      "act": "Indian Penal Code, 1860",
      "sections": ["Section 302", "Section 34"],
      "context": "Charge of murder with common intention"
    }
  ],
  "analysis": {
    "mainIssue": "Whether the conviction under Section 302 IPC was sustainable...",
    "courtReasoning": "The court noted that...",
    "operativeOutcome": "Appeal dismissed. Conviction upheld."
  },
  "evidence": [
    {
      "claim": "Court found the medical evidence conclusive",
      "excerpt": "\"...the post-mortem report clearly establishes...\"",
      "page": 12
    }
  ],
  "uncertainties": [
    "Date of judgment could not be determined from the document."
  ]
}
```

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `5000` | Port for the Express server |
| `GEMINI_API_KEY` | Yes* | — | Google Gemini API key from AI Studio |
| `USE_OFFLINE_MOCK` | No | `false` | `true` → always return sample data, no API call |

\*Without a key, the server will attempt to call Gemini and fail gracefully. Set `USE_OFFLINE_MOCK=true` for a fully offline frontend demo.

---

## Limitations (MVP)

- **Text-based PDFs only.** Scanned / image-only PDFs are not supported — no OCR.
- **English-language documents only.**
- **Indian court documents only** — the Gemini prompt and brief schema are tuned to Indian legal terminology and structure.
- **No user accounts or saved history** — the last brief is cached in `localStorage` for the current browser session only.
- **Not legal advice.** CASEDECODER is a reading-assistance tool; it is not a substitute for a qualified lawyer.

---

## Development Notes

- **Frontend fallback:** If the backend is unreachable, the app shows a helpful notice and prompts the user to load a pre-analyzed sample — no blank crash screen.
- **LocalStorage caching:** The active brief persists across page refreshes via `localStorage`.
- **In-memory uploads:** `multer` uses `memoryStorage()` — no uploaded files are written to disk on the server.
- **Page-boundary tracking:** `pdfExtractor.js` uses `pdf-parse`'s `pagerender` callback to build a character-offset map, allowing the Gemini service to tag evidence excerpts with source page numbers.

---

## License

Created for a hackathon. Not licensed for production or commercial use. All AI-generated briefs must be independently verified against the original court document.

---

*CASEDECODER — Prototype developed for initial Indian court document review. Not legal advice.*

