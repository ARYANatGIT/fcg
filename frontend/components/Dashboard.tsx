"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Map, { Marker } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  Activity, Clock, MapPin, Server,
  Info, TrendingUp, RefreshCw,
  BarChart3, Sparkles, Navigation,
  Terminal, ShieldCheck
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine, Cell
} from "recharts";
import { analyzeForecast, getHealth, getSpatialGrid } from "@/lib/api";
import { AnalysisResponse, StationData } from "@/lib/types";

interface RegionPreset {
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
}

const REGIONS: RegionPreset[] = [
  { id: "demo", name: "Waranga", state: "Maharashtra (Central)", lat: 20.0, lon: 80.0, rainfall: 42.5, windSpeed: 6.8, temp: 24.5, pressure: 1008.0, humidity: 82.0 },
  { id: "west", name: "Ahmedabad", state: "Gujarat (West)", lat: 23.0, lon: 72.6, rainfall: 15.0, windSpeed: 5.2, temp: 28.0, pressure: 1012.0, humidity: 65.0 },
  { id: "east", name: "Bhubaneswar", state: "Odisha (East)", lat: 20.3, lon: 85.8, rainfall: 68.0, windSpeed: 8.5, temp: 26.0, pressure: 1005.0, humidity: 90.0 },
  { id: "south", name: "Thiruvananthapuram", state: "Kerala (South)", lat: 8.5, lon: 76.9, rainfall: 55.0, windSpeed: 7.2, temp: 27.5, pressure: 1009.0, humidity: 88.0 },
  { id: "north", name: "Amritsar", state: "Punjab (North)", lat: 31.6, lon: 74.9, rainfall: 12.0, windSpeed: 4.0, temp: 18.0, pressure: 1015.0, humidity: 60.0 },
  { id: "ne", name: "Guwahati", state: "Assam (Northeast)", lat: 26.2, lon: 91.7, rainfall: 50.0, windSpeed: 4.8, temp: 22.0, pressure: 1011.0, humidity: 85.0 },
  { id: "capital", name: "New Delhi", state: "NCR (North)", lat: 28.6, lon: 77.2, rainfall: 8.5, windSpeed: 3.8, temp: 22.5, pressure: 1014.0, humidity: 55.0 }
];

export default function Dashboard() {
  const [apiHealth, setApiHealth] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AnalysisResponse | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<RegionPreset>(REGIONS[0]);
  const [leadDay, setLeadDay] = useState<number>(5);
  const [stations, setStations] = useState<StationData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [mapViewState, setMapViewState] = useState({ longitude: 80.0, latitude: 21.0, zoom: 3.8 });

  // Load Station Grid for Map
  const loadSpatialGrid = useCallback(async (day: number) => {
    try {
      const res = await getSpatialGrid(day);
      if (res?.data?.stations) {
        setStations(res.data.stations);
      }
    } catch {
      // Fallback handling
    }
  }, []);

  // Analyze Active Forecast
  const handleAnalyze = useCallback(async (region: RegionPreset, day: number) => {
    setLoading(true);
    setError(null);
    try {
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
          forecast_temperature: region.temp,
          forecast_rainfall: region.rainfall,
          forecast_wind_u: region.windSpeed * 0.707,
          forecast_wind_v: region.windSpeed * 0.707,
          forecast_pressure: region.pressure,
          forecast_humidity: region.humidity,
          forecast_wind_speed: region.windSpeed,
          init_month: 1,
          init_day_of_year: 5,
          init_day_sin: 0.086,
          init_day_cos: 0.996,
          lead_day_squared: day * day,
          forecast_wind_direction: 45.0,
          forecast_temp_humidity_interact: region.temp * region.humidity,
          forecast_wind_pressure_interact: region.windSpeed * region.pressure,
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
        setError("An unknown error occurred while analyzing the forecast.");
      }
    } finally {
      setLoading(false);
    }
  }, [loadSpatialGrid]);

  useEffect(() => {
    getHealth().then(setApiHealth);
    handleAnalyze(selectedRegion, leadDay);
  }, [handleAnalyze, selectedRegion, leadDay]);

  const onSelectStation = (station: StationData) => {
    const matched = REGIONS.find(r => r.name.toLowerCase() === station.name.toLowerCase()) || {
      id: station.name.toLowerCase(),
      name: station.name,
      state: station.region,
      lat: station.latitude,
      lon: station.longitude,
      rainfall: station.bust_probability > 0.5 ? 45.0 : 15.0,
      windSpeed: 6.0,
      temp: 25.0,
      pressure: 1010.0,
      humidity: 75.0
    };
    setSelectedRegion(matched);
    setMapViewState(prev => ({ ...prev, longitude: station.longitude, latitude: station.latitude }));
  };

  const loadDemoCase = () => {
    setSelectedRegion(REGIONS[0]);
    setLeadDay(5);
    setMapViewState({ longitude: 80.0, latitude: 20.0, zoom: 4.5 });
  };

  const pred = data?.data?.prediction_and_explanation?.prediction_details;
  const shapReasons = data?.data?.prediction_and_explanation?.top_reasons || [];
  const supportingShap = data?.data?.prediction_and_explanation?.top_supporting_features || [];
  const reducingShap = data?.data?.prediction_and_explanation?.top_reducing_features || [];
  const analogs = data?.data?.analogs?.analogs || [];
  const analogSummary = data?.data?.analogs?.summary;
  const revisions = data?.data?.revision;
  const leadCurve = data?.data?.lead_day_curve || [];

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
    return combined.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution)).slice(0, 6);
  }, [supportingShap, reducingShap]);

  const bustProbPct = pred ? (pred.calibrated_bust_probability * 100).toFixed(1) : "--";
  const confidencePct = pred ? (pred.forecast_confidence * 100).toFixed(1) : "--";
  const isHighRisk = pred ? pred.calibrated_bust_probability >= 0.65 : false;
  const isModRisk = pred ? pred.calibrated_bust_probability >= 0.35 && pred.calibrated_bust_probability < 0.65 : false;
  const riskCategory = pred?.risk_category || (isHighRisk ? "HIGH" : isModRisk ? "MODERATE" : "LOW") || "UNKNOWN";

  return (
    <div className="min-h-screen bg-[#08090a] text-[#d0d6e0] font-sans antialiased selection:bg-[#e4f222] selection:text-[#08090a]">
      {/* 1. Linear Navigation Top Bar */}
      <nav className="border-b border-[#23252a] bg-[#08090a]/80 backdrop-blur-md sticky top-0 z-50 px-4 md:px-6 py-3">
        <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div className="flex items-center gap-3">
            {/* Linear-style geometric glyph */}
            <div className="w-6 h-6 rounded-[6px] bg-[#0f1011] border border-[#23252a] flex items-center justify-center text-[#e4f222]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
                <path d="M16 14v6" />
                <path d="M8 14v6" />
                <path d="M12 16v6" />
              </svg>
            </div>
            
            <div className="flex items-baseline gap-2">
              <span className="text-[15px] font-[510] text-[#ffffff] tracking-[-0.022em]">
                ForecastGuard
              </span>
              <span className="text-[12px] font-linear-mono text-[#8a8f98] hidden sm:inline">
                / bust-detection-v1.0
              </span>
            </div>

            <div className="hidden lg:flex items-center gap-1.5 ml-2">
              <span className="linear-badge font-linear-mono text-[11px] text-[#8a8f98]">
                PS-26079
              </span>
              <span className="linear-badge text-[11px] text-[#8a8f98]">
                MoES · NCMRWF
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[12px]">
            {/* System Status Pill */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#23252a] bg-[#0f1011] text-[#8a8f98]">
              <span className={`w-1.5 h-1.5 rounded-full ${apiHealth ? "bg-[#27a644] animate-pulse" : "bg-[#eb5757]"}`} />
              <span className="font-linear-mono text-[11px]">{apiHealth ? "API ACTIVE" : "OFFLINE"}</span>
            </div>

            {/* Synthetic Data Pill */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#23252a] bg-[#0f1011] text-[#8a8f98]">
              <span className="font-linear-mono text-[11px]">DATA: SYNTHETIC</span>
            </div>

            {/* Acid Lime Primary Action Button (The single chromatic element) */}
            <button
              onClick={loadDemoCase}
              className="btn-acid-lime flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles size={13} strokeWidth={2.5} />
              <span>Demo Case (Waranga D-5)</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-[1280px] mx-auto p-4 md:p-6 space-y-6">
        
        {/* 2. Precision Command Bar */}
        <section className="linear-card flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-[12px] font-linear-mono text-[#8a8f98] uppercase">
              <MapPin size={14} className="text-[#8a8f98]" /> Station:
            </div>
            <select
              value={selectedRegion.id}
              onChange={(e) => {
                const r = REGIONS.find(item => item.id === e.target.value) || REGIONS[0];
                setSelectedRegion(r);
                setMapViewState(prev => ({ ...prev, longitude: r.lon, latitude: r.lat }));
              }}
              aria-label="Select Station"
              className="bg-[#161718] border border-[#23252a] text-[#d0d6e0] text-[13px] rounded-[6px] px-3 py-1.5 focus:outline-none focus:border-[#383b3f] transition font-normal"
            >
              {REGIONS.map(r => (
                <option key={r.id} value={r.id}>
                  {r.name} — {r.state} ({r.lat.toFixed(1)}°N, {r.lon.toFixed(1)}°E)
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-[12px] font-linear-mono text-[#8a8f98] uppercase mr-1">
              <Clock size={14} className="text-[#8a8f98]" /> Lead Day:
            </div>
            <div className="flex items-center gap-1 bg-[#161718] p-0.5 rounded-[6px] border border-[#23252a]">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(d => (
                <button
                  key={d}
                  onClick={() => setLeadDay(d)}
                  className={`w-7 h-6 text-[12px] font-linear-mono rounded-[4px] transition cursor-pointer flex items-center justify-center ${
                    leadDay === d
                      ? "bg-[#e4f222] text-[#08090a] font-[510]"
                      : "text-[#8a8f98] hover:text-[#ffffff] hover:bg-[#23252a]"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </section>

        {error && (
          <div className="p-3.5 rounded-[6px] bg-[#0f1011] border border-[#eb5757]/40 text-[#eb5757] text-[13px] flex items-center gap-2.5 font-linear-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-[#eb5757]" />
            <span>{error}</span>
          </div>
        )}

        {/* 3. Hero Layer: Map & Bust Probability Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Map Frame (7 cols) */}
          <div className="lg:col-span-7 linear-card p-0 overflow-hidden flex flex-col min-h-[400px]">
            <div className="px-4 py-2.5 border-b border-[#23252a] flex justify-between items-center bg-[#0f1011]">
              <div className="flex items-center gap-2 text-[12px] font-[510] text-[#d0d6e0] tracking-[-0.011em]">
                <Navigation size={13} className="text-[#8a8f98]" /> Spatial Bust Risk Distribution
              </div>
              <div className="flex items-center gap-3 text-[11px] font-linear-mono text-[#8a8f98]">
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#27a644]"></span> &lt;35%</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]"></span> 35-65%</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#eb5757]"></span> &gt;65%</span>
              </div>
            </div>

            <div className="relative flex-1 min-h-[350px]">
              <Map
                {...mapViewState}
                onMove={evt => setMapViewState(evt.viewState)}
                mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
                style={{ width: "100%", height: "100%" }}
              >
                {stations.map((st) => (
                  <Marker
                    key={st.name}
                    longitude={st.longitude}
                    latitude={st.latitude}
                    anchor="center"
                    onClick={() => onSelectStation(st)}
                  >
                    <div
                      className={`cursor-pointer group relative flex items-center justify-center rounded-full transition-transform ${
                        selectedRegion.name.toLowerCase() === st.name.toLowerCase()
                          ? "ring-2 ring-[#e4f222] ring-offset-2 ring-offset-[#08090a] w-4 h-4"
                          : "w-3 h-3 opacity-90 hover:scale-125"
                      }`}
                      style={{ backgroundColor: st.bust_probability >= 0.65 ? "#eb5757" : st.bust_probability >= 0.35 ? "#f59e0b" : "#27a644" }}
                    >
                      <div className="absolute bottom-5 hidden group-hover:block bg-[#0f1011] border border-[#23252a] text-[#ffffff] text-[11px] font-linear-mono px-2 py-1 rounded-[4px] shadow-lg whitespace-nowrap z-50 pointer-events-none">
                        {st.name}: {(st.bust_probability * 100).toFixed(0)}% bust risk
                      </div>
                    </div>
                  </Marker>
                ))}
              </Map>

              {/* Minimalist Telemetry Bar */}
              <div className="absolute bottom-3 left-3 right-3 bg-[#08090a]/90 backdrop-blur-sm border border-[#23252a] px-3 py-1.5 rounded-[6px] flex justify-between items-center text-[11px] font-linear-mono text-[#8a8f98]">
                <span>TARGET: <span className="text-[#ffffff]">{selectedRegion.name}</span> ({selectedRegion.lat}°N, {selectedRegion.lon}°E)</span>
                <span>LEAD: <span className="text-[#ffffff]">DAY {leadDay}</span></span>
              </div>
            </div>
          </div>

          {/* Bust Probability Hero Panel (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="linear-card flex-1 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start border-b border-[#23252a] pb-3 mb-4">
                  <div>
                    <span className="text-[11px] font-linear-mono text-[#8a8f98] uppercase tracking-wider block">
                      Target Analysis
                    </span>
                    <h2 className="text-[17px] font-[510] text-[#ffffff] tracking-[-0.012em]">
                      {selectedRegion.name}, {selectedRegion.state}
                    </h2>
                  </div>

                  <span className={`linear-badge font-linear-mono text-[11px] px-2 py-0.5 border ${
                    isHighRisk
                      ? "bg-[#eb5757]/10 text-[#eb5757] border-[#eb5757]/30"
                      : isModRisk
                      ? "bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/30"
                      : "bg-[#27a644]/10 text-[#27a644] border-[#27a644]/30"
                  }`}>
                    {riskCategory} RISK
                  </span>
                </div>

                {loading ? (
                  <div className="py-12 flex flex-col items-center justify-center text-[#8a8f98] gap-2">
                    <RefreshCw className="animate-spin text-[#e4f222]" size={20} />
                    <span className="text-[12px] font-linear-mono">CALCULATING PROBABILITY...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 my-2">
                    <div className="bg-[#161718] p-3.5 rounded-[6px] border border-[#23252a]">
                      <div className="text-[11px] font-linear-mono text-[#8a8f98] uppercase mb-1">
                        Bust Probability
                      </div>
                      <div className={`text-[48px] leading-none font-[510] tracking-[-0.022em] ${
                        isHighRisk ? "text-[#eb5757]" : isModRisk ? "text-[#f59e0b]" : "text-[#27a644]"
                      }`}>
                        {bustProbPct}%
                      </div>
                      <div className="text-[11px] font-linear-mono text-[#62666d] mt-2">
                        LightGBM + Isotonic
                      </div>
                    </div>

                    <div className="bg-[#161718] p-3.5 rounded-[6px] border border-[#23252a]">
                      <div className="text-[11px] font-linear-mono text-[#8a8f98] uppercase mb-1">
                        Forecast Confidence
                      </div>
                      <div className="text-[48px] leading-none font-[510] tracking-[-0.022em] text-[#ffffff]">
                        {confidencePct}%
                      </div>
                      <div className="text-[11px] font-linear-mono text-[#62666d] mt-2">
                        1 - P(bust) Indicator
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Micro Telemetry Strip */}
              <div className="border-t border-[#23252a] pt-3 grid grid-cols-3 gap-2 text-center text-[12px] font-linear-mono">
                <div className="bg-[#161718] p-2 rounded-[4px] border border-[#23252a]">
                  <span className="text-[#62666d] block text-[10px] uppercase">Rainfall</span>
                  <span className="text-[#ffffff] font-normal">{selectedRegion.rainfall} mm</span>
                </div>
                <div className="bg-[#161718] p-2 rounded-[4px] border border-[#23252a]">
                  <span className="text-[#62666d] block text-[10px] uppercase">Wind Speed</span>
                  <span className="text-[#ffffff] font-normal">{selectedRegion.windSpeed} m/s</span>
                </div>
                <div className="bg-[#161718] p-2 rounded-[4px] border border-[#23252a]">
                  <span className="text-[#62666d] block text-[10px] uppercase">Temperature</span>
                  <span className="text-[#ffffff] font-normal">{selectedRegion.temp} °C</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Diagnostic Layer: SHAP, Revisions, Analogs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* SHAP Attributions Card */}
          <div className="linear-card flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3 border-b border-[#23252a] pb-2">
                <h3 className="text-[13px] font-[510] text-[#ffffff] flex items-center gap-1.5 tracking-[-0.011em]">
                  <Info size={14} className="text-[#8a8f98]" /> SHAP Risk Attribution
                </h3>
                <span className="text-[10px] font-linear-mono text-[#8a8f98]">LOCAL</span>
              </div>

              {loading ? (
                <div className="space-y-2 py-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-8 bg-[#161718] rounded-[4px] animate-pulse"></div>
                  ))}
                </div>
              ) : shapReasons.length > 0 ? (
                <div className="space-y-2">
                  {shapReasons.slice(0, 4).map((r, i) => (
                    <div key={i} className="bg-[#161718] p-2 rounded-[4px] border border-[#23252a] flex items-center justify-between text-[12px]">
                      <div>
                        <div className="font-medium text-[#ffffff] text-[12px]">{r.code.replace(/_/g, " ")}</div>
                        <div className="text-[11px] text-[#8a8f98]">{r.text}</div>
                      </div>
                      <div className={`font-linear-mono text-[12px] font-medium shrink-0 ml-2 ${
                        r.contribution >= 0 ? "text-[#eb5757]" : "text-[#27a644]"
                      }`}>
                        {r.contribution >= 0 ? `+${r.contribution.toFixed(2)}` : r.contribution.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[12px] text-[#62666d] italic py-6 text-center font-linear-mono">
                  No SHAP signals available.
                </div>
              )}
            </div>

            <div className="text-[11px] text-[#62666d] italic mt-3 pt-2 border-t border-[#23252a]">
              SHAP reflects statistical attributions, not causal physics.
            </div>
          </div>

          {/* Forecast Revision Evolution Card */}
          <div className="linear-card flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3 border-b border-[#23252a] pb-2">
                <h3 className="text-[13px] font-[510] text-[#ffffff] flex items-center gap-1.5 tracking-[-0.011em]">
                  <TrendingUp size={14} className="text-[#8a8f98]" /> Run-to-Run Revision
                </h3>
                <span className="text-[10px] font-linear-mono text-[#8a8f98]">MULTI-CYCLE</span>
              </div>

              {loading ? (
                <div className="h-28 bg-[#161718] rounded-[4px] animate-pulse my-3"></div>
              ) : revisions ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-[#8a8f98]">Instability Signal:</span>
                    <span className={`linear-badge font-linear-mono text-[11px] px-2 py-0.5 border ${
                      revisions.large_revision
                        ? "bg-[#eb5757]/10 text-[#eb5757] border-[#eb5757]/30"
                        : "bg-[#27a644]/10 text-[#27a644] border-[#27a644]/30"
                    }`}>
                      {revisions.large_revision ? "⚠ LARGE REVISION" : "✓ STABLE"}
                    </span>
                  </div>

                  {revisions.runs && (
                    <div className="bg-[#161718] p-2.5 rounded-[4px] border border-[#23252a] space-y-1">
                      <div className="text-[10px] font-linear-mono text-[#8a8f98] uppercase mb-1">Precipitation Evolution</div>
                      <div className="flex items-center justify-between text-[11px] font-linear-mono">
                        {revisions.runs.map((r, i) => (
                          <div key={i} className="text-center">
                            <span className="text-[#62666d] block text-[9px]">{r.run.split(" ")[0]}</span>
                            <span className="text-[#ffffff] font-normal">{r.rainfall_mm}mm</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="text-[11px] font-linear-mono flex justify-between text-[#8a8f98]">
                    <span>SHIFT SCORE:</span>
                    <span className="text-[#ffffff]">{revisions.combined_revision_score ?? "0.45"}</span>
                  </div>
                </div>
              ) : (
                <div className="text-[12px] text-[#62666d] italic py-6 text-center font-linear-mono">
                  No multi-cycle history found.
                </div>
              )}
            </div>

            <div className="text-[11px] text-[#62666d] italic mt-3 pt-2 border-t border-[#23252a]">
              Run instability reflects inter-cycle NWP uncertainty.
            </div>
          </div>

          {/* Historical Analogs Card */}
          <div className="linear-card flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3 border-b border-[#23252a] pb-2">
                <h3 className="text-[13px] font-[510] text-[#ffffff] flex items-center gap-1.5 tracking-[-0.011em]">
                  <Activity size={14} className="text-[#8a8f98]" /> Historical Analogs
                </h3>
                <span className="text-[10px] font-linear-mono text-[#8a8f98]">TOP-5 CASES</span>
              </div>

              {loading ? (
                <div className="h-28 bg-[#161718] rounded-[4px] animate-pulse my-3"></div>
              ) : (
                <div>
                  <div className="flex items-baseline justify-between mb-2 text-[12px]">
                    <span className="text-[#8a8f98]">Analog Bust Rate:</span>
                    <span className="font-linear-mono text-[13px] font-medium text-[#ffffff]">
                      {analogSummary ? `${Math.round(analogSummary.historical_analog_bust_rate * 5)} / 5 (${(analogSummary.historical_analog_bust_rate * 100).toFixed(0)}%)` : "--"}
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                    {analogs.length > 0 ? (
                      analogs.slice(0, 4).map((a, i) => (
                        <div key={i} className="flex justify-between items-center text-[11px] font-linear-mono bg-[#161718] p-1.5 rounded-[4px] border border-[#23252a]">
                          <span className="text-[#d0d6e0]">
                            #{i + 1} {a.initialization_time.split(" ")[0]}
                          </span>
                          <span className="text-[#8a8f98]">
                            d={a.similarity_distance?.toFixed(2)}
                          </span>
                          <span className={`px-1.5 py-0.2 rounded-[2px] text-[9px] font-medium ${
                            a.bust === 1 ? "bg-[#eb5757]/15 text-[#eb5757] border border-[#eb5757]/30" : "bg-[#27a644]/15 text-[#27a644] border border-[#27a644]/30"
                          }`}>
                            {a.bust === 1 ? "BUST" : "ACCURATE"}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-[12px] text-[#62666d] italic py-3 text-center font-linear-mono">
                        No prior historical analogs matched.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="text-[11px] text-[#62666d] italic mt-3 pt-2 border-t border-[#23252a]">
              Strictly filtered to past dates before current initialization.
            </div>
          </div>
        </div>

        {/* 5. Recharts Analytics Visualizations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bust Probability by Lead Day */}
          <div className="linear-card">
            <div className="flex items-center justify-between mb-4 border-b border-[#23252a] pb-2">
              <h3 className="text-[13px] font-[510] text-[#ffffff] flex items-center gap-1.5 tracking-[-0.011em]">
                <BarChart3 size={14} className="text-[#8a8f98]" /> Bust Probability Progression (Day 1 – Day 10)
              </h3>
              <span className="text-[10px] font-linear-mono text-[#8a8f98]">CURVE</span>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={leadCurve} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="linearColorBust" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#02b8cc" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#02b8cc" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#23252a" opacity={0.6} />
                  <XAxis dataKey="lead_day" tick={{ fill: "#8a8f98", fontSize: 10, fontFamily: "var(--font-berkeley-mono)" }} tickFormatter={(val) => `D${val}`} />
                  <YAxis tick={{ fill: "#8a8f98", fontSize: 10, fontFamily: "var(--font-berkeley-mono)" }} domain={[0, 1]} tickFormatter={(val) => `${(val * 100).toFixed(0)}%`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f1011", borderColor: "#23252a", borderRadius: "6px", fontSize: "11px", fontFamily: "var(--font-berkeley-mono)" }}
                    formatter={(val: any) => [`${(Number(val) * 100).toFixed(1)}%`, "Bust Risk"]}
                    labelFormatter={(label) => `Lead Day ${label}`}
                  />
                  <ReferenceLine y={0.65} stroke="#eb5757" strokeDasharray="3 3" label={{ value: "High Risk (65%)", fill: "#eb5757", fontSize: 10 }} />
                  <Area type="monotone" dataKey="bust_probability" stroke="#02b8cc" strokeWidth={1.5} fillOpacity={1} fill="url(#linearColorBust)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Model Feature Contributions (SHAP Attributions) */}
          <div className="linear-card">
            <div className="flex items-center justify-between mb-4 border-b border-[#23252a] pb-2">
              <h3 className="text-[13px] font-[510] text-[#ffffff] flex items-center gap-1.5 tracking-[-0.011em]">
                <Activity size={14} className="text-[#8a8f98]" /> Feature Attributions (SHAP)
              </h3>
              <span className="text-[10px] font-linear-mono text-[#8a8f98]">WATERFALL</span>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={shapChartData} layout="vertical" margin={{ top: 5, right: 20, left: 35, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#23252a" opacity={0.6} />
                  <XAxis type="number" tick={{ fill: "#8a8f98", fontSize: 10, fontFamily: "var(--font-berkeley-mono)" }} />
                  <YAxis type="category" dataKey="feature" tick={{ fill: "#d0d6e0", fontSize: 10, fontFamily: "var(--font-berkeley-mono)" }} width={80} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f1011", borderColor: "#23252a", borderRadius: "6px", fontSize: "11px", fontFamily: "var(--font-berkeley-mono)" }}
                    formatter={(val: any) => [Number(val).toFixed(3), "SHAP Weight"]}
                  />
                  <Bar dataKey="contribution" radius={[0, 3, 3, 0]}>
                    {shapChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.contribution >= 0 ? "#eb5757" : "#27a644"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </main>

      {/* 6. Precision Footer */}
      <footer className="border-t border-[#23252a] mt-12 py-6 px-4 md:px-6 text-[#62666d] text-[12px] font-linear-mono">
        <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
          <div>
            ForecastGuard AI · Precision Meteorological Decision Support
          </div>
          <div className="text-[11px] text-[#8a8f98]">
            * Prototype system. Model bust estimates do not supersede statutory IMD/MoES advisories.
          </div>
        </div>
      </footer>
    </div>
  );
}