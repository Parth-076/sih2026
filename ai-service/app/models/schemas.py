from typing import List, Optional
from pydantic import BaseModel, Field


class BoundingBox(BaseModel):
    x: int
    y: int
    width: int
    height: int


class OcrTextBlock(BaseModel):
    """One detected line/word of text, matching the shape in brief §10."""

    text: str
    confidence: float = Field(ge=0.0, le=1.0)
    boundingBox: BoundingBox


class OcrResponse(BaseModel):
    success: bool = True
    engine: str
    imageWidth: int
    imageHeight: int
    processingTimeMs: int
    fullText: str
    blocks: List[OcrTextBlock]


class BarcodeResult(BaseModel):
    format: str
    value: str
    boundingBox: Optional[BoundingBox] = None


class BarcodeResponse(BaseModel):
    success: bool = True
    detected: bool
    barcodes: List[BarcodeResult]


class HealthResponse(BaseModel):
    success: bool = True
    service: str = "labelcheck-ai-service"
    ocrEngine: str
    ocrEngineAvailable: bool
    ocrEngineError: Optional[str] = None


class ErrorResponse(BaseModel):
    success: bool = False
    message: str
