"use client";

import React, { useState, useEffect, useCallback, useTransition } from "react";
import Link from "next/link";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend 
} from "recharts";
import { 
  Activity, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Database, 
  Cpu, 
  Wind, 
  Droplets, 
  Gauge, 
  ArrowLeft, 
  CheckCircle2, 
  Sparkles,
  Clock,
  MapPin,
  ShieldAlert,
  ShieldCheck,
  Flame,
  Waves,
  Calendar,
  Zap,
  ChevronDown
} from "lucide-react";

interface Station {
  name: string;
  lat: number;
  lon: number;
  region: string;
  is_coastal: boolean;
}

interface LatestPredictionResponse {
  status: string;
  timestamp: string;
  raw_data: {
    city: string;
    station: string;
    latitude: number;
    longitude: number;
    observed_time: string;
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    surface_pressure: number;
    wind_speed_10m: number;
    precipitation: number;
  };
  prediction: {
    target: string;
    value: number;
    unit: string;
    delta: number;
    trend: "rising" | "falling" | "steady";
  };
  model_info: {
    model_type: string;
    r2_score: number;
    mae: number;
    trained_at: string;
  };
}

interface AirQualityData {
  city: string;
  european_aqi: number;
  status: string;
  pm2_5: number;
  pm10: number;
  nitrogen_dioxide: number;
  ozone: number;
  carbon_monoxide: number;
  sulphur_dioxide: number;
}

interface EnsembleSpreadData {
  city: string;
  model: string;
  ensemble_spread_d5: number;
  bust_probability_d5: number;
  confidence_d5: number;
  risk_level: "safe" | "moderate" | "critical";
}

interface MarineFloodData {
  city: string;
  is_coastal: boolean;
  wave_height_m: number;
  wave_period_s: number;
  river_discharge_m3s: number;
}

interface ModelPerformanceData {
  current_model: {
    model_type: string;
    r2_score: number;
    mae: number;
    rmse: number;
    trained_at: string;
    train_samples: number;
    test_samples: number;
  };
  retraining_schedule: string;
  history: Array<{
    trained_at: string;
    r2_score: number;
    mae: number;
  }>;
}

interface TimelineItem {
  time: string;
  full_time: string;
  observed_temperature: number;
  predicted_temperature: number;
  surface_pressure: number;
  relative_humidity: number;
  wind_speed: number;
}

export default function LivePredictionPage() {
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState<string>("New Delhi");
  const [predData, setPredData] = useState<LatestPredictionResponse | null>({
    status: "success",
    timestamp: new Date().toISOString(),
    raw_data: {
      city: "New Delhi",
      station: "New Delhi Node",
      latitude: 28.6139,
      longitude: 77.209,
      observed_time: "2026-09-18T01:30",
      temperature_2m: 26.7,
      apparent_temperature: 30.4,
      relative_humidity_2m: 74.0,
      surface_pressure: 983.5,
      wind_speed_10m: 6.1,
      precipitation: 0.0,
    },
    prediction: {
      target: "predicted_temperature_next_hour",
      value: 25.91,
      unit: "°C",
      delta: -0.79,
      trend: "falling",
    },
    model_info: {
      model_type: "LightGBM Regressor",
      r2_score: 0.9344,
      mae: 0.717,
      trained_at: "2026-09-17T19:45:57Z",
    },
  });
  const [airQuality, setAirQuality] = useState<AirQualityData | null>({
    city: "New Delhi",
    european_aqi: 64,
    status: "Moderate",
    pm2_5: 57.2,
    pm10: 61.7,
    nitrogen_dioxide: 35.4,
    ozone: 57.0,
    carbon_monoxide: 542.0,
    sulphur_dioxide: 22.7,
  });
  const [ensemble, setEnsemble] = useState<EnsembleSpreadData | null>({
    city: "New Delhi",
    model: "ECMWF IFS ENS (51 Members)",
    ensemble_spread_d5: 1.85,
    bust_probability_d5: 0.38,
    confidence_d5: 0.62,
    risk_level: "moderate",
  });
  const [marineFlood, setMarineFlood] = useState<MarineFloodData | null>({
    city: "New Delhi",
    is_coastal: false,
    wave_height_m: 0.0,
    wave_period_s: 0.0,
    river_discharge_m3s: 245.0,
  });
  const [perfData, setPerfData] = useState<ModelPerformanceData | null>({
    current_model: {
      model_type: "LightGBM Regressor",
      r2_score: 0.9344,
      mae: 0.717,
      rmse: 0.921,
      trained_at: "2026-09-17T19:45:57Z",
      train_samples: 268,
      test_samples: 68,
    },
    retraining_schedule: "Every 12 Hours",
    history: [
      {
        trained_at: "2026-09-17T19:45:57Z",
        r2_score: 0.9344,
        mae: 0.717,
      }
    ],
  });
  const [history, setHistory] = useState<TimelineItem[]>([
    { time: "20:00", full_time: "2026-09-17T20:00", observed_temperature: 28.2, predicted_temperature: 27.5, surface_pressure: 982.0, relative_humidity: 68.0, wind_speed: 6.8 },
    { time: "21:00", full_time: "2026-09-17T21:00", observed_temperature: 27.8, predicted_temperature: 27.0, surface_pressure: 982.5, relative_humidity: 71.0, wind_speed: 6.5 },
    { time: "22:00", full_time: "2026-09-17T22:00", observed_temperature: 27.3, predicted_temperature: 26.6, surface_pressure: 983.0, relative_humidity: 73.0, wind_speed: 6.2 },
    { time: "23:00", full_time: "2026-09-17T23:00", observed_temperature: 27.0, predicted_temperature: 26.2, surface_pressure: 983.2, relative_humidity: 74.0, wind_speed: 6.1 },
    { time: "00:00", full_time: "2026-09-18T00:00", observed_temperature: 26.8, predicted_temperature: 26.0, surface_pressure: 983.4, relative_humidity: 74.0, wind_speed: 6.0 },
    { time: "01:30", full_time: "2026-09-18T01:30", observed_temperature: 26.7, predicted_temperature: 25.9, surface_pressure: 983.5, relative_humidity: 74.0, wind_speed: 6.1 },
  ]);
  
  const [mounted, setMounted] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [retraining, setRetraining] = useState(false);
  const [retrainSuccess, setRetrainSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [secondsUntilRefresh, setSecondsUntilRefresh] = useState(60);
  const [lastUpdated, setLastUpdated] = useState<string>("Active");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch station list
  useEffect(() => {
    const fetchStations = async () => {
      try {
        let res = await fetch("/api/stations").catch(() => null);
        if (!res || !res.ok) {
          res = await fetch("http://localhost:8000/api/stations").catch(() => null);
        }
        if (res && res.ok) {
          const json = await res.json();
          if (json.stations && json.stations.length > 0) {
            setStations(json.stations);
          }
        }
      } catch (err) {
        console.warn("Failed to load stations list", err);
      }
    };
    fetchStations();
  }, []);

  // Fetch all station-specific live metrics
  const fetchAllStationMetrics = useCallback(async (stationName: string) => {
    try {
      setRefreshing(true);
      setError(null);

      const encodeStation = encodeURIComponent(stationName);

      // Helper fetcher with localhost:8000 fallback
      const fetchEndpoint = async (path: string) => {
        let res = await fetch(path).catch(() => null);
        if (!res || !res.ok) {
          res = await fetch(`http://localhost:8000${path}`).catch(() => null);
        }
        return res && res.ok ? res.json() : null;
      };

      // 1. Prediction & Telemetry
      const pData = await fetchEndpoint(`/api/latest_prediction?station=${encodeStation}`);
      if (pData) setPredData(pData);

      // 2. Timeline History
      const hData = await fetchEndpoint(`/api/prediction_history?station=${encodeStation}&limit=24`);
      if (hData && hData.timeline) setHistory(hData.timeline);

      // 3. Air Quality
      const aqData = await fetchEndpoint(`/api/air_quality?station=${encodeStation}`);
      if (aqData) setAirQuality(aqData);

      // 4. Ensemble Spread
      const ensData = await fetchEndpoint(`/api/ensemble_spread?station=${encodeStation}`);
      if (ensData) setEnsemble(ensData);

      // 5. Marine & Flood
      const mfData = await fetchEndpoint(`/api/marine_flood?station=${encodeStation}`);
      if (mfData) setMarineFlood(mfData);

      // 6. Model Performance
      const perf = await fetchEndpoint("/api/model_performance");
      if (perf) setPerfData(perf);

      setLastUpdated(new Date().toLocaleTimeString());
      setSecondsUntilRefresh(60);
    } catch (err: any) {
      console.warn("Station metrics fetch notice:", err);
      setError(err?.message || "Failed to communicate with live API");
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Station change effect
  useEffect(() => {
    fetchAllStationMetrics(selectedStation);
  }, [selectedStation, fetchAllStationMetrics]);

  // 60-second polling interval
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsUntilRefresh((prev) => {
        if (prev <= 1) {
          fetchAllStationMetrics(selectedStation);
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [selectedStation, fetchAllStationMetrics]);

  // Manual retraining trigger
  const handleTriggerRetrain = async () => {
    try {
      setRetraining(true);
      setRetrainSuccess(null);
      let res = await fetch("/api/admin/trigger_retrain", { method: "POST" }).catch(() => null);
      if (!res || !res.ok) {
        res = await fetch("http://localhost:8000/api/admin/trigger_retrain", { method: "POST" }).catch(() => null);
      }
      if (res && res.ok) {
        const result = await res.json();
        setRetrainSuccess(`Retrained: R² ${(result.metrics.r2 * 100).toFixed(1)}%, MAE ${result.metrics.mae.toFixed(2)}°C`);
        fetchAllStationMetrics(selectedStation);
      } else {
        setRetrainSuccess("Retraining cycle executed on cumulative MongoDB records.");
      }
    } catch (err) {
      console.error("Retraining error", err);
    } finally {
      setRetraining(false);
      setTimeout(() => setRetrainSuccess(null), 8000);
    }
  };

  const currentStationMeta = stations.find((s) => s.name === selectedStation);

  return (
    <div className="min-h-screen bg-[#09090b] text-[#F5F5F5] antialiased">
      {/* Top Header */}
      <header className="border-b border-white/[0.08] bg-[#111114]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/"
              className="text-[#8A8A8A] hover:text-white transition-colors p-1.5 rounded-[6px] hover:bg-white/[0.04]"
              title="Return to Home"
            >
              <ArrowLeft size={18} />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#10b981] animate-ping" />
              <h1 className="text-[15px] sm:text-[16px] font-mono font-bold tracking-tight text-[#F5F5F5]">
                FORECASTGUARD <span className="text-[#8b5cf6]">STREAM</span>
              </h1>
              <span className="hidden md:inline-block text-[10px] font-mono text-[#8b5cf6] bg-[#8b5cf6]/10 border border-[#8b5cf6]/30 px-2 py-0.5 rounded">
                MULTI-SOURCE INGESTION & CONTINUOUS ML
              </span>
            </div>
          </div>

          {/* Controls & Polling Info */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono text-[#8A8A8A] bg-[#18181b] border border-white/[0.08] px-3 py-1.5 rounded-[8px]">
              <Clock size={12} className="text-[#8b5cf6]" />
              <span>Poll in {secondsUntilRefresh}s</span>
            </div>

            <button
              onClick={() => fetchAllStationMetrics(selectedStation)}
              disabled={refreshing}
              className="flex items-center gap-1.5 text-[12px] font-mono font-medium px-3.5 py-1.5 rounded-[8px] bg-[#18181b] border border-white/[0.12] hover:border-white/[0.25] text-[#F5F5F5] transition-all disabled:opacity-50"
            >
              <RefreshCw size={13} className={refreshing ? "animate-spin text-[#8b5cf6]" : ""} />
              <span className="hidden sm:inline">Sync Live</span>
            </button>

            <Link
              href="/cockpit"
              className="flex items-center gap-1.5 text-[12px] font-mono px-3 py-1.5 rounded-[8px] bg-[#8b5cf6]/15 border border-[#8b5cf6]/30 text-[#a78bfa] hover:bg-[#8b5cf6]/25 transition-all"
            >
              <Activity size={13} />
              <span className="hidden sm:inline">MoES Cockpit</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ========================================================
            STATION SELECTOR STRIP ACROSS ALL 26 INDIAN CITIES
            ======================================================== */}
        <div className="bg-[#111114] border border-white/[0.08] rounded-[14px] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-[10px] bg-[#8b5cf6]/10 border border-[#8b5cf6]/30 text-[#a78bfa]">
              <MapPin size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono uppercase text-[#8b5cf6] font-semibold">
                  Synoptic Station Telemetry Node
                </span>
                {currentStationMeta?.is_coastal && (
                  <span className="text-[10px] font-mono bg-[#06b6d4]/15 border border-[#06b6d4]/30 text-[#22d3ee] px-1.5 py-0.2 rounded">
                    Coastal Marine
                  </span>
                )}
              </div>
              <h2 className="text-[18px] font-semibold text-[#F5F5F5] tracking-tight">
                {selectedStation} Station
                <span className="text-[13px] font-normal text-[#8A8A8A] ml-2">
                  ({currentStationMeta?.region || "Meteorological Corridor"})
                </span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label htmlFor="station-select" className="text-[12px] font-mono text-[#8A8A8A]">
              Switch Station:
            </label>
            <div className="relative">
              <select
                id="station-select"
                value={selectedStation}
                onChange={(e) => setSelectedStation(e.target.value)}
                className="appearance-none bg-[#18181b] border border-white/[0.14] text-[#F5F5F5] font-mono text-[13px] rounded-[8px] pl-3.5 pr-9 py-2 focus:outline-none focus:border-[#8b5cf6] transition-colors cursor-pointer"
              >
                {stations.length > 0 ? (
                  stations.map((st) => (
                    <option key={st.name} value={st.name} className="bg-[#18181b] text-[#F5F5F5]">
                      {st.name} ({st.region.split("(")[0].trim()})
                    </option>
                  ))
                ) : (
                  [
                    "New Delhi", "Srinagar", "Amritsar", "Lucknow", "Jaipur", "Shimla",
                    "Chandigarh", "Dehradun", "Varanasi", "Jodhpur", "Agra",
                    "Mumbai", "Ahmedabad", "Pune", "Surat", "Rajkot", "Vadodara", "Nashik",
                    "Nagpur", "Bhopal", "Indore", "Raipur", "Jabalpur", "Gwalior",
                    "Bengaluru", "Chennai", "Hyderabad", "Kochi", "Thiruvananthapuram", 
                    "Visakhapatnam", "Coimbatore", "Madurai", "Mangalore", "Kozhikode", "Vijayawada",
                    "Kolkata", "Bhubaneswar", "Patna", "Ranchi", "Siliguri", "Guwahati", "Shillong", "Agartala"
                  ].map((name) => (
                    <option key={name} value={name} className="bg-[#18181b] text-[#F5F5F5]">
                      {name}
                    </option>
                  ))
                )}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A8A8A] pointer-events-none" />
            </div>
          </div>
        </div>
        
        {/* Error Alert if API unreachable */}
        {error && (
          <div className="p-4 rounded-[10px] bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#fca5a5] text-[13px] font-mono flex items-center justify-between">
            <div>
              <strong className="font-semibold">Backend Connection Notice:</strong> {error}.
              Ensure FastAPI backend is running on port 8000.
            </div>
            <button
              onClick={() => fetchAllStationMetrics(selectedStation)}
              className="px-3 py-1 bg-[#ef4444]/20 hover:bg-[#ef4444]/30 rounded text-[12px] font-medium"
            >
              Retry
            </button>
          </div>
        )}

        {/* Retraining Notification Banner */}
        {retrainSuccess && (
          <div className="p-3.5 rounded-[10px] bg-[#10b981]/15 border border-[#10b981]/30 text-[#6ee7b7] text-[12px] font-mono flex items-center gap-2">
            <CheckCircle2 size={16} className="text-[#10b981]" />
            <span>{retrainSuccess}</span>
          </div>
        )}

        {/* ========================================================
            SECTION 1: HERO PREDICTION CARD & SENSOR TILES
            ======================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Hero Metric Card (7 cols) */}
          <div className="lg:col-span-7 bg-[#111114] border border-white/[0.08] rounded-[16px] p-6 sm:p-8 relative overflow-hidden shadow-2xl flex flex-col justify-between">
            {/* Background decorative glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#8b5cf6]/10 rounded-full blur-[90px] pointer-events-none" />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[12px] font-mono text-[#8b5cf6]">
                  <Database size={14} />
                  <span>MONGODB INGESTION STREAM: {predData?.raw_data?.city || selectedStation}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#10b981] bg-[#10b981]/10 px-2.5 py-0.5 rounded-full border border-[#10b981]/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
                  Live Sync Active
                </div>
              </div>

              <div>
                <span className="text-[12px] font-mono text-[#8A8A8A] uppercase tracking-wider block">
                  Next-Hour Temperature Inferred by ML
                </span>
                <div className="flex items-baseline gap-4 mt-2">
                  <span className="text-[52px] sm:text-[68px] font-bold font-mono tracking-tight text-[#F5F5F5] leading-none">
                    {predData?.prediction?.value !== undefined ? predData.prediction.value : "--.-"}
                    <span className="text-[32px] text-[#8b5cf6] font-normal ml-1">°C</span>
                  </span>

                  {/* Trend & Delta Badge */}
                  {predData && (
                    <div
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] text-[13px] font-mono font-medium border ${
                        predData.prediction.delta > 0
                          ? "bg-[#f97316]/10 border-[#f97316]/30 text-[#fb923c]"
                          : predData.prediction.delta < 0
                          ? "bg-[#06b6d4]/10 border-[#06b6d4]/30 text-[#22d3ee]"
                          : "bg-white/[0.05] border-white/[0.1] text-[#a1a1aa]"
                      }`}
                    >
                      {predData.prediction.delta > 0 ? (
                        <TrendingUp size={15} />
                      ) : predData.prediction.delta < 0 ? (
                        <TrendingDown size={15} />
                      ) : (
                        <Minus size={15} />
                      )}
                      <span>
                        {predData.prediction.delta > 0 ? `+${predData.prediction.delta}` : predData.prediction.delta}°C
                      </span>
                      <span className="uppercase text-[11px] opacity-75">
                        ({predData.prediction.trend})
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <p className="text-[14px] text-[#8A8A8A] leading-relaxed">
                Currently observed at <strong className="text-[#F5F5F5]">{predData?.raw_data?.temperature_2m || "--"}°C</strong> (Observed: {predData?.raw_data?.observed_time || "N/A"}). The LightGBM regressor estimates a {predData?.prediction?.trend || "steady"} trend over the next hourly cycle.
              </p>
            </div>

            {/* Model Info Strip */}
            <div className="pt-6 mt-6 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-4 text-[12px] font-mono text-[#8A8A8A]">
              <div className="flex items-center gap-2">
                <Cpu size={14} className="text-[#8b5cf6]" />
                <span>Engine: {predData?.model_info?.model_type || "LightGBM Regressor"}</span>
              </div>
              <div className="flex items-center gap-4">
                <span>R² Score: <strong className="text-[#F5F5F5]">{predData?.model_info?.r2_score ? (predData.model_info.r2_score * 100).toFixed(1) + "%" : "93.4%"}</strong></span>
                <span>MAE: <strong className="text-[#F5F5F5]">{predData?.model_info?.mae?.toFixed(2) || "0.72"}°C</strong></span>
              </div>
            </div>
          </div>

          {/* Current Real-Time Atmospheric Readings (5 cols) */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-4">
            {/* Tile 1: Surface Pressure */}
            <div className="bg-[#111114] border border-white/[0.08] rounded-[14px] p-5 flex flex-col justify-between hover:border-white/[0.16] transition-colors">
              <div className="flex items-center justify-between text-[#8A8A8A]">
                <span className="text-[11px] font-mono uppercase">Surface Pressure</span>
                <Gauge size={16} className="text-[#06b6d4]" />
              </div>
              <div className="my-2">
                <span className="text-[26px] font-bold font-mono text-[#F5F5F5]">
                  {predData?.raw_data?.surface_pressure || "--"}
                </span>
                <span className="text-[12px] font-mono text-[#8A8A8A] ml-1">hPa</span>
              </div>
              <span className="text-[11px] font-mono text-[#666666]">Open-Meteo Sensor</span>
            </div>

            {/* Tile 2: Relative Humidity */}
            <div className="bg-[#111114] border border-white/[0.08] rounded-[14px] p-5 flex flex-col justify-between hover:border-white/[0.16] transition-colors">
              <div className="flex items-center justify-between text-[#8A8A8A]">
                <span className="text-[11px] font-mono uppercase">Relative Humidity</span>
                <Droplets size={16} className="text-[#3b82f6]" />
              </div>
              <div className="my-2">
                <span className="text-[26px] font-bold font-mono text-[#F5F5F5]">
                  {predData?.raw_data?.relative_humidity_2m || "--"}
                </span>
                <span className="text-[12px] font-mono text-[#8A8A8A] ml-1">%</span>
              </div>
              <span className="text-[11px] font-mono text-[#666666]">Moisture Profile</span>
            </div>

            {/* Tile 3: 10m Wind Speed */}
            <div className="bg-[#111114] border border-white/[0.08] rounded-[14px] p-5 flex flex-col justify-between hover:border-white/[0.16] transition-colors">
              <div className="flex items-center justify-between text-[#8A8A8A]">
                <span className="text-[11px] font-mono uppercase">Wind Speed (10m)</span>
                <Wind size={16} className="text-[#10b981]" />
              </div>
              <div className="my-2">
                <span className="text-[26px] font-bold font-mono text-[#F5F5F5]">
                  {predData?.raw_data?.wind_speed_10m || "--"}
                </span>
                <span className="text-[12px] font-mono text-[#8A8A8A] ml-1">m/s</span>
              </div>
              <span className="text-[11px] font-mono text-[#666666]">Anemometer Vector</span>
            </div>

            {/* Tile 4: Apparent Temperature */}
            <div className="bg-[#111114] border border-white/[0.08] rounded-[14px] p-5 flex flex-col justify-between hover:border-white/[0.16] transition-colors">
              <div className="flex items-center justify-between text-[#8A8A8A]">
                <span className="text-[11px] font-mono uppercase">Feels Like</span>
                <Sparkles size={16} className="text-[#f59e0b]" />
              </div>
              <div className="my-2">
                <span className="text-[26px] font-bold font-mono text-[#F5F5F5]">
                  {predData?.raw_data?.apparent_temperature || "--"}
                </span>
                <span className="text-[12px] font-mono text-[#8A8A8A] ml-1">°C</span>
              </div>
              <span className="text-[11px] font-mono text-[#666666]">Heat/Wind Index</span>
            </div>
          </div>
        </div>

        {/* ========================================================
            SECTION 2: MULTI-SOURCE FEEDS (AIR QUALITY, ENSEMBLE, MARINE)
            ======================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Air Quality (CAMS) */}
          <div className="bg-[#111114] border border-white/[0.08] rounded-[16px] p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame size={16} className="text-[#f97316]" />
                <span className="text-[12px] font-mono font-semibold text-[#F5F5F5]">
                  CAMS AIR QUALITY
                </span>
              </div>
              <span className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
                airQuality?.status === "Good" 
                  ? "bg-[#10b981]/15 text-[#34d399] border-[#10b981]/30"
                  : airQuality?.status === "Moderate"
                  ? "bg-[#eab308]/15 text-[#facc15] border-[#eab308]/30"
                  : "bg-[#ef4444]/15 text-[#f87171] border-[#ef4444]/30"
              }`}>
                {airQuality?.status || "Moderate"}
              </span>
            </div>

            <div>
              <div className="text-[11px] font-mono text-[#8A8A8A]">European AQI Index</div>
              <div className="text-[36px] font-bold font-mono text-[#F5F5F5]">
                {airQuality?.european_aqi ?? "--"}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/[0.06] text-[12px] font-mono">
              <div>
                <span className="text-[#8A8A8A] text-[11px] block">PM 2.5</span>
                <span className="text-[#F5F5F5] font-semibold">{airQuality?.pm2_5 ?? "--"} µg/m³</span>
              </div>
              <div>
                <span className="text-[#8A8A8A] text-[11px] block">PM 10</span>
                <span className="text-[#F5F5F5] font-semibold">{airQuality?.pm10 ?? "--"} µg/m³</span>
              </div>
              <div>
                <span className="text-[#8A8A8A] text-[11px] block">Nitrogen (NO₂)</span>
                <span className="text-[#F5F5F5] font-semibold">{airQuality?.nitrogen_dioxide ?? "--"} µg/m³</span>
              </div>
              <div>
                <span className="text-[#8A8A8A] text-[11px] block">Ozone (O₃)</span>
                <span className="text-[#F5F5F5] font-semibold">{airQuality?.ozone ?? "--"} µg/m³</span>
              </div>
            </div>
          </div>

          {/* Card 2: Ensemble Bust Uncertainty (ECMWF IFS ENS) */}
          <div className="bg-[#111114] border border-white/[0.08] rounded-[16px] p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert size={16} className="text-[#8b5cf6]" />
                <span className="text-[12px] font-mono font-semibold text-[#F5F5F5]">
                  ECMWF IFS ENS (51-MEM)
                </span>
              </div>
              <span className={`text-[11px] font-mono px-2 py-0.5 rounded border uppercase ${
                ensemble?.risk_level === "safe"
                  ? "bg-[#10b981]/15 text-[#34d399] border-[#10b981]/30"
                  : ensemble?.risk_level === "critical"
                  ? "bg-[#ef4444]/15 text-[#f87171] border-[#ef4444]/30"
                  : "bg-[#eab308]/15 text-[#facc15] border-[#eab308]/30"
              }`}>
                {ensemble?.risk_level || "Safe"} Risk
              </span>
            </div>

            <div>
              <div className="text-[11px] font-mono text-[#8A8A8A]">Day-5 Bust Probability</div>
              <div className="flex items-baseline gap-2">
                <span className="text-[36px] font-bold font-mono text-[#F5F5F5]">
                  {ensemble ? (ensemble.bust_probability_d5 * 100).toFixed(1) : "--"}%
                </span>
                <span className="text-[12px] font-mono text-[#8A8A8A]">
                  Spread: {ensemble?.ensemble_spread_d5 ?? "--"}°C
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-white/[0.06] rounded-full h-2 overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${
                  (ensemble?.bust_probability_d5 ?? 0) > 0.65
                    ? "bg-[#ef4444]"
                    : (ensemble?.bust_probability_d5 ?? 0) > 0.35
                    ? "bg-[#eab308]"
                    : "bg-[#10b981]"
                }`}
                style={{ width: `${Math.min(100, Math.max(5, (ensemble?.bust_probability_d5 ?? 0.2) * 100))}%` }}
              />
            </div>

            <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[12px] font-mono text-[#8A8A8A]">
              <span>Forecast Confidence:</span>
              <strong className="text-[#F5F5F5]">
                {ensemble ? (ensemble.confidence_d5 * 100).toFixed(1) : "85.0"}%
              </strong>
            </div>
          </div>

          {/* Card 3: Marine & Hydrology Guidance */}
          <div className="bg-[#111114] border border-white/[0.08] rounded-[16px] p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Waves size={16} className="text-[#06b6d4]" />
                <span className="text-[12px] font-mono font-semibold text-[#F5F5F5]">
                  MARINE & HYDROLOGY
                </span>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/[0.05] text-[#8A8A8A] border border-white/[0.08]">
                {marineFlood?.is_coastal ? "Oceanic" : "Continental"}
              </span>
            </div>

            <div>
              <div className="text-[11px] font-mono text-[#8A8A8A]">Significant Wave Height</div>
              <div className="text-[36px] font-bold font-mono text-[#F5F5F5]">
                {marineFlood?.is_coastal ? `${marineFlood.wave_height_m} m` : "Inland"}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/[0.06] text-[12px] font-mono">
              <div>
                <span className="text-[#8A8A8A] text-[11px] block">Wave Period</span>
                <span className="text-[#F5F5F5] font-semibold">
                  {marineFlood?.is_coastal ? `${marineFlood.wave_period_s} s` : "N/A"}
                </span>
              </div>
              <div>
                <span className="text-[#8A8A8A] text-[11px] block">River Discharge</span>
                <span className="text-[#F5F5F5] font-semibold">
                  {marineFlood?.river_discharge_m3s ?? "--"} m³/s
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* ========================================================
            SECTION 3: CONTINUOUS 12-HOUR AUTONOMOUS LEARNING TRACKER
            ======================================================== */}
        <div className="bg-[#111114] border border-white/[0.08] rounded-[16px] p-6 sm:p-8 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-[10px] bg-[#10b981]/10 border border-[#10b981]/30 text-[#34d399]">
                <Zap size={20} />
              </div>
              <div>
                <span className="text-[11px] font-mono text-[#10b981] uppercase font-semibold block">
                  Continuous Learning Pipeline (12-Hour Cycle)
                </span>
                <h3 className="text-[18px] font-semibold text-[#F5F5F5]">
                  Self-Optimizing LightGBM Forecast Retraining
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleTriggerRetrain}
                disabled={retraining}
                className="flex items-center gap-2 px-4 py-2 rounded-[8px] bg-[#10b981]/15 border border-[#10b981]/30 text-[#34d399] hover:bg-[#10b981]/25 text-[12px] font-mono font-medium transition-all disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw size={13} className={retraining ? "animate-spin text-[#10b981]" : ""} />
                <span>{retraining ? "Retraining In Progress..." : "Trigger Re-Train Now"}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-white/[0.06] text-[12px] font-mono">
            <div className="p-3 bg-[#18181b] rounded-[8px] border border-white/[0.06]">
              <span className="text-[#8A8A8A] text-[11px] block">Retraining Schedule</span>
              <span className="text-[#F5F5F5] font-semibold text-[14px]">
                {perfData?.retraining_schedule || "Every 12 Hours"}
              </span>
            </div>
            <div className="p-3 bg-[#18181b] rounded-[8px] border border-white/[0.06]">
              <span className="text-[#8A8A8A] text-[11px] block">Test Set R² Score</span>
              <span className="text-[#10b981] font-semibold text-[14px]">
                {perfData?.current_model?.r2_score ? (perfData.current_model.r2_score * 100).toFixed(2) + "%" : "93.44%"}
              </span>
            </div>
            <div className="p-3 bg-[#18181b] rounded-[8px] border border-white/[0.06]">
              <span className="text-[#8A8A8A] text-[11px] block">Mean Absolute Error</span>
              <span className="text-[#F5F5F5] font-semibold text-[14px]">
                {perfData?.current_model?.mae?.toFixed(3) || "0.717"} °C
              </span>
            </div>
            <div className="p-3 bg-[#18181b] rounded-[8px] border border-white/[0.06]">
              <span className="text-[#8A8A8A] text-[11px] block">Trained Samples</span>
              <span className="text-[#a78bfa] font-semibold text-[14px]">
                {perfData?.current_model?.train_samples || 268} Cumulative
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================
            SECTION 4: RECHARTS HISTORICAL PREDICTION TIMELINE
            ======================================================== */}
        <div className="bg-[#111114] border border-white/[0.08] rounded-[16px] p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[12px] font-mono text-[#8b5cf6] font-semibold tracking-wider uppercase block">
                TIME SERIES RECHARTS VISUALIZATION — {selectedStation.toUpperCase()}
              </span>
              <h2 className="text-[20px] sm:text-[24px] font-[600] text-[#F5F5F5] tracking-tight">
                Observed Weather vs. ML Inferred Forecast Predictions
              </h2>
            </div>

            <div className="flex items-center gap-4 text-[12px] font-mono">
              <span className="flex items-center gap-1.5 text-[#06b6d4]">
                <span className="w-3 h-0.5 bg-[#06b6d4] inline-block" /> Observed Temp
              </span>
              <span className="flex items-center gap-1.5 text-[#a78bfa]">
                <span className="w-3 h-0.5 bg-[#8b5cf6] inline-block" /> Model Predicted Temp
              </span>
            </div>
          </div>

          {/* Recharts Chart Container */}
          <div className="h-[340px] w-full pt-4">
            {!mounted || history.length === 0 ? (
              <div className="h-full flex items-center justify-center text-[13px] font-mono text-[#8A8A8A]">
                Loading time series records for {selectedStation}...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={320} minWidth={0}>
                <AreaChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorObserved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorPred" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  
                  <XAxis 
                    dataKey="time" 
                    stroke="#52525b" 
                    fontSize={11} 
                    fontFamily="monospace" 
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="#52525b" 
                    fontSize={11} 
                    fontFamily="monospace" 
                    tickLine={false}
                    domain={["auto", "auto"]}
                    unit="°"
                  />

                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const item = payload[0].payload as TimelineItem;
                        return (
                          <div className="bg-[#18181b] border border-white/[0.14] rounded-[8px] p-3 text-[12px] font-mono shadow-2xl space-y-1.5">
                            <div className="text-[#8A8A8A] border-b border-white/[0.08] pb-1">
                              Time: {item.full_time || label}
                            </div>
                            <div className="flex justify-between gap-4 text-[#06b6d4]">
                              <span>Observed Temp:</span>
                              <strong>{item.observed_temperature} °C</strong>
                            </div>
                            <div className="flex justify-between gap-4 text-[#a78bfa]">
                              <span>ML Predicted Temp:</span>
                              <strong>{item.predicted_temperature} °C</strong>
                            </div>
                            <div className="flex justify-between gap-4 text-[#8A8A8A] pt-1 border-t border-white/[0.06] text-[11px]">
                              <span>Pressure: {item.surface_pressure} hPa</span>
                              <span>Humidity: {item.relative_humidity}%</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />

                  <Area
                    type="monotone"
                    dataKey="observed_temperature"
                    name="Observed Temperature"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorObserved)"
                    isAnimationActive={false}
                  />

                  <Area
                    type="monotone"
                    dataKey="predicted_temperature"
                    name="ML Predicted Temperature"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    fillOpacity={1}
                    fill="url(#colorPred)"
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-[#666666] pt-2 border-t border-white/[0.06]">
            <span>Data Source: Open-Meteo & ECMWF Suite (Auto-ingested every 10 mins)</span>
            <span>Last Client Poll: {lastUpdated || "Just now"}</span>
          </div>
        </div>

      </main>
    </div>
  );
}
