import numpy as np
import cv2


class InvalidImageError(Exception):
    """Raised when uploaded bytes can't be decoded as an image."""


def decode_image(file_bytes: bytes) -> np.ndarray:
    """
    Decodes raw uploaded bytes into a BGR OpenCV image. Raises
    InvalidImageError on corrupt/unsupported data rather than letting a
    downstream call crash with a cryptic error — mirrors the Node backend's
    own corrupt-image check (image-size) but does a real decode here since
    this service needs actual pixel data anyway.
    """
    if not file_bytes:
        raise InvalidImageError("Uploaded file is empty.")

    arr = np.frombuffer(file_bytes, dtype=np.uint8)
    image = cv2.imdecode(arr, cv2.IMREAD_COLOR)

    if image is None or image.size == 0:
        raise InvalidImageError("Could not decode image — the file may be corrupted or unsupported.")

    return image
