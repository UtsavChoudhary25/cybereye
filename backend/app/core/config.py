import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "CyberEye"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    DESCRIPTION: str = "AI-Powered Cyber Intelligence & OSINT Platform"
    
    ENV: str = "development"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./cybereye.db")
    
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "*"
    ]
    
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    NVD_API_KEY: str = os.getenv("NVD_API_KEY", "")
    SHODAN_API_KEY: str = os.getenv("SHODAN_API_KEY", "")
    VIRUSTOTAL_API_KEY: str = os.getenv("VIRUSTOTAL_API_KEY", "")
    
    DEMO_MODE: bool = True
    REQUIRE_AUTH_FOR_ACTIVE_CHECKS: bool = True

    # Security & Authentication
    SECRET_KEY: str = os.getenv("SECRET_KEY", "cybereye-dev-insecure-secret-key-change-in-production-1234567890")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
    PASSWORD_RESET_TOKEN_EXPIRE_MINUTES: int = 15
    
    # Rate Limiting
    AUTH_RATE_LIMIT_MAX_ATTEMPTS: int = 5
    AUTH_RATE_LIMIT_WINDOW_SECONDS: int = 300  # 5 minutes lockout window

    # Trusted Reverse Proxies (CIDR or IPs) for X-Forwarded-For resolution
    TRUSTED_PROXIES: List[str] = [
        "127.0.0.1",
        "::1"
    ]

    # Audit Retention
    AUDIT_LOG_RETENTION_DAYS: int = 90

    model_config = SettingsConfigDict(case_sensitive=True, env_file=".env", extra="ignore")

settings = Settings()
