/**
 * ForecastGuard AI — Core Meteorological & Forecast Bust Domain Types
 */

export type BustRiskLevel = "safe" | "moderate" | "critical";

export interface GridPointPrediction {
  latitude: number;
  longitude: number;
  leadDay: number;
  leadHour: number;
  bustProbability: number;
  calibratedBustProbability: number;
  confidence: number;
  riskLevel: BustRiskLevel;
  forecastTemperature: number;
  forecastRainfall: number;
  forecastWindSpeed: number;
  forecastPressure: number;
  ensembleSpread?: number;
  forecastRevision?: number;
}

export interface RegionEvaluation {
  regionName: string;
  stationTarget: string;
  latitude: number;
  longitude: number;
  leadDay: number;
  bustProbability: number;
  confidence: number;
  riskLevel: BustRiskLevel;
  variableConfidence: {
    rainfall: number;
    temperature: number;
    wind: number;
    pressure: number;
  };
  modelAssociatedFactors: Array<{
    feature: string;
    impact: number;
    direction: "increases_risk" | "decreases_risk";
    description: string;
  }>;
  historicalAnalogs: Array<{
    caseId: string;
    validDate: string;
    similarityScore: number;
    historicalError: number;
    bustOccurred: boolean;
    synopticRegime: string;
  }>;
}

