import time

from fastapi import APIRouter, UploadFile, File, HTTPException

from app.config import settings
from app.models.schemas import OcrResponse
from app.services.image_preprocessing import preprocess_for_ocr
from app.services.ocr_engine import get_ocr_engine, OcrEngineUnavailableError
from app.utils.image_io import decode_image, InvalidImageError

router = APIRouter()

MAX_UPLOAD_BYTES = 15 * 1024 * 1024  # generous server-side ceiling; Node enforces the real limit


@router.post("/ocr", response_model=OcrResponse)
async def run_ocr(file: UploadFile = File(...)) -> OcrResponse:
    raw = await file.read()
    if len(raw) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="Image is too large.")

    try:
        image = decode_image(raw)
    except InvalidImageError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    height, width = image.shape[:2]

    processed = preprocess_for_ocr(image, settings.max_image_dimension)
    proc_height, proc_width = processed.shape[:2]

    engine = get_ocr_engine(settings.ocr_engine)
    available, error = engine.is_available()
    if not available:
        # 503, not a fabricated empty/success result — brief §34: the AI
        # service being unavailable is a real, expected failure mode that
        # the Node backend and frontend must handle gracefully, not hide.
        raise HTTPException(status_code=503, detail=error or "OCR engine unavailable.")

    start = time.perf_counter()
    try:
        blocks = engine.run(processed)
    except OcrEngineUnavailableError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    elapsed_ms = int((time.perf_counter() - start) * 1000)

    # Bounding boxes are reported in the *preprocessed* image's coordinate
    # space. If preprocessing resized the image, scale boxes back to the
    # original image's dimensions so the frontend can overlay them on the
    # image it actually displays.
    scale_x = width / proc_width if proc_width else 1.0
    scale_y = height / proc_height if proc_height else 1.0
    if scale_x != 1.0 or scale_y != 1.0:
        for block in blocks:
            block.boundingBox.x = int(block.boundingBox.x * scale_x)
            block.boundingBox.y = int(block.boundingBox.y * scale_y)
            block.boundingBox.width = int(block.boundingBox.width * scale_x)
            block.boundingBox.height = int(block.boundingBox.height * scale_y)

    full_text = "\n".join(b.text for b in blocks)

    return OcrResponse(
        engine=engine.name,
        imageWidth=width,
        imageHeight=height,
        processingTimeMs=elapsed_ms,
        fullText=full_text,
        blocks=blocks,
    )
