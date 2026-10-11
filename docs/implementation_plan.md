# CASEDECODER — Implementation Plan

**Product:** CASEDECODER  
**Product Type:** AI-Powered Indian Court Document Analyzer  
**Constraint:** 7-hour hackathon build window  
**Team Profile:** First-year college developers using Google Antigravity & Gemini  
**Document Status:** Ready for execution (No code written yet)

---

## 1. Architecture Overview & Stack Selection

In strict alignment with the approved PRD and Design specifications, we choose the simplest possible, beginner-friendly architecture:

- **Frontend:** React 18 + Vite (JavaScript) with vanilla CSS (CSS custom property design tokens matching the "Legal Editorial" theme).
- **Backend / API proxy:** Lightweight Express.js (Node.js) server running locally on port 5000 (or Vite proxy).
  - *Why needed:* The Gemini API key must **never** be exposed in the frontend bundle. Additionally, extracting text from PDFs and preserving page numbers requires a reliable server-side PDF parsing library (`pdf-parse`).
  - No database or authentication (Supabase is explicitly avoided because persistence beyond the session/localStorage is out of scope).
- **Persistence:** Browser `localStorage` holds the active/latest case brief result so page refreshes don't lose the analyzed output.
- **AI Engine:** Google Gemini API (`@google/genai` or standard SDK via backend) using `gemini-2.5-flash` with structured JSON output schema.

```
┌────────────────────────────────────────────────────────┐
│                   React + Vite (Frontend)              │
│   • Home / Upload View (FileDropzone, validation)      │
│   • Case Brief View (Scannable Cards, Evidence panel)  │
│   • localStorage (caches last analyzed brief)          │
└───────────────────────────┬────────────────────────────┘
                            │ HTTP POST /api/analyze (multipart/form-data)
                            ▼
┌────────────────────────────────────────────────────────┐
│               Node.js + Express (Backend)              │
│   • Multer (in-memory file upload buffer)              │
│   • pdf-parse (per-page text extraction & boundary)    │
│   • Gemini API client (system prompt + JSON schema)    │
│   • Fallback mock / sample response provider           │
└───────────────────────────┬────────────────────────────┘
                            │ GEMINI_API_KEY (Server env only)
                            ▼
┌────────────────────────────────────────────────────────┐
│                   Google Gemini API                    │
│   • Returns structured JSON with citations & excerpts  │
└────────────────────────────────────────────────────────┘
```

---

## 2. Setup Steps & Dependencies

### Prerequisites
- Node.js (v18.x or v20.x LTS)
- npm (v9+)
- A Gemini API Key from Google AI Studio

### Step-by-Step Setup Commands

#### 2.1 Backend Setup (`server/`)
```bash
# From workspace root:
mkdir server
cd server
npm init -y
npm install express cors dotenv multer pdf-parse @google/genai
```
*Dependencies:*
- `express`: Minimal HTTP server framework.
- `cors`: Enable frontend-to-backend requests during local dev.
- `dotenv`: Load `GEMINI_API_KEY` and `PORT` securely.
- `multer`: Memory-based file uploads (no disk clutter).
- `pdf-parse`: Robust, fast PDF text extractor supporting page boundaries.
- `@google/genai`: Official Google GenAI SDK.

#### 2.2 Frontend Setup (`client/`)
```bash
# From workspace root:
npm create vite@latest client -- --template react
cd client
npm install
```
*Dependencies:*
- Vanilla React (`react`, `react-dom`)
- Zero heavy UI frameworks, no Tailwind overhead, pure CSS custom properties.

#### 2.3 Root Scripts Setup (`package.json` at root)
To run both simultaneously with zero confusion:
```json
{
  "name": "casedecoder",
  "version": "1.0.0",
  "scripts": {
    "server": "node server/index.js",
    "client": "npm --prefix client run dev",
    "dev": "concurrently \"npm run server\" \"npm run client\""
  },
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}
```

---

## 3. Minimal File and Folder Structure

```
casedecoder/
├── .gitignore
├── package.json                   # Root orchestrator scripts
├── server/
│   ├── .env.example               # Template for backend secrets
│   ├── .env                       # Ignored in git (contains GEMINI_API_KEY)
│   ├── index.js                   # Express server entry point & /api/analyze route
│   ├── pdfExtractor.js            # Page-aware text extraction using pdf-parse
│   ├── geminiService.js           # Gemini prompt, schema validation & call
│   └── sampleData.js              # High-fidelity backup mock for tested public judgment
├── client/
│   ├── index.html                 # HTML shell, loads Inter font & title
│   ├── vite.config.js             # Vite configuration with proxy to port 5000
│   └── src/
│       ├── main.jsx               # React DOM entry
│       ├── App.jsx                # Top-level state machine (HOME | PROCESSING | RESULTS | ERROR)
│       ├── index.css              # Design tokens (ink-900, paper-50, teal-700) & base typography
│       ├── components/
│       │   ├── AppHeader.jsx      # Wordmark & "Analyze another document" action
│       │   ├── FileDropzone.jsx   # Drag-and-drop / file selector with size/type validation
│       │   ├── LoadingIndicator.jsx # Clean spinner + step-based progress text
│       │   ├── StatusMessage.jsx  # Reusable alert box (error, warning, amber uncertainty)
│       │   ├── CaseAtAGlance.jsx  # Category badge, court, case no, date, judges
│       │   ├── PlainSummary.jsx   # Dispute overview & concise bulleted legal issues
│       │   ├── PartiesTable.jsx   # Party name, role, and supported notes
│       │   ├── LawsList.jsx       # Acts/sections with context (Mentioned / Discussed / Applied)
│       │   ├── FindingsPanels.jsx # Distinct panels: Arguments vs Court Findings vs Outcome
│       │   ├── EvidenceList.jsx   # Verbatim excerpts with source page badge & verification note
│       │   └── Disclaimer.jsx     # Persistent legal information disclaimer
│       └── utils/
│           └── storage.js         # localStorage helpers for active case brief caching
└── docs/
    ├── PRD.md
    ├── design.md
    ├── TEAM_CONTRACT.md
    └── implementation_plan.md
```

---

## 4. Component Responsibilities & State Management

### 4.1 Frontend State Machine (in `App.jsx`)
State is kept minimal without Redux or Context:
- `currentView`: `'home'` | `'results'`
- `file`: `File | null` (selected file object)
- `processingState`: `{ isProcessing: boolean, stepText: string }`
- `error`: `{ title: string, message: string, retryable: boolean } | null`
- `briefData`: `CaseBriefData | null` (loaded from API or `localStorage`)

### 4.2 Component Breakdown
1. **`AppHeader`**: Shows the typographic wordmark `CASE` + `DECODER`. Displays current filename and "Analyze another document" button when on `'results'` view.
2. **`FileDropzone`**:
   - Handles drag-and-drop and native `<input type="file" accept=".pdf" />`.
   - Client-side validation: must be `.pdf`, size must be between 1 KB and 20 MB.
   - Shows selected filename, size in KB/MB, remove button.
   - Emits `onAnalyze(file)`.
3. **`LoadingIndicator`**:
   - Gentle CSS spinner.
   - Rotating status messages: *"Extracting text and page boundaries..."* → *"Analyzing legal context and arguments with Gemini..."* → *"Preparing your structured case brief..."*
4. **`CaseAtAGlance`**:
   - Prominent case category chip (`Civil`, `Criminal`, `Constitutional`, etc.) with reason.
   - Grid of metadata items: Court, Case Number, Date, Judge(s). Missing items display explicit *"Not found in extracted text"*.
5. **`PlainSummary`**:
   - Plain-English overview paragraph.
   - Bulleted list of core legal issues.
6. **`PartiesTable`**:
   - Distinct list of parties, mapped roles (`Petitioner`, `Respondent`, `Appellant`, etc.), and supporting context. If role is ambiguous: *"Role unclear"*.
7. **`LawsList`**:
   - List of Acts and sections.
   - Explicit tag: `Mentioned` (gray), `Discussed by court` (teal-light), or `Applied / relied on` (teal-dark).
8. **`FindingsPanels`**:
   - **Panel 1: Parties' Arguments** (neutral tone, clearly separated).
   - **Panel 2: Court's Reasoning & Observations**.
   - **Panel 3: Final Operative Order / Outcome** (visually distinct container; if unresolved, labelled *"Outcome unclear from available text"*).
9. **`EvidenceList`**:
   - Verbatim quotations extracted from source.
   - Source page tag (e.g., `Page 4`).
   - Tag indicating which finding or section it supports.
10. **`Disclaimer`**:
    - Persistent banner: *"CASEDECODER is an AI-assisted document organization tool. It may misinterpret legal language or omit details. Verify important findings against the original document. This is not legal advice."*

---

## 5. Data Models & API Interfaces

### 5.1 Endpoint: `POST /api/analyze`
- **Request:** `multipart/form-data` with field `file` (the uploaded PDF).
- **Backend Flow:**
  1. Validate file mime type and buffer size.
  2. Parse PDF with `pdfExtractor.js` into per-page text objects:
     ```javascript
     {
       totalPages: 8,
       pages: [
         { pageNumber: 1, text: "IN THE HIGH COURT OF DELHI..." },
         { pageNumber: 2, text: "..." }
       ],
       fullText: "..."
     }
     ```
  3. Pre-flight check: If `fullText.trim().length < 200`, return HTTP 422: *"We couldn't extract enough readable text to analyze this document reliably. It may be scanned or empty."*
  4. Send formatted prompt to Gemini API with strict JSON schema.
  5. Validate that all quotes in the model's evidence array actually exist in the extracted text. If page mapping is missing, assign the correct page number based on the extracted text page lookup.
  6. Return validated JSON response.

### 5.2 Structured Case Brief JSON Schema (`CaseBriefData`)
```json
{
  "documentMetadata": {
    "filename": "judgment_sample.pdf",
    "totalPages": 6
  },
  "caseCategory": {
    "category": "Criminal",
    "reason": "Appeals against conviction under Section 302 of Indian Penal Code."
  },
  "courtMetadata": {
    "courtName": "Supreme Court of India",
    "caseNumber": "Criminal Appeal No. 1234 of 2021",
    "dateOfJudgment": "14 October 2022",
    "judges": ["Justice D.Y. Chandrachud", "Justice Hima Kohli"]
  },
  "parties": [
    {
      "name": "State of Maharashtra",
      "role": "Respondent",
      "notes": "Represented by Standing Counsel"
    },
    {
      "name": "Ramesh Kumar",
      "role": "Appellant",
      "notes": "Convicted accused challenging High Court order"
    }
  ],
  "laws": [
    {
      "act": "Indian Penal Code, 1860",
      "section": "Section 302",
      "context": "Discussed by the court",
      "explanation": "Pertains to punishment for murder; examination of circumstantial evidence."
    }
  ],
  "summary": {
    "plainEnglish": "This appeal challenges the conviction of the appellant for murder based entirely on circumstantial evidence. The Supreme Court evaluated whether the chain of circumstances was complete.",
    "coreIssues": [
      "Whether the recovery of the weapon was proven beyond reasonable doubt.",
      "Whether circumstantial evidence alone was sufficient to uphold the conviction."
    ]
  },
  "analysis": {
    "partyArguments": [
      {
        "party": "Appellant",
        "argument": "Argued that the chain of circumstantial evidence was broken and recovery was tainted."
      },
      {
        "party": "Respondent",
        "argument": "Argued that the last seen theory was established by prosecution witnesses."
      }
    ],
    "courtReasoning": [
      "The court observed that witness statements contained material contradictions regarding the time of arrest.",
      "The chain of circumstantial evidence failed to exclude every other hypothesis except the guilt of the accused."
    ],
    "finalOutcome": {
      "status": "Decided",
      "order": "Appeal allowed. Conviction set aside; appellant ordered to be released forthwith.",
      "isInterim": false
    }
  },
  "evidence": [
    {
      "supportsFinding": "Acquittal due to incomplete circumstantial chain",
      "quote": "Unless the circumstances from which an inference of guilt is drawn are cogently established, the conviction cannot stand.",
      "pageNumber": 5
    }
  ],
  "uncertainties": [
    "FIR registration time was not specified in the extracted text."
  ]
}
```

---

## 6. Implementation Sequence & Testable Checkpoints

To ensure the 7-hour build succeeds, we enforce **strict checkpoint gates**. No developer moves to styling or polish until Checkpoint 2 passes.

| Phase | Duration | Checkpoint Goal | Acceptance Test |
|---|---|---|---|
| **Phase 1: Foundation & Backend Core** | Hours 0:00–1:30 | PDF text extraction & Gemini API call verified | Run a CLI script `node server/testExtract.js sample.pdf` that logs extracted pages and Gemini's parsed JSON output. |
| **Phase 2: API Route & Mock Fallback** | Hours 1:30–2:30 | Working `/api/analyze` endpoint with sample fallback | Post `sample.pdf` via Postman/cURL to `http://localhost:5000/api/analyze` and verify HTTP 200 with schema-compliant JSON. Also verify offline fallback mode. |
| **Phase 3: Frontend Shell & Upload State** | Hours 2:30–4:00 | Complete Home/Upload flow with live processing states | User selects a PDF in browser, clicks "Analyze document", sees real status transitions (Extracting → Analyzing), handles invalid non-PDF errors gracefully. |
| **Phase 4: Case Brief Results Rendering** | Hours 4:00–5:15 | Structured Case Brief rendering with "Legal Editorial" CSS | All 7 sections (Category, Metadata, Parties, Laws, Findings, Evidence, Uncertainties) render cleanly with exact design tokens. |
| **Phase 5: Evidence Linking & Honest Uncertainty** | Hours 5:15–6:00 | Verbatim quote verification and explicit "Not found" labels | Test with 2 real judgments; verify arguments are clearly partitioned from court findings, page numbers match source, and missing fields show "Not found". |
| **Phase 6: Demo Rehearsal & Backup Guardrails** | Hours 6:00–7:00 | End-to-end rehearsal + backup offline demo switch | App runs from cold start in <60 seconds. Pre-tested public judgment works live; backup sample data toggle ready if API rate-limits. |

---

## 7. Teammate Division of Responsibilities

Assuming a 3-person hackathon team (Teammate A, Teammate B, Teammate C):

| Teammate | Focus Area | Allowed Files to Modify | Primary Responsibilities |
|---|---|---|---|
| **Teammate A (Backend & AI Lead)** | Node.js Backend & Gemini API | `server/*`, `.env.example`, `package.json` (root) | 1. Implement `pdfExtractor.js` with page boundary tracking.<br>2. Build `geminiService.js` with structured JSON schema prompt.<br>3. Build Express `/api/analyze` route with file validation.<br>4. Provide pre-tested fallback mock in `sampleData.js`. |
| **Teammate B (Frontend Architecture & Logic)** | React App State & Upload Flow | `client/src/App.jsx`, `client/src/components/FileDropzone.jsx`, `client/src/components/LoadingIndicator.jsx`, `client/src/utils/*`, `client/vite.config.js` | 1. Build Vite setup & API proxy configuration.<br>2. Implement upload state machine (Idle, Selected, Processing, Error, Results).<br>3. Connect `POST /api/analyze` and handle errors cleanly.<br>4. Implement `localStorage` caching and "Analyze another document" reset. |
| **Teammate C (UI/UX & Results Dashboard)** | Design System & Case Brief Components | `client/src/index.css`, `client/src/components/AppHeader.jsx`, `CaseAtAGlance.jsx`, `PlainSummary.jsx`, `PartiesTable.jsx`, `LawsList.jsx`, `FindingsPanels.jsx`, `EvidenceList.jsx`, `Disclaimer.jsx` | 1. Implement design tokens (`ink-900`, `paper-50`, `teal-700`, `amber-100`) in `index.css`.<br>2. Build scannable report cards for the 7 sections.<br>3. Visually distinguish Arguments vs Findings vs Final Outcome.<br>4. Ensure responsive typography and no horizontal scroll on mobile/laptop. |

*Conflict prevention rule:* Teammate A works solely in `server/`, Teammates B and C work in `client/src/` on separated files. Integration happens at the defined `CaseBriefData` interface contract.

---

## 8. Environment Variables & Secret Handling

### Backend Variables (`server/.env`)
```ini
# Gemini API Key obtained from Google AI Studio
GEMINI_API_KEY=AIzaSy...

# Server port (default 5000)
PORT=5000

# Optional demo mode toggle (true = serves pre-analyzed sample for offline pitch)
USE_OFFLINE_MOCK=false
```

### Strict Security Rules
1. **Never commit `.env`:** `.gitignore` must explicitly include `.env`, `node_modules`, and any test PDF uploads.
2. Provide `server/.env.example` with blank keys in the repository.
3. **No Frontend API Keys:** The frontend must never import or expose `VITE_GEMINI_API_KEY`. All Gemini interactions are proxied through Express.
4. **Public judgments only:** Use non-confidential public judgments (e.g., Supreme Court of India open judgments) for all testing and hackathon judging.

---

## 9. Error Handling, Testing & Deployment Steps

### 9.1 Error Handling Matrix
- **Non-PDF or empty file uploaded:** Frontend rejects immediately before network call with *"Please choose a valid PDF file."*
- **Scanned or image-only PDF (No selectable text):** Backend detects `fullText.length < 200` and returns HTTP 422 with *"We couldn't extract enough readable text to analyze this document reliably. Scanned/image-only PDFs are not supported in this prototype."*
- **Gemini API Rate Limit / Quota Exceeded (HTTP 429) or Network Failure:** Backend catches error and returns a clean error payload. Frontend displays *"Analysis didn't finish. The AI service is currently busy. Try again in a moment or test with our sample demo judgment."*
- **Malformed AI JSON Response:** Backend schema validator catches parse failures and retries once, or fails safely without returning broken UI fields.

### 9.2 Testing Steps (Before Demo)
1. **Positive Test Case 1:** Upload Public Judgment 1 (e.g., a 4-page High Court bail order). Confirm category, parties, laws, arguments vs findings, and evidence quotes render with page numbers.
2. **Positive Test Case 2:** Upload Public Judgment 2 (e.g., a 6-page Supreme Court appeal judgment). Confirm operative order and court findings render correctly.
3. **Negative Test Case 1:** Upload an image-only scanned PDF. Confirm polite rejection message without crashing.
4. **Negative Test Case 2:** Upload a plain `.txt` or corrupted file. Confirm validation error.
5. **Cold Start Test:** Stop all servers, run `npm run dev`, and verify entire app loads in under 5 seconds.

### 9.3 Deployment Steps (If time permits) or Local Presentation
- **Primary Hackathon Mode (Local):** Run `npm run dev` (Vite on `http://localhost:5173`, Express on `http://localhost:5000`). This is 100% reliable and immune to cloud deployment cold-start lag.
- **Backup Cloud Deployment (Optional, Hour 6:30):**
  - Backend: Render / Railway / Google Cloud Run (deploy `server/` with `GEMINI_API_KEY`).
  - Frontend: Vercel / Netlify (deploy `client/` with Vite proxy directed to backend URL).

---

## 10. Cut List: Features to Postpone if Time Runs Short

If at Hour 4 or 5 the team is running behind schedule:

1. **POSTPONE IMMEDIATELY:**
   - Drag-and-drop file upload (native file picker `<input type="file">` is 100% sufficient).
   - "Click to scroll to evidence quote" smooth scrolling interaction.
   - Expand/collapse "Show more" toggles on summaries (render concise summaries directly).
   - Any multi-page PDF rendering library or canvas preview.
2. **NEVER POSTPONE (Non-Negotiable Core Value):**
   - Distinction between Parties' Arguments vs Court Findings vs Final Outcome.
   - Grounded verbatim evidence excerpts with page numbers.
   - Explicit "Not found in extracted text" and "Unclear" uncertainty badges.
   - Legal disclaimer banner.
   - Offline fallback sample data for emergency pitch backup.

---

## 11. Identified Uncertainties & Mitigations

1. **Gemini Token Limits on Large Judgments:**
   - *Uncertainty:* Indian judgments can span 50–100+ pages. Sending 100 pages will hit token quotas or latency limits.
   - *Mitigation:* For the MVP hackathon scope, enforce a maximum page processing limit in `pdfExtractor.js` (e.g., first 12 pages + last 3 pages where the operative order resides, or limit uploaded file to ~15 pages) and clearly state this boundary in the upload helper text.
2. **Verbatim Quote Mismatch:**
   - *Uncertainty:* Large language models occasionally paraphrase quotes slightly instead of copying verbatim.
   - *Mitigation:* The prompt explicitly commands: *"Quotes must be exact substring excerpts from the text provided."* In backend validation, we perform a substring match; if slightly misaligned, we preserve the quote but mark page mapping using the best matching page.
3. **Model Hallucination of Case Outcomes:**
   - *Uncertainty:* The model might guess an outcome if the document is an interim order or notice.
   - *Mitigation:* Strict system instructions: *"If the text does not contain a final decision or is an interim order, set finalOutcome.order to 'Outcome unclear from available text' or note it as interim. Do not invent an outcome."*
