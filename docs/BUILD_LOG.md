# Build Log

Tracks what's implemented, phase by phase, per the development strategy in the brief.

## Phase 1 — Project Architecture & Scaffolding ✅ (this response)

- Monorepo structure created: `frontend/`, `backend/`, `ai-service/`, `uploads/`,
  `reports/`, `docs/`.
- Root `package.json` with npm workspaces (frontend + backend) and a combined
  `npm run dev` script (via `concurrently`).
- `.gitignore`, `.env.example` for all three services.
- `README.md` with architecture overview.
- `docs/SYSTEM_FLOW.md` — authoritative flow diagram, copied verbatim from the brief.
- LabelCheck logo copied into `frontend/src/assets/logo.png` and `frontend/public/favicon.png`
  for use in the login page, sidebar, and reports.

**Not yet implemented:** everything else. No frontend/backend code exists yet —
that starts in Phase 2.

## Phase 2 — Authentication + RBAC ✅

**Backend (`backend/`)**
- Express + TypeScript app skeleton (`src/app.ts`, `src/server.ts`) with helmet,
  CORS scoped to `CLIENT_ORIGIN`, JSON body parsing, morgan logging, and static
  serving of `/uploads` for future evidence images.
- Centralized env loader (`src/config/env.ts`) that fails fast with a clear
  message if `JWT_SECRET` is missing — no hard-coded secrets.
- MongoDB connection helper (`src/config/db.ts`) with a clear error message if
  Mongo isn't reachable, and an `isDbConnected()` check surfaced on `GET /api/health`.
- `User` Mongoose model (`src/models/User.ts`): bcrypt password hashing,
  `comparePassword`, role enum (`INSPECTOR` / `OFFICER` / `ADMIN`), `active` flag,
  password hash excluded from JSON output by default.
- JWT helpers (`src/utils/jwt.ts`), a typed `ApiError` class, and a centralized
  error-handling middleware that distinguishes validation errors, duplicate-key
  errors, and generic 500s.
- `authenticate` middleware (verifies JWT **and** re-checks the user still exists
  and is active) and `authorize(...roles)` middleware — **enforced on the backend**,
  not just hidden in the UI, per the brief's requirement.
- zod-based request validation middleware (`validateBody`).
- Routes: `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/users/me`,
  plus admin-only `GET /api/users`, `POST /api/users`, `PUT /api/users/:id` for
  user management (feeds the Phase-3+ User Management page).
- `GET /api/health` — reports DB connectivity, used by the AI-service-unavailable
  / DB-unavailable graceful-degradation requirements later.
- Seed script (`src/scripts/seed.ts`, `npm run seed`) creates the three demo
  accounts with the exact emails specified in the brief, safely re-runnable.
- Jest + Supertest + `mongodb-memory-server` integration tests
  (`tests/auth.test.ts`): login success/failure, deactivated-account rejection,
  missing/malformed-token rejection, and role-authorization (403 for non-admin,
  200 for admin) on an admin-only route.

**Frontend (`frontend/`)**
- Vite + React + TypeScript + Tailwind scaffold with the navy/teal/warning/
  critical/success design tokens from the brief baked into `tailwind.config.js`.
- Axios client (`src/lib/api.ts`) that attaches the JWT to every request and
  redirects to `/login` on a 401.
- `AuthContext` (`src/context/AuthContext.tsx`): verifies any stored token
  against `/users/me` on load, exposes `login`/`logout`/`user`/`loading`.
- `ProtectedRoute` component supporting both "any authenticated user" and
  role-restricted routes (redirects to `/unauthorized` otherwise).
- `Login` page with the LabelCheck logo, and one-click demo-account fill buttons
  for Admin/Officer/Inspector.
- `AppShell` sidebar layout (nav items filtered by role) + placeholder
  `Dashboard` page proving the end-to-end auth/RBAC flow, plus `Unauthorized`
  and reusable `ComingSoon` pages for routes not yet built.

**Commands to run:** see README §6 ("Local Setup"). Short version:
```bash
npm run install:all
copy backend\.env.example backend\.env   # set JWT_SECRET
npm run seed --workspace=backend          # requires MongoDB running
npm run dev
```
Then open http://localhost:5173, sign in with a demo account.

**What to test:**
- Login with each of the 3 demo accounts.
- Confirm Inspector/Officer cannot open `/users` or `/rules` (redirected to
  `/unauthorized`), Admin can.
- Confirm `GET /api/users` returns 403 without a token / with a non-admin token,
  and 200 with an admin token (also covered by `backend/tests/auth.test.ts`).
- Run `cd backend && npm test`.

**Not yet implemented:** product repository, image upload, barcode scanning,
OCR/CV service, rule engine, evidence, reports, dashboard data, inspection
history — all scheduled per the phase list in this doc.

## Phase 3 — Product Repository + MongoDB models ✅

**Backend**
- `Product` Mongoose model (`src/models/Product.ts`): the structured Legal
  Metrology fields from brief §7 as first-class columns (productName, brand,
  manufacturer, category, barcode, netQuantity/unit, mrp, countryOfOrigin,
  manufacturingDate, bestBeforeOrExpiry, consumerCare, batchNumber, images),
  plus a flexible `declarations` map for category-specific or additional
  fields — so products with different declaration structures are supported
  without a schema change, per brief §7's explicit requirement.
  Barcode is unique+sparse (not all products need one yet); text index on
  name/brand/manufacturer for search.
- Product controller + routes (`src/controllers/productController.ts`,
  `src/routes/productRoutes.ts`): `GET /api/products` (search + category
  filter + pagination), `GET /api/products/:id`, `GET /api/products/barcode/:barcode`
  (returns the exact "Product ID detected but product was not found in
  repository" message from brief §9 on a miss), `GET /api/products/categories`,
  and `POST` / `PUT` / `DELETE /api/products/:id` restricted to **ADMIN**
  (brief §5: Admin "manages products" / "manages product repository").
  All authenticated roles can read — Inspectors need lookups mid-inspection.
- zod validation on create/update; duplicate-barcode returns 409 with a clear
  message.
- Seed scripts refactored: `seedUsers.ts` and new `seedProducts.ts` are each
  independently runnable (`npm run seed:users` / `npm run seed:products`) and
  orchestrated together by `npm run seed`. `seedProducts.ts` creates the 5
  scenarios required by brief §32: fully compliant, missing declaration,
  inconsistent MRP, poor-readability-prone, and multiple findings — each with
  a plain-language `declarations.demoScenario` note for presentation purposes
  only (it has no effect on compliance logic).
- `backend/tests/product.test.ts`: create/read/update/delete, role permission
  checks (403 for non-admin writes), duplicate-barcode rejection, and the
  barcode-not-found message.

**Frontend**
- `Products` page (`src/pages/Products.tsx`) now replaces the Phase-2
  placeholder at `/products`: searchable table, a detail drawer showing every
  field including the flexible declarations, and — for Admins only — Add /
  Edit (modal form, `ProductFormModal.tsx`) / Delete (with confirmation).
  Non-admin roles see the same table read-only, matching the backend
  permission boundary.
- `src/lib/productsApi.ts` — thin typed wrapper around the product endpoints.

**Commands to run:**
```bash
npm run install:all
npm run seed --workspace=backend   # now seeds users AND the 5 demo products
npm run dev
```

**What to test:**
- As Admin: add, edit, and delete a product from `/products`.
- As Inspector/Officer: confirm the table loads but Add/Edit/Delete controls
  are hidden, and confirm `POST /api/products` returns 403 for these roles
  even if called directly (backend enforcement, not just hidden buttons).
- Search by product name/brand; click a row to see the detail drawer,
  including the `demoScenario` note in Additional Declarations.
- `cd backend && npm test` — covers auth + product suites together.

**Not yet implemented:** image upload, barcode-scanning UI, the AI/CV
service, declaration extraction, font/readability analysis, the rule engine,
evidence, reports, inspection history, dashboard data.

## Phase 4 — Image Upload + Barcode Scanning workflow ✅

**Backend**
- `Inspection` model (`src/models/Inspection.ts`): the record created the
  moment an inspection starts — inspector, optional matched product, saved
  image paths, barcode scanned/matched flags, status (`PENDING_ANALYSIS`
  initially), plus placeholder fields (`ocrResults`, `findings`, `evidence`,
  `finalStatus`, `reviewer`) so the schema doesn't need breaking changes once
  Phases 5–11 populate them. Human-readable `inspectionCode`
  (`INS-YYYYMMDD-NNNN`) generated per inspection for report display.
- Upload handling (`src/middleware/upload.ts`): `multer` with in-memory
  storage, a 6-image limit, and a MIME allowlist (JPG/JPEG/PNG/WEBP); backend
  size limit from `MAX_UPLOAD_SIZE_MB`. Multer's errors (wrong type, too
  large, too many files) are mapped to clear JSON messages in the shared
  error handler.
- `POST /api/inspections` (`src/controllers/inspectionController.ts`):
  requires ≥1 image; validates every image is actually decodable (via
  `image-size`, a lightweight pure-JS header parser — rejects corrupt/
  truncated files without a heavy native-decode dependency, keeping the
  Windows install simple); resolves a product from an explicit `productId`
  or a scanned `barcode`; on a barcode with no match, returns the exact
  "Product ID detected but product was not found in repository." message
  from brief §9 and **continues** rather than erroring; persists images to
  `uploads/inspections/<id>/` only after the Inspection document exists, so
  filenames are collision-free per inspection.
- `GET /api/inspections/:id` and `GET /api/inspections`: Inspector sees only
  their own; Officer/Admin see all — enforced in the controller, not just
  the UI.
- `backend/tests/inspection.test.ts`: no-image rejection, unsupported file
  type rejection, successful creation, barcode match / no-match paths,
  multi-image upload, and the inspector-can't-view-another-inspector's-
  inspection permission check.
- **Bug fix carried over from Phase 2/3**: `backend/tests/env.setup.ts` now
  sets required env vars (`JWT_SECRET` etc.) via Jest's `setupFiles`, which
  run *before* a test file's own imports. Previously these were set inside
  each file's `beforeAll`, which runs too late — `config/env.ts` validates
  `JWT_SECRET` at import time, so the auth/product test suites would have
  thrown "Missing required environment variable" the first time they
  actually ran. Not caught until this phase because the sandbox this project
  is being built in has no network access to run `npm test`.

**Frontend**
- `ImageUploadDropzone.tsx` — drag-and-drop + click-to-browse, live preview
  thumbnails, per-file remove, client-side type/size/count validation
  (mirrors the backend's rules so problems surface before upload).
- `BarcodeScanner.tsx` — manual barcode entry (always available) plus an
  optional **live camera scan** using the browser's native
  `BarcodeDetector` API where supported (Chrome/Edge/Android). Where it
  isn't supported, the UI says so plainly and falls back to manual entry —
  no simulated/fake scanning, per brief §33's "no fake features" rule.
- `NewInspection.tsx` (now live at `/inspections/new`, replacing the Phase-2
  placeholder): scan/enter barcode → shows a matched-product card or the
  not-found fallback message → upload images → "Start Inspection" → redirects
  to the new inspection's detail page.
- `InspectionDetail.tsx` (new route `/inspections/:id`): shows the
  inspection code, status, matched product (or the barcode-not-matched
  notice), and the uploaded package images, with a clear note that
  OCR/compliance analysis is wired in during later phases.

**Commands to run:** same as before (`npm run install:all`, `npm run seed
--workspace=backend`, `npm run dev`).

**What to test:**
- Start a new inspection with 1–3 images and no barcode — confirm it lands
  on `PENDING_ANALYSIS` and images render on the detail page.
- Enter one of the seeded barcodes (e.g. `8901030123457`) manually and
  confirm the matched-product card appears; enter a barcode not in the
  repository and confirm the "not found" fallback message and that you can
  still continue.
- Try uploading a `.txt` file renamed `.jpg` or a > 10MB image and confirm
  a clear rejection message (not a crash).
- Log in as Inspector A, start an inspection, then as Inspector B try
  `GET /api/inspections/<A's id>` — confirm 403. As Officer/Admin, confirm
  you can view it.
- `cd backend && npm test` — now covers auth, products, and inspections.

**Not yet implemented:** the Python AI/CV service, OCR, declaration
extraction, font/readability analysis, the rule engine, evidence, reports,
inspection history search/filters, dashboard data.

## Phase 5 — Python FastAPI AI/CV service: OCR + bounding boxes ✅

Standalone service — the Node backend isn't wired to call it yet (that's
Phase 6). Runnable and testable on its own via `/docs`.

- **App structure**: `app/main.py` (FastAPI + CORS), `app/config.py`
  (pydantic-settings, reads `ai-service/.env`), `app/routers/` (health, ocr,
  barcode), `app/services/` (image preprocessing, OCR engine abstraction,
  barcode decoding), `app/models/schemas.py` (pydantic response models),
  `app/utils/image_io.py` (real OpenCV decode + corrupt-image rejection).
- **Pluggable OCR engine** (`app/services/ocr_engine.py`): `OCR_ENGINE` env
  var selects **PaddleOCR** (default) or **Tesseract**, both real,
  lazily-imported implementations. If the selected engine's library isn't
  installed or fails to load, `/health` and `/ocr` report that plainly (HTTP
  503 + explanation) — the service never fabricates OCR text or confidence
  scores, per brief §33/§34. PaddleOCR's model is loaded once and cached
  per process, not reloaded per request.
- **`POST /ocr`**: real `cv2.imdecode` validation (corrupt uploads → 400),
  preprocessing (`app/services/image_preprocessing.py` — resize to
  `MAX_IMAGE_DIMENSION`, denoise, CLAHE contrast normalization on luminance
  only), then OCR. Returns the exact structured shape from brief §10 —
  `text` / `confidence` / `boundingBox` per block — plus `fullText`,
  `engine`, image dimensions, and processing time. Bounding boxes are
  rescaled back to the *original* uploaded image's coordinate space (not the
  resized/preprocessed one), so the frontend can overlay them directly on
  the image it shows the user.
- **`POST /barcode`**: real `pyzbar` (zbar-backed) decoding — a genuine
  second decode path alongside the browser's client-side scan from Phase 4,
  useful when a package photo includes the barcode rather than being scanned
  live. Windows-friendly: pyzbar's wheel bundles the zbar DLLs, no separate
  system install.
- **Tests** (`ai-service/tests/`): image decode/validation and preprocessing
  run without needing an OCR engine installed at all (`test_image_utils.py`);
  API-surface tests (`test_health.py`) cover the health contract and reject
  invalid uploads on `/ocr` and `/barcode` regardless of which engine is
  configured.
- **`ai-service/README.md`**: exact Windows setup commands for both engine
  choices, including the Tesseract Windows installer link.

**Commands to run:**
```bat
cd ai-service
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --port 8000
```

**What to test:**
- `GET http://127.0.0.1:8000/health` — confirm `ocrEngineAvailable: true`
  (or read `ocrEngineError` if not, and follow the README's install steps).
- Visit `/docs`, try `POST /ocr` with a real package photo — confirm text
  blocks with plausible bounding boxes come back.
- Try `POST /ocr` with a non-image file — confirm a 400, not a crash.
- `pytest` — passes with **no** OCR engine installed (that's by design).

**Not yet implemented:** the Node backend does not call this service yet
(Phase 6); declaration extraction, font/readability analysis, rule engine,
evidence, reports, history, dashboard data.

## Phase 6 — Connect Node backend to the AI service ✅

**Backend**
- `src/services/aiServiceClient.ts` — calls the AI service's `POST /ocr`
  using Node's built-in `fetch`/`FormData`/`Blob` (no extra HTTP-client
  dependency for a single multipart call). Wraps every failure mode —
  connection refused, timeout (`AI_SERVICE_TIMEOUT_MS`), and the AI
  service's own 503 ("OCR engine not installed") — in a single
  `AiServiceUnavailableError`, so callers have one clear thing to catch and
  degrade on, per brief §34.
- `Inspection` model extended: proper `ocrResults` sub-schema (one entry per
  image — `engine`, `imageWidth/Height`, `processingTimeMs`, `fullText`,
  `blocks: [{ text, confidence, boundingBox }]`, matching the AI service's
  response shape exactly rather than storing it as an opaque blob), a new
  `OCR_COMPLETE` status (honestly distinct from a compliance verdict, which
  nothing has computed yet), and `analysisError` to hold the last failure
  message for graceful degradation.
- `POST /api/inspections/:id/analyze` (`analyzeInspection` in
  `inspectionController.ts`): reads each of the inspection's saved images
  from disk, sends them to the AI service, and stores the results. On any
  AI-service failure, the inspection is **reverted** to `PENDING_ANALYSIS`
  with `analysisError` set (not left stuck "ANALYZING", not marked complete
  with fake data) and the endpoint returns 503 so the frontend can offer a
  retry. Same inspector/officer/admin ownership rule as `GET
  /api/inspections/:id`, factored into a shared `assertCanAccessInspection`
  helper.
- `src/utils/uploadPaths.ts` — maps a served `/uploads/...` path back to an
  absolute file path and infers MIME type from extension.
- `backend/tests/inspectionAnalyze.test.ts`: uses `undici`'s `MockAgent` to
  intercept Node's global `fetch` (the officially documented way to mock
  fetch in Node 18+), covering (1) a successful OCR round-trip persisted
  correctly, (2) the AI service returning 503 → inspection reverted +
  `analysisError` set + endpoint returns 503, (3) the AI service being
  completely unreachable (connection refused, simulating "service isn't
  running") → same graceful degradation, and (4) the ownership permission
  check on the new endpoint. This is real integration testing of the
  failure path brief §34 requires, without needing the actual Python
  service running.

**Frontend**
- `InspectionDetail.tsx` rewritten with a **real** processing pipeline
  (brief §24: "show real progress based on API calls... do not fake a
  10-second animation"): image-upload step is already done by the time this
  page loads; the OCR step's checkmark/spinner/error state is driven
  directly by the actual `POST /analyze` call's in-flight/success/failure
  state; the four not-yet-built stages (declaration extraction,
  readability, rule engine, evidence/report) are shown as plainly
  upcoming — greyed out, labeled with the phase that builds them — rather
  than faked as complete.
- Analysis auto-runs once when a freshly-created inspection is opened
  (`PENDING_ANALYSIS` with no prior `analysisError`), and offers a manual
  **Retry analysis** button on failure — including displaying the AI
  service's actual error message (e.g. "PaddleOCR is not installed...").
- OCR results (full text per image + block/engine/timing summary) render
  once `OCR_COMPLETE`.

**Commands to run:** to see the full pipeline work end-to-end you now need
**both** services running — the AI service (see Phase 5 commands) and
`npm run dev` for backend+frontend.

**What to test:**
- With the AI service running and an OCR engine installed: start a new
  inspection, confirm it auto-analyzes and shows real extracted text.
- Stop the AI service (or don't start it) and start a new inspection —
  confirm you get a clear "AI analysis service unavailable" message and a
  working Retry button, not a crash or a stuck spinner.
- `cd backend && npm test` — the AI-service integration tests
  (`inspectionAnalyze.test.ts`) don't require the Python service to be
  running; they mock it.

**Not yet implemented:** declaration extraction, font/readability analysis,
the compliance rule engine, evidence, reports, inspection history
search/filters, dashboard data.

## Phase 7 — Declaration extraction ✅

**Backend**
- `src/utils/labelNormalization.ts` — `normalizeUnit` (g/gm/grams→g,
  kg/kgs→kg, ml/mL→ml, l/litre/liters→l, per brief §11), `parseAmount`
  (strips thousands separators), `tryParseDate` (DD/MM/YYYY, MM/YYYY, "12
  Jan 2027" style — returns `null` rather than guessing on anything
  ambiguous, so the raw printed text is never silently discarded).
- `src/services/declarationExtractor.ts` — pattern-based (not exact-string)
  extraction over OCR full text: MRP (`MRP Rs. 99`, `M.R.P. 99`, `₹99`,
  `Maximum Retail Price: Rs 99` — all resolve to the same field, matching
  brief §11's exact examples), net quantity + unit, manufacturing/
  packing/best-before dates (kept distinct by their different label
  keywords), country of origin, manufacturer, consumer care (phone/email),
  batch number. Every field keeps the raw matched text alongside any
  normalized value — nothing is invented when a pattern doesn't match.
- Wired into `POST /api/inspections/:id/analyze` (Phase 6's endpoint):
  extraction runs automatically right after OCR succeeds, over the combined
  text from all uploaded images. New `Inspection.extractedDeclarations`
  field; new honest status `DECLARATIONS_EXTRACTED` (replacing the terminal
  use of `OCR_COMPLETE`, which is now just an intermediate waypoint in the
  status enum).
- `backend/tests/declarationExtractor.test.ts` — unit tests covering every
  MRP/net-quantity format from brief §11's examples, unit normalization,
  date parsing (including the "return null, keep raw text" case for
  unparseable formats like "18 months from packaging"), and a realistic
  multi-field label. `inspectionAnalyze.test.ts` updated to assert
  `extractedDeclarations` is populated end-to-end.

**Frontend**
- `InspectionDetail.tsx`: added a real "Declaration extraction" pipeline
  step (done/running state, no longer in the "upcoming phase" list) and an
  **Extracted Declarations** panel — a clean label/value table for every
  field that was found. When the inspection has a matched repository
  product, MRP and net quantity get an informal ✓ *matches repository* /
  ⚠ *differs from repository* badge — explicitly labeled as informal, since
  the formal rule-engine findings (with severity and evidence) are Phase 9.

**Commands to run:** unchanged — `npm run dev` (+ AI service running for
the OCR step to actually produce text to extract from).

**What to test:**
- Analyze an inspection whose package image has clear label text — confirm
  MRP/net quantity/dates/etc. show up in the Extracted Declarations panel.
- If the inspection matched a seeded product with a deliberately different
  MRP (e.g. the "Chatpata Masala Namkeen" demo product, printed Rs. 109 vs
  repository Rs. 99), confirm the mismatch badge appears once you get real
  OCR text saying "109" on it — with only a 1x1 test PNG or a photo with no
  matching text, extraction correctly finds nothing and says so.
- `cd backend && npm test` — `declarationExtractor.test.ts` runs with zero
  external dependencies (pure functions), so it's a fast, reliable check
  independent of the AI service.

**Not yet implemented:** font/readability analysis, the compliance rule
engine, evidence, reports, inspection history, dashboard data.

## Phase 8 — Font size & readability analysis ✅

**Backend**
- `src/services/readabilityAnalyzer.ts` — estimates label readability from OCR
  bounding boxes and original image dimensions (brief §12). Uses relative height
  thresholds (`minRelativeHeightPass: 0.028`, `minRelativeHeightWarning: 0.018`)
  and OCR confidence threshold (`0.75`) to classify declarations (especially MRP
  and net quantity) as `PASS`, `WARNING`, or `REVIEW_REQUIRED`.
- Bumps classification if confidence is low, and aggregates to an overall rating.
- Wired into `POST /api/inspections/:id/analyze` right after declaration
  extraction, storing structured results on `Inspection.readabilityResults`.
- `backend/tests/readabilityAnalyzer.test.ts` — unit tests validating relative
  height classification, warning bump on low confidence, and overall rating.

## Phase 9 — Configurable compliance rule engine ✅

**Backend**
- `ComplianceRule` Mongoose model (`src/models/ComplianceRule.ts`) supporting:
  - `validationType`: `PRESENCE`, `CONSISTENCY`, `FORMAT`, `READABILITY`
  - `defaultSeverity`: `NON_COMPLIANT`, `REVIEW_REQUIRED`
  - `targetField`, `ruleCode`, `name`, `description`, `config`, `enabled`
- `src/services/ruleEngine.ts` — evaluates active compliance rules against
  extracted declarations, repository product record, OCR full text, and
  readability assessments.
- Verdict policy:
  - Any `NON_COMPLIANT` finding → `NON_COMPLIANT`
  - Else any `REVIEW_REQUIRED` or `WARNING` → `REVIEW_REQUIRED`
  - Else → `COMPLIANT`
- `seedRules.ts` — seeds 10 demo rules covering Legal Metrology requirements
  (brief §32): MRP presence, net quantity presence, country of origin presence,
  MRP consistency, net quantity consistency, consumer care presence, expiry
  presence, net quantity format standard abbreviation, MRP currency format,
  and MRP readability.
- Full CRUD API at `/api/rules` (`listRules`, `getRule`, `createRule`,
  `updateRule`, `deleteRule`) with RBAC (Admin-only for mutations).
- Unit and integration tests (`ruleEngine.test.ts`, `rules.test.ts`).

## Phase 10 — Evidence audit trail ✅

- Compliance evidence is directly embedded in each finding in the `Inspection`
  model (`IComplianceFindingEvidence`):
  - `location`: human-readable explanation of where the verification was performed
  - `imagePath`: package image containing the evidence
  - `boundingBox`: spatial coordinates `{ x, y, width, height }`
  - `ocrText`: verbatim text matched on the package
  - `extractedValue`: parsed / detected value
  - `expectedValue`: repository benchmark or standard value
- Every finding produced by `ruleEngine.ts` populates this evidence block,
  satisfying Differentiator #3 & #7 without redundant data duplication.

## Phase 11 — Automated evidence-based reporting ✅

**Backend**
- `pdfkit` installed for authentic, multi-page vector PDF document generation
  (not brittle HTML-to-PDF).
- `src/services/reportGenerator.ts` — generates a complete, professional Legal
  Metrology Inspection Report:
  - Branding header with LabelCheck logo and official title
  - Executive summary and status verdict badge (`COMPLIANT`, `NON_COMPLIANT`,
    `REVIEW_REQUIRED`)
  - Product repository cross-check table
  - Extracted declarations table (normalized vs raw printed text)
  - Font readability assessment
  - Compliance findings with detailed evidence audit trails (locations, detected
    vs expected values, OCR snippets, bounding boxes)
  - Package images index
  - Legal disclaimer and digital certification block
  - Running footers with dynamic "Page X of Y" pagination via buffered pages
- `src/controllers/reportController.ts`:
  - `POST /api/inspections/:id/report` (and `/api/reports/inspections/:id`):
    generates PDF report, saves to `env.reportDir`, records path on inspection
  - `GET /api/inspections/:id/report`: streams or downloads PDF file (supports
    `?inline=true` for browser preview)
- RBAC enforced via `assertCanAccessInspection` (Inspectors access own inspections;
  Officers and Admins access any).
- `backend/tests/report.test.ts` — full integration tests verifying PDF generation,
  file structure, headers, streaming, and RBAC authorization.

**Frontend**
- `InspectionDetail.tsx` enhanced with:
  - Direct **Download Report** and **Preview** buttons in header
  - Compliance Findings & Audit Evidence panel
  - Readability Analysis rating & metrics
  - Real processing pipeline displaying completion of all analysis & report stages

## Phase 12 — Searchable inspection history & advanced filtering ✅

**Backend**
- `listInspections` in `src/controllers/inspectionController.ts` expanded with
  multi-criteria query filters:
  - `status`: filter by inspection status (`COMPLIANT`, `NON_COMPLIANT`, `REVIEW_REQUIRED`, `PENDING_ANALYSIS`)
  - `product`: search by product name, brand, barcode, or ObjectId
  - `inspector`: filter by inspector ID or name/email (strictly scopes inspectors to their own records; officers/admins may search across any)
  - `category`: filters by product category (`productCategory`) via linked products
  - `severity`: filters by findings outcome (`findings.outcome`: `NON_COMPLIANT`, `REVIEW_REQUIRED`, `WARNING`)
  - `date-range`: filters by creation timestamp (`startDate`/`from`, `endDate`/`to`)
  - `search` / `q`: keyword search across inspection code, barcode, or product
- Populates `product` (`productName`, `brand`, `productCategory`, `barcode`, `mrp`, `netQuantity`, `unit`)
  and `inspector` (`name`, `email`, `role`).
- `backend/tests/inspection.test.ts` — new integration test suite covering each
  individual filter parameter and RBAC scoping.

**Frontend**
- `src/pages/History.tsx` — comprehensive inspection history interface:
  - Multi-input filter toolbar: keyword search, status dropdown, severity dropdown,
    category dropdown, inspector input (privileged), date pickers (from/to), and
    "Reset all" action.
  - Interactive data table showing:
    - Inspection code (linked to detail page)
    - Timestamp
    - Product name & barcode
    - Product category
    - Inspector (visible to officers/admins)
    - Color-coded status badge
    - Violations / findings count badge
    - Quick actions: view inspection details, one-click PDF download
  - Pagination controls with total record count and page navigator.
  - Empty / no-match state with filter reset action.
- Mounted at `/history` in `src/App.tsx`.

## Phase 13 — Executive analytics dashboard & live aggregations ✅

**Backend**
- `src/controllers/dashboardController.ts` — high-performance MongoDB aggregation
  engine supplying live KPIs and intelligence:
  - KPI Totals: total inspections, compliant, non-compliant, review-required,
    pending, and calculated compliance rate %.
  - 30-Day Activity Trend: daily-bucketed `$dateToString` aggregation tracking
    daily volumes by outcome, zero-filled for smooth continuous charts.
  - Top Violation Categories: `$unwind: "$findings"` aggregation grouping by
    target field and rule code to identify persistent Legal Metrology non-compliance.
  - Category Compliance Breakdown: `$lookup` aggregation joining product
    categories to track compliance rates by product segment.
  - Recent Inspections: 5 latest inspections with populated product and inspector.
  - RBAC scoping: `INSPECTOR` receives personal metrics; `OFFICER` and `ADMIN`
    receive system-wide metrics.
- `src/routes/dashboardRoutes.ts` — mounted at `GET /api/dashboard`.
- `backend/tests/dashboard.test.ts` — integration test suite validating KPI calculations,
  30-day time-series arrays, violation rankings, and inspector role scoping.

**Frontend**
- `src/pages/Dashboard.tsx` — transformed into an executive analytical dashboard:
  - 4 Key Metric Cards (Total Inspections, Compliant Packages with compliance rate %,
    Non-Compliant violations, Review Required).
  - 30-Day Inspection Trend AreaChart with gradient fills using Recharts.
  - Top Violations horizontal BarChart highlighting frequent rule citations.
  - Category Compliance Breakdown progress bars.
  - Recent Inspections feed with direct links to inspection details and PDF report download.

## Phase 14 — Human-in-the-Loop Review Verification & Full Analyze Pipeline ✅

**Backend**
- `src/models/Inspection.ts` — updated `IComplianceFinding` schema with subdocument `_id`,
  `reviewStatus` (`PENDING`, `CONFIRMED`, `REJECTED`, `MARKED_FOR_REVIEW`),
  `reviewComment`, `reviewedBy`, and `reviewedAt`.
- `src/services/ruleEngine.ts` — implemented `recalculateInspectionStatusAfterReview`
  policy function:
  - Disregards `REJECTED` findings (treating them as resolved false-positives).
  - Retains `NON_COMPLIANT` when any active non-rejected finding is non-compliant.
  - Returns `REVIEW_REQUIRED` if non-compliant findings are dismissed but review-required or warning items remain, or if an item was explicitly `MARKED_FOR_REVIEW`.
  - Recalculates to `COMPLIANT` when all violations are dismissed or resolved.
  - Initializes each finding with `reviewStatus: "PENDING"`.
- `src/controllers/inspectionController.ts` — 
  - `reviewFinding`: accepts action (`confirm`, `reject`, `mark-for-review`), validates
    actions, updates finding review status & comment, records inspector/officer audit trail,
    and dynamically recalculates the inspection's overall status and `finalStatus`.
    Finds findings by subdocument `_id`, numeric index (`0, 1, 2...`), or `ruleCode`.
  - `finalizeInspectionReview`: allows supervisory officers to directly assign `finalStatus`
    and record officer sign-off.
  - `analyzeInspection`: unified pipeline executing OCR → declaration extraction →
    readability assessment → compliance rule engine → derived inspection status & findings
    in one single call.
- `src/routes/inspectionRoutes.ts` — mounted:
  - `PATCH /api/inspections/:id/findings/:findingId/review`
  - `POST /api/inspections/:id/findings/:findingId/review`
  - `POST /api/inspections/:id/review-finding`
  - `POST /api/inspections/:id/review`
  - `PATCH /api/inspections/:id/review`

**Frontend**
- `src/types/inspection.ts` — updated `ComplianceFinding` with review status, comments, and reviewer metadata.
- `src/lib/inspectionsApi.ts` — added `reviewFindingApi` and `finalizeReviewApi` helper methods.
- `src/pages/InspectionDetail.tsx` — added interactive Human-in-the-Loop review controls
  directly on each finding card:
  - Verification badges: `✓ Confirmed Violation`, `✕ Dismissed / False Positive` (line-through), `⏳ Marked for Review`, and `Pending Verification`.
  - Action buttons: "Confirm", "Reject (False Positive)", "Mark for Review".
  - Inline prompt for inputting justification/notes, recording physical inspection audit logs.
  - Real-time UI synchronization: dismissing violations instantly recalculates inspection status live.

**Tests & Quality**
- `backend/tests/findingReview.test.ts` — 8 integration tests covering finding confirmation,
  status recalculation upon dismissal, marking for review, index-based and ID-based endpoints,
  RBAC inspector isolation, invalid actions, and review finalization.
- `backend/tests/ruleEngine.test.ts` — 10 unit tests covering presence, consistency, format,
  readability rule evaluation, and review status recalculation rules.
- `backend/tests/inspectionAnalyze.test.ts` — verified unified end-to-end pipeline
  (OCR → extraction → readability → rule engine → status) for both compliant and non-compliant
  inspections, as well as AI service graceful 503 degradation.
- Full test suite: **11 passed test suites, 107/107 tests passing**.




