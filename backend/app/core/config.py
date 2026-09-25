import os

from dotenv import load_dotenv


load_dotenv()


class Settings:
    APP_NAME: str = os.getenv(
        "APP_NAME",
        "RAG Knowledge Assistant API",
    )

    APP_VERSION: str = os.getenv(
        "APP_VERSION",
        "1.0.0",
    )

    ENVIRONMENT: str = os.getenv(
        "ENVIRONMENT",
        "development",
    ).lower()

    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "",
    )

    JWT_SECRET_KEY: str = os.getenv(
        "JWT_SECRET_KEY",
        "",
    )

    JWT_ALGORITHM: str = os.getenv(
        "JWT_ALGORITHM",
        "HS256",
    )

    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
        os.getenv(
            "JWT_ACCESS_TOKEN_EXPIRE_MINUTES",
            "60",
        )
    )

    GEMINI_API_KEY: str = os.getenv(
        "GEMINI_API_KEY",
        "",
    )

    FRONTEND_URL: str = os.getenv(
        "FRONTEND_URL",
        "http://localhost:5173",
    ).rstrip("/")

    CORS_ORIGINS: str = os.getenv(
        "CORS_ORIGINS",
        "",
    )

    AUTO_CREATE_TABLES: bool = os.getenv(
        "AUTO_CREATE_TABLES",
        "true",
    ).lower() in {
        "1",
        "true",
        "yes",
        "on",
    }

    @property
    def allowed_origins(self) -> list[str]:
        origins = []

        if self.FRONTEND_URL:
            origins.append(self.FRONTEND_URL)

        if self.CORS_ORIGINS:
            origins.extend(
                origin.strip().rstrip("/")
                for origin in self.CORS_ORIGINS.split(",")
                if origin.strip()
            )

        # Remove duplicates while preserving order.
        return list(dict.fromkeys(origins))

    def validate(self) -> None:
        if not self.DATABASE_URL:
            raise ValueError(
                "DATABASE_URL is not configured in the .env file."
            )

        if not self.JWT_SECRET_KEY:
            raise ValueError(
                "JWT_SECRET_KEY is not configured in the .env file."
            )

        if self.JWT_ALGORITHM not in {
            "HS256",
            "HS384",
            "HS512",
        }:
            raise ValueError(
                "JWT_ALGORITHM must be HS256, HS384, or HS512."
            )

        if (
            self.JWT_ACCESS_TOKEN_EXPIRE_MINUTES <= 0
        ):
            raise ValueError(
                "JWT_ACCESS_TOKEN_EXPIRE_MINUTES must be greater than 0."
            )

        if not self.FRONTEND_URL:
            raise ValueError(
                "FRONTEND_URL must be configured."
            )

        if self.ENVIRONMENT == "production":
            if len(self.JWT_SECRET_KEY) < 32:
                raise ValueError(
                    "JWT_SECRET_KEY must contain at least "
                    "32 characters in production."
                )

            if self.AUTO_CREATE_TABLES:
                raise ValueError(
                    "AUTO_CREATE_TABLES must be false in production."
                )


settings = Settings()

settings.validate()