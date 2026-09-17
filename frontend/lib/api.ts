import { AnalysisResponse, SpatialGridResponse } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function getHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/api/v1/health`);
    return res.ok;
  } catch {
    return false;
  }
}

export async function analyzeForecast(payload: any): Promise<AnalysisResponse> {
  const res = await fetch(`${API_URL}/api/v1/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || `API Error: ${res.statusText}`);
  }
  return res.json();
}

export async function getSpatialGrid(leadDay: number = 5): Promise<SpatialGridResponse> {
  const res = await fetch(`${API_URL}/api/v1/spatial-grid?lead_day=${leadDay}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch spatial grid: ${res.statusText}`);
  }
  return res.json();
}

export async function getFeatures(): Promise<any> {
  const res = await fetch(`${API_URL}/api/v1/features`);
  if (!res.ok) {
    throw new Error("Failed to fetch feature catalog");
  }
  return res.json();
}

export async function getModelInfo(): Promise<any> {
  const res = await fetch(`${API_URL}/api/v1/model`);
  if (!res.ok) {
    throw new Error("Failed to fetch model metadata");
  }
  return res.json();
}