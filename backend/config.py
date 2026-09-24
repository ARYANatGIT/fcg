from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    app_env: str = "development"
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    allowed_origins: str = "http://localhost:3000,http://localhost:5173"
    data_mode: str = "real_time"
    windy_map_api_key: str = ""
    carto_basemaps_api_key: str = ""
    openweather_api_key: str = ""
    google_maps_api_key: str = ""
    
    @property
    def cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",")]

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()