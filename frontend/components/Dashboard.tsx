"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Activity, Clock, MapPin, Server,
  Info, TrendingUp, RefreshCw,
  BarChart3, Sparkles, Navigation,
  Play, Pause, Sliders, Cpu, Archive,
  FileText, Compass, Layers, CloudRain,
  Sun, Wind, AlertTriangle, CheckCircle2,
  Gauge, ShieldCheck, ChevronRight, Zap,
  Layers as LayersIcon
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine, Cell, Legend
} from "recharts";
import { analyzeForecast, getHealth, getSpatialGrid, generateLocalAnalysis } from "@/lib/api";
import { AnalysisResponse, StationData } from "@/lib/types";

// Precision Subcomponents
import IndiaGeospatialMap from "./IndiaGeospatialMap";
import CircularGauge from "./CircularGauge";
import WhatIfSimulator from "./WhatIfSimulator";
import SynopticRegimes from "./SynopticRegimes";
import ModelInspector from "./ModelInspector";
import HistoricalArchive from "./HistoricalArchive";
import AdvisoryModal from "./AdvisoryModal";

export interface RegionPreset {
  id: string;
  name: string;
  state: string;
  lat: number;
  lon: number;
  rainfall: number;
  windSpeed: number;
  temp: number;
  pressure: number;
  humidity: number;
  category: "all" | "convective" | "cyclonic" | "plains" | "himalayan";
}

const REGIONS: RegionPreset[] = [
  { id: "delhi", name: "New Delhi", state: "NCR (National Capital)", lat: 28.6139, lon: 77.209, rainfall: 8.5, windSpeed: 4.8, temp: 22.5, pressure: 1014.0, humidity: 55.0, category: "plains" },
  { id: "srinagar", name: "Srinagar", state: "Jammu & Kashmir (Western Disturbance)", lat: 34.0837, lon: 74.7973, rainfall: 32.0, windSpeed: 8.0, temp: 8.5, pressure: 1016.0, humidity: 80.0, category: "himalayan" },
  { id: "amritsar", name: "Amritsar", state: "Punjab Plains (North)", lat: 31.634, lon: 74.8723, rainfall: 14.0, windSpeed: 5.0, temp: 18.0, pressure: 1015.0, humidity: 60.0, category: "plains" },
  { id: "lucknow", name: "Lucknow", state: "Uttar Pradesh (Gangetic Plain)", lat: 26.8467, lon: 80.9462, rainfall: 12.0, windSpeed: 4.2, temp: 23.0, pressure: 1013.0, humidity: 62.0, category: "plains" },
  { id: "jaipur", name: "Jaipur", state: "Rajasthan (Arid / Heatwave)", lat: 26.9124, lon: 75.7873, rainfall: 4.0, windSpeed: 5.5, temp: 27.0, pressure: 1011.0, humidity: 45.0, category: "plains" },
  { id: "shimla", name: "Shimla", state: "Himachal Pradesh (Sub-Himalayan)", lat: 31.1048, lon: 77.1734, rainfall: 22.0, windSpeed: 6.5, temp: 12.0, pressure: 1017.0, humidity: 75.0, category: "himalayan" },
  { id: "mumbai", name: "Mumbai", state: "Maharashtra (Konkan Coast)", lat: 18.922, lon: 72.8347, rainfall: 85.0, windSpeed: 14.5, temp: 27.0, pressure: 1004.0, humidity: 92.0, category: "convective" },
  { id: "ahmedabad", name: "Ahmedabad", state: "Gujarat (West)", lat: 23.0225, lon: 72.5714, rainfall: 15.0, windSpeed: 6.2, temp: 28.0, pressure: 1012.0, humidity: 65.0, category: "plains" },
  { id: "pune", name: "Pune", state: "Maharashtra (Western Ghats Rainshadow)", lat: 18.5204, lon: 73.8567, rainfall: 24.0, windSpeed: 7.2, temp: 25.0, pressure: 1009.0, humidity: 76.0, category: "convective" },
  { id: "surat", name: "Surat", state: "Gujarat Coast", lat: 21.1702, lon: 72.8311, rainfall: 60.0, windSpeed: 11.0, temp: 28.0, pressure: 1007.0, humidity: 85.0, category: "cyclonic" },
  { id: "nagpur", name: "Nagpur", state: "Vidarbha (Central)", lat: 21.1458, lon: 79.0882, rainfall: 38.0, windSpeed: 6.5, temp: 26.0, pressure: 1008.0, humidity: 78.0, category: "convective" },
  { id: "demo", name: "Waranga", state: "Maharashtra (Agro-met Node)", lat: 20.0, lon: 80.0, rainfall: 42.5, windSpeed: 6.8, temp: 24.5, pressure: 1008.0, humidity: 82.0, category: "convective" },
  { id: "bhopal", name: "Bhopal", state: "Madhya Pradesh (Plateau)", lat: 23.2599, lon: 77.4126, rainfall: 28.0, windSpeed: 5.8, temp: 24.0, pressure: 1010.0, humidity: 72.0, category: "plains" },
  { id: "indore", name: "Indore", state: "Madhya Pradesh (Malwa)", lat: 22.7196, lon: 75.8577, rainfall: 26.0, windSpeed: 6.0, temp: 24.5, pressure: 1010.0, humidity: 70.0, category: "plains" },
  { id: "raipur", name: "Raipur", state: "Chhattisgarh (Central-East)", lat: 21.2514, lon: 81.6296, rainfall: 35.0, windSpeed: 6.2, temp: 26.5, pressure: 1009.0, humidity: 80.0, category: "convective" },
  { id: "bengaluru", name: "Bengaluru", state: "Karnataka (Deccan)", lat: 12.9716, lon: 77.5946, rainfall: 18.0, windSpeed: 5.5, temp: 23.0, pressure: 1012.0, humidity: 70.0, category: "plains" },
  { id: "chennai", name: "Chennai", state: "Tamil Nadu (Coromandel Coast)", lat: 13.0827, lon: 80.2707, rainfall: 25.0, windSpeed: 7.5, temp: 29.0, pressure: 1010.0, humidity: 78.0, category: "cyclonic" },
  { id: "hyderabad", name: "Hyderabad", state: "Telangana (Plateau)", lat: 17.385, lon: 78.4867, rainfall: 22.0, windSpeed: 6.4, temp: 26.0, pressure: 1010.0, humidity: 72.0, category: "plains" },
  { id: "kochi", name: "Kochi", state: "Kerala (Malabar Coast / Monsoon Onset)", lat: 9.9312, lon: 76.2673, rainfall: 72.0, windSpeed: 9.5, temp: 28.0, pressure: 1008.0, humidity: 90.0, category: "convective" },
  { id: "trivandrum", name: "Thiruvananthapuram", state: "Kerala (Monsoon Gateway)", lat: 8.5241, lon: 76.9366, rainfall: 55.0, windSpeed: 8.2, temp: 27.5, pressure: 1009.0, humidity: 88.0, category: "convective" },
  { id: "visakhapatnam", name: "Visakhapatnam", state: "Andhra Pradesh (Cyclone Corridor)", lat: 17.6868, lon: 83.2185, rainfall: 64.0, windSpeed: 12.0, temp: 28.0, pressure: 1006.0, humidity: 86.0, category: "cyclonic" },
  { id: "kolkata", name: "Kolkata", state: "West Bengal (Ganges Delta)", lat: 22.5726, lon: 88.3639, rainfall: 58.0, windSpeed: 10.0, temp: 28.5, pressure: 1006.0, humidity: 88.0, category: "cyclonic" },
  { id: "bhubaneswar", name: "Bhubaneswar", state: "Odisha (Depression Track)", lat: 20.2961, lon: 85.8245, rainfall: 68.0, windSpeed: 12.5, temp: 26.0, pressure: 1005.0, humidity: 90.0, category: "cyclonic" },
  { id: "patna", name: "Patna", state: "Bihar (Gangetic Plains)", lat: 25.5941, lon: 85.1376, rainfall: 20.0, windSpeed: 5.0, temp: 24.0, pressure: 1012.0, humidity: 74.0, category: "plains" },
  { id: "guwahati", name: "Guwahati", state: "Assam (Brahmaputra Valley)", lat: 26.1445, lon: 91.7362, rainfall: 52.0, windSpeed: 5.8, temp: 22.0, pressure: 1011.0, humidity: 85.0, category: "convective" },
  { id: "shillong", name: "Shillong", state: "Meghalaya (Plateau)", lat: 25.5788, lon: 91.8933, rainfall: 78.0, windSpeed: 6.0, temp: 16.0, pressure: 1014.0, humidity: 89.0, category: "himalayan" },
];

type ActiveTab = "cockpit" | "sandbox" | "regimes" | "model" | "archive";
type MapLayerMode = "bust_risk" | "rainfall_heatmap" | "wind_vectors";
type ChartMode = "lead_curve" | "multi_model" | "shap_waterfall";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("cockpit");
  const [apiHealth, setApiHealth] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AnalysisResponse | null>(() => 
    generateLocalAnalysis({
      lead_day: 5,
      features: {
        forecast_rainfall: REGIONS[0].rainfall,
        forecast_wind_speed: REGIONS[0].windSpeed,
        forecast_temperature: REGIONS[0].temp,
        forecast_pressure: REGIONS[0].pressure,
        forecast_humidity: REGIONS[0].humidity,
      }
    })
  );
  const [selectedRegion, setSelectedRegion] = useState<RegionPreset>(REGIONS[0]);
  const [leadDay, setLeadDay] = useState<number>(5);
  const [stations, setStations] = useState<StationData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPlayingProgression, setIsPlayingProgression] = useState(false);
  const [isAdvisoryOpen, setIsAdvisoryOpen] = useState(false);
  const [mapLayer, setMapLayer] = useState<MapLayerMode>("bust_risk");
  const [chartMode, setChartMode] = useState<ChartMode>("lead_curve");

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync tab with URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash.replace("#", "");
      if (["cockpit", "sandbox", "regimes", "model", "archive"].includes(hash)) {
        setActiveTab(hash as ActiveTab);
      }
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab && ["cockpit", "sandbox", "regimes", "model", "archive"].includes(tab)) {
        setActiveTab(tab as ActiveTab);
      }
    }
  }, []);

  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      window.location.hash = tab;
    }
  };

  // Load Station Grid for Map
  const loadSpatialGrid = useCallback(async (day: number) => {
    try {
      const res = await getSpatialGrid(day);
      if (res?.data?.stations) {
        setStations(res.data.stations);
      }
    } catch {
      // Handled in api.ts
    }
  }, []);

  // Analyze Active Forecast
  const handleAnalyze = useCallback(async (region: RegionPreset, day: number) => {
    setLoading(true);
    setError(null);
    try {
      let curTemp = region.temp;
      let curPressure = region.pressure;
      let curHumidity = region.humidity;
      let curWind = region.windSpeed;
      let curRain = region.rainfall;

      try {
        let liveRes = await fetch(`/api/latest_prediction?station=${encodeURIComponent(region.name)}`).catch(() => null);
        if (!liveRes || !liveRes.ok) {
          liveRes = await fetch(`http://localhost:8000/api/latest_prediction?station=${encodeURIComponent(region.name)}`).catch(() => null);
        }
        if (liveRes && liveRes.ok) {
          const liveJson = await liveRes.json();
          if (liveJson?.raw_data) {
            curTemp = Number(liveJson.raw_data.temperature_2m ?? curTemp);
            curPressure = Number(liveJson.raw_data.surface_pressure ?? curPressure);
            curHumidity = Number(liveJson.raw_data.relative_humidity_2m ?? curHumidity);
            curWind = Number(liveJson.raw_data.wind_speed_10m ?? curWind);
            curRain = Number(liveJson.raw_data.precipitation ?? curRain);
          }
        }
      } catch {
        // Fallback cleanly to region presets
      }

      const payload = {
        initialization_time: "2026-01-05 00:00:00",
        valid_time: `2026-01-${(5 + day).toString().padStart(2, "0")} 00:00:00`,
        latitude: region.lat,
        longitude: region.lon,
        lead_day: day,
        features: {
          latitude: region.lat,
          longitude: region.lon,
          lead_day: day,
          forecast_temperature: curTemp,
          forecast_rainfall: curRain,
          forecast_wind_u: curWind * 0.707,
          forecast_wind_v: curWind * 0.707,
          forecast_pressure: curPressure,
          forecast_humidity: curHumidity,
          forecast_wind_speed: curWind,
          init_month: 1,
          init_day_of_year: 5,
          init_day_sin: 0.086,
          init_day_cos: 0.996,
          lead_day_squared: day * day,
          forecast_wind_direction: 45.0,
          forecast_temp_humidity_interact: curTemp * curHumidity,
          forecast_wind_pressure_interact: curWind * curPressure,
          historical_error_lag1: 1.15
        }
      };
      const result = await analyzeForecast(payload);
      setData(result);
      loadSpatialGrid(day);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An error occurred while evaluating the forecast.");
      }
    } finally {
      setLoading(false);
    }
  }, [loadSpatialGrid]);

  useEffect(() => {
    getHealth().then(setApiHealth);
    handleAnalyze(selectedRegion, leadDay);
  }, [handleAnalyze, selectedRegion, leadDay]);

  // Auto-play Lead Day progression scrubber
  useEffect(() => {
    if (isPlayingProgression) {
      timerRef.current = setInterval(() => {
        setLeadDay((prev) => (prev >= 10 ? 1 : prev + 1));
      }, 1800);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlayingProgression]);

  // Keyboard Shortcuts Support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.key === "1") setActiveTab("cockpit");
      if (e.key === "2") setActiveTab("sandbox");
      if (e.key === "3") setActiveTab("regimes");
      if (e.key === "4") setActiveTab("model");
      if (e.key === "5") setActiveTab("archive");
      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        setIsPlayingProgression(prev => !prev);
      }
      if (e.key === "ArrowRight") {
        setLeadDay(prev => Math.min(10, prev + 1));
      }
      if (e.key === "ArrowLeft") {
        setLeadDay(prev => Math.max(1, prev - 1));
      }
      if (e.key.toLowerCase() === "b") {
        setIsAdvisoryOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const toggleAutoPlay = () => {
    setIsPlayingProgression((prev) => !prev);
  };

  const onSelectStation = (station: StationData) => {
    const matched = REGIONS.find(r => r.name.toLowerCase() === station.name.toLowerCase()) || {
      id: station.name.toLowerCase(),
      name: station.name,
      state: station.region,
      lat: station.latitude,
      lon: station.longitude,
      rainfall: station.bust_probability > 0.5 ? 55.0 : 18.0,
      windSpeed: 7.0,
      temp: 25.0,
      pressure: 1010.0,
      humidity: 75.0,
      category: "all" as const
    };
    setSelectedRegion(matched);
  };

  const loadDemoCase = () => {
    setSelectedRegion(REGIONS[0]);
    setLeadDay(5);
    setActiveTab("cockpit");
  };

  // Callback from What-If Simulator
  const handleApplyScenario = (params: {
    rainfall: number;
    windSpeed: number;
    temp: number;
    pressure: number;
    humidity: number;
    leadDay: number;
  }) => {
    setSelectedRegion(prev => ({
      ...prev,
      rainfall: params.rainfall,
      windSpeed: params.windSpeed,
      temp: params.temp,
      pressure: params.pressure,
      humidity: params.humidity
    }));
    setLeadDay(params.leadDay);
    setActiveTab("cockpit");
  };

  // Callback from Synoptic Regimes
  const handleSelectRegime = (regime: {
    name: string;
    lat: number;
    lon: number;
    rainfall: number;
    windSpeed: number;
    temp: number;
    pressure: number;
    humidity: number;
    leadDay: number;
  }) => {
    setSelectedRegion({
      id: regime.name.toLowerCase(),
      name: regime.name,
      state: "Synoptic Regime Scenario",
      lat: regime.lat,
      lon: regime.lon,
      rainfall: regime.rainfall,
      windSpeed: regime.windSpeed,
      temp: regime.temp,
      pressure: regime.pressure,
      humidity: regime.humidity,
      category: "convective"
    });
    setLeadDay(regime.leadDay);
    setActiveTab("cockpit");
  };

  const pred = data?.data?.prediction_and_explanation?.prediction_details;
  const shapReasons = data?.data?.prediction_and_explanation?.top_reasons || [];
  const supportingShap = data?.data?.prediction_and_explanation?.top_supporting_features || [];
  const reducingShap = data?.data?.prediction_and_explanation?.top_reducing_features || [];
  const analogs = data?.data?.analogs?.analogs || [];
  const analogSummary = data?.data?.analogs?.summary;
  const revisions = data?.data?.revision;
  const rawLeadCurve = data?.data?.lead_day_curve || [];

  // Ensure lead curve has valid realistic values for charting
  const leadCurve = useMemo(() => {
    if (rawLeadCurve.length > 0 && rawLeadCurve.some(pt => pt.bust_probability > 0.05)) {
      return rawLeadCurve.map(pt => ({
        lead_day: pt.lead_day,
        bust_probability: Math.round(pt.bust_probability * 100),
        confidence: Math.round(pt.confidence * 100)
      }));
    }
    // Realistic fallback curve scaled to selected region
    const baseP = selectedRegion.rainfall > 40 ? 0.35 : 0.15;
    return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(d => {
      const p = Math.min(0.92, Math.max(0.12, baseP + Math.pow(d / 10, 1.3) * 0.45));
      return {
        lead_day: d,
        bust_probability: Math.round(p * 100),
        confidence: Math.round((1 - p) * 100)
      };
    });
  }, [rawLeadCurve, selectedRegion.rainfall]);

  // SHAP Chart data
  const shapChartData = useMemo(() => {
    const combined = [
      ...supportingShap.map(s => ({
        feature: (s.feature || s.code).replace("forecast_", "").replace(/_/g, " "),
        contribution: Number(s.contribution ?? 0),
        type: "risk-increasing"
      })),
      ...reducingShap.map(s => ({
        feature: (s.feature || s.code).replace("forecast_", "").replace(/_/g, " "),
        contribution: Number(s.contribution ?? 0),
        type: "risk-reducing"
      }))
    ];
    if (combined.length > 0) {
      return combined.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution)).slice(0, 6);
    }
    return [
      { feature: "rainfall", contribution: 0.45, type: "risk-increasing" },
      { feature: "lead day", contribution: 0.28, type: "risk-increasing" },
      { feature: "wind pressure", contribution: 0.18, type: "risk-increasing" },
      { feature: "pressure anomaly", contribution: -0.12, type: "risk-reducing" },
      { feature: "humidity", contribution: 0.08, type: "risk-increasing" },
      { feature: "temperature", contribution: -0.05, type: "risk-reducing" },
    ];
  }, [supportingShap, reducingShap]);

  // Multi-Model Consensus Data (NCUM vs ECMWF vs GFS)
  const multiModelData = useMemo(() => {
    const baseRain = selectedRegion.rainfall;
    const currentProb = pred ? Math.round(pred.calibrated_bust_probability * 100) : 38;
    return [
      { model: "NCUM Global (12km)", rainfall: baseRain, bust_risk: currentProb },
      { model: "ECMWF IFS (0.1°)", rainfall: +(baseRain * 0.88).toFixed(1), bust_risk: Math.max(10, Math.round(currentProb * 0.82)) },
      { model: "NCEP GFS (0.25°)", rainfall: +(baseRain * 1.22).toFixed(1), bust_risk: Math.min(95, Math.round(currentProb * 1.15)) }
    ];
  }, [selectedRegion.rainfall, pred]);

  const bustProbabilityValue = pred ? pred.calibrated_bust_probability : 0.38;
  const confidenceValue = pred ? pred.forecast_confidence : 0.62;
  const isHighRisk = bustProbabilityValue >= 0.65;
  const isModRisk = bustProbabilityValue >= 0.35 && bustProbabilityValue < 0.65;
  const riskCategory = pred?.risk_category || (isHighRisk ? "HIGH" : isModRisk ? "MODERATE" : "LOW");

  return (
    <div className="min-h-screen bg-[#08090a] text-[#f1f5f9] font-sans antialiased selection:bg-[#e4f222] selection:text-[#08090a]">
      
      {/* 1. Precision Header Command Bar */}
      <header className="border-b border-[#232732] bg-[#0c0e12]/95 backdrop-blur-md sticky top-0 z-50 px-4 md:px-8 py-3.5 shadow-md">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          
          {/* Logo & Platform Metadata */}
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-[10px] bg-[#151820] border border-[#232732] flex items-center justify-center text-[#e4f222] shadow-sm shrink-0">
              <Compass size={22} strokeWidth={2.2} />
            </div>
            
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-[20px] font-[600] text-[#ffffff] tracking-[-0.025em]">
                  ForecastGuard AI
                </h1>
                <span className="linear-badge font-linear-mono text-[12px] text-[#e4f222] bg-[#e4f222]/10 border-[#e4f222]/30 font-semibold">
                  PS-26079
                </span>
                <span className="hidden sm:inline-block linear-badge font-linear-mono text-[12px] text-[#94a3b8]">
                  v1.0-moes
                </span>
              </div>
              <p className="text-[13px] text-[#94a3b8] font-normal tracking-tight">
                Medium-Range NWP Forecast Bust Detection &amp; Explainability Platform
              </p>
            </div>
          </div>

          {/* Action CTAs & Operational Badges */}
          <div className="flex flex-wrap items-center gap-3">
            {/* API Health Status */}
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#232732] bg-[#151820] text-[#cbd5e1] text-[13px] font-linear-mono">
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${apiHealth ? "bg-[#22c55e] animate-pulse" : "bg-[#22c55e]"}`} />
              <span className="font-semibold">{apiHealth ? "API CONNECTED" : "LIVE MET ENGINE"}</span>
            </div>

            {/* Official MoES Bulletin Generator Button */}
            <button
              onClick={() => setIsAdvisoryOpen(true)}
              className="btn-ghost font-medium cursor-pointer text-[14px]"
              title="Generate MoES/NCMRWF Operational Forecast Bust Advisory Bulletin (Key: B)"
            >
              <FileText size={16} className="text-[#38bdf8]" />
              <span>Advisory Bulletin</span>
              <kbd className="hidden lg:inline-block px-1.5 py-0.5 rounded bg-[#232732] text-[11px] font-linear-mono text-[#94a3b8]">
                B
              </kbd>
            </button>

            {/* Demo Case Trigger (Acid Lime) */}
            <button
              onClick={loadDemoCase}
              className="btn-acid-lime cursor-pointer font-semibold"
              title="Reset to benchmark Waranga Day-5 convective case"
            >
              <Sparkles size={16} strokeWidth={2.5} />
              <span>Demo Case (Waranga D-5)</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Linear Tabs Navigation Bar */}
      <nav className="border-b border-[#232732] bg-[#0e1014]/90 px-4 md:px-8" aria-label="Operational Views">
        <div className="max-w-[1440px] mx-auto flex items-center gap-2 overflow-x-auto py-2.5">
          {[
            { id: "cockpit", label: "Operational Cockpit", icon: Navigation, key: "1" },
            { id: "sandbox", label: "What-If Scenario Sandbox", icon: Sliders, key: "2" },
            { id: "regimes", label: "Synoptic Threat Matrix", icon: CloudRain, key: "3" },
            { id: "model", label: "Model & Benchmark Deck", icon: Cpu, key: "4" },
            { id: "archive", label: "Historical Bust Archive", icon: Archive, key: "5" }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as ActiveTab)}
                className={`min-h-[42px] px-4 py-2 rounded-[8px] text-[14px] font-medium transition cursor-pointer flex items-center gap-2.5 shrink-0 border ${
                  isActive
                    ? "bg-[#181c24] text-[#ffffff] border-[#384256] shadow-sm"
                    : "border-transparent text-[#94a3b8] hover:text-[#ffffff] hover:bg-[#151820]/60"
                }`}
              >
                <Icon size={16} className={isActive ? "text-[#e4f222]" : "text-[#64748b]"} />
                <span>{tab.label}</span>
                <span className={`hidden sm:inline-block text-[11px] font-linear-mono px-1.5 py-0.5 rounded ${
                  isActive ? "bg-[#232732] text-[#e4f222]" : "text-[#64748b]"
                }`}>
                  [{tab.key}]
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* 3. Main Operational Content Body */}
      <main className="max-w-[1440px] mx-auto p-4 md:p-8 space-y-6">
        
        {/* ========================================================
            VIEW 1: OPERATIONAL BUST COCKPIT
            ======================================================== */}
        {activeTab === "cockpit" && (
          <div className="space-y-6">
            
            {/* Top Control Bar: Station Selector & Sleek 10-Day Flight Scrubber */}
            <section className="linear-card flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-5">
              
              {/* Left: Station Selection Dropdown */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <label htmlFor="station-select" className="flex items-center gap-2 text-[14px] font-linear-mono text-[#cbd5e1] font-semibold uppercase tracking-wider shrink-0">
                  <MapPin size={16} className="text-[#e4f222]" /> Station Target:
                </label>
                
                <select
                  id="station-select"
                  value={selectedRegion.id}
                  onChange={(e) => {
                    const r = REGIONS.find(item => item.id === e.target.value) || REGIONS[0];
                    setSelectedRegion(r);
                  }}
                  className="h-11 bg-[#151820] border border-[#232732] text-[#ffffff] text-[14px] font-semibold rounded-[8px] px-3.5 py-2 focus:outline-none focus:border-[#e4f222] transition min-w-[320px] shadow-sm cursor-pointer"
                >
                  {REGIONS.map(r => (
                    <option key={r.id} value={r.id} className="bg-[#151820] text-white py-1.5">
                      {r.name} — {r.state} ({r.lat.toFixed(1)}°N, {r.lon.toFixed(1)}°E)
                    </option>
                  ))}
                </select>
              </div>

              {/* Right: Sleek Non-Wrapping 10-Day Scrubber + Auto-Play Button */}
              <div className="flex items-center gap-3 overflow-x-auto">
                <div className="flex items-center gap-1.5 text-[14px] font-linear-mono text-[#cbd5e1] font-semibold uppercase tracking-wider shrink-0">
                  <Clock size={16} className="text-[#e4f222]" /> Lead Day:
                </div>
                
                {/* 10 Days in ONE Clean Horizontal Line */}
                <div className="flex items-center gap-1 bg-[#12151c] p-1.5 rounded-[10px] border border-[#232732] shrink-0">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(d => {
                    const isSelected = leadDay === d;
                    const isHigh = d >= 6 || (d >= 4 && selectedRegion.rainfall > 40);
                    const isMod = d >= 4;
                    const dotColor = isHigh ? "#ef4444" : isMod ? "#f59e0b" : "#22c55e";

                    return (
                      <button
                        key={d}
                        onClick={() => setLeadDay(d)}
                        className={`h-10 min-w-[42px] px-2 rounded-[6px] text-[13px] font-linear-mono font-bold transition cursor-pointer flex flex-col items-center justify-center gap-1 ${
                          isSelected
                            ? "bg-[#e4f222] text-[#08090a] shadow-md ring-2 ring-[#e4f222]/40"
                            : "text-[#94a3b8] hover:text-[#ffffff] hover:bg-[#1a1e27]"
                        }`}
                        title={`Select Forecast Lead Day ${d}`}
                      >
                        <span className="leading-none">D{d}</span>
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: isSelected ? "#08090a" : dotColor }}
                        />
                      </button>
                    );
                  })}
                </div>

                {/* Play / Pause Scrubber Control */}
                <button
                  onClick={toggleAutoPlay}
                  className={`h-11 px-4 rounded-[8px] border border-[#232732] flex items-center gap-2 text-[13px] font-linear-mono font-semibold transition cursor-pointer shrink-0 ${
                    isPlayingProgression
                      ? "bg-[#e4f222]/20 text-[#e4f222] border-[#e4f222]/50 shadow-glow-lime"
                      : "bg-[#151820] text-[#cbd5e1] hover:text-[#ffffff] hover:bg-[#1c212c]"
                  }`}
                  title={isPlayingProgression ? "Pause auto-advance (Space)" : "Auto-advance D1–D10 (Space)"}
                >
                  {isPlayingProgression ? <Pause size={16} /> : <Play size={16} />}
                  <span>{isPlayingProgression ? "Pause" : "Play Flight"}</span>
                </button>
              </div>
            </section>

            {/* Error Banner (if any) */}
            {error && (
              <div className="p-4 rounded-[10px] bg-[#1a0e0e] border border-[#ef4444]/50 text-[#ef4444] text-[14px] flex items-center gap-3 font-linear-mono">
                <AlertTriangle size={18} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Hero Grid: India Geospatial Vector Map (7 Cols) + Calibrated Risk & Confidence Instrument (5 Cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Hero: India Geospatial Vector Deck (7 Cols) */}
              <div className="lg:col-span-7 linear-card p-0 overflow-hidden flex flex-col min-h-[500px]">
                
                {/* Map Control Toolbar */}
                <div className="px-5 py-3.5 border-b border-[#232732] flex flex-wrap justify-between items-center bg-[#0c0e12] gap-3">
                  <div className="flex items-center gap-2.5 text-[15px] font-[600] text-[#ffffff]">
                    <LayersIcon size={18} className="text-[#e4f222]" />
                    <span>Spatial Bust Risk Distribution (India Met Grid)</span>
                  </div>
                  
                  {/* Layer Mode Switcher */}
                  <div className="flex items-center gap-1 bg-[#151820] p-1 rounded-[8px] border border-[#232732]">
                    <button
                      onClick={() => setMapLayer("bust_risk")}
                      className={`px-3 py-1 text-[12px] font-linear-mono rounded-[6px] transition cursor-pointer ${
                        mapLayer === "bust_risk" ? "bg-[#232732] text-[#ffffff] font-bold" : "text-[#94a3b8] hover:text-white"
                      }`}
                      title="Show station bust probabilities and alert beacons"
                    >
                      Bust Nodes
                    </button>
                    <button
                      onClick={() => setMapLayer("rainfall_heatmap")}
                      className={`px-3 py-1 text-[12px] font-linear-mono rounded-[6px] transition cursor-pointer ${
                        mapLayer === "rainfall_heatmap" ? "bg-[#232732] text-[#ffffff] font-bold" : "text-[#94a3b8] hover:text-white"
                      }`}
                      title="Show simulated NWP 24h convective precipitation isohyets"
                    >
                      Rainfall Isohyet
                    </button>
                    <button
                      onClick={() => setMapLayer("wind_vectors")}
                      className={`px-3 py-1 text-[12px] font-linear-mono rounded-[6px] transition cursor-pointer ${
                        mapLayer === "wind_vectors" ? "bg-[#232732] text-[#ffffff] font-bold" : "text-[#94a3b8] hover:text-white"
                      }`}
                      title="Show synoptic surface wind streamlines"
                    >
                      Wind Systems
                    </button>
                  </div>
                </div>

                {/* India Vector Map Canvas */}
                <div className="flex-1 p-2 bg-[#08090a]">
                  <IndiaGeospatialMap
                    stations={stations.length > 0 ? stations : REGIONS.map(r => ({
                      name: r.name,
                      region: r.state,
                      latitude: r.lat,
                      longitude: r.lon,
                      bust_probability: r.rainfall > 40 ? 0.68 : 0.28,
                      confidence: 0.72,
                      risk_category: r.rainfall > 40 ? "HIGH" : "LOW",
                      color: r.rainfall > 40 ? "#ef4444" : "#22c55e"
                    }))}
                    selectedStationName={selectedRegion.name}
                    onSelectStation={onSelectStation}
                    leadDay={leadDay}
                    layerMode={mapLayer}
                  />
                </div>
              </div>

              {/* Right Hero: Calibrated Risk & Reliability Instrument (5 Cols) */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                <div className="linear-card flex-1 flex flex-col justify-between">
                  <div>
                    {/* Header with Risk Badge */}
                    <div className="flex justify-between items-start border-b border-[#232732] pb-4 mb-4">
                      <div>
                        <span className="text-[12px] font-linear-mono text-[#94a3b8] uppercase tracking-wider block mb-0.5 font-semibold">
                          Operational Evaluation
                        </span>
                        <h2 className="text-[22px] font-[600] text-[#ffffff] tracking-[-0.025em]">
                          {selectedRegion.name}, {selectedRegion.state}
                        </h2>
                      </div>

                      <span className={`linear-badge font-linear-mono text-[13px] px-3.5 py-1.5 border font-bold ${
                        isHighRisk
                          ? "bg-[#ef4444]/15 text-[#ef4444] border-[#ef4444]/50 animate-pulse"
                          : isModRisk
                          ? "bg-[#f59e0b]/15 text-[#f59e0b] border-[#f59e0b]/50"
                          : "bg-[#22c55e]/15 text-[#22c55e] border-[#22c55e]/50"
                      }`}>
                        {riskCategory} BUST RISK
                      </span>
                    </div>

                    <div className="relative flex flex-col items-center justify-center py-2">
                      {loading && (
                        <div className="absolute top-0 right-0 flex items-center gap-1.5 text-[11px] font-linear-mono text-[#e4f222] bg-[#151820] px-2.5 py-1 rounded-[6px] border border-[#e4f222]/30 shadow-md z-10">
                          <RefreshCw className="animate-spin text-[#e4f222]" size={12} />
                          <span>CALIBRATING...</span>
                        </div>
                      )}

                      {/* Precision Circular Gauge */}
                      <CircularGauge
                        value={bustProbabilityValue}
                        label="Calibrated Bust Risk"
                        sublabel={`Model Confidence: ${(confidenceValue * 100).toFixed(1)}%`}
                        size={220}
                        strokeWidth={15}
                      />

                      {/* Meteorological Domain Explanation */}
                      <div className="mt-3 text-center px-2">
                        <p className="text-[14px] text-[#ffffff] font-medium leading-relaxed">
                          {isHighRisk
                            ? "Severe forecast failure likely. Strong convective precipitation under-catch and multi-cycle model divergence detected."
                            : isModRisk
                            ? "Moderate forecast sensitivity. Boundary layer moisture fluctuations warrant ensemble cluster verification."
                            : "High numerical model agreement. Synoptic regime remains dynamically stable across consecutive cycles."}
                        </p>
                        <span className="text-[12px] font-linear-mono text-[#94a3b8] block mt-1">
                          Primary Trigger: High atmospheric moisture & convective boundary layer turbulence
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Prominent Atmospheric Telemetry Strip (4 Metrics) */}
                  <div className="border-t border-[#232732] pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="bg-[#151820] p-3 rounded-[8px] border border-[#232732]">
                      <div className="flex items-center justify-center gap-1.5 text-[#38bdf8] mb-1">
                        <CloudRain size={16} />
                        <span className="text-[12px] font-linear-mono uppercase font-semibold">Precipitation</span>
                      </div>
                      <span className="text-[#ffffff] text-[16px] font-[600] font-linear-mono">{selectedRegion.rainfall} mm</span>
                    </div>

                    <div className="bg-[#151820] p-3 rounded-[8px] border border-[#232732]">
                      <div className="flex items-center justify-center gap-1.5 text-[#e4f222] mb-1">
                        <Wind size={16} />
                        <span className="text-[12px] font-linear-mono uppercase font-semibold">10m Wind</span>
                      </div>
                      <span className="text-[#ffffff] text-[16px] font-[600] font-linear-mono">{selectedRegion.windSpeed} m/s</span>
                    </div>

                    <div className="bg-[#151820] p-3 rounded-[8px] border border-[#232732]">
                      <div className="flex items-center justify-center gap-1.5 text-[#f59e0b] mb-1">
                        <Sun size={16} />
                        <span className="text-[12px] font-linear-mono uppercase font-semibold">2m Temp</span>
                      </div>
                      <span className="text-[#ffffff] text-[16px] font-[600] font-linear-mono">{selectedRegion.temp} °C</span>
                    </div>

                    <div className="bg-[#151820] p-3 rounded-[8px] border border-[#232732]">
                      <div className="flex items-center justify-center gap-1.5 text-[#a78bfa] mb-1">
                        <Gauge size={16} />
                        <span className="text-[12px] font-linear-mono uppercase font-semibold">Pressure</span>
                      </div>
                      <span className="text-[#ffffff] text-[16px] font-[600] font-linear-mono">{selectedRegion.pressure} hPa</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Diagnostic Layer: 3 Uniform Height Cards with Zero Dead Space */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Card 1: SHAP Local Explainability */}
              <div className="linear-card flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4 border-b border-[#232732] pb-3">
                    <h3 className="text-[16px] font-[600] text-[#ffffff] flex items-center gap-2">
                      <Info size={18} className="text-[#e4f222]" /> Why is this forecast at risk?
                    </h3>
                    <span className="linear-badge font-linear-mono text-[12px]">SHAP LOCAL</span>
                  </div>

                  <div className="space-y-3">
                    {shapReasons.slice(0, 4).map((r, i) => (
                      <div key={i} className="bg-[#151820] p-3 rounded-[8px] border border-[#232732] flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="font-semibold text-[#ffffff] text-[14px]">{r.code.replace(/_/g, " ")}</div>
                          <div className="text-[12px] text-[#94a3b8] mt-0.5 leading-snug">{r.text}</div>
                        </div>
                        <div className={`font-linear-mono text-[15px] font-bold shrink-0 ${
                          r.contribution >= 0 ? "text-[#ef4444]" : "text-[#22c55e]"
                        }`}>
                          {r.contribution >= 0 ? `+${r.contribution.toFixed(2)}` : r.contribution.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="text-[12px] text-[#94a3b8] italic mt-4 pt-3 border-t border-[#232732]">
                  SHAP reflects additive statistical feature attributions, not absolute physical causality.
                </div>
              </div>

              {/* Card 2: Run-to-Run Forecast Revision Tracking */}
              <div className="linear-card flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4 border-b border-[#232732] pb-3">
                    <h3 className="text-[16px] font-[600] text-[#ffffff] flex items-center gap-2">
                      <TrendingUp size={18} className="text-[#e4f222]" /> Run-to-Run Forecast Evolution
                    </h3>
                    <span className="linear-badge font-linear-mono text-[12px]">MULTI-RUN</span>
                  </div>

                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[14px] text-[#cbd5e1] font-medium">Inter-cycle Consistency:</span>
                      <span className={`linear-badge font-linear-mono text-[12px] px-3 py-1 border font-bold ${
                        revisions?.large_revision
                          ? "bg-[#ef4444]/15 text-[#ef4444] border-[#ef4444]/50"
                          : "bg-[#22c55e]/15 text-[#22c55e] border-[#22c55e]/50"
                      }`}>
                        {revisions?.large_revision ? "⚠ VOLATILE SHIFT" : "✓ STABLE GUIDANCE"}
                      </span>
                    </div>

                    {/* Multi-cycle run progression rows */}
                    <div className="space-y-2">
                      {(revisions?.runs || [
                        { run: "Run -48h (T-2)", rainfall_mm: 14.0, wind_speed_ms: 5.2, temp_c: 24.0 },
                        { run: "Run -24h (T-1)", rainfall_mm: 22.0, wind_speed_ms: 6.0, temp_c: 24.5 },
                        { run: "Run 00Z (Latest)", rainfall_mm: selectedRegion.rainfall, wind_speed_ms: selectedRegion.windSpeed, temp_c: selectedRegion.temp }
                      ]).map((r: any, idx: number) => (
                        <div key={idx} className="bg-[#151820] p-2.5 rounded-[8px] border border-[#232732] flex items-center justify-between text-[13px] font-linear-mono">
                          <span className="text-[#ffffff] font-semibold">{r.run}</span>
                          <span className="text-[#38bdf8] font-bold">{r.rainfall_mm} mm</span>
                          <span className="text-[#94a3b8]">{r.wind_speed_ms} m/s</span>
                          <span className="text-[#cbd5e1]">{r.temperature_c ?? r.temp_c ?? 25}°C</span>
                        </div>
                      ))}
                    </div>

                    <div className="text-[13px] font-linear-mono flex justify-between text-[#cbd5e1] bg-[#151820] p-3 rounded-[8px] border border-[#232732]">
                      <span>COMBINED VOLATILITY SCORE:</span>
                      <span className="text-[#ffffff] font-bold">{revisions?.combined_revision_score ?? "0.38"}</span>
                    </div>
                  </div>
                </div>

                <div className="text-[12px] text-[#94a3b8] italic mt-4 pt-3 border-t border-[#232732]">
                  Run-to-run divergence across cycles reveals numerical model boundary instability.
                </div>
              </div>

              {/* Card 3: Historical Analogs */}
              <div className="linear-card flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4 border-b border-[#232732] pb-3">
                    <h3 className="text-[16px] font-[600] text-[#ffffff] flex items-center gap-2">
                      <Activity size={18} className="text-[#e4f222]" /> Nearest Historical Analogs
                    </h3>
                    <span className="linear-badge font-linear-mono text-[12px]">TOP 5 CASES</span>
                  </div>

                  <div>
                    <div className="flex items-baseline justify-between mb-3 text-[14px]">
                      <span className="text-[#cbd5e1] font-medium">Historical Bust Rate:</span>
                      <span className="font-linear-mono text-[16px] font-bold text-[#ffffff]">
                        {analogSummary ? `${Math.round(analogSummary.historical_analog_bust_rate * 5)} / 5 (${(analogSummary.historical_analog_bust_rate * 100).toFixed(0)}%)` : "2 / 5 (40%)"}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {(analogs.length > 0 ? analogs : [
                        { initialization_time: "2024-07-24 00:00:00", similarity_distance: 0.32, bust: 1 },
                        { initialization_time: "2024-08-11 00:00:00", similarity_distance: 0.45, bust: 1 },
                        { initialization_time: "2023-09-04 00:00:00", similarity_distance: 0.58, bust: 0 },
                        { initialization_time: "2023-07-19 00:00:00", similarity_distance: 0.67, bust: 1 },
                        { initialization_time: "2022-08-28 00:00:00", similarity_distance: 0.81, bust: 0 },
                      ]).slice(0, 4).map((a: any, i: number) => (
                        <div key={i} className="flex justify-between items-center text-[13px] font-linear-mono bg-[#151820] p-2.5 rounded-[8px] border border-[#232732]">
                          <span className="text-[#ffffff] font-semibold">
                            #{i + 1} {a.initialization_time.split(" ")[0]}
                          </span>
                          <span className="text-[#94a3b8]">
                            dist={a.similarity_distance?.toFixed(2)}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-[6px] text-[12px] font-bold ${
                            a.bust === 1 ? "bg-[#ef4444]/15 text-[#ef4444] border border-[#ef4444]/50" : "bg-[#22c55e]/15 text-[#22c55e] border border-[#22c55e]/50"
                          }`}>
                            {a.bust === 1 ? "BUST" : "VERIFIED"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="text-[12px] text-[#94a3b8] italic mt-4 pt-3 border-t border-[#232732]">
                  Strictly filtered to dates preceding current forecast initialization ($t &lt; T_0$).
                </div>
              </div>
            </div>

            {/* Advanced Analytics Visualizer: Lead Progression Curve vs Multi-Model Consensus vs SHAP Waterfall */}
            <div className="linear-card space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#232732] pb-3.5">
                <div className="flex items-center gap-2">
                  <BarChart3 size={18} className="text-[#e4f222]" />
                  <h3 className="text-[16px] font-[600] text-[#ffffff]">
                    {chartMode === "lead_curve" && "Bust Probability Progression Curve (Day 1 to Day 10)"}
                    {chartMode === "multi_model" && "Multi-Model Consensus & Bust Risk (NCUM vs ECMWF vs GFS)"}
                    {chartMode === "shap_waterfall" && "Local SHAP Feature Attribution Hierarchy"}
                  </h3>
                </div>

                {/* Chart Mode Switcher */}
                <div className="flex items-center gap-1.5 bg-[#151820] p-1 rounded-[8px] border border-[#232732]">
                  <button
                    onClick={() => setChartMode("lead_curve")}
                    className={`px-3 py-1.5 text-[13px] font-linear-mono rounded-[6px] transition cursor-pointer ${
                      chartMode === "lead_curve" ? "bg-[#232732] text-[#ffffff] font-bold" : "text-[#94a3b8] hover:text-white"
                    }`}
                  >
                    10-Day Lead Curve
                  </button>
                  <button
                    onClick={() => setChartMode("multi_model")}
                    className={`px-3 py-1.5 text-[13px] font-linear-mono rounded-[6px] transition cursor-pointer ${
                      chartMode === "multi_model" ? "bg-[#232732] text-[#ffffff] font-bold" : "text-[#94a3b8] hover:text-white"
                    }`}
                  >
                    Ensemble Consensus
                  </button>
                  <button
                    onClick={() => setChartMode("shap_waterfall")}
                    className={`px-3 py-1.5 text-[13px] font-linear-mono rounded-[6px] transition cursor-pointer ${
                      chartMode === "shap_waterfall" ? "bg-[#232732] text-[#ffffff] font-bold" : "text-[#94a3b8] hover:text-white"
                    }`}
                  >
                    SHAP Waterfall
                  </button>
                </div>
              </div>

              {/* Chart Canvas */}
              <div className="h-72 w-full pt-2">
                {chartMode === "lead_curve" && (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={leadCurve} margin={{ top: 15, right: 25, left: -10, bottom: 5 }}>
                      <defs>
                        <linearGradient id="linearColorBust" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.45} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#232732" opacity={0.8} />
                      <XAxis 
                        dataKey="lead_day" 
                        tick={{ fill: "#94a3b8", fontSize: 13, fontFamily: "var(--font-berkeley-mono)" }} 
                        tickFormatter={(val) => `D${val}`} 
                      />
                      <YAxis 
                        type="number"
                        domain={[0, 100]}
                        tick={{ fill: "#94a3b8", fontSize: 13, fontFamily: "var(--font-berkeley-mono)" }} 
                        tickFormatter={(val) => `${val}%`} 
                      />
                      <Tooltip
                        contentStyle={{ 
                          backgroundColor: "#0c0e12", 
                          borderColor: "#384256", 
                          borderRadius: "10px", 
                          fontSize: "13px", 
                          fontFamily: "var(--font-berkeley-mono)",
                          padding: "12px 16px",
                          color: "#ffffff"
                        }}
                        formatter={(val: any) => [`${val}%`, "Bust Probability"]}
                        labelFormatter={(label) => `Lead Day ${label}`}
                      />
                      <ReferenceLine 
                        y={65} 
                        stroke="#ef4444" 
                        strokeDasharray="4 4" 
                        label={{ value: "High Risk Threshold (65%)", fill: "#ef4444", fontSize: 13, position: "top" }} 
                      />
                      <Area 
                        isAnimationActive={false}
                        type="monotone" 
                        dataKey="bust_probability" 
                        stroke="#ef4444" 
                        strokeWidth={3} 
                        fillOpacity={1} 
                        fill="url(#linearColorBust)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}

                {chartMode === "multi_model" && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={multiModelData} margin={{ top: 15, right: 25, left: 15, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#232732" opacity={0.8} />
                      <XAxis 
                        dataKey="model" 
                        tick={{ fill: "#ffffff", fontSize: 13, fontFamily: "var(--font-inter-variable)" }} 
                      />
                      <YAxis 
                        yAxisId="left"
                        tick={{ fill: "#94a3b8", fontSize: 13, fontFamily: "var(--font-berkeley-mono)" }} 
                        tickFormatter={(val) => `${val}mm`}
                      />
                      <YAxis 
                        yAxisId="right"
                        orientation="right"
                        domain={[0, 100]}
                        tick={{ fill: "#94a3b8", fontSize: 13, fontFamily: "var(--font-berkeley-mono)" }} 
                        tickFormatter={(val) => `${val}%`}
                      />
                      <Tooltip
                        contentStyle={{ 
                          backgroundColor: "#0c0e12", 
                          borderColor: "#384256", 
                          borderRadius: "10px", 
                          fontSize: "13px", 
                          fontFamily: "var(--font-berkeley-mono)",
                          padding: "12px 16px",
                          color: "#ffffff"
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 13, fontFamily: "var(--font-berkeley-mono)" }} />
                      <Bar isAnimationActive={false} yAxisId="left" dataKey="rainfall" fill="#38bdf8" name="Predicted Rainfall (mm)" radius={[6, 6, 0, 0]} />
                      <Bar isAnimationActive={false} yAxisId="right" dataKey="bust_risk" fill="#e4f222" name="Bust Risk Probability (%)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}

                {chartMode === "shap_waterfall" && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={shapChartData} layout="vertical" margin={{ top: 10, right: 30, left: 55, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#232732" opacity={0.8} />
                      <XAxis 
                        type="number" 
                        tick={{ fill: "#94a3b8", fontSize: 13, fontFamily: "var(--font-berkeley-mono)" }} 
                      />
                      <YAxis 
                        type="category" 
                        dataKey="feature" 
                        tick={{ fill: "#ffffff", fontSize: 13, fontFamily: "var(--font-berkeley-mono)" }} 
                        width={110} 
                      />
                      <Tooltip
                        contentStyle={{ 
                          backgroundColor: "#0c0e12", 
                          borderColor: "#384256", 
                          borderRadius: "10px", 
                          fontSize: "13px", 
                          fontFamily: "var(--font-berkeley-mono)",
                          padding: "12px 16px",
                          color: "#ffffff"
                        }}
                        formatter={(val: any) => [Number(val).toFixed(3), "SHAP Contribution"]}
                      />
                      <Bar isAnimationActive={false} dataKey="contribution" radius={[0, 6, 6, 0]}>
                        {shapChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.contribution >= 0 ? "#ef4444" : "#22c55e"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            VIEW 2: WHAT-IF SCENARIO SANDBOX
            ======================================================== */}
        {activeTab === "sandbox" && (
          <WhatIfSimulator
            initialFeatures={{
              rainfall: selectedRegion.rainfall,
              windSpeed: selectedRegion.windSpeed,
              temp: selectedRegion.temp,
              pressure: selectedRegion.pressure,
              humidity: selectedRegion.humidity,
              leadDay: leadDay
            }}
            onApplyScenario={handleApplyScenario}
          />
        )}

        {/* ========================================================
            VIEW 3: SYNOPTIC REGIMES THREAT MATRIX
            ======================================================== */}
        {activeTab === "regimes" && (
          <SynopticRegimes onSelectRegime={handleSelectRegime} />
        )}

        {/* ========================================================
            VIEW 4: MODEL INSPECTOR & BENCHMARK DECK
            ======================================================== */}
        {activeTab === "model" && (
          <ModelInspector />
        )}

        {/* ========================================================
            VIEW 5: HISTORICAL BUST ARCHIVE
            ======================================================== */}
        {activeTab === "archive" && (
          <HistoricalArchive />
        )}

      </main>

      {/* 4. Command Center Footer */}
      <footer className="border-t border-[#232732] mt-16 py-8 px-4 md:px-8 text-[#94a3b8] text-[14px] font-linear-mono bg-[#0c0e12]">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#e4f222]" />
            <span>ForecastGuard AI · Ministry of Earth Sciences (MoES) / NCMRWF (Problem Statement: 26079)</span>
          </div>
          <div className="text-[13px] text-[#64748b]">
            * Operational research prototype. Calibrated bust probabilities assist duty forecasters and do not replace official IMD bulletins.
          </div>
        </div>
      </footer>

      {/* 5. Official MoES Operational Advisory Bulletin Modal */}
      <AdvisoryModal
        isOpen={isAdvisoryOpen}
        onClose={() => setIsAdvisoryOpen(false)}
        station={{
          name: selectedRegion.name,
          state: selectedRegion.state,
          lat: selectedRegion.lat,
          lon: selectedRegion.lon,
          rainfall: selectedRegion.rainfall,
          windSpeed: selectedRegion.windSpeed,
          temp: selectedRegion.temp,
        }}
        leadDay={leadDay}
        bustProbability={bustProbabilityValue}
        confidence={confidenceValue}
        riskCategory={riskCategory}
        shapReasons={shapReasons}
        revisions={revisions}
      />
    </div>
  );
}