from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import health, ocr, barcode

app = FastAPI(
    title="LabelCheck AI/CV Service",
    description=(
        "OCR, bounding-box detection, and barcode decoding for the LabelCheck "
        "Legal Metrology compliance inspector (SIH26-26034)."
    ),
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.allowed_origin],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(ocr.router)
app.include_router(barcode.router)


@app.get("/")
def root():
    return {
        "service": "labelcheck-ai-service",
        "docs": "/docs",
        "endpoints": ["/health", "/ocr", "/barcode"],
    }
