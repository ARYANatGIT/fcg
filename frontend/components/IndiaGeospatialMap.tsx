"use client";

import React, { useState, useMemo } from "react";
import { Plus, Minus, RotateCcw, Compass, MapPin, Wind, CloudRain, AlertTriangle, Layers } from "lucide-react";
import { StationData } from "@/lib/types";

interface IndiaGeospatialMapProps {
  stations: StationData[];
  selectedStationName: string;
  onSelectStation: (station: StationData) => void;
  leadDay: number;
  layerMode: "bust_risk" | "rainfall_heatmap" | "wind_vectors";
}

// Projection bounds for India: Lat 6°N to 38°N, Lon 66°E to 100°E
const LAT_MIN = 6.5;
const LAT_MAX = 37.5;
const LON_MIN = 66.0;
const LON_MAX = 98.5;

function projectToSvg(lat: number, lon: number, width: number = 800, height: number = 800) {
  // Equirectangular projection normalized to 800x800 SVG box
  const x = ((lon - LON_MIN) / (LON_MAX - LON_MIN)) * width;
  const y = height - ((lat - LAT_MIN) / (LAT_MAX - LAT_MIN)) * height;
  return { x, y };
}

// Stylized, high-precision SVG polygon representation of the Indian Subcontinent Coastline & Frontiers
const INDIA_COASTLINE_PATH = `
  M 200,80 
  L 230,65 L 260,75 L 285,110 L 310,135 L 340,140 L 370,165 
  L 410,170 L 460,200 L 510,210 L 560,215 L 610,210 L 670,225
  L 710,215 L 740,240 L 730,270 L 700,290 L 650,295 L 620,320
  L 600,340 L 580,330 L 570,360 L 580,390 L 570,420 L 530,440
  L 510,470 L 480,510 L 450,560 L 420,620 L 390,680 L 360,740
  L 350,770 L 340,740 L 320,670 L 300,610 L 270,540 L 250,470
  L 220,440 L 190,430 L 160,420 L 140,400 L 150,370 L 180,360
  L 200,340 L 190,310 L 170,290 L 160,250 L 170,210 L 185,170
  L 190,130 Z
`;

// Major Meteorological Radar Centers (Doppler Radars)
const DOPPLER_RADARS = [
  { name: "Mumbai", lat: 19.07, lon: 72.87 },
  { name: "Kolkata", lat: 22.57, lon: 88.36 },
  { name: "Chennai", lat: 13.08, lon: 80.27 },
  { name: "New Delhi", lat: 28.61, lon: 77.20 },
  { name: "Nagpur", lat: 21.14, lon: 79.08 },
];

export default function IndiaGeospatialMap({
  stations,
  selectedStationName,
  onSelectStation,
  leadDay,
  layerMode,
}: IndiaGeospatialMapProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [hoveredStation, setHoveredStation] = useState<StationData | null>(null);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.3, 2.5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.3, 0.8));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="relative w-full h-full min-h-[460px] bg-[#07080a] overflow-hidden select-none rounded-[10px] border border-[#1e232e]">
      
      {/* 1. Compass Rose Indicator */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-[#0d1017]/90 backdrop-blur-md px-3 py-1.5 rounded-[8px] border border-[#232732] text-[12px] font-linear-mono text-[#94a3b8]">
        <Compass size={16} className="text-[#e4f222] animate-spin-slow" />
        <span>IMD / NCMRWF MET GRID (8°N–37°N, 68°E–97°E)</span>
      </div>

      {/* 2. On-Map Precision Zoom Controls */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        <button
          onClick={handleZoomIn}
          className="w-10 h-10 rounded-[8px] bg-[#0d1017]/95 border border-[#232732] text-white flex items-center justify-center hover:bg-[#1a202c] hover:border-[#384256] transition cursor-pointer shadow-lg"
          title="Zoom In"
        >
          <Plus size={18} />
        </button>
        <button
          onClick={handleZoomOut}
          className="w-10 h-10 rounded-[8px] bg-[#0d1017]/95 border border-[#232732] text-white flex items-center justify-center hover:bg-[#1a202c] hover:border-[#384256] transition cursor-pointer shadow-lg"
          title="Zoom Out"
        >
          <Minus size={18} />
        </button>
        <button
          onClick={handleReset}
          className="w-10 h-10 rounded-[8px] bg-[#0d1017]/95 border border-[#232732] text-white flex items-center justify-center hover:bg-[#1a202c] hover:border-[#384256] transition cursor-pointer shadow-lg"
          title="Reset Map View"
        >
          <RotateCcw size={16} />
        </button>
      </div>

      {/* 3. Floating Hover Telemetry Card */}
      {hoveredStation && (
        <div
          className="absolute z-30 bg-[#0d1017]/95 border border-[#384256] p-3.5 rounded-[10px] shadow-2xl pointer-events-none min-w-[240px] backdrop-blur-md transition-all duration-150"
          style={{
            top: 60,
            left: 16,
          }}
        >
          <div className="flex items-center justify-between border-b border-[#232732] pb-2 mb-2">
            <span className="font-bold text-[15px] text-white">{hoveredStation.name}</span>
            <span className={`text-[11px] font-linear-mono font-bold px-2 py-0.5 rounded ${
              hoveredStation.bust_probability >= 0.65 ? "bg-[#ef4444]/20 text-[#ef4444]" : hoveredStation.bust_probability >= 0.35 ? "bg-[#f59e0b]/20 text-[#f59e0b]" : "bg-[#22c55e]/20 text-[#22c55e]"
            }`}>
              {hoveredStation.risk_category} RISK
            </span>
          </div>
          <div className="text-[12px] text-[#94a3b8] mb-1">{hoveredStation.region}</div>
          <div className="grid grid-cols-2 gap-2 text-[12px] font-linear-mono mt-2 pt-2 border-t border-[#232732]/70">
            <div>
              <span className="text-[#64748b] block text-[10px] uppercase">Bust Risk</span>
              <span className="text-white font-bold">{(hoveredStation.bust_probability * 100).toFixed(1)}%</span>
            </div>
            <div>
              <span className="text-[#64748b] block text-[10px] uppercase">Coordinates</span>
              <span className="text-[#cbd5e1]">{hoveredStation.latitude.toFixed(1)}°N, {hoveredStation.longitude.toFixed(1)}°E</span>
            </div>
          </div>
        </div>
      )}

      {/* 4. Main SVG Geospatial Canvas */}
      <svg
        viewBox="0 0 800 800"
        className="w-full h-full transition-transform duration-300 ease-out"
        style={{
          transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
        }}
      >
        <defs>
          {/* Subcontinent Surface Gradient */}
          <radialGradient id="landMassGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#141824" />
            <stop offset="80%" stopColor="#0f121a" />
            <stop offset="100%" stopColor="#0a0c12" />
          </radialGradient>

          {/* Oceanic Deep Water Gradient */}
          <radialGradient id="oceanGradient" cx="50%" cy="80%" r="70%">
            <stop offset="0%" stopColor="#080b12" />
            <stop offset="100%" stopColor="#040608" />
          </radialGradient>

          {/* Isohyet Simulated Precipitation Gradient */}
          <linearGradient id="monsoonRainGradient" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0284c7" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.25" />
            <stop offset="80%" stopColor="#e4f222" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0.45" />
          </linearGradient>

          {/* Radar Sweep Animation Filter */}
          <radialGradient id="radarSweep" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.2" />
            <stop offset="90%" stopColor="#38bdf8" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ocean Background */}
        <rect width="800" height="800" fill="url(#oceanGradient)" />

        {/* Latitude & Longitude Coordinate Graticule Grid */}
        <g stroke="#1a202c" strokeWidth="0.75" strokeDasharray="3,5" opacity="0.7">
          {/* Parallels (Latitudes) */}
          {[10, 15, 20, 25, 30, 35].map(lat => {
            const { y } = projectToSvg(lat, 80);
            return (
              <g key={`lat-${lat}`}>
                <line x1="0" y1={y} x2="800" y2={y} />
                <text x="15" y={y - 4} fill="#475569" fontSize="10" fontFamily="var(--font-berkeley-mono)">
                  {lat}°N
                </text>
              </g>
            );
          })}
          {/* Meridians (Longitudes) */}
          {[70, 75, 80, 85, 90, 95].map(lon => {
            const { x } = projectToSvg(20, lon);
            return (
              <g key={`lon-${lon}`}>
                <line x1={x} y1="0" x2={x} y2="800" />
                <text x={x + 4} y="790" fill="#475569" fontSize="10" fontFamily="var(--font-berkeley-mono)">
                  {lon}°E
                </text>
              </g>
            );
          })}
        </g>

        {/* Indian Subcontinent Landmass Polygon */}
        <path
          d={INDIA_COASTLINE_PATH}
          fill="url(#landMassGradient)"
          stroke="#2d3748"
          strokeWidth="1.8"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Sri Lanka Island Outline */}
        <ellipse cx="440" cy="740" rx="20" ry="32" fill="#0f121a" stroke="#2d3748" strokeWidth="1.2" />

        {/* Andaman & Nicobar Islands */}
        <g stroke="#2d3748" strokeWidth="1" fill="#141824">
          <ellipse cx="690" cy="620" rx="6" ry="14" />
          <ellipse cx="695" cy="650" rx="5" ry="10" />
          <ellipse cx="705" cy="700" rx="7" ry="16" />
        </g>

        {/* Lakshadweep Islands */}
        <g stroke="#2d3748" strokeWidth="1" fill="#141824">
          <circle cx="270" cy="670" r="4" />
          <circle cx="275" cy="690" r="3.5" />
          <circle cx="280" cy="720" r="4" />
        </g>

        {/* LAYER MODE 2: Convective Rainfall Isohyets Simulation */}
        {layerMode === "rainfall_heatmap" && (
          <g opacity="0.85">
            {/* Severe Monsoon Trough Isohyet Band (Odisha to Gujarat) */}
            <path
              d="M 220,430 Q 380,420 530,410 Q 560,450 490,470 Q 360,490 240,460 Z"
              fill="url(#monsoonRainGradient)"
              filter="blur(14px)"
            />
            {/* Konkan Coast Orographic Rainfall Plume */}
            <path
              d="M 240,460 Q 280,560 320,680 Q 290,690 260,560 Z"
              fill="#0284c7"
              opacity="0.35"
              filter="blur(12px)"
            />
            {/* Northeast Convective Core */}
            <circle cx="670" cy="280" r="70" fill="#ef4444" opacity="0.25" filter="blur(16px)" />
          </g>
        )}

        {/* LAYER MODE 3: Surface Wind Flow Vectors */}
        {layerMode === "wind_vectors" && (
          <g stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" opacity="0.6">
            {/* Southwest Monsoon Flow Streamlines */}
            {[
              "M 160,650 Q 240,550 340,450",
              "M 200,720 Q 290,600 400,500",
              "M 260,780 Q 380,680 500,560",
              "M 380,720 Q 480,620 580,480",
              "M 450,620 Q 540,520 620,380",
              "M 300,450 Q 450,420 600,340",
            ].map((p, idx) => (
              <path key={idx} d={p} fill="none" strokeDasharray="6,4" />
            ))}
          </g>
        )}

        {/* Doppler Radar Range Rings */}
        {DOPPLER_RADARS.map(radar => {
          const { x, y } = projectToSvg(radar.lat, radar.lon);
          return (
            <g key={radar.name} opacity="0.45">
              <circle cx={x} cy={y} r="55" fill="none" stroke="#0ea5e9" strokeWidth="0.8" strokeDasharray="3,3" />
              <circle cx={x} cy={y} r="110" fill="none" stroke="#0ea5e9" strokeWidth="0.6" strokeDasharray="2,4" />
            </g>
          );
        })}

        {/* Stations & Forecast Bust Nodes */}
        {stations.map(st => {
          const { x, y } = projectToSvg(st.latitude, st.longitude);
          const isSelected = selectedStationName.toLowerCase() === st.name.toLowerCase();
          const isHigh = st.bust_probability >= 0.65;
          const isMod = st.bust_probability >= 0.35 && st.bust_probability < 0.65;
          const nodeColor = isHigh ? "#ef4444" : isMod ? "#f59e0b" : "#22c55e";

          return (
            <g
              key={st.name}
              className="cursor-pointer group"
              onClick={() => onSelectStation(st)}
              onMouseEnter={() => setHoveredStation(st)}
              onMouseLeave={() => setHoveredStation(null)}
            >
              {/* Outer Pulsing Beacon Ring for High Risk */}
              {isHigh && (
                <circle
                  cx={x}
                  cy={y}
                  r={isSelected ? 18 : 13}
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="1.5"
                  opacity="0.8"
                  className="animate-ping origin-center"
                />
              )}

              {/* Selection Halo */}
              {isSelected && (
                <circle
                  cx={x}
                  cy={y}
                  r="15"
                  fill="none"
                  stroke="#e4f222"
                  strokeWidth="2.5"
                  strokeDasharray="4,2"
                />
              )}

              {/* Node Solid Circle */}
              <circle
                cx={x}
                cy={y}
                r={isSelected ? 7.5 : 5.5}
                fill={nodeColor}
                stroke="#08090a"
                strokeWidth="2"
                className="transition-transform duration-200 group-hover:scale-125"
                style={{
                  filter: `drop-shadow(0 0 6px ${nodeColor}80)`,
                }}
              />

              {/* Center White Pip */}
              <circle cx={x} cy={y} r="2" fill="#ffffff" />

              {/* Station Label Text */}
              <text
                x={x + 9}
                y={y + 4}
                fill={isSelected ? "#ffffff" : "#cbd5e1"}
                fontSize={isSelected ? "13" : "11"}
                fontWeight={isSelected ? "700" : "500"}
                fontFamily="var(--font-berkeley-mono)"
                className="pointer-events-none transition-all"
                style={{
                  textShadow: "0 1px 3px rgba(0,0,0,0.9)",
                }}
              >
                {st.name}
              </text>
            </g>
          );
        })}

        {/* Ocean Geographical Watermarks */}
        <text x="120" y="600" fill="#1e293b" fontSize="13" letterSpacing="4" fontFamily="var(--font-berkeley-mono)">
          ARABIAN SEA
        </text>
        <text x="560" y="580" fill="#1e293b" fontSize="13" letterSpacing="4" fontFamily="var(--font-berkeley-mono)">
          BAY OF BENGAL
        </text>
        <text x="350" y="785" fill="#1e293b" fontSize="12" letterSpacing="4" fontFamily="var(--font-berkeley-mono)">
          INDIAN OCEAN
        </text>
      </svg>

      {/* 5. Bottom Status Telemetry Ribbon */}
      <div className="absolute bottom-3 left-3 right-3 bg-[#08090a]/95 backdrop-blur-md border border-[#232732] px-4 py-2 rounded-[8px] flex flex-wrap justify-between items-center text-[12px] font-linear-mono text-[#94a3b8] gap-3 z-20">
        <span className="flex items-center gap-1.5 text-white">
          <MapPin size={14} className="text-[#e4f222]" />
          SELECTED: <strong className="font-bold text-[#e4f222]">{selectedStationName}</strong>
        </span>
        <span className="flex items-center gap-1.5">
          CYCLE: <strong className="text-white">Day {leadDay} Forecast Window</strong>
        </span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#22c55e]"></span> Safe (&lt;35%)</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#f59e0b]"></span> Mod (35–65%)</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#ef4444]"></span> Critical (&gt;65%)</span>
        </div>
      </div>
    </div>
  );
}

