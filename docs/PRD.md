# CASEDECODER — Product Requirements Document (PRD)

**Product:** CASEDECODER  
**Product type:** AI-powered Indian court-document analyzer  
**Hackathon build window:** 7 hours  
**Team:** First-year college students using Google Antigravity and Gemini  
**Document status:** MVP scope for hackathon

## 1. Product overview

CASEDECODER turns an English-language Indian court judgment or order into a concise, structured case brief. A user uploads a PDF and receives a likely case category, key parties, laws discussed, a plain-English summary, and the court's final outcome where it can be established from the document.

The product must do more than produce a generic summary: it should distinguish a party's arguments from the court's findings and show supporting text so users can verify important claims.

**MVP boundary:** Prioritize text-based PDFs and one reliable end-to-end workflow. Scanned-document OCR, legal advice, a searchable judgment database, and user accounts are out of scope.

## 2. Target users and pain points

### Primary users
- **Law students and junior lawyers:** Need to understand long judgments quickly and locate the relevant parties, provisions, issues, and decision.
- **Court clerks and legal support staff:** Need a faster first-pass method to classify and organize incoming documents.
- **Everyday citizens:** Need a readable explanation of a court document without being expected to understand dense legal English.

### Exact pain point
Important information is scattered across lengthy documents and expressed in specialized legal language. Manually finding it takes time; simple keyword search cannot reliably tell whether a statement is an allegation, an argument, a court observation, or the final decision.

## 3. Core value proposition

**“Upload an Indian court judgment. Get a clear, structured case brief—with evidence you can check—instead of manually hunting through pages.”**

CASEDECODER supports faster initial review; it does not replace reading the original document, legal expertise, or professional legal advice.

## 4. Primary user journey

1. **Open CASEDECODER:** The landing page explains what the tool does and that results must be verified.
2. **Upload a PDF:** The user selects a text-based English judgment or order. The UI shows the filename and upload/processing status.
3. **Extract and analyze:** The backend extracts text while preserving page boundaries where possible, then sends manageable text to Gemini for structured analysis.
4. **Review the case brief:** A results page displays:
   - Case category and brief reason
   - Court/case metadata when present
   - Parties and their roles
   - Acts and legal provisions, with their context
   - Main issue and concise plain-English summary
   - Court reasoning and final operative outcome, if identifiable
5. **Verify key claims:** The user can see a supporting excerpt and page number for important findings when the source text permits reliable page tracking.
6. **Handle uncertainty:** Missing or unclear information is labelled “Not found” or “Unclear,” never silently guessed. The user can upload another PDF or return to the start.

## 5. Must-have MVP features and acceptance criteria

### M1. PDF upload and basic validation
**Requirement:** Upload a text-based PDF judgment/order.

**Acceptance criteria**
- User can select a PDF from their device.
- Non-PDF or empty uploads produce a clear error message.
- The interface shows the selected filename and a visible processing state.
- The app does not imply success if extraction or analysis fails.

### M2. PDF text extraction
**Requirement:** Extract text from the uploaded document and retain page-level boundaries where feasible.

**Acceptance criteria**
- A suitable text-based sample judgment can be processed end-to-end.
- Empty, corrupted, password-protected, or image-only PDFs produce a helpful limitation/error message.
- The app detects when extracted text is too short to analyze reliably.
- For the 7-hour MVP, image-only PDFs may be explicitly unsupported; do not silently return a fabricated report.

### M3. AI-generated structured case brief
**Requirement:** Use Gemini to return predictable structured data, not an unstructured paragraph alone.

**Required fields**
- Case category: civil, criminal, constitutional, family, service/employment, commercial, tax, or other/unclear
- Court, case number, date, and judge(s), if available
- Parties and roles, if available
- Acts and legal provisions mentioned
- Main legal issue(s)
- Short plain-English summary
- Court reasoning / findings
- Final outcome or operative order, if identifiable
- Missing information and uncertainty notes

**Acceptance criteria**
- The backend requests a consistent JSON schema and validates/parses the response.
- The UI displays all required sections, including an explicit “Not found” or “Unclear” state where appropriate.
- The model is instructed not to invent names, statutes, quotations, or outcomes.
- The result distinguishes party arguments from court findings and the final order.
- API errors, malformed output, and timeouts show a recoverable error state.

### M4. Results dashboard
**Requirement:** Present findings in a readable, organized interface.

**Acceptance criteria**
- Users can identify the case category, parties, laws, summary, and outcome without reading a wall of text.
- Long summaries are broken into labelled sections and concise bullets.
- The UI adapts to a normal laptop browser viewport.
- A clear disclaimer states that AI output can be wrong and is not legal advice.

### M5. Evidence and source traceability
**Requirement:** Provide supporting excerpts and page references for important findings where reliable source mapping is available.

**Acceptance criteria**
- Each displayed evidence item contains a quotation from the extracted source, not newly invented wording.
- Page numbers come from the PDF extraction pipeline, not from the model guessing.
- If reliable page mapping is unavailable for a finding, the UI says the reference is unavailable instead of fabricating one.
- Users can compare the quoted excerpt with the original extracted text or a simple source-text view.

### M6. End-to-end demo reliability
**Requirement:** Deliver one dependable upload-to-results path.

**Acceptance criteria**
- The team can run the app from documented startup steps.
- At least two preselected public judgments are tested before the demo.
- A failed API call or unsupported PDF does not crash the whole interface.
- A pre-tested sample result or screenshot is available as a backup, clearly distinguished from live analysis.

## 6. Optional features — only if the MVP works early

- OCR for scanned/image-only PDFs.
- Download or export the case brief as Markdown/PDF.
- A side-by-side document viewer with clickable page references.
- Search/filter across previously analyzed documents in the current session.
- Multi-document batch processing.
- Support for Hindi or other Indian languages.
- Accounts, persistent document history, or a judgment database.

**Do not start optional features until M1–M6 work on the same sample document.**

## 7. Differentiators for judges

Prioritize these in order; implement only what fits the remaining time.

1. **Argument vs. judgment separation:** Clearly separate what the petitioner/respondent argues from what the court itself observes and orders.
2. **Evidence-backed findings:** Show short source quotations and trustworthy page references for important details.
3. **Legal language translator:** Explain selected legal terms in simple English in the context of the uploaded judgment.
4. **Honest uncertainty:** Mark absent or ambiguous information instead of guessing, especially when the final outcome cannot be established.
5. **Context-aware law extraction:** Separate laws merely mentioned from provisions the court substantively discusses or applies.

The first two are the highest-priority differentiators because they directly address legal-context accuracy and user trust.

## 8. Risks and assumptions

### Risks
- **Incorrect AI extraction or hallucination:** The model may invent details or confuse an allegation with a court finding. Mitigation: strict instructions, structured output, source excerpts, uncertainty states, and manual testing.
- **Long documents exceed model limits:** Mitigation: start with a manageable sample; chunk text if needed and analyze the concluding section separately without ignoring the rest.
- **Page references become inaccurate:** Mitigation: attach page numbers during extraction; never ask the model to invent them.
- **Scanned PDFs have no selectable text:** Mitigation: explicitly support text-based PDFs for the MVP and explain the limitation.
- **API/network failure or rate limits:** Mitigation: test the Gemini key early, show useful errors, and prepare a labelled backup demo.
- **Secret leakage:** Keep API keys in backend environment variables; never place them in frontend code or commit them to Git.
- **Sensitive legal documents:** Use public judgments for the demo. Do not upload confidential documents to an external AI provider without appropriate permission and safeguards.
- **Over-scoping:** Seven hours is too short for a production-grade legal platform. Protect the single end-to-end workflow.

### Assumptions
- Gemini API use is allowed and a working API key/quota is available.
- The team can use Antigravity to generate and modify a simple frontend and backend.
- The initial demo uses English-language, text-based public judgments.
- The judges value a useful, distinctive demonstration over feature count.
- The app is a prototype for information organization, not a source of legal advice.

## 9. Suggested 7-hour build schedule

| Time | Goal |
|---|---|
| 0:00–0:30 | Agree on scope, choose a public sample PDF, define the JSON schema |
| 0:30–1:30 | Prove PDF text extraction and Gemini API call independently |
| 1:30–3:00 | Implement upload endpoint and structured analysis response |
| 3:00–4:30 | Build/connect the upload and results UI |
| 4:30–5:30 | Add argument/finding separation and evidence snippets/page mapping |
| 5:30–6:15 | Test two judgments, fix major failures and edge cases |
| 6:15–7:00 | Polish demo, rehearse pitch, prepare a clearly labelled backup |

If the backend/API proof of concept is not working by the end of hour 2, simplify the input size and schema before adding UI polish.

## 10. Demo scenario

**Scenario:** A junior lawyer receives a long, publicly available Indian court judgment and needs a first-pass understanding.

1. Open CASEDECODER and explain that it organizes a judgment without replacing legal review.
2. Upload the pre-tested PDF.
3. Show the processing state while the system extracts text and calls Gemini.
4. Present the case category, parties, laws/provisions, key issue, and plain-English summary.
5. Highlight the difference between a party's argument and the court's own finding.
6. Open an evidence excerpt and show its source page where supported.
7. Show an “Unclear” or “Not found” state for any detail the document does not establish.
8. Close by explaining the value: less time spent locating basic information, with evidence that lets a human verify important claims.

**Demo success definition:** On a tested public text-based judgment, the application completes upload → extraction → Gemini analysis → structured results without manual editing of the output, and at least the core facts can be checked against the source.

## 11. Out of scope and product guardrails

- No legal advice, prediction of case outcomes, or recommendation about what legal action a person should take.
- No claim that results are guaranteed accurate or suitable for filing in court.
- No fabricated citations, page numbers, parties, or legal provisions.
- No production-grade privacy, access control, audit logging, or legal compliance claims.
- No attempt to cover every Indian court format in the hackathon MVP.

---

**Product principle:** Be useful, verifiable, and honest about uncertainty. A smaller report that can be checked is better than a polished report that confidently gets the law wrong.
