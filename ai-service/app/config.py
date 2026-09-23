from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    host: str = "127.0.0.1"
    port: int = 8000
    env: str = "development"

    ocr_engine: str = "paddleocr"  # "paddleocr" or "tesseract"
    max_image_dimension: int = 1600

    allowed_origin: str = "http://localhost:5000"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()
