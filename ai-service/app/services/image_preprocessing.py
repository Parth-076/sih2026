import cv2
import numpy as np


def resize_to_max_dimension(image: np.ndarray, max_dimension: int) -> np.ndarray:
    """Downscales an oversized image so OCR runs in reasonable time and the
    two services don't shuttle unnecessarily large payloads (brief §35 —
    performance / not sending huge images between services). Never upscales.
    """
    height, width = image.shape[:2]
    longest_side = max(height, width)
    if longest_side <= max_dimension:
        return image

    scale = max_dimension / float(longest_side)
    new_size = (int(width * scale), int(height * scale))
    return cv2.resize(image, new_size, interpolation=cv2.INTER_AREA)


def preprocess_for_ocr(image: np.ndarray, max_dimension: int) -> np.ndarray:
    """
    A practical baseline preprocessing pipeline: resize, denoise, and
    normalize contrast. This is intentionally conservative — aggressive
    binarization can hurt PaddleOCR/Tesseract accuracy on real package
    photos more than it helps, so we stop short of hard thresholding.
    """
    resized = resize_to_max_dimension(image, max_dimension)
    height, width = resized.shape[:2]

    # Guard against pathologically small images (e.g. test fixtures, corrupt
    # crops) where denoising/CLAHE tile sizes would otherwise error out.
    if height < 8 or width < 8:
        return resized

    denoised = cv2.fastNlMeansDenoisingColored(resized, None, h=6, hColor=6, templateWindowSize=7, searchWindowSize=21)

    # CLAHE (adaptive histogram equalization) on the luminance channel only,
    # so we improve contrast without distorting color-dependent downstream
    # steps and without over-brightening already well-lit labels.
    lab = cv2.cvtColor(denoised, cv2.COLOR_BGR2LAB)
    l_channel, a_channel, b_channel = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    l_channel = clahe.apply(l_channel)
    normalized = cv2.merge((l_channel, a_channel, b_channel))
    normalized = cv2.cvtColor(normalized, cv2.COLOR_LAB2BGR)

    return normalized
