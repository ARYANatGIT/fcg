"use client";

import React, { useState, useEffect, useTransition } from "react";
import { Sliders, Zap, ArrowRight, RefreshCw, AlertTriangle, ShieldCheck, Thermometer, Wind, CloudRain, Gauge, Droplets } from "lucide-react";
import CircularGauge from "./CircularGauge";

interface WhatIfSimulatorProps {
  initialFeatures: {
    rainfall: number;
    windSpeed: number;
    temp: number;
    pressure: number;
    humidity: number;
    leadDay: number;
  };
  onApplyScenario: (params: {
    rainfall: number;
    windSpeed: number;
    temp: number;
    pressure: number;
    humidity: number;
    leadDay: number;
  }) => void;
}

const PRESETS = [
  {
    name: "Monsoon Deep Depression",
    desc: "140mm torrential convective rain, 18m/s squally wind, 996 hPa low pressure vortex",
    rainfall: 140,
    windSpeed: 18,
    temp: 26,
    pressure: 996,
    humidity: 95,
    leadDay: 5,
    icon: CloudRain,
    color: "#38bdf8"
  },
  {
    name: "Tropical Cyclone Landfall",
    desc: "190mm extreme rain core, 30m/s gale wind, 982 hPa central pressure minimum",
    rainfall: 190,
    windSpeed: 30,
    temp: 27,
    pressure: 982,
    humidity: 98,
    leadDay: 6,
    icon: Wind,
    color: "#ef4444"
  },
  {
    name: "Severe Pre-Monsoon Heatwave",
    desc: "46°C extreme thermal heating, 0mm rain, 1006 hPa, dry boundary layer (25% RH)",
    rainfall: 0,
    windSpeed: 7,
    temp: 46,
    pressure: 1006,
    humidity: 25,
    leadDay: 4,
    icon: Thermometer,
    color: "#f59e0b"
  },
  {
    name: "Western Disturbance Trough",
    desc: "55mm orographic rain/snow, 14m/s mountain wind, 12°C cool tropospheric air",
    rainfall: 55,
    windSpeed: 14,
    temp: 12,
    pressure: 1011,
    humidity: 88,
    leadDay: 5,
    icon: CloudRain,
    color: "#a78bfa"
  },
  {
    name: "Benign Stable High Pressure",
    desc: "0mm rain, 3.5m/s light breeze, 1018 hPa anticyclone with high numerical consensus",
    rainfall: 0,
    windSpeed: 3.5,
    temp: 24,
    pressure: 1018,
    humidity: 50,
    leadDay: 2,
    icon: ShieldCheck,
    color: "#22c55e"
  },
];

const PRESET_ICON_MAP: Record<string, any> = {
  monsoon: CloudRain,
  cyclone: Wind,
  heatwave: Thermometer,
  western_disturbance: CloudRain,
  stable: ShieldCheck,
  convective: Zap,
  fog: Wind,
};

export default function WhatIfSimulator({
  initialFeatures,
  onApplyScenario,
}: WhatIfSimulatorProps) {
  const [presets, setPresets] = useState<any[]>(PRESETS);
  const [rainfall, setRainfall] = useState(initialFeatures.rainfall);
  const [windSpeed, setWindSpeed] = useState(initialFeatures.windSpeed);
  const [temp, setTemp] = useState(initialFeatures.temp);
  const [pressure, setPressure] = useState(initialFeatures.pressure);
  const [humidity, setHumidity] = useState(initialFeatures.humidity);
  const [leadDay, setLeadDay] = useState(initialFeatures.leadDay);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [, startTransition] = useTransition();

  // Load scenarios from MongoDB
  useEffect(() => {
    fetch("/api/whatif_scenarios")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.scenarios && Array.isArray(data.scenarios) && data.scenarios.length > 0) {
          setPresets(data.scenarios);
        }
      })
      .catch((err) => console.warn("Failed to load whatif scenarios from MongoDB:", err));
  }, []);

  // Save custom scenario to MongoDB
  const handleSaveScenario = async () => {
    try {
      setIsSaving(true);
      const name = prompt("Enter a name for this custom atmospheric scenario:", `Custom Scenario ${presets.length + 1}`);
      if (!name) {
        setIsSaving(false);
        return;
      }
      const desc = prompt("Enter a brief description of the scenario:", `${rainfall}mm rain, ${windSpeed}m/s wind, ${temp}°C, ${pressure}hPa at D-${leadDay}`);

      const res = await fetch("/api/whatif_scenarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          desc: desc || "User-defined atmospheric perturbation scenario",
          rainfall,
          windSpeed,
          temp,
          pressure,
          humidity,
          leadDay,
          category: "custom",
          color: "#38bdf8",
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json?.scenario) {
          setPresets((prev) => [json.scenario, ...prev]);
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 3000);
        }
      }
    } catch (err) {
      console.warn("Failed to save scenario:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Dynamic sensitivity calculation approximating the calibrated LightGBM decision bounds
  const calculateSimulatedRisk = () => {
    const rainScore = Math.min(1.0, rainfall / 120.0);
    const windScore = Math.min(1.0, Math.max(0, (windSpeed - 5) / 25.0));
    const leadScore = Math.pow(leadDay / 10.0, 1.6);
    const pressureAnomaly = Math.max(0, (1013.25 - pressure) / 30.0);
    const convectiveIndex = Math.max(0, ((temp * (humidity / 100.0)) - 12.0) / 30.0);

    let rawScore =
      0.05 +
      rainScore * 0.45 +
      leadScore * 0.18 +
      windScore * 0.14 +
      pressureAnomaly * 0.12 +
      convectiveIndex * 0.06;

    return Math.min(0.95, Math.max(0.04, Number(rawScore.toFixed(3))));
  };

  const simulatedProb = calculateSimulatedRisk();
  const simulatedConfidence = Number((1.0 - simulatedProb).toFixed(3));
  const isHigh = simulatedProb >= 0.65;
  const isMod = simulatedProb >= 0.35 && simulatedProb < 0.65;
  const riskCategory = isHigh ? "HIGH" : isMod ? "MODERATE" : "LOW";

  const loadPreset = (p: (typeof PRESETS)[0]) => {
    startTransition(() => {
      setRainfall(p.rainfall);
      setWindSpeed(p.windSpeed);
      setTemp(p.temp);
      setPressure(p.pressure);
      setHumidity(p.humidity);
      setLeadDay(p.leadDay);
    });
  };

  const handleApply = () => {
    onApplyScenario({
      rainfall,
      windSpeed,
      temp,
      pressure,
      humidity,
      leadDay,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Description */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#232732] pb-5">
        <div>
          <h2 className="text-[20px] font-[600] text-[#ffffff] flex items-center gap-2.5">
            <Sliders size={20} className="text-[#e4f222]" /> NWP Sensitivity &amp; What-If Scenario Sandbox
          </h2>
          <p className="text-[14px] text-[#94a3b8] mt-1">
            Interactively perturb numerical weather prediction variables to simulate how convective precipitation, wind gusts, or lead time shift bust probability.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveScenario}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSaving ? "animate-spin text-cyan-400" : ""}`} />
            <span>{saveSuccess ? "Saved Successfully!" : "Save Current Scenario"}</span>
          </button>

          <button
            onClick={handleApply}
            className="btn-acid-lime cursor-pointer font-semibold flex items-center gap-2"
          >
            <Zap size={16} strokeWidth={2.5} />
            <span>Apply Scenario to Overview</span>
          </button>
        </div>
      </div>

      {/* Preset Scenarios Strip */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-white/80 font-bold uppercase tracking-wider block">
            Select Atmospheric Scenario ({presets.length} Saved Scenarios):
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {presets.map((p) => {
            const Icon = typeof p.icon === "string" ? (PRESET_ICON_MAP[p.category] || CloudRain) : (p.icon || PRESET_ICON_MAP[p.category] || CloudRain);
            return (
              <button
                key={p.name}
                onClick={() => loadPreset(p)}
                className="linear-panel-inner text-left hover:border-cyan-500/40 transition p-4 cursor-pointer group flex flex-col justify-between rounded-xl bg-[#0e1424]/80 border border-white/10"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div
                      className="w-9 h-9 rounded-lg bg-[#1c212c] flex items-center justify-center shrink-0"
                      style={{ color: p.color || "#38bdf8" }}
                    >
                      <Icon size={18} />
                    </div>
                    <ArrowRight size={14} className="text-white/40 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <div className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                    {p.name}
                  </div>
                  <p className="text-xs text-white/60 mt-1.5 leading-relaxed line-clamp-2">
                    {p.desc}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-xs font-mono text-white/50">
                  <span>Lead: D-{p.leadDay}</span>
                  <span style={{ color: p.color || "#38bdf8" }} className="font-bold">LOAD &rarr;</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Sandbox Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Atmospheric Controls (7 cols) */}
        <div className="lg:col-span-7 linear-card space-y-6">
          <div className="flex justify-between items-center border-b border-[#232732] pb-3.5">
            <span className="text-[16px] font-[600] text-[#ffffff]">
              Atmospheric Parameter Controls
            </span>
            <span className="linear-badge font-linear-mono text-[12px]">
              REAL-TIME INFERENCE
            </span>
          </div>

          {/* 1. Rainfall */}
          <div className="space-y-2.5 bg-[#12151c] p-4 rounded-[10px] border border-[#232732]">
            <div className="flex justify-between items-center text-[14px]">
              <span className="text-[#ffffff] font-medium flex items-center gap-2">
                <CloudRain size={16} className="text-[#38bdf8]" /> Predicted 24h Rainfall
              </span>
              <span className="font-linear-mono text-[#38bdf8] text-[16px] font-bold">{rainfall} mm</span>
            </div>
            <input
              type="range"
              min="0"
              max="200"
              step="1"
              value={rainfall}
              onChange={(e) => setRainfall(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-[12px] font-linear-mono text-[#94a3b8]">
              <span>0 mm (Dry)</span>
              <span>50 mm (Heavy)</span>
              <span>120 mm (Very Heavy)</span>
              <span>200 mm (Extreme)</span>
            </div>
          </div>

          {/* 2. Wind Speed */}
          <div className="space-y-2.5 bg-[#12151c] p-4 rounded-[10px] border border-[#232732]">
            <div className="flex justify-between items-center text-[14px]">
              <span className="text-[#ffffff] font-medium flex items-center gap-2">
                <Wind size={16} className="text-[#e4f222]" /> 10m Wind Speed Magnitude
              </span>
              <span className="font-linear-mono text-[#e4f222] text-[16px] font-bold">{windSpeed.toFixed(1)} m/s</span>
            </div>
            <input
              type="range"
              min="0"
              max="35"
              step="0.5"
              value={windSpeed}
              onChange={(e) => setWindSpeed(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-[12px] font-linear-mono text-[#94a3b8]">
              <span>0 m/s (Calm)</span>
              <span>10 m/s (Breezy)</span>
              <span>20 m/s (Gale)</span>
              <span>35 m/s (Storm)</span>
            </div>
          </div>

          {/* 3. 2m Temperature */}
          <div className="space-y-2.5 bg-[#12151c] p-4 rounded-[10px] border border-[#232732]">
            <div className="flex justify-between items-center text-[14px]">
              <span className="text-[#ffffff] font-medium flex items-center gap-2">
                <Thermometer size={16} className="text-[#f59e0b]" /> 2m Surface Temperature
              </span>
              <span className="font-linear-mono text-[#f59e0b] text-[16px] font-bold">{temp.toFixed(1)} °C</span>
            </div>
            <input
              type="range"
              min="5"
              max="48"
              step="0.5"
              value={temp}
              onChange={(e) => setTemp(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-[12px] font-linear-mono text-[#94a3b8]">
              <span>5 °C (Cold)</span>
              <span>25 °C (Moderate)</span>
              <span>38 °C (Hot)</span>
              <span>48 °C (Heatwave)</span>
            </div>
          </div>

          {/* 4. Surface Pressure */}
          <div className="space-y-2.5 bg-[#12151c] p-4 rounded-[10px] border border-[#232732]">
            <div className="flex justify-between items-center text-[14px]">
              <span className="text-[#ffffff] font-medium flex items-center gap-2">
                <Gauge size={16} className="text-[#a78bfa]" /> Surface Atmospheric Pressure
              </span>
              <span className="font-linear-mono text-[#a78bfa] text-[16px] font-bold">{pressure.toFixed(1)} hPa</span>
            </div>
            <input
              type="range"
              min="975"
              max="1025"
              step="0.5"
              value={pressure}
              onChange={(e) => setPressure(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-[12px] font-linear-mono text-[#94a3b8]">
              <span>975 hPa (Deep Depression)</span>
              <span>1000 hPa (Low)</span>
              <span>1013 hPa (Standard)</span>
              <span>1025 hPa (High)</span>
            </div>
          </div>

          {/* 5. Relative Humidity */}
          <div className="space-y-2.5 bg-[#12151c] p-4 rounded-[10px] border border-[#232732]">
            <div className="flex justify-between items-center text-[14px]">
              <span className="text-[#ffffff] font-medium flex items-center gap-2">
                <Droplets size={16} className="text-[#38bdf8]" /> 2m Relative Humidity
              </span>
              <span className="font-linear-mono text-[#38bdf8] text-[16px] font-bold">{humidity.toFixed(0)} %</span>
            </div>
            <input
              type="range"
              min="15"
              max="100"
              step="1"
              value={humidity}
              onChange={(e) => setHumidity(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-[12px] font-linear-mono text-[#94a3b8]">
              <span>15% (Arid)</span>
              <span>50% (Comfort)</span>
              <span>75% (Humid)</span>
              <span>100% (Saturated)</span>
            </div>
          </div>

          {/* 6. Lead Day */}
          <div className="space-y-2.5 bg-[#12151c] p-4 rounded-[10px] border border-[#232732]">
            <div className="flex justify-between items-center text-[14px]">
              <span className="text-[#ffffff] font-medium flex items-center gap-2">
                <Zap size={16} className="text-[#e4f222]" /> Medium-Range Lead Day
              </span>
              <span className="font-linear-mono text-[#e4f222] text-[16px] font-bold">Day {leadDay}</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              value={leadDay}
              onChange={(e) => setLeadDay(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-[12px] font-linear-mono text-[#94a3b8]">
              <span>Day 1 (Short Range)</span>
              <span>Day 5 (Medium Range)</span>
              <span>Day 10 (Extended Medium Range)</span>
            </div>
          </div>
        </div>

        {/* Real-time Sensitivity Readout (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          <div className="linear-card flex-1 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center border-b border-[#232732] pb-3.5 mb-4">
                <h3 className="text-[16px] font-[600] text-[#ffffff]">
                  Simulated Bust Likelihood
                </h3>
                <span className={`linear-badge font-linear-mono text-[12px] font-semibold ${
                  isHigh ? "bg-[#ef4444]/15 text-[#ef4444] border-[#ef4444]/50" : isMod ? "bg-[#f59e0b]/15 text-[#f59e0b] border-[#f59e0b]/50" : "bg-[#22c55e]/15 text-[#22c55e] border-[#22c55e]/50"
                }`}>
                  {riskCategory} RISK
                </span>
              </div>

              <div className="flex flex-col items-center justify-center py-4">
                <CircularGauge
                  value={simulatedProb}
                  label="Simulated Bust Risk"
                  sublabel={`Confidence: ${(simulatedConfidence * 100).toFixed(1)}%`}
                  size={220}
                  strokeWidth={15}
                />
              </div>

              <div className="bg-[#12151c] p-4 rounded-[10px] border border-[#232732] mt-4 space-y-2 text-[13px]">
                <div className="font-[600] text-[#ffffff] flex items-center gap-2">
                  <AlertTriangle size={15} className="text-[#e4f222]" />
                  Sensitivity Analysis Insights:
                </div>
                <ul className="text-[#94a3b8] space-y-1.5 pl-5 list-disc leading-relaxed">
                  <li>
                    {rainfall > 50
                      ? `Heavy convective rain (${rainfall}mm) triggers non-linear error growth in precipitation verification.`
                      : `Mild rainfall (${rainfall}mm) keeps convective error variance low.`}
                  </li>
                  <li>
                    {leadDay >= 5
                      ? `Lead Day ${leadDay} compounds baroclinic wave phase displacement errors.`
                      : `Short lead time (Day ${leadDay}) provides robust dynamical anchor.`}
                  </li>
                  <li>
                    {pressure < 1002
                      ? `Deep barometric depression (${pressure} hPa) amplifies cyclogenesis uncertainty.`
                      : `Normal surface pressure supports steady synoptic flow.`}
                  </li>
                </ul>
              </div>
            </div>

            <button
              onClick={handleApply}
              className="btn-acid-lime w-full font-semibold cursor-pointer mt-6"
            >
              <Zap size={16} strokeWidth={2.5} />
              <span>Deploy Scenario to Live Overview</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
