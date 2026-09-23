from typing import List
import numpy as np

from app.models.schemas import BarcodeResult, BoundingBox


def decode_barcodes(image: np.ndarray) -> List[BarcodeResult]:
    """
    Decodes barcodes/QR codes present in an image using pyzbar (a real
    zbar-backed decoder — not a simulated result). Returns an empty list,
    never an error, when nothing is found: "no barcode detected" is a
    normal outcome the caller handles gracefully (brief §9).
    """
    try:
        from pyzbar.pyzbar import decode
    except Exception as exc:  # noqa: BLE001
        raise RuntimeError(
            "Barcode decoding library (pyzbar) is not installed. Run "
            "`pip install pyzbar` in the ai-service virtual environment."
        ) from exc

    decoded = decode(image)
    results: List[BarcodeResult] = []
    for symbol in decoded:
        rect = symbol.rect
        results.append(
            BarcodeResult(
                format=symbol.type,
                value=symbol.data.decode("utf-8", errors="replace"),
                boundingBox=BoundingBox(
                    x=int(rect.left), y=int(rect.top), width=int(rect.width), height=int(rect.height)
                ),
            )
        )
    return results
