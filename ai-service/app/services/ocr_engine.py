from abc import ABC, abstractmethod
from typing import List, Tuple
import numpy as np

from app.models.schemas import OcrTextBlock, BoundingBox


class OcrEngineUnavailableError(Exception):
    """Raised when the configured OCR engine's library isn't installed, or
    fails to initialize. Callers should surface this as a clear 503-style
    message — never fall back to fabricated OCR output (brief §33)."""


class OcrEngine(ABC):
    name: str

    @abstractmethod
    def is_available(self) -> Tuple[bool, str | None]:
        """Returns (available, error_message)."""

    @abstractmethod
    def run(self, image: np.ndarray) -> List[OcrTextBlock]:
        """Runs OCR on a BGR OpenCV image and returns detected text blocks."""


class PaddleOcrEngine(OcrEngine):
    name = "paddleocr"

    def __init__(self):
        self._ocr = None
        self._init_error: str | None = None

    def _ensure_initialized(self):
        if self._ocr is not None or self._init_error is not None:
            return
        try:
            from paddleocr import PaddleOCR  # lazy import — heavy dependency

            self._ocr = PaddleOCR(use_angle_cls=True, lang="en", show_log=False)
        except Exception as exc:  # noqa: BLE001 — surfaced to the caller, not swallowed
            self._init_error = (
                "PaddleOCR is not installed or failed to load. Install it with "
                "`pip install paddlepaddle paddleocr` (see ai-service/README.md), or set "
                "OCR_ENGINE=tesseract in ai-service/.env to use Tesseract instead. "
                f"Original error: {exc}"
            )

    def is_available(self) -> Tuple[bool, str | None]:
        self._ensure_initialized()
        return (self._ocr is not None, self._init_error)

    def run(self, image: np.ndarray) -> List[OcrTextBlock]:
        self._ensure_initialized()
        if self._ocr is None:
            raise OcrEngineUnavailableError(self._init_error or "PaddleOCR unavailable.")

        raw_result = self._ocr.ocr(image, cls=True)
        blocks: List[OcrTextBlock] = []

        # PaddleOCR returns a list (per image) of [ [box_points], (text, confidence) ].
        for page in raw_result or []:
            for line in page or []:
                box_points, (text, confidence) = line
                xs = [p[0] for p in box_points]
                ys = [p[1] for p in box_points]
                x_min, x_max = int(min(xs)), int(max(xs))
                y_min, y_max = int(min(ys)), int(max(ys))

                blocks.append(
                    OcrTextBlock(
                        text=text,
                        confidence=round(float(confidence), 4),
                        boundingBox=BoundingBox(
                            x=x_min, y=y_min, width=x_max - x_min, height=y_max - y_min
                        ),
                    )
                )
        return blocks


class TesseractOcrEngine(OcrEngine):
    name = "tesseract"

    def __init__(self):
        self._checked = False
        self._available = False
        self._init_error: str | None = None

    def _ensure_checked(self):
        if self._checked:
            return
        self._checked = True
        try:
            import pytesseract  # lazy import

            pytesseract.get_tesseract_version()
            self._available = True
        except Exception as exc:  # noqa: BLE001
            self._init_error = (
                "Tesseract is not installed or not on PATH. Install the Tesseract-OCR binary "
                "(see ai-service/README.md for the Windows installer link) and ensure it's on "
                f"PATH, or set OCR_ENGINE=paddleocr instead. Original error: {exc}"
            )

    def is_available(self) -> Tuple[bool, str | None]:
        self._ensure_checked()
        return (self._available, self._init_error)

    def run(self, image: np.ndarray) -> List[OcrTextBlock]:
        self._ensure_checked()
        if not self._available:
            raise OcrEngineUnavailableError(self._init_error or "Tesseract unavailable.")

        import pytesseract
        from pytesseract import Output
        import cv2

        rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        data = pytesseract.image_to_data(rgb, output_type=Output.DICT)

        blocks: List[OcrTextBlock] = []
        for i in range(len(data["text"])):
            text = data["text"][i].strip()
            conf_raw = data["conf"][i]
            try:
                conf = float(conf_raw)
            except (TypeError, ValueError):
                conf = -1.0

            if not text or conf < 0:
                continue

            blocks.append(
                OcrTextBlock(
                    text=text,
                    confidence=round(min(max(conf / 100.0, 0.0), 1.0), 4),
                    boundingBox=BoundingBox(
                        x=int(data["left"][i]),
                        y=int(data["top"][i]),
                        width=int(data["width"][i]),
                        height=int(data["height"][i]),
                    ),
                )
            )
        return blocks


_ENGINES: dict[str, OcrEngine] = {}


def get_ocr_engine(engine_name: str) -> OcrEngine:
    """Returns a cached engine instance so PaddleOCR's (slow) model load
    only happens once per process, not per request."""
    if engine_name not in _ENGINES:
        if engine_name == "paddleocr":
            _ENGINES[engine_name] = PaddleOcrEngine()
        elif engine_name == "tesseract":
            _ENGINES[engine_name] = TesseractOcrEngine()
        else:
            raise ValueError(f"Unknown OCR_ENGINE '{engine_name}'. Use 'paddleocr' or 'tesseract'.")
    return _ENGINES[engine_name]
