from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_URL: str = "http://localhost:3000"
    DATABASE_URL: str = "sqlite:///./dev.db"

    SIGNUP_ENABLED: bool = True

    JWT_SECRET: str = "dev-secret-key"
    JWT_ALGORITHM: str = "HS256"

    ACCESS_TOKEN_EXPIRATION: int = 60 * 15
    REFRESH_TOKEN_EXPIRATION: int = 60 * 60 * 24 * 7
    EMAIL_TOKEN_EXPIRATION: int = 60 * 60 * 24
    WAITLIST_TOKEN_EXPIRATION: int = 60 * 60 * 24

    # Redis configuration
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    REDIS_PASSWORD: str = ""
    REDIS_PREFIX: str = "koru:"

    # RabbitMQ configuration
    RABBITMQ_HOST: str = "localhost"
    RABBITMQ_PORT: int = 5672
    RABBITMQ_USER: str = "guest"
    RABBITMQ_PASSWORD: str = "guest"
    RABBITMQ_VHOST: str | None = None

    # hCaptcha configuration
    HCAPTCHA_SITEKEY: str = "dev-sitekey"
    HCAPTCHA_SECRET: str = "dev-secret"

    # GoCardless configuration
    GOCARDLESS_SECRET_ID: str = "dev-id"
    GOCARDLESS_SECRET_KEY: str = "dev-key"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
