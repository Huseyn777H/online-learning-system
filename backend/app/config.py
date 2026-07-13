from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings, populated from environment variables / .env file."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    DATABASE_URL: str = "postgresql+psycopg2://ols_user:ols_password@localhost:5432/ols_db"

    REDIS_URL: str = "redis://localhost:6379/0"

    JWT_SECRET: str = "insecure-dev-secret-change-me"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 1440

    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""

    MAX_UPLOAD_MB: int = 20

    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    MEDIA_ROOT: str = "media"


settings = Settings()
