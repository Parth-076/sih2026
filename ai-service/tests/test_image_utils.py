import base64
import pytest

from app.utils.image_io import decode_image, InvalidImageError
from app.services.image_preprocessing import resize_to_max_dimension, preprocess_for_ocr

# Smallest possible valid PNG (1x1 transparent pixel).
TINY_PNG = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="
)


def test_decode_valid_image():
    image = decode_image(TINY_PNG)
    assert image is not None
    assert image.shape[0] == 1 and image.shape[1] == 1


def test_decode_rejects_empty_bytes():
    with pytest.raises(InvalidImageError):
        decode_image(b"")


def test_decode_rejects_garbage_bytes():
    with pytest.raises(InvalidImageError):
        decode_image(b"this is not an image")


def test_resize_never_upscales():
    image = decode_image(TINY_PNG)
    resized = resize_to_max_dimension(image, 1600)
    assert resized.shape[0] == image.shape[0]
    assert resized.shape[1] == image.shape[1]


def test_preprocess_runs_without_error():
    image = decode_image(TINY_PNG)
    processed = preprocess_for_ocr(image, 1600)
    assert processed is not None
    assert processed.shape[2] == 3  # still a 3-channel BGR image
