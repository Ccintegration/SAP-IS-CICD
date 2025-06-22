# File Path: backend/config.py
# Filename: config.py
"""
Configuration management for SAP Integration Suite Backend
"""

import os
from functools import lru_cache
from pydantic_settings import BaseSettings
from pydantic import Field
from typing import List
import logging
import logging.config
from pathlib import Path

class Settings(BaseSettings):
    """Application settings"""
    
    # Application settings
    app_name: str = "SAP Integration Suite Backend"
    environment: str = Field(default="development", env="ENVIRONMENT")
    debug: bool = Field(default=True, env="DEBUG")
    
    # Server settings
    host: str = Field(default="0.0.0.0", env="HOST")
    port: int = Field(default=8000, env="PORT")
    reload: bool = Field(default=True, env="RELOAD")
    
    # CORS settings
    allowed_origins: List[str] = Field(
        default=[
            "http://localhost:3000",
            "http://localhost:5173", 
            "http://localhost:8080",
            "https://2eb62935ac7a480ba3a90806f9af053b-82e2889c39e44190a89b82122.projects.builder.codes"
        ],
        env="ALLOWED_ORIGINS"
    )
    
    # SAP Integration Suite credentials (CCCI_SANDBOX)
    sap_client_id: str = Field(
        default="sb-4d88ec4d-cf00-4e40-b9a3-bf20640f4941!b236015|it!b182722",
        env="SAP_CLIENT_ID"
    )
    sap_client_secret: str = Field(
        default="68998671-12de-4a2c-ab02-8968d571b4cd$1hejXEfNv1qrX8raaVfuD_x-6PtP1xub7uRFmr55gaI=",
        env="SAP_CLIENT_SECRET"
    )
    sap_token_url: str = Field(
        default="https://ccci-integration-suite-fuom1yo5.authentication.eu10.hana.ondemand.com/oauth/token",
        env="SAP_TOKEN_URL"
    )
    sap_base_url: str = Field(
        default="https://ccci-integration-suite-fuom1yo5.it-cpi024.cfapps.eu10-002.hana.ondemand.com",
        env="SAP_BASE_URL"
    )
    
    # HTTP client settings
    http_timeout: int = Field(default=30, env="HTTP_TIMEOUT")
    max_retries: int = Field(default=3, env="MAX_RETRIES")
    
    # Token management
    token_cache_ttl: int = Field(default=3600, env="TOKEN_CACHE_TTL")  # seconds
    token_refresh_buffer: int = Field(default=300, env="TOKEN_REFRESH_BUFFER")  # seconds
    
    # Logging
    log_level: str = Field(default="INFO", env="LOG_LEVEL")
    log_format: str = Field(
        default="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        env="LOG_FORMAT"
    )
    
    # Database (for future use)
    database_url: str = Field(default="sqlite:///./sap_backend.db", env="DATABASE_URL")
    
    # Security
    secret_key: str = Field(
        default="your-secret-key-change-in-production",
        env="SECRET_KEY"
    )
    
    # Rate limiting
    rate_limit_requests: int = Field(default=100, env="RATE_LIMIT_REQUESTS")
    rate_limit_window: int = Field(default=60, env="RATE_LIMIT_WINDOW")  # seconds
    
    # File storage settings
    configurations_dir: str = Field(default="configurations", env="CONFIGURATIONS_DIR")
    exports_dir: str = Field(default="exports", env="EXPORTS_DIR")
    imports_dir: str = Field(default="imports", env="IMPORTS_DIR")
    backups_dir: str = Field(default="backups", env="BACKUPS_DIR")
    logs_dir: str = Field(default="logs", env="LOGS_DIR")
    max_file_size: int = Field(default=10485760, env="MAX_FILE_SIZE")  # 10MB in bytes
    allowed_file_types: List[str] = Field(
        default=[".csv", ".json", ".xml", ".txt", ".zip"],
        env="ALLOWED_FILE_TYPES"
    )
    
    # Pipeline settings
    max_concurrent_pipelines: int = Field(default=5, env="MAX_CONCURRENT_PIPELINES")
    pipeline_timeout: int = Field(default=3600, env="PIPELINE_TIMEOUT")  # 1 hour in seconds
    pipeline_retry_attempts: int = Field(default=3, env="PIPELINE_RETRY_ATTEMPTS")
    
    # Monitoring and health check
    health_check_interval: int = Field(default=30, env="HEALTH_CHECK_INTERVAL")  # seconds
    metrics_enabled: bool = Field(default=True, env="METRICS_ENABLED")
    monitoring_retention_days: int = Field(default=30, env="MONITORING_RETENTION_DAYS")
    
    # SAP API specific settings
    api_version: str = Field(default="v1", env="SAP_API_VERSION")
    max_retries_sap: int = Field(default=3, env="MAX_RETRIES_SAP")
    retry_delay: int = Field(default=1, env="RETRY_DELAY")  # seconds
    request_timeout: int = Field(default=30, env="REQUEST_TIMEOUT")  # seconds
    
    # Integration flow settings
    default_iflow_version: str = Field(default="active", env="DEFAULT_IFLOW_VERSION")
    max_iflows_per_request: int = Field(default=100, env="MAX_IFLOWS_PER_REQUEST")
    iflow_fetch_batch_size: int = Field(default=10, env="IFLOW_FETCH_BATCH_SIZE")
    
    # Design guidelines settings
    compliance_threshold: float = Field(default=75.0, env="COMPLIANCE_THRESHOLD")  # percentage
    guidelines_cache_ttl: int = Field(default=1800, env="GUIDELINES_CACHE_TTL")  # 30 minutes
    auto_execute_guidelines: bool = Field(default=False, env="AUTO_EXECUTE_GUIDELINES")
    
    # Export/Import settings
    max_export_size: int = Field(default=104857600, env="MAX_EXPORT_SIZE")  # 100MB
    export_compression: bool = Field(default=True, env="EXPORT_COMPRESSION")
    import_validation: bool = Field(default=True, env="IMPORT_VALIDATION")
    
    # Backup settings
    backup_enabled: bool = Field(default=True, env="BACKUP_ENABLED")
    backup_retention_days: int = Field(default=30, env="BACKUP_RETENTION_DAYS")
    auto_backup_schedule: str = Field(default="0 2 * * *", env="AUTO_BACKUP_SCHEDULE")  # Daily at 2 AM
    backup_compression: bool = Field(default=True, env="BACKUP_COMPRESSION")
    
    # Notification settings
    notifications_enabled: bool = Field(default=True, env="NOTIFICATIONS_ENABLED")
    email_notifications: bool = Field(default=False, env="EMAIL_NOTIFICATIONS")
    slack_notifications: bool = Field(default=False, env="SLACK_NOTIFICATIONS")
    smtp_server: str = Field(default="", env="SMTP_SERVER")
    smtp_port: int = Field(default=587, env="SMTP_PORT")
    smtp_username: str = Field(default="", env="SMTP_USERNAME")
    smtp_password: str = Field(default="", env="SMTP_PASSWORD")
    slack_webhook_url: str = Field(default="", env="SLACK_WEBHOOK_URL")
    
    # Security settings
    enable_audit_log: bool = Field(default=True, env="ENABLE_AUDIT_LOG")
    audit_log_retention_days: int = Field(default=90, env="AUDIT_LOG_RETENTION_DAYS")
    enable_api_keys: bool = Field(default=False, env="ENABLE_API_KEYS")
    api_key_expiry_days: int = Field(default=30, env="API_KEY_EXPIRY_DAYS")
    password_min_length: int = Field(default=8, env="PASSWORD_MIN_LENGTH")
    session_timeout_minutes: int = Field(default=60, env="SESSION_TIMEOUT_MINUTES")
    
    # Cache settings
    cache_enabled: bool = Field(default=True, env="CACHE_ENABLED")
    cache_ttl: int = Field(default=300, env="CACHE_TTL")  # 5 minutes
    redis_url: str = Field(default="redis://localhost:6379", env="REDIS_URL")
    
    # Performance settings
    worker_processes: int = Field(default=1, env="WORKER_PROCESSES")
    max_connections: int = Field(default=100, env="MAX_CONNECTIONS")
    connection_pool_size: int = Field(default=10, env="CONNECTION_POOL_SIZE")
    request_queue_size: int = Field(default=1000, env="REQUEST_QUEUE_SIZE")
    
    # Development settings
    enable_dev_mode: bool = Field(default=False, env="ENABLE_DEV_MODE")
    mock_sap_responses: bool = Field(default=False, env="MOCK_SAP_RESPONSES")
    enable_sql_echo: bool = Field(default=False, env="ENABLE_SQL_ECHO")
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False

@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()

# Environment-specific configurations
def get_development_settings() -> Settings:
    """Get development-specific settings"""
    settings = get_settings()
    settings.debug = True
    settings.reload = True
    settings.log_level = "DEBUG"
    settings.enable_dev_mode = True
    settings.mock_sap_responses = False
    return settings

def get_production_settings() -> Settings:
    """Get production-specific settings"""
    settings = get_settings()
    settings.debug = False
    settings.reload = False
    settings.log_level = "INFO"
    settings.environment = "production"
    settings.enable_dev_mode = False
    settings.mock_sap_responses = False
    settings.worker_processes = 4
    return settings

def get_test_settings() -> Settings:
    """Get test-specific settings"""
    settings = get_settings()
    settings.environment = "test"
    settings.database_url = "sqlite:///./test_sap_backend.db"
    settings.mock_sap_responses = True
    settings.cache_enabled = False
    settings.notifications_enabled = False
    return settings

# Configuration validation
def validate_sap_config(settings: Settings) -> bool:
    """Validate SAP configuration"""
    required_fields = [
        settings.sap_client_id,
        settings.sap_client_secret,
        settings.sap_token_url,
        settings.sap_base_url
    ]
    
    if not all(required_fields):
        return False
    
    # Validate URL formats
    if not settings.sap_token_url.startswith("https://"):
        return False
    
    if not settings.sap_base_url.startswith("https://"):
        return False
    
    # Validate client ID format (SAP specific)
    if not any(pattern in settings.sap_client_id for pattern in ["sb-", "!b", "|it!"]):
        return False
    
    return True

def validate_directories(settings: Settings) -> bool:
    """Validate and create necessary directories"""
    directories = [
        settings.configurations_dir,
        settings.exports_dir,
        settings.imports_dir,
        settings.backups_dir,
        settings.logs_dir
    ]
    
    try:
        for directory in directories:
            Path(directory).mkdir(parents=True, exist_ok=True)
        return True
    except Exception as e:
        print(f"Failed to create directories: {e}")
        return False

def get_database_url(settings: Settings) -> str:
    """Get database URL with environment-specific handling"""
    if settings.environment == "test":
        return "sqlite:///./test_sap_backend.db"
    elif settings.environment == "production":
        return os.getenv("DATABASE_URL", settings.database_url)
    else:
        return settings.database_url

def get_cors_origins(settings: Settings) -> List[str]:
    """Get CORS origins with environment-specific handling"""
    origins = settings.allowed_origins.copy()
    
    # Add environment-specific origins
    if settings.environment == "development":
        origins.extend([
            "http://localhost:3001",
            "http://localhost:3002",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:5173"
        ])
    elif settings.environment == "production":
        # Add production-specific origins from environment
        prod_origins = os.getenv("PROD_CORS_ORIGINS", "")
        if prod_origins:
            origins.extend([origin.strip() for origin in prod_origins.split(",")])
    
    return list(set(origins))  # Remove duplicates

def setup_basic_logging(settings: Settings):
    """Setup basic logging without complex configuration"""
    try:
        # Ensure logs directory exists
        Path(settings.logs_dir).mkdir(parents=True, exist_ok=True)
        
        # Configure basic logging
        log_level = getattr(logging, settings.log_level.upper(), logging.INFO)
        
        # Basic logging configuration
        logging.basicConfig(
            level=log_level,
            format=settings.log_format,
            handlers=[
                logging.StreamHandler(),  # Console output
                logging.FileHandler(
                    filename=Path(settings.logs_dir) / "sap_backend.log",
                    mode='a',
                    encoding='utf-8'
                )
            ]
        )
        
        # Set specific logger levels
        logging.getLogger("uvicorn").setLevel(logging.INFO)
        logging.getLogger("httpx").setLevel(logging.WARNING)
        
        print(f"✅ Basic logging configured successfully")
        
    except Exception as e:
        # Fallback to console logging only
        print(f"⚠️ Failed to setup file logging: {e}")
        logging.basicConfig(
            level=logging.INFO,
            format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            handlers=[logging.StreamHandler()]
        )
        print("✅ Console logging configured as fallback")

def get_log_config(settings: Settings) -> dict:
    """Get logging configuration (simplified)"""
    return {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "default": {
                "format": settings.log_format,
                "datefmt": "%Y-%m-%d %H:%M:%S"
            }
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "level": settings.log_level,
                "formatter": "default",
                "stream": "ext://sys.stdout"
            }
        },
        "root": {
            "level": settings.log_level,
            "handlers": ["console"]
        }
    }

def setup_logging(settings: Settings):
    """Setup logging configuration with error handling"""
    try:
        # Try advanced logging first
        log_config = get_log_config(settings)
        logging.config.dictConfig(log_config)
        print("✅ Advanced logging configured successfully")
    except Exception as e:
        print(f"⚠️ Advanced logging failed: {e}")
        # Fallback to basic logging
        setup_basic_logging(settings)

# Environment detection
def detect_environment() -> str:
    """Detect current environment"""
    env = os.getenv("ENVIRONMENT", "development").lower()
    
    # Auto-detect based on common indicators
    if os.getenv("KUBERNETES_SERVICE_HOST"):
        return "production"
    elif os.getenv("DOCKER_CONTAINER"):
        return "staging"
    elif os.getenv("CI"):
        return "test"
    
    return env

# Configuration initialization
def initialize_config() -> Settings:
    """Initialize configuration with validation and safe error handling"""
    try:
        settings = get_settings()
        
        # Set environment if not explicitly set
        if not os.getenv("ENVIRONMENT"):
            detected_env = detect_environment()
            settings.environment = detected_env
        
        # Validate configuration
        if not validate_sap_config(settings):
            print("⚠️ WARNING: SAP configuration validation failed. Please check your environment variables.")
        
        if not validate_directories(settings):
            print("⚠️ WARNING: Failed to create some directories.")
        
        # Setup logging with error handling
        setup_logging(settings)
        
        print("✅ Configuration initialized successfully")
        return settings
        
    except Exception as e:
        print(f"❌ Failed to initialize configuration: {e}")
        # Return basic settings as fallback
        settings = Settings()
        setup_basic_logging(settings)
        print("✅ Fallback configuration loaded")
        return settings

# Safe initialization
try:
    settings = initialize_config()
except Exception as e:
    print(f"❌ Critical error initializing config: {e}")
    # Absolute fallback
    settings = Settings()
    logging.basicConfig(level=logging.INFO)
    print("✅ Minimal fallback configuration loaded")

# Configuration summary for debugging
def print_config_summary(settings: Settings):
    """Print configuration summary for debugging"""
    print("\n" + "="*50)
    print("SAP CI/CD Backend Configuration Summary")
    print("="*50)
    print(f"Environment: {settings.environment}")
    print(f"Debug Mode: {settings.debug}")
    print(f"SAP Base URL: {settings.sap_base_url}")
    print(f"Server: {settings.host}:{settings.port}")
    print("="*50 + "\n")

# Print configuration summary if running in debug mode
if settings.debug and settings.environment == "development":
    try:
        print_config_summary(settings)
    except Exception:
        pass  # Ignore any errors in summary printing