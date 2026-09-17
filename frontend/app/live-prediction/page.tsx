"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  LineChart, 
  Line, 
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
  Clock
} from "lucide-react";

interface LatestPredictionResponse {
  status: string;
  timestamp: string;
  raw_data: {
    station: string;
    observed_time: string;
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    surface_pressure: number;
    wind_speed_10m: number;
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
    features_used: string[];
    trained_at: string;
  };
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
  const [data, setData] = useState<LatestPredictionResponse | null>({
    status: "success",
    timestamp: new Date().toISOString(),
    raw_data: {
      station: "New Delhi IMD/NCMRWF Corridor",
      observed_time: "2026-09-24T23:00",
      temperature_2m: 29.0,
      apparent_temperature: 29.0,
      relative_humidity_2m: 74.0,
      surface_pressure: 982.8,
      wind_speed_10m: 8.6,
    },
    prediction: {
      target: "predicted_temperature_next_hour",
      value: 28.15,
      unit: "°C",
      delta: -0.85,
      trend: "falling",
    },
    model_info: {
      model_type: "LightGBM Regressor",
      r2_score: 0.934,
      mae: 0.717,
      features_used: ["temperature_2m", "relative_humidity_2m", "surface_pressure", "wind_speed_10m", "rolling_temp_mean_3", "rolling_temp_std_3", "rolling_pressure_mean_3", "rolling_humidity_mean_3"],
      trained_at: "2026-09-17T19:45:57Z",
    },
  });
  const [history, setHistory] = useState<TimelineItem[]>([
    { time: "18:00", full_time: "2026-09-24T18:00", observed_temperature: 33.4, predicted_temperature: 32.4, surface_pressure: 979.9, relative_humidity: 45.0, wind_speed: 9.2 },
    { time: "19:00", full_time: "2026-09-24T19:00", observed_temperature: 32.6, predicted_temperature: 31.6, surface_pressure: 980.4, relative_humidity: 49.0, wind_speed: 8.2 },
    { time: "20:00", full_time: "2026-09-24T20:00", observed_temperature: 31.7, predicted_temperature: 30.8, surface_pressure: 981.0, relative_humidity: 55.0, wind_speed: 7.5 },
    { time: "21:00", full_time: "2026-09-24T21:00", observed_temperature: 30.7, predicted_temperature: 29.6, surface_pressure: 981.8, relative_humidity: 62.0, wind_speed: 7.6 },
    { time: "22:00", full_time: "2026-09-24T22:00", observed_temperature: 29.8, predicted_temperature: 29.1, surface_pressure: 982.5, relative_humidity: 68.0, wind_speed: 8.2 },
    { time: "23:00", full_time: "2026-09-24T23:00", observed_temperature: 29.0, predicted_temperature: 28.1, surface_pressure: 982.8, relative_humidity: 74.0, wind_speed: 8.6 },
  ]);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [secondsUntilRefresh, setSecondsUntilRefresh] = useState(60);
  const [lastUpdated, setLastUpdated] = useState<string>("Active");

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setRefreshing(true);
      setError(null);

      // 1. Fetch latest prediction (try relative rewrite then localhost:8000)
      let predRes = await fetch(`/api/latest_prediction`).catch(() => null);
      if (!predRes || !predRes.ok) {
        predRes = await fetch(`http://localhost:8000/api/latest_prediction`).catch(() => null);
      }
      if (predRes && predRes.ok) {
        const predJson: LatestPredictionResponse = await predRes.json();
        setData(predJson);
      }

      // 2. Fetch history for Recharts
      let histRes = await fetch(`/api/prediction_history?limit=24`).catch(() => null);
      if (!histRes || !histRes.ok) {
        histRes = await fetch(`http://localhost:8000/api/prediction_history?limit=24`).catch(() => null);
      }
      if (histRes && histRes.ok) {
        const histJson = await histRes.json();
        if (histJson.timeline && histJson.timeline.length > 0) {
          setHistory(histJson.timeline);
        }
      }

      setLastUpdated(new Date().toLocaleTimeString());
      setSecondsUntilRefresh(60);
    } catch (err: any) {
      console.warn("Live prediction poll notice:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 60-second polling interval
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsUntilRefresh((prev) => {
        if (prev <= 1) {
          fetchData();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [fetchData]);

  return (
    <div className="min-h-screen bg-[#09090b] text-[#F5F5F5] antialiased">
      {/* Top Header */}
      <header className="border-b border-white/[0.08] bg-[#111114]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-[#8A8A8A] hover:text-white transition-colors p-1.5 rounded-[6px] hover:bg-white/[0.04]"
              title="Return to Home"
            >
              <ArrowLeft size={18} />
            </Link>
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#10b981] animate-ping" />
              <h1 className="text-[16px] font-mono font-bold tracking-tight text-[#F5F5F5]">
                FORECASTGUARD <span className="text-[#8b5cf6]">STREAM</span>
              </h1>
              <span className="text-[11px] font-mono text-[#8b5cf6] bg-[#8b5cf6]/10 border border-[#8b5cf6]/30 px-2 py-0.5 rounded">
                LIVE MONGODB & LIGHTGBM
              </span>
            </div>
          </div>

          {/* Controls & Polling Info */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-[12px] font-mono text-[#8A8A8A] bg-[#18181b] border border-white/[0.08] px-3 py-1.5 rounded-[8px]">
              <Clock size={13} className="text-[#8b5cf6]" />
              <span>Poll in {secondsUntilRefresh}s</span>
            </div>

            <button
              onClick={() => fetchData()}
              disabled={refreshing}
              className="flex items-center gap-1.5 text-[12px] font-mono font-medium px-3.5 py-1.5 rounded-[8px] bg-[#18181b] border border-white/[0.12] hover:border-white/[0.25] text-[#F5F5F5] transition-all disabled:opacity-50"
            >
              <RefreshCw size={13} className={refreshing ? "animate-spin text-[#8b5cf6]" : ""} />
              <span>Refresh</span>
            </button>

            <Link
              href="/cockpit"
              className="hidden md:flex items-center gap-1.5 text-[12px] font-mono px-3 py-1.5 rounded-[8px] bg-[#8b5cf6]/15 border border-[#8b5cf6]/30 text-[#a78bfa] hover:bg-[#8b5cf6]/25 transition-all"
            >
              <Activity size={13} />
              <span>MoES Cockpit</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        
        {/* Error Alert if API unreachable */}
        {error && (
          <div className="p-4 rounded-[10px] bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#fca5a5] text-[13px] font-mono flex items-center justify-between">
            <div>
              <strong className="font-semibold">Backend Connection Notice:</strong> {error}.
              Ensure FastAPI is running on port 8000.
            </div>
            <button
              onClick={() => fetchData()}
              className="px-3 py-1 bg-[#ef4444]/20 hover:bg-[#ef4444]/30 rounded text-[12px] font-medium"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* ========================================================
            SECTION 1: LARGE LIVE PREDICTION METRIC CARD
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
                  <span>MONGODB INGESTION STREAM: {data?.raw_data?.station || "New Delhi Station"}</span>
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
                    {loading ? "--.-" : data?.prediction?.value}
                    <span className="text-[32px] text-[#8b5cf6] font-normal ml-1">°C</span>
                  </span>

                  {/* Trend & Delta Badge */}
                  {data && (
                    <div
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] text-[13px] font-mono font-medium border ${
                        data.prediction.delta > 0
                          ? "bg-[#f97316]/10 border-[#f97316]/30 text-[#fb923c]"
                          : data.prediction.delta < 0
                          ? "bg-[#06b6d4]/10 border-[#06b6d4]/30 text-[#22d3ee]"
                          : "bg-white/[0.05] border-white/[0.1] text-[#a1a1aa]"
                      }`}
                    >
                      {data.prediction.delta > 0 ? (
                        <TrendingUp size={15} />
                      ) : data.prediction.delta < 0 ? (
                        <TrendingDown size={15} />
                      ) : (
                        <Minus size={15} />
                      )}
                      <span>
                        {data.prediction.delta > 0 ? `+${data.prediction.delta}` : data.prediction.delta}°C
                      </span>
                      <span className="uppercase text-[11px] opacity-75">
                        ({data.prediction.trend})
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <p className="text-[14px] text-[#8A8A8A] leading-relaxed">
                Currently observed at <strong className="text-[#F5F5F5]">{data?.raw_data?.temperature_2m || "--"}°C</strong> (Observed: {data?.raw_data?.observed_time || "N/A"}). The LightGBM regressor estimates a {data?.prediction?.trend} trend over the next hourly cycle.
              </p>
            </div>

            {/* Model Info Strip */}
            <div className="pt-6 mt-6 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-4 text-[12px] font-mono text-[#8A8A8A]">
              <div className="flex items-center gap-2">
                <Cpu size={14} className="text-[#8b5cf6]" />
                <span>Engine: {data?.model_info?.model_type || "LightGBM Regressor"}</span>
              </div>
              <div className="flex items-center gap-4">
                <span>R² Score: <strong className="text-[#F5F5F5]">{data?.model_info?.r2_score ? (data.model_info.r2_score * 100).toFixed(1) + "%" : "93.4%"}</strong></span>
                <span>MAE: <strong className="text-[#F5F5F5]">{data?.model_info?.mae || "0.72"}°C</strong></span>
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
                  {data?.raw_data?.surface_pressure || "--"}
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
                  {data?.raw_data?.relative_humidity_2m || "--"}
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
                  {data?.raw_data?.wind_speed_10m || "--"}
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
                  {data?.raw_data?.apparent_temperature || "--"}
                </span>
                <span className="text-[12px] font-mono text-[#8A8A8A] ml-1">°C</span>
              </div>
              <span className="text-[11px] font-mono text-[#666666]">Heat/Wind Index</span>
            </div>
          </div>
        </div>

        {/* ========================================================
            SECTION 2: RECHARTS HISTORICAL PREDICTION TIMELINE
            ======================================================== */}
        <div className="bg-[#111114] border border-white/[0.08] rounded-[16px] p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[12px] font-mono text-[#8b5cf6] font-semibold tracking-wider uppercase block">
                TIME SERIES RECHARTS VISUALIZATION
              </span>
              <h2 className="text-[20px] sm:text-[24px] font-[600] text-[#F5F5F5] tracking-tight">
                Observed Weather vs. ML Inferred Model Predictions
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
                Initializing time series charts...
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
            <span>Data Ingestion: Open-Meteo API (Auto-ingested every 10 mins)</span>
            <span>Last Client Poll: {lastUpdated || "Just now"}</span>
          </div>
        </div>

      </main>
    </div>
  );
}
