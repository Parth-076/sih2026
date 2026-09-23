from fastapi import APIRouter

from app.config import settings
from app.models.schemas import HealthResponse
from app.services.ocr_engine import get_ocr_engine

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    engine = get_ocr_engine(settings.ocr_engine)
    available, error = engine.is_available()
    return HealthResponse(
        ocrEngine=settings.ocr_engine,
        ocrEngineAvailable=available,
        ocrEngineError=error,
    )
