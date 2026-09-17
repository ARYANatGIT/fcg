"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Map, { Marker } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  AlertTriangle, Activity, CloudRain, Clock, MapPin, Server,
  Info, ShieldAlert, CheckCircle2, TrendingUp, RefreshCw,
  BarChart3, Sparkles, Navigation
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
      // Fallback station grid if backend is offline
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

  // SHAP Chart data (combine top supporting & reducing)
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
  const riskCategory = pred?.risk_category || (pred?.calibrated_bust_probability && pred.calibrated_bust_probability >= 0.65 ? "HIGH" : pred?.calibrated_bust_probability && pred.calibrated_bust_probability >= 0.35 ? "MODERATE" : "LOW") || "UNKNOWN";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-3 md:p-6 font-sans">
      {/* 1. Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-950 border border-cyan-700/50 rounded-lg text-cyan-400">
              <CloudRain size={26} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                ForecastGuard AI
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-cyan-900/60 text-cyan-300 border border-cyan-600/40">
                  MoES / NCMRWF (PS-26079)
                </span>
              </h1>
              <p className="text-slate-400 text-xs mt-0.5">
                AI-Based Forecast Bust Detection &amp; Confidence Estimation for Medium-Range NWP
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <button
            onClick={loadDemoCase}
            className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-3 py-1.5 rounded-md font-medium transition shadow-sm cursor-pointer"
          >
            <Sparkles size={14} /> Demo Case (Waranga Day 5)
          </button>
          <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border font-medium ${
            apiHealth ? "bg-emerald-950/40 border-emerald-700/50 text-emerald-300" : "bg-red-950/40 border-red-700/50 text-red-300"
          }`}>
            <Server size={14} /> {apiHealth ? "API Connected" : "API Offline"}
          </div>
          <div className="flex items-center gap-1.5 bg-amber-950/30 border border-amber-700/50 text-amber-300 px-2.5 py-1.5 rounded-md font-medium">
            <AlertTriangle size={14} /> SYNTHETIC DEMO DATA
          </div>
        </div>
      </header>

      {/* 2. Control Bar */}
      <section className="dashboard-panel mb-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-slate-900/90">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-slate-300 text-xs font-semibold uppercase tracking-wider">
            <MapPin size={16} className="text-cyan-400" /> Region / Station:
          </div>
          <select
            value={selectedRegion.id}
            onChange={(e) => {
              const r = REGIONS.find(item => item.id === e.target.value) || REGIONS[0];
              setSelectedRegion(r);
              setMapViewState(prev => ({ ...prev, longitude: r.lon, latitude: r.lat }));
            }}
            aria-label="Select Region"
            className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-medium"
          >
            {REGIONS.map(r => (
              <option key={r.id} value={r.id}>
                {r.name} — {r.state} ({r.lat.toFixed(1)}°N, {r.lon.toFixed(1)}°E)
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-slate-300 text-xs font-semibold uppercase tracking-wider mr-1">
            <Clock size={16} className="text-cyan-400" /> Lead Day:
          </div>
          <div className="flex flex-wrap gap-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(d => (
              <button
                key={d}
                onClick={() => setLeadDay(d)}
                className={`w-7 h-7 text-xs font-bold rounded transition ${
                  leadDay === d
                    ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/30 ring-1 ring-cyan-400"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/60"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </section>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-950/40 border border-red-700/60 text-red-300 text-sm flex items-center gap-3">
          <ShieldAlert className="text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 3. Top Row: Interactive India Map & Bust Probability Hero */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        {/* Map Panel (7 cols) */}
        <div className="lg:col-span-7 dashboard-panel flex flex-col p-0 overflow-hidden relative min-h-[380px]">
          <div className="p-3 border-b border-slate-800 flex justify-between items-center bg-slate-900/80 z-10">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
              <Navigation size={14} className="text-cyan-400" /> Model-Estimated Forecast Bust Probability Map
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Low (&lt;35%)</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span> Mod (35-65%)</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span> High (&gt;65%)</span>
            </div>
          </div>

          <div className="relative flex-1 min-h-[330px]">
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
                    className={`cursor-pointer group relative flex items-center justify-center rounded-full transition-transform hover:scale-125 ${
                      selectedRegion.name.toLowerCase() === st.name.toLowerCase()
                        ? "ring-2 ring-white ring-offset-2 ring-offset-slate-900 w-5 h-5 shadow-lg shadow-cyan-500/50"
                        : "w-3.5 h-3.5 opacity-85 hover:opacity-100"
                    }`}
                    style={{ backgroundColor: st.color }}
                  >
                    <div className="absolute bottom-6 hidden group-hover:block bg-slate-900 border border-slate-700 text-white text-[11px] px-2 py-1 rounded shadow-lg whitespace-nowrap z-50 pointer-events-none">
                      <span className="font-bold">{st.name}</span> ({st.region}): {(st.bust_probability * 100).toFixed(0)}% bust risk
                    </div>
                  </div>
                </Marker>
              ))}
            </Map>

            <div className="absolute bottom-2 left-2 bg-slate-900/90 px-2.5 py-1 text-[11px] rounded border border-slate-700 text-slate-400">
              Active Target: <span className="text-white font-semibold">{selectedRegion.name}</span> ({selectedRegion.lat}°N, {selectedRegion.lon}°E) | Day {leadDay}
            </div>
          </div>
        </div>

        {/* Bust Probability & Hero Stats (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="dashboard-panel flex-1 flex flex-col justify-between">
            <div className="flex justify-between items-start border-b border-slate-800 pb-3">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Target Evaluation
                </span>
                <h3 className="text-lg font-bold text-white">
                  {selectedRegion.name}, {selectedRegion.state}
                </h3>
              </div>
              <span className={`px-2.5 py-1 rounded text-xs font-extrabold uppercase border ${
                riskCategory === "HIGH"
                  ? "bg-rose-950/60 text-rose-400 border-rose-700/60"
                  : riskCategory === "MODERATE"
                  ? "bg-amber-950/60 text-amber-400 border-amber-700/60"
                  : "bg-emerald-950/60 text-emerald-400 border-emerald-700/60"
              }`}>
                {riskCategory} RISK
              </span>
            </div>

            {loading ? (
              <div className="py-8 flex flex-col items-center justify-center text-slate-500 gap-2">
                <RefreshCw className="animate-spin text-cyan-400" size={24} />
                <span className="text-xs">Computing calibrated bust inference...</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                  <div className="text-slate-400 text-xs font-semibold mb-1">Bust Probability</div>
                  <div className={`text-4xl font-extrabold tracking-tight ${
                    riskCategory === "HIGH" ? "text-rose-400" : riskCategory === "MODERATE" ? "text-amber-400" : "text-emerald-400"
                  }`}>
                    {bustProbPct}%
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    LightGBM + Isotonic
                  </div>
                </div>

                <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                  <div className="text-slate-400 text-xs font-semibold mb-1">Forecast Confidence</div>
                  <div className="text-4xl font-extrabold text-white tracking-tight">
                    {confidencePct}%
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    1 - P(bust) Indicator
                  </div>
                </div>
              </div>
            )}

            <div className="border-t border-slate-800 pt-3 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-slate-900/50 p-2 rounded">
                <span className="text-slate-400 block text-[10px]">Precipitation</span>
                <span className="font-semibold text-white">{selectedRegion.rainfall} mm</span>
              </div>
              <div className="bg-slate-900/50 p-2 rounded">
                <span className="text-slate-400 block text-[10px]">Wind Speed</span>
                <span className="font-semibold text-white">{selectedRegion.windSpeed} m/s</span>
              </div>
              <div className="bg-slate-900/50 p-2 rounded">
                <span className="text-slate-400 block text-[10px]">Temperature</span>
                <span className="font-semibold text-white">{selectedRegion.temp} °C</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Middle Row: SHAP Explainability, Forecast Revision, Historical Analogs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* SHAP Local Explainability */}
        <div className="dashboard-panel flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
              <h3 className="font-bold text-sm text-slate-200 flex items-center gap-1.5">
                <Info size={16} className="text-cyan-400" /> Why is this forecast at risk?
              </h3>
              <span className="text-[10px] text-slate-500 uppercase font-bold">Local SHAP</span>
            </div>

            {loading ? (
              <div className="space-y-2 py-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-9 bg-slate-800/80 rounded animate-pulse"></div>
                ))}
              </div>
            ) : shapReasons.length > 0 ? (
              <div className="space-y-2.5">
                {shapReasons.slice(0, 4).map((r, i) => (
                  <div key={i} className="bg-slate-900/80 p-2.5 rounded border border-slate-800/80 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-slate-200">{r.code.replace(/_/g, " ")}</div>
                      <div className="text-[10px] text-slate-400">{r.text}</div>
                    </div>
                    <div className={`font-mono text-xs font-bold shrink-0 ml-2 ${
                      r.contribution >= 0 ? "text-rose-400" : "text-emerald-400"
                    }`}>
                      {r.contribution >= 0 ? `+${r.contribution.toFixed(2)}` : r.contribution.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic py-6 text-center">
                SHAP explanation signals unavailable for this configuration.
              </div>
            )}
          </div>

          <div className="text-[10px] text-slate-500 italic mt-3 pt-2 border-t border-slate-800/80">
            SHAP reflects algorithmic model attributions, not confirmed meteorological causality.
          </div>
        </div>

        {/* Forecast Revision Detection */}
        <div className="dashboard-panel flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
              <h3 className="font-bold text-sm text-slate-200 flex items-center gap-1.5">
                <TrendingUp size={16} className="text-cyan-400" /> Forecast Revision Evolution
              </h3>
              <span className="text-[10px] text-slate-500 uppercase font-bold">Run-to-Run</span>
            </div>

            {loading ? (
              <div className="h-28 bg-slate-800/80 rounded animate-pulse my-4"></div>
            ) : revisions ? (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-400">Run Instability Signal:</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
                    revisions.large_revision
                      ? "bg-rose-950/60 border-rose-700/60 text-rose-400"
                      : "bg-emerald-950/60 border-emerald-700/60 text-emerald-300"
                  }`}>
                    {revisions.large_revision ? "⚠ Large Revision" : "✓ Normal Shift"}
                  </span>
                </div>

                {revisions.runs && (
                  <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800 space-y-1.5 text-xs">
                    <div className="text-[11px] text-slate-400 font-semibold mb-1">Precipitation Progression:</div>
                    <div className="flex items-center justify-between text-[11px]">
                      {revisions.runs.map((r, i) => (
                        <div key={i} className="text-center">
                          <span className="text-slate-500 block text-[9px]">{r.run}</span>
                          <span className="font-bold text-white">{r.rainfall_mm} mm</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-2.5 text-xs flex justify-between text-slate-400">
                  <span>Combined Shift Score:</span>
                  <span className="font-bold text-white">{revisions.combined_revision_score ?? "0.45"}</span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic py-6 text-center">
                Multi-run revision history unavailable for this target.
              </div>
            )}
          </div>

          <div className="text-[10px] text-slate-500 italic mt-3 pt-2 border-t border-slate-800/80">
            Forecast shifts indicate numerical instability across initialization cycles.
          </div>
        </div>

        {/* Historical Analog Retrieval */}
        <div className="dashboard-panel flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
              <h3 className="font-bold text-sm text-slate-200 flex items-center gap-1.5">
                <Activity size={16} className="text-cyan-400" /> Historical Analogs
              </h3>
              <span className="text-[10px] text-slate-500 uppercase font-bold">Top-5 Similar</span>
            </div>

            {loading ? (
              <div className="h-28 bg-slate-800/80 rounded animate-pulse my-4"></div>
            ) : (
              <div>
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-xs text-slate-400">Analog Bust Frequency:</span>
                  <span className="text-base font-bold text-white">
                    {analogSummary ? `${Math.round(analogSummary.historical_analog_bust_rate * 5)} / 5 (${(analogSummary.historical_analog_bust_rate * 100).toFixed(0)}%)` : "--"}
                  </span>
                </div>

                <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                  {analogs.length > 0 ? (
                    analogs.slice(0, 4).map((a, i) => (
                      <div key={i} className="flex justify-between items-center text-[11px] bg-slate-900/80 p-1.5 rounded border border-slate-800">
                        <span className="text-slate-300">
                          #{i + 1} {a.initialization_time.split(" ")[0]}
                        </span>
                        <span className="text-slate-400 font-mono">
                          d={a.similarity_distance?.toFixed(2)}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          a.bust === 1 ? "bg-rose-950 text-rose-400 border border-rose-800" : "bg-emerald-950 text-emerald-400 border border-emerald-800"
                        }`}>
                          {a.bust === 1 ? "BUST" : "ACCURATE"}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-500 italic py-2 text-center">
                      No prior analogs matching strict chronological filter.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="text-[10px] text-slate-500 italic mt-3 pt-2 border-t border-slate-800/80">
            Strict anti-leakage: Searched strictly before current initialization time.
          </div>
        </div>
      </div>

      {/* 5. Bottom Row: Recharts Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Bust Probability by Lead Day Chart */}
        <div className="dashboard-panel">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-2">
            <h3 className="font-bold text-sm text-slate-200 flex items-center gap-1.5">
              <BarChart3 size={16} className="text-cyan-400" /> Bust Probability by Lead Day (Day 1 – Day 10)
            </h3>
            <span className="text-[10px] text-slate-500">Uncertainty Growth Curve</span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={leadCurve} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBust" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                <XAxis dataKey="lead_day" tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={(val) => `D${val}`} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} domain={[0, 1]} tickFormatter={(val) => `${(val * 100).toFixed(0)}%`} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", fontSize: "12px" }}
                  formatter={(val: any) => [`${(Number(val) * 100).toFixed(1)}%`, "Bust Probability"]}
                  labelFormatter={(label) => `Forecast Lead Day ${label}`}
                />
                <ReferenceLine y={0.65} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: "High Risk (65%)", fill: "#f43f5e", fontSize: 10 }} />
                <Area type="monotone" dataKey="bust_probability" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorBust)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Model Feature Contributions (SHAP Bar Chart) */}
        <div className="dashboard-panel">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-2">
            <h3 className="font-bold text-sm text-slate-200 flex items-center gap-1.5">
              <Activity size={16} className="text-cyan-400" /> Model Feature Contributions (SHAP Attributions)
            </h3>
            <span className="text-[10px] text-slate-500">Feature Impact on Risk</span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={shapChartData} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <YAxis type="category" dataKey="feature" tick={{ fill: "#cbd5e1", fontSize: 10 }} width={90} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", fontSize: "12px" }}
                  formatter={(val: any) => [Number(val).toFixed(3), "SHAP Contribution"]}
                />
                <Bar dataKey="contribution" radius={[0, 4, 4, 0]}>
                  {shapChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.contribution >= 0 ? "#f43f5e" : "#10b981"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 6. Footer & Disclaimers */}
      <footer className="border-t border-slate-800 pt-4 text-center text-slate-500 text-xs flex flex-col md:flex-row justify-between items-center gap-2">
        <div>
          ForecastGuard AI Prototype &bull; MoES / NCMRWF Problem Statement 26079
        </div>
        <div className="text-[11px] text-slate-400">
          * Research Decision-Support Prototype. Model-estimated bust probabilities do not replace official MoES/IMD severe weather advisories.
        </div>
      </footer>
    </div>
  );
}