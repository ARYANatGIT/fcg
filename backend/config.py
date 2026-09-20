from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    app_env: str = "development"
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    allowed_origins: str = "http://localhost:3000,http://localhost:5173"
    data_mode: str = "synthetic" # <-- Add this line
    windy_map_api_key: str = "VrzEVkW0Mx3LAN3AJWNTS2zXOeTWlpkv"
    carto_basemaps_api_key: str = "cb1_3qnh_1_8e89ac90b8868a8c23bf7986"
    openweather_api_key: str = "bb7bff7cbcebf1e0990e0dcadaef7af1"
    
    @property
    def cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",")]

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()