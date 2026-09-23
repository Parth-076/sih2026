from fastapi import APIRouter, UploadFile, File, HTTPException

from app.models.schemas import BarcodeResponse
from app.services.barcode_decoder import decode_barcodes
from app.utils.image_io import decode_image, InvalidImageError

router = APIRouter()


@router.post("/barcode", response_model=BarcodeResponse)
async def run_barcode_decode(file: UploadFile = File(...)) -> BarcodeResponse:
    raw = await file.read()

    try:
        image = decode_image(raw)
    except InvalidImageError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    try:
        barcodes = decode_barcodes(image)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    return BarcodeResponse(detected=len(barcodes) > 0, barcodes=barcodes)
