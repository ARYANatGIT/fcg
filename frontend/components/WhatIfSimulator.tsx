"use client";

import React, { useState, useTransition } from "react";
import { Sliders, RefreshCw, AlertTriangle, ArrowRight, Zap, CheckCircle2 } from "lucide-react";
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
    desc: "140mm torrential convective rain, 18m/s squally wind, 996 hPa low",
    rainfall: 140,
    windSpeed: 18,
    temp: 26,
    pressure: 996,
    humidity: 95,
    leadDay: 5,
  },
  {
    name: "Tropical Cyclone Landfall",
    desc: "190mm extreme rain, 30m/s gale wind, 982 hPa central pressure",
    rainfall: 190,
    windSpeed: 30,
    temp: 27,
    pressure: 982,
    humidity: 98,
    leadDay: 6,
  },
  {
    name: "Severe Pre-Monsoon Heatwave",
    desc: "46°C extreme heat, 0mm rain, 1006 hPa, dry air 25% RH",
    rainfall: 0,
    windSpeed: 7,
    temp: 46,
    pressure: 1006,
    humidity: 25,
    leadDay: 4,
  },
  {
    name: "Western Disturbance Trough",
    desc: "55mm orographic precipitation, 14m/s mountain wind, 12°C",
    rainfall: 55,
    windSpeed: 14,
    temp: 12,
    pressure: 1011,
    humidity: 88,
    leadDay: 5,
  },
  {
    name: "Benign Stable High Pressure",
    desc: "0mm rain, 3.5m/s calm breeze, 1018 hPa anticyclone",
    rainfall: 0,
    windSpeed: 3.5,
    temp: 24,
    pressure: 1018,
    humidity: 50,
    leadDay: 2,
  },
];

export default function WhatIfSimulator({
  initialFeatures,
  onApplyScenario,
}: WhatIfSimulatorProps) {
  const [rainfall, setRainfall] = useState(initialFeatures.rainfall);
  const [windSpeed, setWindSpeed] = useState(initialFeatures.windSpeed);
  const [temp, setTemp] = useState(initialFeatures.temp);
  const [pressure, setPressure] = useState(initialFeatures.pressure);
  const [humidity, setHumidity] = useState(initialFeatures.humidity);
  const [leadDay, setLeadDay] = useState(initialFeatures.leadDay);
  const [, startTransition] = useTransition();

  // Dynamic sensitivity calculation approximating the calibrated LightGBM decision bounds
  const calculateSimulatedRisk = () => {
    // Rain component (log transformed in model)
    const rainScore = Math.min(1.0, Math.log1p(rainfall) / 5.2);
    // Wind component
    const windScore = Math.min(1.0, windSpeed / 25.0);
    // Lead time component (quadratic growth)
    const leadScore = Math.pow(leadDay / 10.0, 1.4);
    // Pressure anomaly component (< 1000 hPa low is volatile)
    const pressureAnomaly = Math.max(0, (1013 - pressure) / 25.0);
    // Thermal-humidity convective instability
    const convectiveIndex = (temp * (humidity / 100.0)) / 45.0;

    let rawScore =
      0.12 +
      rainScore * 0.35 +
      leadScore * 0.28 +
      windScore * 0.16 +
      pressureAnomaly * 0.12 +
      convectiveIndex * 0.08;

    return Math.min(0.96, Math.max(0.04, rawScore));
  };

  const simulatedProb = calculateSimulatedRisk();
  const simulatedConfidence = 1.0 - simulatedProb;
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#23252a] pb-4">
        <div>
          <h2 className="text-[18px] font-[510] text-[#ffffff] flex items-center gap-2 tracking-[-0.012em]">
            <Sliders size={18} className="text-[#e4f222]" /> NWP Sensitivity &amp; What-If Scenario Sandbox
          </h2>
          <p className="text-[13px] text-[#8a8f98] mt-1">
            Simulate how variations in NWP predicted rainfall, wind speed, or pressure alter forecast bust probability.
          </p>
        </div>

        <button
          onClick={handleApply}
          className="btn-acid-lime font-medium cursor-pointer"
        >
          <Zap size={14} strokeWidth={2.5} />
          <span>Apply Scenario to Cockpit</span>
        </button>
      </div>

      {/* Preset Scenarios Strip */}
      <div className="flex flex-col gap-2">
        <span className="text-[12px] font-linear-mono text-[#8a8f98] uppercase tracking-wider">
          Quick Atmospheric Presets:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {PRESETS.map((p) => (
            <button
              key={p.name}
              onClick={() => loadPreset(p)}
              className="linear-panel-inner text-left hover:border-[#383b3f] hover:bg-[#1f2126] transition p-3 cursor-pointer group"
            >
              <div className="text-[13px] font-[510] text-[#ffffff] group-hover:text-[#e4f222] transition-colors flex items-center justify-between">
                <span>{p.name}</span>
                <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-[11px] text-[#8a8f98] mt-1 line-clamp-2">
                {p.desc}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Main Sandbox Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sliders (7 cols) */}
        <div className="lg:col-span-7 linear-card space-y-5">
          <div className="flex justify-between items-center border-b border-[#23252a] pb-3">
            <span className="text-[14px] font-[510] text-[#ffffff]">
              Atmospheric Parameter Controls
            </span>
            <span className="linear-badge font-linear-mono text-[11px]">
              REAL-TIME SENSITIVITY
            </span>
          </div>

          {/* 1. Rainfall */}
          <div className="space-y-2">
            <div className="flex justify-between text-[13px]">
              <span className="text-[#ffffff] font-medium">Predicted 24h Rainfall</span>
              <span className="font-linear-mono text-[#e4f222] font-semibold">{rainfall} mm</span>
            </div>
            <input
              type="range"
              min="0"
              max="200"
              step="1"
              value={rainfall}
              onChange={(e) => setRainfall(Number(e.target.value))}
              className="w-full accent-[#e4f222] bg-[#161718] h-2 rounded cursor-pointer"
            />
            <div className="flex justify-between text-[11px] font-linear-mono text-[#62666d]">
              <span>0 mm (Dry)</span>
              <span>50 mm (Heavy)</span>
              <span>120 mm (Very Heavy)</span>
              <span>200 mm (Extreme)</span>
            </div>
          </div>

          {/* 2. 10m Wind Speed */}
          <div className="space-y-2">
            <div className="flex justify-between text-[13px]">
              <span className="text-[#ffffff] font-medium">10m Wind Speed Magnitude</span>
              <span className="font-linear-mono text-[#02b8cc] font-semibold">{windSpeed.toFixed(1)} m/s</span>
            </div>
            <input
              type="range"
              min="0"
              max="35"
              step="0.5"
              value={windSpeed}
              onChange={(e) => setWindSpeed(Number(e.target.value))}
              className="w-full accent-[#02b8cc] bg-[#161718] h-2 rounded cursor-pointer"
            />
            <div className="flex justify-between text-[11px] font-linear-mono text-[#62666d]">
              <span>0 m/s (Calm)</span>
              <span>10 m/s (Breezy)</span>
              <span>20 m/s (Gale)</span>
              <span>35 m/s (Storm)</span>
            </div>
          </div>

          {/* 3. 2m Temperature */}
          <div className="space-y-2">
            <div className="flex justify-between text-[13px]">
              <span className="text-[#ffffff] font-medium">2m Surface Air Temperature</span>
              <span className="font-linear-mono text-[#f59e0b] font-semibold">{temp.toFixed(1)} °C</span>
            </div>
            <input
              type="range"
              min="5"
              max="48"
              step="0.5"
              value={temp}
              onChange={(e) => setTemp(Number(e.target.value))}
              className="w-full accent-[#f59e0b] bg-[#161718] h-2 rounded cursor-pointer"
            />
            <div className="flex justify-between text-[11px] font-linear-mono text-[#62666d]">
              <span>5 °C (Cold)</span>
              <span>25 °C (Moderate)</span>
              <span>38 °C (Hot)</span>
              <span>48 °C (Severe Heatwave)</span>
            </div>
          </div>

          {/* 4. Surface Pressure */}
          <div className="space-y-2">
            <div className="flex justify-between text-[13px]">
              <span className="text-[#ffffff] font-medium">Mean Surface Pressure</span>
              <span className="font-linear-mono text-[#d0d6e0] font-semibold">{pressure.toFixed(0)} hPa</span>
            </div>
            <input
              type="range"
              min="975"
              max="1025"
              step="1"
              value={pressure}
              onChange={(e) => setPressure(Number(e.target.value))}
              className="w-full accent-[#d0d6e0] bg-[#161718] h-2 rounded cursor-pointer"
            />
            <div className="flex justify-between text-[11px] font-linear-mono text-[#62666d]">
              <span>975 hPa (Deep Depression)</span>
              <span>1000 hPa (Monsoon Low)</span>
              <span>1013 hPa (Standard)</span>
              <span>1025 hPa (High)</span>
            </div>
          </div>

          {/* 5. Relative Humidity */}
          <div className="space-y-2">
            <div className="flex justify-between text-[13px]">
              <span className="text-[#ffffff] font-medium">2m Relative Humidity</span>
              <span className="font-linear-mono text-[#27a644] font-semibold">{humidity}%</span>
            </div>
            <input
              type="range"
              min="15"
              max="100"
              step="1"
              value={humidity}
              onChange={(e) => setHumidity(Number(e.target.value))}
              className="w-full accent-[#27a644] bg-[#161718] h-2 rounded cursor-pointer"
            />
            <div className="flex justify-between text-[11px] font-linear-mono text-[#62666d]">
              <span>15% (Very Dry)</span>
              <span>50% (Comfortable)</span>
              <span>80% (Humid)</span>
              <span>100% (Saturated)</span>
            </div>
          </div>

          {/* 6. Lead Day Slider */}
          <div className="space-y-2 pt-2 border-t border-[#23252a]">
            <div className="flex justify-between text-[13px]">
              <span className="text-[#ffffff] font-medium">Forecast Lead Time</span>
              <span className="font-linear-mono text-[#e4f222] font-semibold">Day {leadDay}</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              value={leadDay}
              onChange={(e) => setLeadDay(Number(e.target.value))}
              className="w-full accent-[#e4f222] bg-[#161718] h-2 rounded cursor-pointer"
            />
            <div className="flex justify-between text-[11px] font-linear-mono text-[#62666d]">
              <span>Day 1 (Immediate)</span>
              <span>Day 5 (Medium Range)</span>
              <span>Day 10 (Extended Limit)</span>
            </div>
          </div>
        </div>

        {/* Real-time Response Output (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="linear-card flex-1 flex flex-col justify-between items-center text-center">
            <div className="w-full flex justify-between items-center border-b border-[#23252a] pb-3 mb-4">
              <span className="text-[13px] font-[510] text-[#ffffff]">
                Simulated Output Response
              </span>
              <span
                className={`linear-badge font-linear-mono text-[12px] px-2.5 py-0.5 border font-medium ${
                  isHigh
                    ? "bg-[#eb5757]/15 text-[#eb5757] border-[#eb5757]/40"
                    : isMod
                    ? "bg-[#f59e0b]/15 text-[#f59e0b] border-[#f59e0b]/40"
                    : "bg-[#27a644]/15 text-[#27a644] border-[#27a644]/40"
                }`}
              >
                {riskCategory} RISK
              </span>
            </div>

            {/* Circular Gauge */}
            <div className="py-2">
              <CircularGauge
                value={simulatedProb}
                label="Simulated Bust Risk"
                sublabel={`Confidence: ${(simulatedConfidence * 100).toFixed(1)}%`}
                size={220}
                strokeWidth={14}
              />
            </div>

            {/* Sensitivity Insights */}
            <div className="w-full bg-[#161718] p-3.5 rounded-[8px] border border-[#23252a] text-left space-y-2 mt-2">
              <div className="text-[12px] font-linear-mono text-[#8a8f98] uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle size={13} className="text-[#e4f222]" /> Key Sensitivity Drivers:
              </div>
              <ul className="text-[12px] space-y-1 text-[#d0d6e0]">
                {rainfall > 70 && (
                  <li className="flex items-center gap-1.5 text-[#eb5757]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#eb5757]"></span> Extreme rainfall ({rainfall}mm) heavily inflates bust probability.
                  </li>
                )}
                {leadDay >= 6 && (
                  <li className="flex items-center gap-1.5 text-[#f59e0b]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]"></span> Day {leadDay} compound uncertainty significantly elevates error threshold.
                  </li>
                )}
                {windSpeed > 18 && (
                  <li className="flex items-center gap-1.5 text-[#eb5757]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#eb5757]"></span> Strong wind ({windSpeed}m/s) triggers vector instability attributions.
                  </li>
                )}
                {rainfall <= 20 && leadDay <= 3 && (
                  <li className="flex items-center gap-1.5 text-[#27a644]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#27a644]"></span> Short lead time and modest precipitation support high forecast confidence.
                  </li>
                )}
              </ul>
            </div>

            {/* Apply Button */}
            <button
              onClick={handleApply}
              className="btn-acid-lime w-full mt-4 cursor-pointer"
            >
              <CheckCircle2 size={15} />
              <span>Load These Values Into Operational Cockpit</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
