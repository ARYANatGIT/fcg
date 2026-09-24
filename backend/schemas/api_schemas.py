import os
from pydantic import BaseModel, Field, model_validator
from typing import Dict, Any, List, Optional

class APIResponseBase(BaseModel):
    status: str = "success"
    metadata: Dict[str, Any] = Field(default_factory=lambda: {"data_status": os.getenv("DATA_MODE", "real_time")})

class ForecastRequest(BaseModel):
    initialization_time: str
    valid_time: str
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    lead_day: int = Field(..., ge=1, le=10)
    features: Dict[str, float]

    @model_validator(mode='after')
    def check_time_ordering(self):
        if self.valid_time <= self.initialization_time:
            raise ValueError("valid_time must be strictly after initialization_time")
        return self

class PredictionResponse(APIResponseBase):
    data: Dict[str, Any]

class ExplainResponse(APIResponseBase):
    data: Dict[str, Any]

class AnalogsRequest(BaseModel):
    initialization_time: str
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    lead_day: int = Field(..., ge=1, le=10)
    features: Dict[str, float]
    top_k: Optional[int] = 5

class AnalogsResponse(APIResponseBase):
    data: Dict[str, Any]

class RevisionsRequest(BaseModel):
    valid_time: str
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)

class RevisionsResponse(APIResponseBase):
    data: Dict[str, Any]

class FeaturesResponse(APIResponseBase):
    data: Dict[str, Any]

class AnalysisResponse(APIResponseBase):
    data: Dict[str, Any]

class SpatialGridResponse(APIResponseBase):
    data: Dict[str, Any]