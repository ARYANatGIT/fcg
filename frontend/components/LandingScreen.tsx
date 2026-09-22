"use client";

import React, { useState, useEffect } from "react";
import { 
  Compass, 
  ArrowUpRight, 
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
  CheckCircle2,
  ChevronRight
} from "lucide-react";
import TopRightToolbar from "./TopRightToolbar";

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
    <div className="noir-app noise-surface min-h-screen w-full flex flex-col justify-between p-5 md:p-12 relative overflow-hidden select-none animate-in fade-in duration-300">
      {/* 1. Ambient Grid & Glow Orbs (from Lovable) */}
      <div className="ambient-grid absolute inset-0 pointer-events-none z-0" aria-hidden="true" />
      <div className="ambient-glow glow-left pointer-events-none" />
      <div className="ambient-glow glow-right pointer-events-none" />

      {/* 2. SVG Film Grain Overlay */}
      <div className="grain" />

      {/* 3. Concentric Radar Rings Atmosphere (Animated Focus Pulse) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[720px] md:w-[1100px] md:h-[1100px] pointer-events-none flex items-center justify-center opacity-30 z-0">
        <div className="absolute w-full h-full rounded-full border border-white/[0.04]" />
        <div className="absolute w-3/4 h-3/4 rounded-full border border-white/[0.06]" />
        <div className="absolute w-1/2 h-1/2 rounded-full border border-white/[0.08]" />
        <div className="absolute w-1/4 h-1/4 rounded-full border border-white/20" />
        <div 
          className="absolute w-1/2 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-white origin-left"
          style={{
            left: "50%",
            transform: `rotate(${pulseCount * 36}deg)`,
            transition: "transform 1s linear"
          }}
        />
      </div>

      {/* 4. Top Navigation Bar (Floating Glass Shell) */}
      <header className="relative z-10 w-full max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 py-4 px-6 rounded-full glass border border-white/10 backdrop-blur-2xl">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center text-white shadow-sm">
            <Compass size={22} strokeWidth={2} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-[#E8E8E5] tracking-tight">ForecastGuard</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono-tech uppercase bg-white/[0.06] border border-white/10 text-white">
                v1.0-moes
              </span>
            </div>
            <span className="text-xs text-[#8B8B87] font-mono-tech tracking-wide block">
              Ministry of Earth Sciences · NCMRWF
            </span>
          </div>
        </div>

        {/* Numbered Category Tabs (Noir Index Style) */}
        <div className="hidden lg:flex items-center gap-1 text-xs font-mono-tech text-[#8B8B87]">
          <span className="px-3 py-1 rounded-full bg-white/[0.04] text-[#E8E8E5] border border-white/10">01 COCKPIT</span>
          <span className="px-3 py-1 rounded-full hover:text-[#E8E8E5] transition">02 CARTOGRAPHY</span>
          <span className="px-3 py-1 rounded-full hover:text-[#E8E8E5] transition">03 DIAGNOSTICS</span>
          <span className="px-3 py-1 rounded-full hover:text-[#E8E8E5] transition">04 SIMULATION</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden xl:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/40 border border-white/10 text-xs font-mono-tech text-[#D8D8D3]">
            <span className="status-dot-active" />
            <span>NCUM 9km Global Ensemble</span>
          </div>
          <TopRightToolbar onSelectTab={() => onGetStarted()} />
        </div>
      </header>

      {/* 5. Expansive Editorial Hero Section */}
      <main className="relative z-10 w-full max-w-5xl mx-auto my-auto py-12 md:py-16 flex flex-col items-center text-center space-y-8">
        
        {/* Monospace Metadata Micro-Label */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-white text-xs font-mono-tech tracking-widest uppercase shadow-sm">
          <Radio size={13} className="animate-pulse text-white" />
          <span>01 / MEDIUM-RANGE NWP FORECAST BUST DETECTION</span>
        </div>

        {/* Hero Title with Dramatic Manrope Typography */}
        <div className="space-y-5 max-w-4xl">
          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-[5rem] font-bold text-[#E8E8E5] tracking-[-0.075em] leading-[0.92]">
            Operational Medium-Range <br className="hidden sm:inline" />
            <em>NWP Forecast Bust Detection</em>
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-[#92928C] max-w-2xl mx-auto font-normal leading-relaxed">
            Machine learning early-warning platform alerting forecasters to medium-range forecast busts across India with physics-grounded SHAP attributions, run-to-run drift tracking, and official Survey of India cartography.
          </p>
        </div>

        {/* Primary Action Button: Noir Index Circle CTA */}
        <div className="pt-2 flex flex-col items-center gap-3">
          <button
            onClick={onGetStarted}
            className="circle-cta group cursor-pointer"
          >
            <span className="font-semibold tracking-wider">ENTER OPERATIONAL COCKPIT</span>
            <div className="circle-icon">
              <ArrowUpRight size={18} strokeWidth={2.4} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
          </button>
          <span className="text-xs font-mono-tech text-[#8B8B87] tracking-wider uppercase">
            Click above to launch the Live Overview &amp; Synoptic Matrix
          </span>
        </div>

        {/* 6. 4-Column Mission Telemetry (Hairline-Divided Metric Strip) */}
        <div className="w-full pt-8">
          <div className="metric-strip">
            <div className="metric-item text-left space-y-2">
              <div className="flex items-center justify-between">
                <span className="mono-label">01 / COVERAGE</span>
                <MapPin size={16} className="text-white" />
              </div>
              <div className="text-3xl font-bold text-[#E8E8E5] font-mono-tech">43</div>
              <p className="text-xs text-[#92928C] leading-normal font-sans">
                Synoptic observation stations monitored across all Indian climatic regimes.
              </p>
            </div>

            <div className="metric-item text-left space-y-2">
              <div className="flex items-center justify-between">
                <span className="mono-label">02 / LEAD HORIZON</span>
                <TrendingUp size={16} className="text-white" />
              </div>
              <div className="text-3xl font-bold text-[#E8E8E5] font-mono-tech">10-Day</div>
              <p className="text-xs text-[#92928C] leading-normal font-sans">
                Continuous medium-range verification tracking model drift from Day 1 to Day 10.
              </p>
            </div>

            <div className="metric-item text-left space-y-2">
              <div className="flex items-center justify-between">
                <span className="mono-label">03 / CARTOGRAPHY</span>
                <ShieldCheck size={16} className="text-white" />
              </div>
              <div className="text-3xl font-bold text-[#E8E8E5] font-mono-tech">Official SOI</div>
              <p className="text-xs text-[#92928C] leading-normal font-sans">
                Official Survey of India boundaries with Leaflet &amp; CARTO Basemaps integration.
              </p>
            </div>

            <div className="metric-item text-left space-y-2">
              <div className="flex items-center justify-between">
                <span className="mono-label">04 / AI ENGINE</span>
                <Cpu size={16} className="text-white" />
              </div>
              <div className="text-3xl font-bold text-[#E8E8E5] font-mono-tech">LightGBM+XGB</div>
              <p className="text-xs text-[#92928C] leading-normal font-sans">
                Calibrated ensemble with real-time SHAP feature attribution &amp; physics checks.
              </p>
            </div>
          </div>
        </div>

      </main>

      {/* 7. Footer */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto pt-6 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] font-mono-tech text-[#8B8B87]">
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
