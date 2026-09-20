"use client";

import React, { useState, useEffect } from "react";
import { 
  Compass, 
  ChevronRight, 
  Activity, 
  Radio, 
  Cpu, 
  ShieldCheck, 
  Wind, 
  Database,
  Layers,
  Sparkles,
  CloudRain,
  TrendingUp,
  MapPin,
  CheckCircle2
} from "lucide-react";

interface LandingScreenProps {
  onGetStarted: () => void;
}

export default function LandingScreen({ onGetStarted }: LandingScreenProps) {
  const [pulseCount, setPulseCount] = useState<number>(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulseCount((prev) => (prev + 1) % 100);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#06080c] text-white flex flex-col justify-between p-6 md:p-12 relative overflow-hidden select-none animate-in fade-in duration-300">
      {/* Dynamic Cinematic Background Grid & Glow */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 30%, rgba(56, 189, 248, 0.18) 0%, transparent 70%),
            linear-gradient(to right, rgba(35, 47, 66, 0.25) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(35, 47, 66, 0.25) 1px, transparent 1px)
          `,
          backgroundSize: "100% 100%, 64px 64px, 64px 64px"
        }}
      />

      {/* Atmospheric Radar Wave Animation in Background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] md:w-[1000px] md:h-[1000px] pointer-events-none flex items-center justify-center opacity-40">
        <div className="absolute w-full h-full rounded-full border border-cyan-500/10 animate-ping" style={{ animationDuration: "8s" }} />
        <div className="absolute w-3/4 h-3/4 rounded-full border border-cyan-500/15 animate-pulse" style={{ animationDuration: "5s" }} />
        <div className="absolute w-1/2 h-1/2 rounded-full border border-cyan-500/20" />
        <div className="absolute w-1/4 h-1/4 rounded-full border border-[#e4f222]/20" />
        <div 
          className="absolute w-1/2 h-[2px] bg-gradient-to-r from-transparent via-cyan-400/30 to-cyan-300 origin-left"
          style={{
            left: "50%",
            transform: `rotate(${pulseCount * 36}deg)`,
            transition: "transform 1s linear"
          }}
        />
      </div>

      {/* Top Navbar */}
      <header className="relative z-10 w-full max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 border-b border-[#232f42]/80 pb-6">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#121722] border border-[#232f42] flex items-center justify-center text-[#e4f222] shadow-xl">
            <Compass size={28} strokeWidth={2.2} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-extrabold text-white tracking-tight">ForecastGuard</span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-linear-mono bg-cyan-950 border border-cyan-500/40 text-cyan-300">
                v1.0-moes
              </span>
            </div>
            <span className="text-xs text-[#94a3b8] font-linear-mono block">
              Ministry of Earth Sciences · NCMRWF
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#121722] border border-[#232f42] text-xs font-linear-mono text-[#cbd5e1]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>NCUM 9km Global Ensemble · OPERATIONAL</span>
          </div>
        </div>
      </header>

      {/* Full-Screen Expansive Hero Section */}
      <main className="relative z-10 w-full max-w-6xl mx-auto my-auto py-12 flex flex-col items-center text-center space-y-8">
        
        {/* System Category Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#121722]/90 border border-cyan-500/40 text-cyan-300 text-xs font-linear-mono tracking-wider shadow-lg">
          <Radio size={14} className="animate-pulse text-[#e4f222]" />
          <span className="font-semibold uppercase">MEDIUM-RANGE NWP FORECAST BUST DETECTION SYSTEM</span>
        </div>

        {/* Hero Title */}
        <div className="space-y-4 max-w-4xl">
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-tight leading-[1.08]">
            Operational Medium-Range <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-[#e4f222] bg-clip-text text-transparent">
              NWP Forecast Bust Detection
            </span>
          </h1>
          <p className="text-base sm:text-xl text-[#94a3b8] max-w-3xl mx-auto font-normal leading-relaxed">
            Machine learning early-warning platform alerting forecasters to medium-range forecast busts across India with physics-grounded SHAP attributions, run-to-run drift tracking, and official Survey of India cartography.
          </p>
        </div>

        {/* Primary Action Button: "GET STARTED" */}
        <div className="pt-4 flex flex-col items-center gap-3">
          <button
            onClick={onGetStarted}
            className="group px-12 py-5 rounded-2xl bg-gradient-to-r from-cyan-400 via-blue-500 to-[#e4f222] text-[#06080c] font-black text-lg tracking-wider uppercase font-linear-mono hover:opacity-95 shadow-[0_0_40px_rgba(56,189,248,0.35)] flex items-center justify-center gap-3 transition transform hover:scale-[1.04] active:scale-[0.98] cursor-pointer"
          >
            <span>GET STARTED</span>
            <ChevronRight size={22} strokeWidth={3} className="transition-transform group-hover:translate-x-1" />
          </button>
          <span className="text-xs font-linear-mono text-[#64748b]">
            Click above to launch the Live Overview &amp; Synoptic Matrix
          </span>
        </div>

        {/* 4-Column Mission Telemetry Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full pt-8">
          <div className="bg-[#0c1017]/80 backdrop-blur-md p-5 rounded-2xl border border-[#232f42] text-left space-y-2 shadow-xl hover:border-cyan-500/50 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-linear-mono text-cyan-400 uppercase font-bold">Coverage</span>
              <MapPin size={18} className="text-cyan-400" />
            </div>
            <div className="text-3xl font-black text-white font-linear-mono">43</div>
            <p className="text-xs text-[#94a3b8] leading-normal">
              Synoptic observation stations monitored across all Indian climatic regimes.
            </p>
          </div>

          <div className="bg-[#0c1017]/80 backdrop-blur-md p-5 rounded-2xl border border-[#232f42] text-left space-y-2 shadow-xl hover:border-cyan-500/50 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-linear-mono text-[#e4f222] uppercase font-bold">Lead Horizon</span>
              <TrendingUp size={18} className="text-[#e4f222]" />
            </div>
            <div className="text-3xl font-black text-[#e4f222] font-linear-mono">10-Day</div>
            <p className="text-xs text-[#94a3b8] leading-normal">
              Continuous medium-range verification tracking model drift from Day 1 to Day 10.
            </p>
          </div>

          <div className="bg-[#0c1017]/80 backdrop-blur-md p-5 rounded-2xl border border-[#232f42] text-left space-y-2 shadow-xl hover:border-cyan-500/50 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-linear-mono text-emerald-400 uppercase font-bold">Cartography</span>
              <ShieldCheck size={18} className="text-emerald-400" />
            </div>
            <div className="text-3xl font-black text-emerald-400 font-linear-mono">Official SOI</div>
            <p className="text-xs text-[#94a3b8] leading-normal">
              Official Survey of India boundaries with Leaflet &amp; CARTO Basemaps integration.
            </p>
          </div>

          <div className="bg-[#0c1017]/80 backdrop-blur-md p-5 rounded-2xl border border-[#232f42] text-left space-y-2 shadow-xl hover:border-cyan-500/50 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-linear-mono text-sky-400 uppercase font-bold">AI Engine</span>
              <Cpu size={18} className="text-sky-400" />
            </div>
            <div className="text-3xl font-black text-sky-400 font-linear-mono">LightGBM+XGB</div>
            <p className="text-xs text-[#94a3b8] leading-normal">
              Calibrated ensemble with real-time SHAP feature attribution &amp; physics checks.
            </p>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto pt-6 border-t border-[#232f42]/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-linear-mono text-[#64748b]">
        <div>
          ForecastGuard · Ministry of Earth Sciences (MoES) / NCMRWF
        </div>
        <div>
          Operational Research Prototype · Real-time verification &amp; bust detection
        </div>
      </footer>
    </div>
  );
}
