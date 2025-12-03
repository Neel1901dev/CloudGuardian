import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    """Application configuration settings"""
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./compliance.db")
    
    # Logging
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    
    # Report Storage
    REPORTS_DIR: str = os.getenv("REPORTS_DIR", "./reports")

settings = Settings()

# Create reports directory if it doesn't exist
os.makedirs(settings.REPORTS_DIR, exist_ok=True)
