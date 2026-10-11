# CASEDECODER — Design Specification

**Product:** CASEDECODER  
**Purpose:** Turn an English-language Indian court judgment or order into a clear, structured, evidence-backed case brief.  
**Build constraint:** 7-hour hackathon; first-year developers using Google Antigravity and Gemini.  
**Design status:** MVP specification aligned to the approved PRD.

---

## 1. Design goals

1. **Make the important information scannable.** Users should find the case category, parties, laws, main issue, and outcome without reading a wall of text.
2. **Earn trust through evidence.** Clearly separate AI-generated explanations from source quotations and page references.
3. **Respect legal nuance.** Visually distinguish party arguments, court observations/findings, and the final operative outcome.
4. **Be calm, clear, and credible.** Avoid courtroom clichés, excessive gradients, robot imagery, and generic “AI dashboard” styling.
5. **Fit the seven-hour build.** Use one main workflow, a small reusable component set, and no unnecessary routes or complex interactions.

## 2. Product scope and information architecture

Build only the two screens required for the MVP:

1. **Home / Upload** — explain the tool, let the user select a PDF, validate the file, and start analysis.
2. **Case Brief / Results** — display the structured report and evidence, with an easy way to analyze another document.

The upload, processing, and error states can all live on the Home screen. Results are shown on the Case Brief screen. Do not add accounts, a saved-document library, a legal chatbot, a public judgment search, or a separate settings page.

### Global navigation

- **Brand mark:** CASEDECODER; returns to Home.
- **Primary action:** “Analyze a judgment” on Home.
- **Results action:** “Analyze another document” returns to Home and clears the previous result.
- No multi-level navigation or sidebar is needed for the MVP.

## 3. Visual identity

### Brand personality

- **Precise:** information is clearly labelled and easy to verify.
- **Human:** legal language is translated into accessible English without being childish.
- **Grounded:** source evidence is prominent; uncertain details are not disguised.
- **Modern:** editorial typography, clean alignment, restrained color, and generous whitespace.

### Visual concept: “Legal editorial”

Use the visual language of a well-designed research publication: warm paper-like surfaces, deep ink typography, restrained teal accents, and small evidence markers. The product should feel like a focused reading tool, not a law-firm website or an analytics control panel.

Avoid:
- Large purple/blue AI gradients.
- Glassmorphism and excessive shadows.
- Decorative gavels, scales, courthouse columns, or robot illustrations.
- Too many colorful cards or badges.
- Tiny grey legal text.
- Fake precision such as arbitrary AI confidence percentages.

### Logo treatment

Use a typographic wordmark: **CASE** in the main ink color and **DECODER** in the accent color, or keep the whole wordmark ink-colored with a small teal square/bracket motif. A simple text wordmark is enough for the hackathon; do not spend time building a complex logo.

## 4. Color palette

Use CSS variables or the equivalent design tokens so colors remain consistent.

| Token | Hex | Usage |
|---|---|---|
| `ink-900` | `#172421` | Main text, headings, wordmark |
| `ink-700` | `#344640` | Secondary headings and body text |
| `paper-50` | `#F8F7F2` | Main page background |
| `surface-0` | `#FFFFFF` | Cards, upload panel, evidence surfaces |
| `line-200` | `#E2E6E0` | Borders, separators |
| `teal-700` | `#176B5B` | Primary buttons, links, active states |
| `teal-100` | `#DDEFE8` | Soft accent backgrounds |
| `amber-700` | `#8A5A12` | Caution and “Unclear” states |
| `amber-100` | `#FFF0D2` | Caution backgrounds |
| `red-700` | `#A3332B` | Errors and destructive warnings |
| `red-100` | `#FBE8E5` | Error backgrounds |
| `slate-600` | `#586762` | Secondary labels and helper text |

### Color rules

- Use `paper-50` as the overall background and white for primary content surfaces.
- Use teal for primary actions and navigation emphasis, not as decoration everywhere.
- Use amber for “Unclear,” “Needs verification,” or unsupported information.
- Use red only for actual errors or failed actions.
- Never communicate a state by color alone; include text and/or an icon.
- Keep borders subtle and shadows minimal. Most hierarchy should come from spacing, typography, and alignment.

## 5. Typography

Use **Inter** if it is already available in the project; otherwise use the system sans-serif stack. Do not block development to fetch or configure a custom font.

| Style | Suggested size | Weight | Usage |
|---|---:|---:|---|
| Display heading | 40–48 px desktop / 32 px mobile | 650–700 | Home headline |
| Page heading | 30–36 px desktop / 26–30 px mobile | 650–700 | Results title |
| Section heading | 18–22 px | 600–650 | Card and report section headings |
| Body | 16 px | 400–450 | Explanations and summaries |
| Body small | 14 px | 400 | Metadata, supporting descriptions |
| Eyebrow / label | 12–13 px | 600 | Small section labels; use sparingly |
| Evidence quote | 15–16 px | 400 | Source quotations |
| Metadata | 13–14 px | 450 | Case number, court, date |

### Type rules

- Body copy should have a line height of approximately 1.5–1.65.
- Keep paragraph widths comfortable; avoid full-screen lines of text.
- Use sentence case for headings and buttons.
- Avoid long blocks of uppercase text.
- Legal quotations should be readable and visually distinct without looking like fine print.
- Use tabular numerals only if useful for page numbers or case metadata.

## 6. Spacing, layout, and shape

Use a simple 4 px spacing base.

| Token | Value | Common use |
|---|---:|---|
| `space-1` | 4 px | Icon/text gap |
| `space-2` | 8 px | Tight control spacing |
| `space-3` | 12 px | Labels and helper text |
| `space-4` | 16 px | Standard component padding |
| `space-6` | 24 px | Card padding / section gaps |
| `space-8` | 32 px | Major section gaps |
| `space-12` | 48 px | Large page spacing |
| `space-16` | 64 px | Hero spacing on desktop |

- Main content maximum width: **1120 px**.
- Reading column maximum width: **760–800 px**.
- Desktop side padding: **32 px**; tablet: **24 px**; mobile: **16–20 px**.
- Card radius: **12–16 px**.
- Input/button radius: **8–10 px**.
- Use a 1 px border on cards rather than heavy shadows.
- Keep the main content aligned to a consistent grid.
- Use a 12-column grid only if the current framework makes it easy; a simple flex/grid layout is sufficient.

## 7. Page 1 — Home / Upload

### Purpose

Explain CASEDECODER in one glance and make it easy to upload a supported judgment or order. This page must not promise perfect accuracy or imply that the tool gives legal advice.

### Desktop layout

1. **Top navigation** — compact wordmark on the left; a small “How it works” anchor or text link may scroll to the explanation below. Do not add a complex navigation menu.
2. **Hero section** — left-aligned headline and concise supporting copy; upload panel beside it on wide screens.
3. **Upload panel** — primary focus, with drag-and-drop if easy, plus a clear “Choose PDF” button.
4. **What you’ll get** — three compact points: case overview, key parties and laws, outcome with source evidence.
5. **Trust note** — small but readable note: “AI-generated analysis can be wrong. Verify important details against the original document. Not legal advice.”
6. **Footer** — CASEDECODER wordmark and a short prototype disclaimer. No social links or unrelated footer content.

### Suggested exact copy

**Wordmark:** CASEDECODER

**Eyebrow:** INDIAN COURT DOCUMENTS, MADE CLEARER

**Headline:** A long judgment. A clearer first read.

**Supporting text:** Upload an English-language Indian court judgment or order to organize the case type, parties, laws discussed, key issues, and final outcome—where the document makes it clear.

**Primary upload panel heading:** Start with a judgment

**Upload helper text:** Choose a text-based PDF from your device. Scanned/image-only PDFs are not supported in this prototype.

**Primary button:** Choose PDF

**Drop-zone helper:** Or drag and drop a PDF here

**File note:** Use a public judgment for the demo. Do not upload confidential documents.

**Primary submit button after selection:** Analyze document

**Small process explanation:** Extract text → Analyze legal context → Review a structured case brief

**What you’ll get heading:** From dense legal text to a useful first brief

- **Case at a glance** — likely category and available case details.
- **People and provisions** — parties, their roles, and Acts or sections mentioned.
- **Outcome with evidence** — a plain-English explanation with supporting source text where available.

**Trust note:** CASEDECODER helps with initial review; it does not replace the original judgment or professional legal advice.

### Upload panel interactions

- Clicking “Choose PDF” opens the native file picker.
- If drag-and-drop is implemented, dropping a PDF selects it; the file picker must still work.
- Show selected filename, file size if available, a PDF icon, and a “Remove” action.
- “Analyze document” is disabled until a valid file is selected.
- On submit, disable duplicate submissions and display the processing state.
- If the user removes the selected file, return the panel to its initial state.
- Do not show a fake upload percentage if the app cannot measure real progress.

### Home page states

#### Initial / empty state
- Show the drop area with a simple document icon.
- Show “Choose PDF” and drag-and-drop helper text.
- Keep “Analyze document” hidden or disabled until a valid file is selected.
- State supported format and scanned-PDF limitation before the user selects a file.

#### File selected state
- Show the PDF icon, filename, file size if available, and “Remove.”
- Show “Ready to analyze” as status text.
- Enable “Analyze document.”

#### Processing state
- Replace the submit button label with “Analyzing document…”
- Show a subtle spinner and a short step label such as “Extracting text and preparing your case brief.”
- Prevent repeated submissions.
- Do not claim that analysis is complete until the backend returns a valid result.

#### Invalid file state
- Show a clear inline message, e.g. “Please choose a PDF file.”
- For empty, corrupted, password-protected, or unsupported scanned files, explain the issue and how to continue.
- Keep the rest of the page usable so the user can choose another file.

#### Extraction failure state
- Heading: “We couldn’t read this PDF”
- Body: “This file may be scanned, protected, empty, or damaged. Try a text-based PDF judgment.”
- Action: “Choose another PDF”
- Do not show a results screen with invented or partial facts.

#### AI/API failure state
- Heading: “Analysis didn’t finish”
- Body: “The document could not be analyzed right now. Your file has not been turned into a case brief.”
- Action: “Try again”
- Secondary action: “Choose another PDF”
- If retrying the same file is supported, retain the selected file; otherwise explain that the user needs to select it again.

## 8. Page 2 — Case Brief / Results

### Purpose

Present the AI analysis as a structured, readable case brief. Prioritize the likely category, summary, parties, laws, and outcome. Keep evidence close to the claims it supports.

### Overall layout

**Desktop:**
- Header row: wordmark, current document filename, “Analyze another document.”
- Main content width up to 1120 px.
- Main report column approximately 2/3 width.
- Evidence/source column approximately 1/3 width where practical.
- If a side-by-side layout makes the text cramped, use a single wide column with evidence panels directly beneath the relevant section.

**Tablet:**
- Use a single column or a 60/40 split only if both columns remain readable.
- Keep evidence directly after its related finding.

**Mobile:**
- One column.
- Full-width cards and buttons.
- No horizontal scrolling.
- Metadata wraps naturally; long case names and filenames must not break the layout.

### Results header

Display:
- Breadcrumb or small label: “CASE BRIEF”
- Original filename
- Heading: “Your case brief”
- Small status label: “AI-generated · Verify against source”
- Button: “Analyze another document”

Do not display a fabricated processing time, confidence percentage, or “verified” badge.

### Section A — Case at a glance

**Purpose:** Make the category and core context immediately visible.

Show:
- Case category, e.g. “Criminal” or “Civil,” only when supported.
- A brief explanation for the category.
- Court, case number, date, and judge(s) when found.
- For missing data, show “Not found in extracted text.”
- For uncertain classification, show “Unclear” with a short explanation.

**Interaction:** This section is informational. Avoid adding filters, charts, or decorative gauges.

### Section B — Plain-English summary

**Purpose:** Give users a concise first read.

Show:
- A short summary of the dispute and what the document concerns.
- Main legal issue(s) as concise bullets.
- Use everyday English, but preserve important legal distinctions.

**Interaction:** If the summary is long, keep the initial view concise rather than adding a complex expand/collapse system. A simple “Show more” is optional only if easy to implement accessibly.

### Section C — Parties and roles

**Purpose:** Clarify who is involved and what role each party plays.

Show a compact list or two-column table with:
- Party name
- Role, such as petitioner, respondent, appellant, or accused, if explicitly supported
- Short contextual note only when useful and supported by the document

If a role is not clear, show “Role unclear” rather than guessing. Do not infer personal identities beyond the document.

### Section D — Laws and provisions

**Purpose:** Show the legal provisions named in the document and how they are used.

For each item, show:
- Act/statute name
- Section or provision, if present
- Context label:
  - “Mentioned”
  - “Discussed by the court”
  - “Applied / relied on by the court” only where the source supports it
- Brief plain-English explanation only if the model can support it from the document and is instructed not to invent.

Do not imply that every cited law was applied by the court.

### Section E — Arguments, findings, and outcome

This is the most important nuance-sensitive section. Use distinct labelled panels rather than merging everything into one summary.

**Panel 1: Parties’ arguments**
- Identify arguments attributed to each party.
- Use a neutral style; do not present allegations as established facts.

**Panel 2: Court’s reasoning / findings**
- Show the court’s own observations or findings separately from the parties’ claims.

**Panel 3: Final outcome**
- Show the operative outcome or order in a visually prominent but restrained panel.
- If the document does not establish the final outcome, show “Outcome unclear from the available text.”
- If the text appears to describe an interim order, label it as interim where supported.
- Do not make predictions or legal recommendations.

### Section F — Evidence and source excerpts

**Purpose:** Let users check important claims.

For each evidence item, display:
- The finding or field it supports
- A short verbatim quotation from the extracted document
- Source page number, if reliably tracked
- A small label such as “Source excerpt”

**Interaction:**
- If clicking a finding can focus or scroll to its evidence panel, implement this only if straightforward.
- A page number is a reference, not a promise that an in-app PDF viewer exists.
- If the page reference is unavailable, show “Page reference unavailable.”
- If no supporting excerpt is available, show “No supporting excerpt available for this item.” Never invent a quotation.
- A full side-by-side PDF viewer is optional and not required for the MVP.

### Section G — Missing information and uncertainty

Show this section only when relevant, but do not hide important uncertainty.

Examples:
- “The judge’s name was not found in the extracted text.”
- “The document excerpt does not establish the final outcome.”
- “The legal provision is mentioned, but its application is unclear.”

Use an amber-tinted panel with an icon and descriptive text. Avoid a numeric confidence score unless the system has a valid, explainable way to calculate it.

### Results footer / disclaimer

Show a persistent, readable note near the end of the report:

“CASEDECODER is an AI-assisted document organization tool. It may misinterpret legal language or omit details. Verify important findings against the original document. This is not legal advice.”

Provide a final action: **“Analyze another document.”**

## 9. Reusable components

Build a small set of components that can be reused on both pages. Keep component logic simple.

1. **`AppHeader`**
   - CASEDECODER wordmark.
   - Optional current-page label.
   - On results, “Analyze another document” action.

2. **`Button`**
   - Primary, secondary, and text variants.
   - Visible hover, focus, disabled, and loading states.
   - Minimum interactive target around 44 × 44 px where practical.

3. **`FileDropzone`**
   - File selection/drop area, accepted-format helper text, selected-file summary, remove action, and validation message.

4. **`StatusMessage`**
   - Neutral, success, warning, and error variants.
   - Always includes text, not color alone.

5. **`SectionCard`**
   - Consistent border, radius, heading, optional description, and content spacing.
   - Avoid putting every small item in its own card; group related information.

6. **`MetadataList`**
   - Label/value pairs for court, case number, date, and judge(s).
   - Supports “Not found” values without collapsing the layout.

7. **`PartyList`**
   - Party name, role, and optional supported note.

8. **`LawItem`**
   - Act/provision, context label, optional plain-English explanation, and optional source reference.

9. **`FindingPanel`**
   - Separate visual treatment for party arguments, court findings, and final outcome.

10. **`EvidenceQuote`**
    - Verbatim excerpt, page reference when available, and the finding it supports.

11. **`LoadingIndicator`**
    - Small spinner plus human-readable progress text.
    - No fake percentage or unnecessarily elaborate animation.

12. **`Disclaimer`**
    - Standard legal-information disclaimer reused on Home and Results.

## 10. Interaction and feedback rules

- Every button must have a clear, real action.
- Use explicit labels such as “Analyze document,” not vague labels like “Go.”
- Disable actions while a request is in progress if duplicate actions would cause errors.
- Preserve the selected file after a recoverable API error when feasible.
- Show validation errors near the relevant upload control.
- Show global analysis failures in a visible status panel near the top of the upload area.
- Do not clear a valid result until the user chooses to analyze another document.
- Use text labels for states: “Ready to analyze,” “Analyzing,” “Analysis complete,” “Unclear,” and “Not found.”
- Do not show success until the backend returns parseable, validated output.
- If partial analysis is supported, identify what could not be processed; otherwise fail clearly rather than showing a misleadingly complete report.

## 11. Loading, empty, error, and success states

| State | UI behavior | Required copy / guidance |
|---|---|---|
| Initial upload | Empty dropzone and supported-file note | “Choose a text-based PDF” |
| Valid file selected | Filename, PDF icon, remove action | “Ready to analyze” |
| Invalid file type | Inline error, selection remains possible | “Please choose a PDF file.” |
| Processing | Spinner, disabled submit action, status text | “Analyzing document…” |
| Text extraction failed | Error panel, choose-another action | “We couldn’t read this PDF.” |
| Extracted text too short | Warning/error before AI analysis | “We couldn’t extract enough readable text to analyze this document reliably.” |
| Gemini/API failure | Recoverable error panel and retry | “Analysis didn’t finish. Try again.” |
| Malformed AI output | Treat as analysis failure; do not render broken fields | “We couldn’t organize the analysis into a usable case brief. Please try again.” |
| Success | Structured report with source evidence and uncertainty labels | “Your case brief” |
| Missing field | Render labelled unavailable value | “Not found in extracted text.” |
| Unclear outcome | Warning panel in outcome section | “Outcome unclear from the available text.” |
| No evidence mapping | Keep finding but label missing reference | “Page reference unavailable.” |

## 12. Responsive behavior

### Desktop — 1024 px and wider
- Use a centered maximum-width container.
- Home hero and upload panel may sit side by side.
- Results may use a main report column plus evidence column.
- Keep body text around 16 px and maintain generous line length.

### Tablet — 768–1023 px
- Reduce outer margins and card padding.
- Home may become a single column if side-by-side content feels tight.
- Results should prefer one column when evidence text becomes narrow.
- Keep buttons and file controls comfortably tappable.

### Mobile — under 768 px
- Use a single-column layout and 16–20 px side padding.
- Stack hero content and upload panel.
- Make primary actions full width when helpful.
- Wrap filenames and metadata; avoid horizontal scrolling.
- Place evidence directly below the finding it supports.
- Keep the wordmark compact; avoid a hamburger menu when there are no meaningful navigation items.
- Use at least 16 px body text and generous vertical spacing.

### Responsive acceptance checks
- No horizontal overflow at 360 px width.
- File upload works with a touch device as well as desktop.
- Long party names, filenames, and quotations wrap without overlapping controls.
- Results remain understandable when the viewport is narrow.

## 13. Accessibility

- Use semantic headings in order: one `h1` per page, then `h2` section headings.
- Use real `<button>` and file input controls rather than clickable generic containers alone.
- Ensure the file input can be reached and activated with a keyboard.
- Provide a visible focus ring for all interactive controls.
- Label upload controls and associate error messages with the relevant control.
- Announce processing and completion status accessibly, such as with an appropriate live status region.
- Do not rely on color alone for warning, success, or error states.
- Maintain readable contrast; target WCAG AA contrast ratios: 4.5:1 for normal text and 3:1 for large text and meaningful UI boundaries.
- Use descriptive text for icon-only controls; preferably pair icons with visible labels.
- Avoid flashing, rapid motion, and animation that cannot be reduced.
- Respect `prefers-reduced-motion`.
- Keep focus order aligned with the visual reading order.
- Evidence quotations should remain selectable text, not images.
- Do not use font sizes below 12 px; use 14 px or larger for most supporting content.

## 14. Motion and micro-interactions

Use motion sparingly to clarify state changes.

- **Button hover:** Slight background or border change, around 120–160 ms.
- **Dropzone hover/focus:** Border and background change to indicate that a file can be dropped or selected.
- **Processing:** A small spinner with a stable status label; no full-screen animated spectacle.
- **Results appearance:** A subtle fade-in or short upward transition (150–220 ms) after valid analysis returns.
- **Inline error:** Reveal the error message without shaking the entire form.
- **Reduced motion:** Remove nonessential transitions when the user requests reduced motion.

Avoid parallax, animated gradients, bouncing cards, decorative particles, and animations that make the user wait before interacting.

## 15. Content and legal-safety rules

- Never label AI-generated results as legally verified.
- Never present a party’s allegation as a proven fact.
- Keep arguments, court reasoning/findings, and the final order visually separate.
- Mark missing or ambiguous fields as “Not found” or “Unclear.”
- Do not fabricate quotations, source page numbers, case metadata, or legal provisions.
- Distinguish a law merely mentioned from one discussed or applied by the court.
- The final outcome should be visually prominent but only when identifiable from the available text.
- Keep the “not legal advice” disclaimer readable, not hidden in tiny footer text.
- Use public judgments for the hackathon demo and warn users not to upload confidential documents.

## 16. Build priorities for the 7-hour hackathon

### P0 — Must ship
1. Home page and PDF picker.
2. File validation and clear errors.
3. Visible processing state.
4. Results page showing structured Gemini output.
5. Case category, parties, legal provisions, summary, reasoning/findings, and outcome.
6. Explicit missing/unclear states.
7. Evidence excerpts and page references when reliably available.
8. Responsive layout, readable typography, and disclaimer.

### P1 — Add only after P0 works
- Drag-and-drop upload if not already easy.
- Click a finding to move to its evidence panel.
- Simple “Show more” for a long summary.
- Better handling of especially long documents.

### Not in this design scope
- User accounts, saved-document history, or databases.
- A general-purpose legal chatbot.
- A separate PDF viewer or side-by-side viewer.
- OCR for scanned documents.
- Multi-document batch upload.
- Hindi or other language support.
- Charts, analytics, or numeric AI-confidence meters.

## 17. Definition of design done

The design is ready for implementation when:

- A first-time user can understand the purpose from the Home screen without explanation.
- The user can select a supported PDF and understand what happens next.
- Every processing and failure state has clear feedback and a next step.
- The results screen makes category, parties, laws, summary, findings, and outcome easy to scan.
- Arguments, court findings, and final outcome are visually distinct.
- Evidence excerpts and page references appear only when they are grounded in the extracted source.
- Missing information is clearly labelled rather than hidden.
- The app works without horizontal scrolling on a 360 px mobile viewport and is comfortable on a laptop.
- The disclaimer is visible and readable.
- The interface uses a consistent, restrained visual system that the team can implement within the hackathon.

---

**Design principle:** CASEDECODER should feel like a calm, trustworthy reading companion. Make the case easier to understand, make the source easy to check, and never make uncertainty look like certainty.