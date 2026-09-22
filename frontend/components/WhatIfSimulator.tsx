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
    desc: "140mm convective rain, 18m/s squally wind, 996 hPa low pressure vortex",
    rainfall: 140,
    windSpeed: 18,
    temp: 26,
    pressure: 996,
    humidity: 95,
    leadDay: 5,
    icon: CloudRain,
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
  },
];

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

  useEffect(() => {
    fetch("/api/whatif_scenarios")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.scenarios && Array.isArray(data.scenarios) && data.scenarios.length > 0) {
          setPresets(data.scenarios);
        }
      })
      .catch(() => null);
  }, []);

  const handleSaveScenario = async () => {
    try {
      setIsSaving(true);
      const name = prompt("Enter a name for this custom atmospheric scenario:", `Custom Scenario ${presets.length + 1}`);
      if (!name) {
        setIsSaving(false);
        return;
      }
      const desc = prompt("Enter a brief description:", `${rainfall}mm rain, ${windSpeed}m/s wind, ${temp}°C, ${pressure}hPa at D-${leadDay}`);

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
    } catch {
      // Handled cleanly
    } finally {
      setIsSaving(false);
    }
  };

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

  const loadPreset = (p: any) => {
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
      <div className="glass-feature p-5 rounded-2xl border border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center text-[#E8E8E5]">
              <Sliders size={16} />
            </div>
            <h2 className="text-lg font-bold text-[#E8E8E5] tracking-tight font-sans">
              NWP Sensitivity &amp; What-If Scenario Sandbox
            </h2>
          </div>
          <p className="text-xs text-[#92928C] leading-relaxed max-w-3xl">
            Interactively perturb numerical weather prediction variables to simulate how convective precipitation, wind gusts, or lead time shift bust probability.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveScenario}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-[#E8E8E5] text-xs font-mono-tech font-semibold transition cursor-pointer active:scale-[0.99]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSaving ? "animate-spin text-white" : ""}`} />
            <span>{saveSuccess ? "Saved!" : "Save Scenario"}</span>
          </button>

          <button
            onClick={handleApply}
            className="px-4 py-2 rounded-full bg-[#E8E8E4] hover:bg-white text-[#141414] font-bold text-xs font-mono-tech flex items-center gap-2 transition cursor-pointer active:scale-[0.99] shadow-sm"
          >
            <Zap size={14} />
            <span>Apply to Live Cockpit</span>
          </button>
        </div>
      </div>

      {/* Preset Scenarios Strip */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="noir-kicker block">
            Select Atmospheric Preset ({presets.length} Scenarios):
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {presets.map((p, idx) => {
            const Icon = p.icon || CloudRain;
            return (
              <button
                key={p.name + idx}
                onClick={() => loadPreset(p)}
                className="detail-card text-left p-4 cursor-pointer group flex flex-col justify-between rounded-2xl transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center text-[#E8E8E5] shrink-0">
                      <Icon size={15} />
                    </div>
                    <ArrowRight size={13} className="text-[#8B8B87] group-hover:text-[#E8E8E5] group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <div className="text-xs font-bold text-[#E8E8E5]">
                    {p.name}
                  </div>
                  <p className="text-[11px] text-[#92928C] mt-1.5 leading-relaxed line-clamp-2">
                    {p.desc}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[10px] font-mono-tech text-[#8B8B87]">
                  <span>Lead: D-{p.leadDay}</span>
                  <span className="font-bold text-[#E8E8E5]">LOAD &rarr;</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Sandbox Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Atmospheric Controls (7 cols) */}
        <div className="lg:col-span-7 detail-card space-y-5 p-6 rounded-2xl">
          <div className="flex justify-between items-center border-b border-white/10 pb-3.5">
            <span className="text-base font-bold text-[#E8E8E5]">
              Atmospheric Parameter Controls
            </span>
            <span className="px-2.5 py-0.5 rounded-full font-mono-tech text-[10px] bg-white/[0.05] text-[#D8D8D3] border border-white/10 font-semibold">
              REAL-TIME INFERENCE
            </span>
          </div>

          {/* 1. Rainfall */}
          <div className="space-y-2 bg-white/[0.03] p-4 rounded-xl border border-white/10">
            <div className="flex justify-between items-center text-sm">
              <span className="text-[#E8E8E5] font-semibold flex items-center gap-2">
                <CloudRain size={16} className="text-white" /> Predicted 24h Rainfall
              </span>
              <span className="font-mono-tech text-[#E8E8E5] text-base font-bold">{rainfall} mm</span>
            </div>
            <input
              type="range"
              min="0"
              max="200"
              step="1"
              value={rainfall}
              onChange={(e) => setRainfall(Number(e.target.value))}
              className="w-full accent-white cursor-pointer"
            />
            <div className="flex justify-between text-xs font-mono-tech text-[#8B8B87]">
              <span>0 mm (Dry)</span>
              <span>50 mm</span>
              <span>120 mm</span>
              <span>200 mm (Extreme)</span>
            </div>
          </div>

          {/* 2. Wind Speed */}
          <div className="space-y-2 bg-white/[0.03] p-4 rounded-xl border border-white/10">
            <div className="flex justify-between items-center text-sm">
              <span className="text-[#E8E8E5] font-semibold flex items-center gap-2">
                <Wind size={16} className="text-white" /> 10m Wind Speed Magnitude
              </span>
              <span className="font-mono-tech text-[#E8E8E5] text-base font-bold">{windSpeed.toFixed(1)} m/s</span>
            </div>
            <input
              type="range"
              min="0"
              max="35"
              step="0.5"
              value={windSpeed}
              onChange={(e) => setWindSpeed(Number(e.target.value))}
              className="w-full accent-white cursor-pointer"
            />
            <div className="flex justify-between text-xs font-mono-tech text-[#8B8B87]">
              <span>0 m/s</span>
              <span>10 m/s</span>
              <span>20 m/s</span>
              <span>35 m/s (Gale)</span>
            </div>
          </div>

          {/* 3. 2m Temperature */}
          <div className="space-y-2 bg-white/[0.03] p-4 rounded-xl border border-white/10">
            <div className="flex justify-between items-center text-sm">
              <span className="text-[#E8E8E5] font-semibold flex items-center gap-2">
                <Thermometer size={16} className="text-white" /> 2m Surface Temperature
              </span>
              <span className="font-mono-tech text-[#E8E8E5] text-base font-bold">{temp.toFixed(1)} °C</span>
            </div>
            <input
              type="range"
              min="5"
              max="48"
              step="0.5"
              value={temp}
              onChange={(e) => setTemp(Number(e.target.value))}
              className="w-full accent-white cursor-pointer"
            />
            <div className="flex justify-between text-xs font-mono-tech text-[#8B8B87]">
              <span>5 °C</span>
              <span>25 °C</span>
              <span>38 °C</span>
              <span>48 °C (Heatwave)</span>
            </div>
          </div>

          {/* 4. Surface Pressure */}
          <div className="space-y-2 bg-white/[0.03] p-4 rounded-xl border border-white/10">
            <div className="flex justify-between items-center text-sm">
              <span className="text-[#E8E8E5] font-semibold flex items-center gap-2">
                <Gauge size={16} className="text-white" /> Surface Atmospheric Pressure
              </span>
              <span className="font-mono-tech text-[#E8E8E5] text-base font-bold">{pressure.toFixed(1)} hPa</span>
            </div>
            <input
              type="range"
              min="975"
              max="1025"
              step="0.5"
              value={pressure}
              onChange={(e) => setPressure(Number(e.target.value))}
              className="w-full accent-white cursor-pointer"
            />
            <div className="flex justify-between text-xs font-mono-tech text-[#8B8B87]">
              <span>975 hPa (Depression)</span>
              <span>1000 hPa</span>
              <span>1013 hPa</span>
              <span>1025 hPa (High)</span>
            </div>
          </div>

          {/* 5. Relative Humidity */}
          <div className="space-y-2 bg-white/[0.03] p-4 rounded-xl border border-white/10">
            <div className="flex justify-between items-center text-sm">
              <span className="text-[#E8E8E5] font-semibold flex items-center gap-2">
                <Droplets size={16} className="text-white" /> 2m Relative Humidity
              </span>
              <span className="font-mono-tech text-[#E8E8E5] text-base font-bold">{humidity.toFixed(0)} %</span>
            </div>
            <input
              type="range"
              min="15"
              max="100"
              step="1"
              value={humidity}
              onChange={(e) => setHumidity(Number(e.target.value))}
              className="w-full accent-white cursor-pointer"
            />
            <div className="flex justify-between text-xs font-mono-tech text-[#8B8B87]">
              <span>15% (Dry)</span>
              <span>50%</span>
              <span>75%</span>
              <span>100% (Saturated)</span>
            </div>
          </div>

          {/* 6. Lead Day */}
          <div className="space-y-2 bg-white/[0.03] p-4 rounded-xl border border-white/10">
            <div className="flex justify-between items-center text-sm">
              <span className="text-[#E8E8E5] font-semibold flex items-center gap-2">
                <Zap size={16} className="text-white" /> Medium-Range Lead Day
              </span>
              <span className="font-mono-tech text-[#E8E8E5] text-base font-bold">Day {leadDay}</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              value={leadDay}
              onChange={(e) => setLeadDay(Number(e.target.value))}
              className="w-full accent-white cursor-pointer"
            />
            <div className="flex justify-between text-xs font-mono-tech text-[#8B8B87]">
              <span>Day 1 (Short)</span>
              <span>Day 5 (Medium)</span>
              <span>Day 10 (Extended)</span>
            </div>
          </div>
        </div>

        {/* Real-time Sensitivity Readout (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          <div className="detail-card flex-1 flex flex-col justify-between p-6 rounded-2xl">
            <div>
              <div className="flex justify-between items-center border-b border-white/10 pb-3.5 mb-4">
                <h3 className="text-base font-bold text-[#E8E8E5]">
                  Simulated Bust Likelihood
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full font-mono-tech text-[10px] font-bold border ${
                  isHigh ? "bg-red-500/10 text-red-400 border-red-500/30" : isMod ? "bg-amber-500/10 text-amber-400 border-amber-500/30" : "bg-white/[0.05] text-[#D8D8D3] border-white/10"
                }`}>
                  {riskCategory} RISK
                </span>
              </div>

              <div className="flex flex-col items-center justify-center py-4">
                <CircularGauge
                  value={simulatedProb}
                  label="Simulated Bust Risk"
                  sublabel={`Confidence: ${(simulatedConfidence * 100).toFixed(1)}%`}
                  size={200}
                  strokeWidth={14}
                />
              </div>

              <div className="bg-white/[0.03] p-4 rounded-xl border border-white/10 mt-4 space-y-2 text-xs">
                <div className="font-semibold text-[#E8E8E5] flex items-center gap-2">
                  <AlertTriangle size={15} className="text-white" />
                  Sensitivity Analysis Insights:
                </div>
                <ul className="text-[#92928C] space-y-1.5 pl-4 list-disc leading-relaxed">
                  <li>
                    {rainfall > 50
                      ? `Heavy convective rain (${rainfall}mm) triggers non-linear error growth.`
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
              className="w-full mt-6 py-3 px-4 rounded-full bg-[#E8E8E4] hover:bg-white text-[#141414] font-bold font-mono-tech text-xs flex items-center justify-center gap-2 transition cursor-pointer active:scale-[0.99] shadow-sm"
            >
              <Zap size={14} />
              <span>Deploy Scenario to Live Cockpit</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
