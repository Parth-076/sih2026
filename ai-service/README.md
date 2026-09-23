# LabelCheck AI/CV Service

FastAPI service providing OCR (text + bounding boxes + confidence), image
preprocessing, and barcode decoding for the LabelCheck backend. See the root
`README.md` and `docs/SYSTEM_FLOW.md` for how this fits into the full system.

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | Reports whether the configured OCR engine is actually available |
| POST | `/ocr` | Multipart image upload → `{ fullText, blocks: [{ text, confidence, boundingBox }], engine, imageWidth, imageHeight, processingTimeMs }` |
| POST | `/barcode` | Multipart image upload → `{ detected, barcodes: [{ format, value, boundingBox }] }` |

Interactive API docs are available at `/docs` once the service is running.

## OCR engine choice

Set `OCR_ENGINE` in `ai-service/.env` to `paddleocr` (default) or `tesseract`.
Both are real, working implementations — pick whichever installs more easily
in your environment. If the configured engine's library isn't installed,
`/health` and `/ocr` report that clearly (HTTP 503 with an explanation) —
the service never fabricates OCR results.

- **PaddleOCR** (default): good out-of-the-box accuracy, no separate system
  install beyond the pip packages. First run downloads model weights
  (~10-15MB), which needs internet access once.
- **Tesseract**: lighter Python footprint, but requires installing the
  Tesseract-OCR binary separately and having it on your `PATH`. On Windows,
  use the installer from
  [UB-Mannheim's Tesseract build](https://github.com/UB-Mannheim/tesseract/wiki),
  then set `OCR_ENGINE=tesseract` in `ai-service/.env`.

## Local setup (Windows)

```bat
cd ai-service
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --port 8000
```

(macOS/Linux: `python3 -m venv venv && source venv/bin/activate`, then the
same `pip install` / `uvicorn` commands, `cp` instead of `copy`.)

Visit `http://127.0.0.1:8000/health` — it should report `ocrEngineAvailable:
true`. If not, the `ocrEngineError` field explains what's missing.

## Running tests

```bat
cd ai-service
venv\Scripts\activate
pytest
```

The test suite (`tests/test_health.py`, `tests/test_image_utils.py`) covers
image decoding/validation and the API surface without requiring an OCR
engine to be installed, so `pytest` works even before you've set up
PaddleOCR/Tesseract. OCR-engine-specific behavior is exercised through the
Node backend's integration tests once Phase 6 connects the two services.

## Design notes

- Images are validated with a real OpenCV decode (`cv2.imdecode`), not just
  a header check — corrupt/truncated uploads get a clear 400, never a crash.
- Preprocessing (`app/services/image_preprocessing.py`) resizes to
  `MAX_IMAGE_DIMENSION`, denoises, and applies CLAHE contrast normalization
  on the luminance channel only — deliberately conservative, since aggressive
  binarization tends to hurt real-world package-photo OCR accuracy more than
  it helps.
- Bounding boxes returned by `/ocr` are rescaled back to the *original*
  uploaded image's dimensions (not the resized/preprocessed ones), so the
  frontend can overlay them directly on the image it displays to the user.
- `pyzbar` (barcode decoding) ships Windows wheels with the zbar DLLs
  bundled, so `pip install pyzbar` is enough — no separate system library
  needed, unlike some other zbar bindings.
