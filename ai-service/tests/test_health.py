from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root():
    res = client.get("/")
    assert res.status_code == 200
    assert res.json()["service"] == "labelcheck-ai-service"


def test_health_reports_engine_status():
    res = client.get("/health")
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert "ocrEngine" in body
    assert "ocrEngineAvailable" in body


def test_ocr_rejects_empty_upload():
    res = client.post("/ocr", files={"file": ("empty.png", b"", "image/png")})
    assert res.status_code == 400


def test_ocr_rejects_garbage_bytes():
    res = client.post("/ocr", files={"file": ("fake.png", b"not a real image", "image/png")})
    assert res.status_code == 400


def test_barcode_rejects_garbage_bytes():
    res = client.post("/barcode", files={"file": ("fake.png", b"not a real image", "image/png")})
    assert res.status_code == 400
