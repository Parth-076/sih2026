# LabelCheck

**AI-Assisted Legal Metrology Digital Inspector**

Smart India Hackathon 2026 — Problem Statement **SIH26-26034**
"Software System to Check Compliance of Packaged Commodities under Legal Metrology Rules"
Team: **Innovexa**

> ⚠️ This README is updated as each build phase lands. See `docs/BUILD_LOG.md` for
> phase-by-phase status, and `docs/SYSTEM_FLOW.md` for the authoritative workflow diagram.

## 1. Overview

LabelCheck helps Legal Metrology inspectors and officers check whether packaged
commodities comply with declaration requirements — net quantity, MRP, manufacturer
details, country of origin, dates, consumer care information, and more — by combining
barcode lookup, OCR + computer vision, a configurable rule engine, and an
evidence-first, human-in-the-loop review workflow.

## 2. Architecture

```
React Frontend  →  Node/Express API  →  MongoDB
                          ↓
                 Python FastAPI AI Service
                          ↓
          OCR / Computer Vision / Barcode Processing
```

- **frontend/** — React + TypeScript + Vite + Tailwind + shadcn/ui + Recharts
- **backend/** — Node.js + Express + TypeScript + MongoDB/Mongoose + JWT auth
- **ai-service/** — Python + FastAPI + OpenCV + OCR + barcode decoding
- **uploads/** — package images (shared, gitignored contents)
- **reports/** — generated PDF inspection reports (shared, gitignored contents)

## 3. System Flow

Login → Authentication → Role-Based Access (Inspector / Officer / Admin) → Product
(upload image or scan barcode) → Product Repository lookup → Image Processing →
OCR + Computer Vision → Text + Bounding Boxes → Declaration Extraction & Font/Readability
Analysis → Compliance Rule Engine → Missing / Misleading / Non-Standard findings →
Compliance Result (Compliant / Non-Compliant / Review Required) → Evidence + Report →
Inspection History → Dashboard & Report Access.

Full diagram: `docs/SYSTEM_FLOW.md`.

## 4. Tech Stack

| Layer | Stack |
|---|---|
| Frontend | React, TypeScript, Vite, Tailwind CSS, shadcn/ui, Lucide, Recharts |
| Backend | Node.js, Express, TypeScript, JWT, bcrypt, Mongoose |
| Database | MongoDB |
| AI/CV service | Python, FastAPI, OpenCV, PaddleOCR, barcode decoding |

## 5. Project Structure

```
labelcheck/
├── frontend/        # React app
├── backend/         # Express API
├── ai-service/       # FastAPI OCR/CV service
├── uploads/          # package images
├── reports/          # generated PDF reports
├── docs/             # build log, system flow, API notes
├── package.json       # npm workspaces (frontend + backend)
└── README.md
```

## 6. Local Setup (Windows-friendly)

> Detailed, phase-accurate setup instructions land here as each phase is implemented.
> MongoDB, backend, and frontend instructions are added in Phase 2/3; AI service
> instructions are added in Phase 5.

### Prerequisites
- Node.js 18+
- Python 3.10+ (needed starting Phase 5)
- MongoDB running locally on `mongodb://127.0.0.1:27017`, **or** a MongoDB Atlas
  connection string

### Install
```bash
npm run install:all
```
This installs both `frontend` and `backend` (npm workspaces) in one step.

### Configure environment
```bash
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env
```
(On macOS/Linux use `cp` instead of `copy`.) Edit `backend/.env` and set a real
`JWT_SECRET` (any long random string works for local dev). The defaults otherwise
work out of the box against a local MongoDB.

### Seed demo accounts and demo products
Make sure MongoDB is running, then:
```bash
npm run seed --workspace=backend
```
This seeds the 3 demo accounts and 5 demo products (one per compliance
scenario in brief §32) in one step. Run `npm run seed:users` or
`npm run seed:products` individually if you only need one.

### Run
```bash
npm run dev
```
This starts the backend on **http://localhost:5000** and the frontend on
**http://localhost:5173** together. Open the frontend URL and sign in.

### Run backend tests
```bash
cd backend
npm test
```
Tests spin up an in-memory MongoDB (via `mongodb-memory-server`), so no local
database is needed for `npm test` — only for `npm run dev` / `npm run seed`.

### AI/CV service (Python)
The OCR + barcode-decoding service is independent of the Node/React apps —
see **`ai-service/README.md`** for full setup (including the PaddleOCR vs
Tesseract choice and Windows-specific notes). Quick version:
```bat
cd ai-service
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --port 8000
```
Check `http://127.0.0.1:8000/health` to confirm the OCR engine loaded. The
Node backend calls this service when an inspection is analyzed
(`POST /api/inspections/:id/analyze`, auto-triggered from the inspection
detail page) — run it alongside `npm run dev` for the full OCR flow to work.
If it isn't running, inspections still get created fine; analysis just
returns a clear "AI analysis service unavailable" message with a retry
option instead of extracted text.

## 7. Demo Accounts

Seeded by `npm run seed --workspace=backend` (also selectable via one-click
buttons on the login page):

| Role | Email | Password |
|---|---|---|
| Admin | `admin@example.com` | `Admin@1234` |
| Officer | `officer@example.com` | `Officer@1234` |
| Inspector | `inspector@example.com` | `Inspector@1234` |

## 8. Status

See `docs/BUILD_LOG.md` for what's implemented so far and what's next.

## 9. Important Notes on Legal Content

The compliance rule engine ships with a small set of clearly-labeled **prototype/demo
rules** for demonstration purposes. It is architected so real Legal Metrology rules can
be added or updated later, but this project does not claim to encode complete or
legally authoritative Legal Metrology requirements. See `docs/SYSTEM_FLOW.md` and the
Rules Management page for details.
