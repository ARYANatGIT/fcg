export interface PredictionDetails {
  raw_bust_probability: number;
  calibrated_bust_probability: number;
  forecast_confidence: number;
  risk_category?: string;
  risk_level: string;
}

export interface ShapReason {
  code: string;
  text: string;
  feature: string;
  contribution: number;
  value: string | number;
}

export interface Explanation {
  prediction_details: PredictionDetails;
  explanation_caveat: string;
  top_reasons: ShapReason[];
  top_supporting_features: ShapReason[];
  top_reducing_features: ShapReason[];
}

export interface Analog {
  initialization_time: string;
  valid_time?: string;
  lead_day?: number;
  latitude?: number;
  longitude?: number;
  similarity_distance: number;
  bust: number;
  combined_error_score?: number;
  bust_threshold?: number;
}

export interface AnalogResponse {
  available?: boolean;
  reason?: string;
  analogs?: Analog[];
  summary?: {
    historical_analog_bust_rate: number;
    number_of_analogs_retrieved: number;
    search_space_size?: number;
    mean_error?: number;
    best_distance?: number;
  };
}

export interface RevisionRun {
  run: string;
  rainfall_mm: number;
  wind_speed_ms: number;
  temperature_c: number;
}

export interface RevisionResponse {
  revision_available: boolean;
  reason?: string;
  target?: { valid_time: string; latitude: number; longitude: number };
  runs?: RevisionRun[];
  shifts?: {
    rainfall_shift?: string;
    trend?: string;
  };
  combined_revision_score?: number;
  large_revision?: boolean;
  risk_signal?: string;
  caveat?: string;
}

export interface LeadCurvePoint {
  lead_day: number;
  bust_probability: number;
  confidence: number;
}

export interface StationData {
  name: string;
  region: string;
  latitude: number;
  longitude: number;
  bust_probability: number;
  confidence: number;
  risk_category: string;
  color: string;
}

export interface AnalysisResponse {
  status: string;
  data: {
    prediction_and_explanation: Explanation;
    analogs: AnalogResponse;
    revision: RevisionResponse;
    lead_day_curve?: LeadCurvePoint[];
  };
  metadata: {
    data_status: string;
    model_version?: string;
  };
}

export interface SpatialGridResponse {
  status: string;
  data: {
    lead_day: number;
    total_stations: number;
    stations: StationData[];
  };
  metadata: {
    data_status: string;
  };
}