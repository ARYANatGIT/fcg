"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Map, { Marker } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  Activity, Clock, MapPin, Server,
  Info, TrendingUp, RefreshCw,
  BarChart3, Sparkles, Navigation,
  Plus, Minus, RotateCcw, ArrowRight
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

const DEFAULT_VIEW_STATE = { longitude: 80.0, latitude: 21.5, zoom: 4.0 };

export default function Dashboard() {
  const [apiHealth, setApiHealth] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AnalysisResponse | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<RegionPreset>(REGIONS[0]);
  const [leadDay, setLeadDay] = useState<number>(5);
  const [stations, setStations] = useState<StationData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [mapViewState, setMapViewState] = useState(DEFAULT_VIEW_STATE);

  // Load Station Grid for Map
  const loadSpatialGrid = useCallback(async (day: number) => {
    try {
      const res = await getSpatialGrid(day);
      if (res?.data?.stations) {
        setStations(res.data.stations);
      }
    } catch {
      // Fallback
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
    setMapViewState(prev => ({ ...prev, longitude: station.longitude, latitude: station.latitude, zoom: 5.5 }));
  };

  const loadDemoCase = () => {
    setSelectedRegion(REGIONS[0]);
    setLeadDay(5);
    setMapViewState({ longitude: 80.0, latitude: 20.0, zoom: 5.0 });
  };

  const resetMapView = () => {
    setMapViewState(DEFAULT_VIEW_STATE);
  };

  const zoomIn = () => {
    setMapViewState(prev => ({ ...prev, zoom: Math.min(prev.zoom + 0.8, 8) }));
  };

  const zoomOut = () => {
    setMapViewState(prev => ({ ...prev, zoom: Math.max(prev.zoom - 0.8, 3) }));
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
      {/* 1. Header Navigation Bar */}
      <nav className="border-b border-[#23252a] bg-[#08090a]/90 backdrop-blur-md sticky top-0 z-50 px-4 md:px-8 py-3.5">
        <div className="max-w-[1360px] mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3">
            {/* Linear-style geometric glyph */}
            <div className="w-8 h-8 rounded-[8px] bg-[#0f1011] border border-[#23252a] flex items-center justify-center text-[#e4f222] shadow-sm shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
                <path d="M16 14v6" />
                <path d="M8 14v6" />
                <path d="M12 16v6" />
              </svg>
            </div>
            
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-[17px] font-[510] text-[#ffffff] tracking-[-0.022em]">
                  ForecastGuard AI
                </span>
                <span className="linear-badge font-linear-mono text-[11px] text-[#8a8f98]">
                  v1.0-moes
                </span>
              </div>
              <p className="text-[12px] text-[#8a8f98] font-normal tracking-tight hidden sm:block">
                Medium-Range NWP Forecast Bust Detection &amp; Confidence System (PS-26079)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* API Health */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#23252a] bg-[#0f1011] text-[#8a8f98] text-[12px]">
              <span className={`w-2 h-2 rounded-full shrink-0 ${apiHealth ? "bg-[#27a644] animate-pulse" : "bg-[#eb5757]"}`} />
              <span className="font-linear-mono">{apiHealth ? "API READY" : "OFFLINE"}</span>
            </div>

            {/* Prototype Badge */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#23252a] bg-[#0f1011] text-[#8a8f98] text-[12px]">
              <span className="font-linear-mono">DATA: SYNTHETIC</span>
            </div>

            {/* Primary Action Button (Acid Lime) */}
            <button
              onClick={loadDemoCase}
              className="btn-acid-lime cursor-pointer font-medium"
              title="Load standard Waranga Day 5 demonstration forecast"
            >
              <Sparkles size={15} strokeWidth={2.5} />
              <span>Demo Case (Waranga D-5)</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-[1360px] mx-auto p-4 md:p-8 space-y-6">
        
        {/* 2. Precision Command Bar (Station + Lead Day Selectors) */}
        <section className="linear-card flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-5">
          {/* Station Selection */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <label htmlFor="station-select" className="flex items-center gap-2 text-[13px] font-linear-mono text-[#8a8f98] uppercase tracking-wider shrink-0">
              <MapPin size={15} className="text-[#e4f222]" /> Evaluation Target:
            </label>
            <select
              id="station-select"
              value={selectedRegion.id}
              onChange={(e) => {
                const r = REGIONS.find(item => item.id === e.target.value) || REGIONS[0];
                setSelectedRegion(r);
                setMapViewState(prev => ({ ...prev, longitude: r.lon, latitude: r.lat, zoom: 5.5 }));
              }}
              className="h-10 bg-[#161718] border border-[#23252a] text-[#ffffff] text-[14px] rounded-[6px] px-3.5 py-2 focus:outline-none focus:border-[#e4f222]/50 transition font-normal min-w-[280px]"
            >
              {REGIONS.map(r => (
                <option key={r.id} value={r.id}>
                  {r.name} — {r.state} ({r.lat.toFixed(1)}°N, {r.lon.toFixed(1)}°E)
                </option>
              ))}
            </select>
          </div>

          {/* Lead Day Segmented Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2 text-[13px] font-linear-mono text-[#8a8f98] uppercase tracking-wider shrink-0">
              <Clock size={15} className="text-[#e4f222]" /> Lead Day:
            </div>
            <div className="flex flex-wrap items-center gap-1.5 bg-[#161718] p-1.5 rounded-[8px] border border-[#23252a]">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(d => (
                <button
                  key={d}
                  onClick={() => setLeadDay(d)}
                  className={`h-9 min-w-[38px] px-2.5 text-[13px] font-linear-mono rounded-[6px] transition cursor-pointer flex items-center justify-center ${
                    leadDay === d
                      ? "bg-[#e4f222] text-[#08090a] font-[590] shadow-sm"
                      : "text-[#8a8f98] hover:text-[#ffffff] hover:bg-[#23252a]"
                  }`}
                  aria-label={`Select Lead Day ${d}`}
                >
                  D{d}
                </button>
              ))}
            </div>
          </div>
        </section>

        {error && (
          <div className="p-4 rounded-[8px] bg-[#0f1011] border border-[#eb5757]/40 text-[#eb5757] text-[14px] flex items-center gap-3 font-linear-mono">
            <span className="w-2 h-2 rounded-full bg-[#eb5757] shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 3. Hero Layer: Interactive Map & Bust Probability Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Map Frame (7 cols) */}
          <div className="lg:col-span-7 linear-card p-0 overflow-hidden flex flex-col min-h-[440px]">
            <div className="px-5 py-3.5 border-b border-[#23252a] flex flex-wrap justify-between items-center bg-[#0f1011] gap-2">
              <div className="flex items-center gap-2.5 text-[14px] font-[510] text-[#ffffff] tracking-[-0.011em]">
                <Navigation size={15} className="text-[#e4f222]" /> Spatial Bust Risk Distribution (India)
              </div>
              
              {/* Risk Legend */}
              <div className="flex items-center gap-4 text-[12px] font-linear-mono text-[#8a8f98]">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#27a644]"></span> Low (&lt;35%)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#f59e0b]"></span> Mod (35–65%)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#eb5757]"></span> High (&gt;65%)
                </span>
              </div>
            </div>

            <div className="relative flex-1 min-h-[380px]">
              <Map
                {...mapViewState}
                onMove={evt => setMapViewState(evt.viewState)}
                mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
                style={{ width: "100%", height: "100%" }}
              >
                {stations.map((st) => {
                  const isSelected = selectedRegion.name.toLowerCase() === st.name.toLowerCase();
                  return (
                    <Marker
                      key={st.name}
                      longitude={st.longitude}
                      latitude={st.latitude}
                      anchor="center"
                      onClick={() => onSelectStation(st)}
                    >
                      <div
                        className={`cursor-pointer group relative flex items-center justify-center rounded-full transition-all duration-200 ${
                          isSelected
                            ? "w-5 h-5 ring-2 ring-[#e4f222] ring-offset-2 ring-offset-[#08090a] scale-110 z-30"
                            : "w-4 h-4 ring-1 ring-[#08090a] opacity-90 hover:scale-125 z-10"
                        }`}
                        style={{ backgroundColor: st.bust_probability >= 0.65 ? "#eb5757" : st.bust_probability >= 0.35 ? "#f59e0b" : "#27a644" }}
                      >
                        {/* Hover Tooltip */}
                        <div className="absolute bottom-6 hidden group-hover:flex flex-col bg-[#0f1011] border border-[#23252a] text-[#ffffff] text-[12px] font-linear-mono px-3 py-1.5 rounded-[6px] shadow-xl whitespace-nowrap z-50 pointer-events-none gap-0.5">
                          <span className="font-semibold text-white">{st.name} ({st.region})</span>
                          <span className="text-[#8a8f98]">Bust Probability: {(st.bust_probability * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                    </Marker>
                  );
                })}
              </Map>

              {/* On-Map Zoom & View Controls */}
              <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-20">
                <button
                  onClick={zoomIn}
                  className="w-8 h-8 rounded-[6px] bg-[#0f1011]/90 border border-[#23252a] text-[#ffffff] flex items-center justify-center hover:bg-[#161718] transition cursor-pointer"
                  title="Zoom In"
                  aria-label="Zoom In"
                >
                  <Plus size={15} />
                </button>
                <button
                  onClick={zoomOut}
                  className="w-8 h-8 rounded-[6px] bg-[#0f1011]/90 border border-[#23252a] text-[#ffffff] flex items-center justify-center hover:bg-[#161718] transition cursor-pointer"
                  title="Zoom Out"
                  aria-label="Zoom Out"
                >
                  <Minus size={15} />
                </button>
                <button
                  onClick={resetMapView}
                  className="w-8 h-8 rounded-[6px] bg-[#0f1011]/90 border border-[#23252a] text-[#ffffff] flex items-center justify-center hover:bg-[#161718] transition cursor-pointer"
                  title="Reset Map View"
                  aria-label="Reset Map View"
                >
                  <RotateCcw size={14} />
                </button>
              </div>

              {/* Bottom Telemetry Status Bar */}
              <div className="absolute bottom-3 left-3 right-3 bg-[#08090a]/90 backdrop-blur-md border border-[#23252a] px-4 py-2 rounded-[8px] flex flex-wrap justify-between items-center text-[12px] font-linear-mono text-[#8a8f98] gap-2">
                <span>
                  TARGET: <strong className="text-[#ffffff] font-medium">{selectedRegion.name}</strong> ({selectedRegion.lat}°N, {selectedRegion.lon}°E)
                </span>
                <span>
                  VALID: <strong className="text-[#ffffff] font-medium">Day {leadDay} Forecast Cycle</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Bust Probability Hero Panel (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="linear-card flex-1 flex flex-col justify-between">
              <div>
                {/* Station & Risk Tag */}
                <div className="flex justify-between items-start border-b border-[#23252a] pb-4 mb-4">
                  <div>
                    <span className="text-[12px] font-linear-mono text-[#8a8f98] uppercase tracking-wider block mb-0.5">
                      Forecast Evaluation
                    </span>
                    <h2 className="text-[20px] font-[510] text-[#ffffff] tracking-[-0.022em]">
                      {selectedRegion.name}, {selectedRegion.state}
                    </h2>
                  </div>

                  <span className={`linear-badge font-linear-mono text-[12px] px-3 py-1 border font-medium ${
                    isHighRisk
                      ? "bg-[#eb5757]/15 text-[#eb5757] border-[#eb5757]/40"
                      : isModRisk
                      ? "bg-[#f59e0b]/15 text-[#f59e0b] border-[#f59e0b]/40"
                      : "bg-[#27a644]/15 text-[#27a644] border-[#27a644]/40"
                  }`}>
                    {riskCategory} RISK
                  </span>
                </div>

                {loading ? (
                  <div className="py-14 flex flex-col items-center justify-center text-[#8a8f98] gap-3">
                    <RefreshCw className="animate-spin text-[#e4f222]" size={24} />
                    <span className="text-[13px] font-linear-mono">CALCULATING PROBABILITY...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 my-3">
                    {/* Calibrated Bust Probability */}
                    <div className="bg-[#161718] p-4 rounded-[8px] border border-[#23252a]">
                      <div className="text-[12px] font-linear-mono text-[#8a8f98] uppercase tracking-wider mb-1">
                        Bust Probability
                      </div>
                      <div className={`text-[52px] leading-none font-[510] tracking-[-0.022em] ${
                        isHighRisk ? "text-[#eb5757]" : isModRisk ? "text-[#f59e0b]" : "text-[#27a644]"
                      }`}>
                        {bustProbPct}%
                      </div>
                      <div className="text-[12px] font-linear-mono text-[#62666d] mt-2">
                        Calibrated Isotonic
                      </div>
                    </div>

                    {/* Forecast Confidence */}
                    <div className="bg-[#161718] p-4 rounded-[8px] border border-[#23252a]">
                      <div className="text-[12px] font-linear-mono text-[#8a8f98] uppercase tracking-wider mb-1">
                        Forecast Confidence
                      </div>
                      <div className="text-[52px] leading-none font-[510] tracking-[-0.022em] text-[#ffffff]">
                        {confidencePct}%
                      </div>
                      <div className="text-[12px] font-linear-mono text-[#62666d] mt-2">
                        1 - P(bust) Metric
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Weather Telemetry Strip */}
              <div className="border-t border-[#23252a] pt-4 grid grid-cols-3 gap-3 text-center">
                <div className="bg-[#161718] p-2.5 rounded-[6px] border border-[#23252a]">
                  <span className="text-[#8a8f98] block text-[11px] font-linear-mono uppercase mb-0.5">Rainfall</span>
                  <span className="text-[#ffffff] text-[15px] font-medium font-linear-mono">{selectedRegion.rainfall} mm</span>
                </div>
                <div className="bg-[#161718] p-2.5 rounded-[6px] border border-[#23252a]">
                  <span className="text-[#8a8f98] block text-[11px] font-linear-mono uppercase mb-0.5">Wind Speed</span>
                  <span className="text-[#ffffff] text-[15px] font-medium font-linear-mono">{selectedRegion.windSpeed} m/s</span>
                </div>
                <div className="bg-[#161718] p-2.5 rounded-[6px] border border-[#23252a]">
                  <span className="text-[#8a8f98] block text-[11px] font-linear-mono uppercase mb-0.5">Temperature</span>
                  <span className="text-[#ffffff] text-[15px] font-medium font-linear-mono">{selectedRegion.temp} °C</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Diagnostic Layer: SHAP Risk, Forecast Revision, Historical Analogs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* SHAP Attributions Card */}
          <div className="linear-card flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4 border-b border-[#23252a] pb-2.5">
                <h3 className="text-[15px] font-[510] text-[#ffffff] flex items-center gap-2 tracking-[-0.011em]">
                  <Info size={16} className="text-[#e4f222]" /> Why is this forecast at risk?
                </h3>
                <span className="linear-badge font-linear-mono text-[11px]">SHAP LOCAL</span>
              </div>

              {loading ? (
                <div className="space-y-3 py-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-10 bg-[#161718] rounded-[6px] animate-pulse"></div>
                  ))}
                </div>
              ) : shapReasons.length > 0 ? (
                <div className="space-y-2.5">
                  {shapReasons.slice(0, 4).map((r, i) => (
                    <div key={i} className="bg-[#161718] p-3 rounded-[6px] border border-[#23252a] flex items-center justify-between">
                      <div className="pr-2">
                        <div className="font-medium text-[#ffffff] text-[13px]">{r.code.replace(/_/g, " ")}</div>
                        <div className="text-[12px] text-[#8a8f98] mt-0.5">{r.text}</div>
                      </div>
                      <div className={`font-linear-mono text-[14px] font-medium shrink-0 ${
                        r.contribution >= 0 ? "text-[#eb5757]" : "text-[#27a644]"
                      }`}>
                        {r.contribution >= 0 ? `+${r.contribution.toFixed(2)}` : r.contribution.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[13px] text-[#8a8f98] italic py-8 text-center font-linear-mono">
                  No SHAP attribution signals available.
                </div>
              )}
            </div>

            <div className="text-[12px] text-[#62666d] italic mt-4 pt-2.5 border-t border-[#23252a]">
              SHAP reflects statistical attributions, not confirmed physical causality.
            </div>
          </div>

          {/* Forecast Revision Evolution Card */}
          <div className="linear-card flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4 border-b border-[#23252a] pb-2.5">
                <h3 className="text-[15px] font-[510] text-[#ffffff] flex items-center gap-2 tracking-[-0.011em]">
                  <TrendingUp size={16} className="text-[#e4f222]" /> Run-to-Run Forecast Revision
                </h3>
                <span className="linear-badge font-linear-mono text-[11px]">MULTI-RUN</span>
              </div>

              {loading ? (
                <div className="h-32 bg-[#161718] rounded-[6px] animate-pulse my-4"></div>
              ) : revisions ? (
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-[#8a8f98]">Inter-cycle Stability:</span>
                    <span className={`linear-badge font-linear-mono text-[12px] px-2.5 py-1 border font-medium ${
                      revisions.large_revision
                        ? "bg-[#eb5757]/15 text-[#eb5757] border-[#eb5757]/40"
                        : "bg-[#27a644]/15 text-[#27a644] border-[#27a644]/40"
                    }`}>
                      {revisions.large_revision ? "⚠ LARGE REVISION" : "✓ STABLE EVOLUTION"}
                    </span>
                  </div>

                  {revisions.runs && (
                    <div className="bg-[#161718] p-3 rounded-[6px] border border-[#23252a] space-y-2">
                      <div className="text-[11px] font-linear-mono text-[#8a8f98] uppercase tracking-wider">
                        Precipitation Evolution
                      </div>
                      <div className="flex items-center justify-between text-[13px] font-linear-mono">
                        {revisions.runs.map((r, i) => (
                          <div key={i} className="text-center flex-1">
                            <span className="text-[#8a8f98] block text-[11px] mb-0.5">{r.run.split(" ")[0]}</span>
                            <span className="text-[#ffffff] font-medium">{r.rainfall_mm}mm</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="text-[12px] font-linear-mono flex justify-between text-[#8a8f98] bg-[#161718] p-2.5 rounded-[6px] border border-[#23252a]">
                    <span>COMBINED SHIFT SCORE:</span>
                    <span className="text-[#ffffff] font-medium">{revisions.combined_revision_score ?? "0.45"}</span>
                  </div>
                </div>
              ) : (
                <div className="text-[13px] text-[#8a8f98] italic py-8 text-center font-linear-mono">
                  No multi-cycle forecast history available.
                </div>
              )}
            </div>

            <div className="text-[12px] text-[#62666d] italic mt-4 pt-2.5 border-t border-[#23252a]">
              Run-to-run changes indicate numerical forecast instability.
            </div>
          </div>

          {/* Historical Analogs Card */}
          <div className="linear-card flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4 border-b border-[#23252a] pb-2.5">
                <h3 className="text-[15px] font-[510] text-[#ffffff] flex items-center gap-2 tracking-[-0.011em]">
                  <Activity size={16} className="text-[#e4f222]" /> Historical Analogs
                </h3>
                <span className="linear-badge font-linear-mono text-[11px]">TOP-5 CASES</span>
              </div>

              {loading ? (
                <div className="h-32 bg-[#161718] rounded-[6px] animate-pulse my-4"></div>
              ) : (
                <div>
                  <div className="flex items-baseline justify-between mb-3 text-[13px]">
                    <span className="text-[#8a8f98]">Historical Bust Rate:</span>
                    <span className="font-linear-mono text-[15px] font-medium text-[#ffffff]">
                      {analogSummary ? `${Math.round(analogSummary.historical_analog_bust_rate * 5)} / 5 (${(analogSummary.historical_analog_bust_rate * 100).toFixed(0)}%)` : "--"}
                    </span>
                  </div>

                  <div className="space-y-2 max-h-[170px] overflow-y-auto pr-1">
                    {analogs.length > 0 ? (
                      analogs.slice(0, 4).map((a, i) => (
                        <div key={i} className="flex justify-between items-center text-[12px] font-linear-mono bg-[#161718] p-2.5 rounded-[6px] border border-[#23252a]">
                          <span className="text-[#ffffff] font-medium">
                            #{i + 1} {a.initialization_time.split(" ")[0]}
                          </span>
                          <span className="text-[#8a8f98]">
                            dist={a.similarity_distance?.toFixed(2)}
                          </span>
                          <span className={`px-2 py-0.5 rounded-[4px] text-[11px] font-medium ${
                            a.bust === 1 ? "bg-[#eb5757]/15 text-[#eb5757] border border-[#eb5757]/40" : "bg-[#27a644]/15 text-[#27a644] border border-[#27a644]/40"
                          }`}>
                            {a.bust === 1 ? "BUST" : "ACCURATE"}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-[13px] text-[#8a8f98] italic py-6 text-center font-linear-mono">
                        No prior historical analogs matched filter.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="text-[12px] text-[#62666d] italic mt-4 pt-2.5 border-t border-[#23252a]">
              Filtered strictly to dates before current forecast initialization.
            </div>
          </div>
        </div>

        {/* 5. Recharts Analytics Visualizations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Bust Probability by Lead Day */}
          <div className="linear-card">
            <div className="flex items-center justify-between mb-4 border-b border-[#23252a] pb-2.5">
              <h3 className="text-[15px] font-[510] text-[#ffffff] flex items-center gap-2 tracking-[-0.011em]">
                <BarChart3 size={16} className="text-[#e4f222]" /> Bust Probability Progression (Day 1 – Day 10)
              </h3>
              <span className="linear-badge font-linear-mono text-[11px]">LEAD CURVE</span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={leadCurve} margin={{ top: 15, right: 15, left: -15, bottom: 5 }}>
                  <defs>
                    <linearGradient id="linearColorBust" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#02b8cc" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#02b8cc" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#23252a" opacity={0.7} />
                  <XAxis 
                    dataKey="lead_day" 
                    tick={{ fill: "#8a8f98", fontSize: 12, fontFamily: "var(--font-berkeley-mono)" }} 
                    tickFormatter={(val) => `D${val}`} 
                  />
                  <YAxis 
                    tick={{ fill: "#8a8f98", fontSize: 12, fontFamily: "var(--font-berkeley-mono)" }} 
                    domain={[0, 1]} 
                    tickFormatter={(val) => `${(val * 100).toFixed(0)}%`} 
                  />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: "#0f1011", 
                      borderColor: "#23252a", 
                      borderRadius: "8px", 
                      fontSize: "12px", 
                      fontFamily: "var(--font-berkeley-mono)",
                      padding: "10px 14px",
                      color: "#ffffff"
                    }}
                    formatter={(val: any) => [`${(Number(val) * 100).toFixed(1)}%`, "Bust Probability"]}
                    labelFormatter={(label) => `Forecast Lead Day ${label}`}
                  />
                  <ReferenceLine 
                    y={0.65} 
                    stroke="#eb5757" 
                    strokeDasharray="4 4" 
                    label={{ value: "High Risk Threshold (65%)", fill: "#eb5757", fontSize: 11, position: "top" }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="bust_probability" 
                    stroke="#02b8cc" 
                    strokeWidth={2} 
                    fillOpacity={1} 
                    fill="url(#linearColorBust)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Model Feature Contributions (SHAP Attributions) */}
          <div className="linear-card">
            <div className="flex items-center justify-between mb-4 border-b border-[#23252a] pb-2.5">
              <h3 className="text-[15px] font-[510] text-[#ffffff] flex items-center gap-2 tracking-[-0.011em]">
                <Activity size={16} className="text-[#e4f222]" /> Feature Attributions (SHAP Waterfall)
              </h3>
              <span className="linear-badge font-linear-mono text-[11px]">WATERFALL</span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={shapChartData} layout="vertical" margin={{ top: 10, right: 25, left: 45, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#23252a" opacity={0.7} />
                  <XAxis 
                    type="number" 
                    tick={{ fill: "#8a8f98", fontSize: 12, fontFamily: "var(--font-berkeley-mono)" }} 
                  />
                  <YAxis 
                    type="category" 
                    dataKey="feature" 
                    tick={{ fill: "#ffffff", fontSize: 12, fontFamily: "var(--font-berkeley-mono)" }} 
                    width={95} 
                  />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: "#0f1011", 
                      borderColor: "#23252a", 
                      borderRadius: "8px", 
                      fontSize: "12px", 
                      fontFamily: "var(--font-berkeley-mono)",
                      padding: "10px 14px",
                      color: "#ffffff"
                    }}
                    formatter={(val: any) => [Number(val).toFixed(3), "SHAP Contribution"]}
                  />
                  <Bar dataKey="contribution" radius={[0, 4, 4, 0]}>
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

      {/* 6. Footer */}
      <footer className="border-t border-[#23252a] mt-12 py-6 px-4 md:px-8 text-[#8a8f98] text-[13px] font-linear-mono">
        <div className="max-w-[1360px] mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div>
            ForecastGuard AI · MoES / NCMRWF Problem Statement ID: 26079
          </div>
          <div className="text-[12px] text-[#62666d]">
            * Research prototype. Model bust estimates do not supersede statutory IMD/MoES public advisories.
          </div>
        </div>
      </footer>
    </div>
  );
}