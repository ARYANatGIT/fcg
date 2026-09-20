"use client";

import React from "react";
import { CloudRain, Wind, Sun, Compass, AlertCircle, ArrowUpRight, Zap, CheckCircle2, ShieldAlert } from "lucide-react";

interface SynopticRegimesProps {
  onSelectRegime: (regime: {
    name: string;
    lat: number;
    lon: number;
    rainfall: number;
    windSpeed: number;
    temp: number;
    pressure: number;
    humidity: number;
    leadDay: number;
  }) => void;
}

const REGIMES = [
  {
    id: "monsoon-depression",
    title: "Monsoon Deep Depression",
    season: "SW Monsoon (July – August)",
    icon: CloudRain,
    iconColor: "#38bdf8",
    riskLevel: "HIGH BUST RISK (DAY 4+)",
    riskBadgeColor: "bg-[#ef4444]/15 text-[#ef4444] border-[#ef4444]/50",
    regions: "Odisha, Chhattisgarh, MP, Vidarbha, Gujarat",
    synopticDescription:
      "Vorticity center moving WNW along the monsoon trough. Global NWP models frequently misjudge the southern flank heavy convective rain bands and track velocity beyond Day 3.",
    failureModes: [
      "Heavy rainfall core location displaced by 150–300 km",
      "Interaction with mid-tropospheric cyclones over Gujarat underestimated",
      "Precipitation magnitude heavily under-predicted on landfall Day",
    ],
    targetLocation: { name: "Bhubaneswar / Central Trough", lat: 20.3, lon: 85.8 },
    parameters: { rainfall: 110, windSpeed: 16.5, temp: 26.5, pressure: 998, humidity: 94, leadDay: 5 },
  },
  {
    id: "tropical-cyclone",
    title: "Tropical Cyclone (Bay of Bengal / Arabian Sea)",
    season: "Pre/Post Monsoon (May / Oct – Nov)",
    icon: Compass,
    iconColor: "#ef4444",
    riskLevel: "CRITICAL REVISION SENSITIVITY",
    riskBadgeColor: "bg-[#ef4444]/15 text-[#ef4444] border-[#ef4444]/50",
    regions: "Coastal Odisha, Andhra Pradesh, West Bengal, Gujarat",
    synopticDescription:
      "Intense cyclonic vortex over warm sea surface temperatures (>29°C). Medium-range NWP suffers from recurvature uncertainty and rapid intensification (RI) blindspots.",
    failureModes: [
      "Landfall timing error exceeding ±18 hours at Day 5",
      "Recurvature vs straight westward track divergence between consecutive cycles",
      "Intensity bust during rapid convective burst phases",
    ],
    targetLocation: { name: "Coastal Odisha / AP", lat: 18.5, lon: 84.5 },
    parameters: { rainfall: 165, windSpeed: 28.0, temp: 28.0, pressure: 984, humidity: 96, leadDay: 6 },
  },
  {
    id: "western-disturbance",
    title: "Western Disturbance (WD)",
    season: "Winter & Pre-Monsoon (Dec – March)",
    icon: Wind,
    iconColor: "#a78bfa",
    riskLevel: "MODERATE TO HIGH BUST RISK",
    riskBadgeColor: "bg-[#f59e0b]/15 text-[#f59e0b] border-[#f59e0b]/50",
    regions: "Jammu & Kashmir, Himachal, Punjab, Haryana, W. UP",
    synopticDescription:
      "Upper-tropospheric westerly trough propagating from Mediterranean. Orographic uplift over Western Himalayas causes sharp localized snowfall/rain bursts.",
    failureModes: [
      "Timing of induced cyclonic circulation over Rajasthan plains missed",
      "Rain/Snow transition line altitude error over Himachal/Kashmir",
      "Downstream hail and convective squall under-predicted",
    ],
    targetLocation: { name: "Amritsar / Punjab Plains", lat: 31.6, lon: 74.9 },
    parameters: { rainfall: 38, windSpeed: 12.0, temp: 14.0, pressure: 1012, humidity: 85, leadDay: 4 },
  },
  {
    id: "heatwave",
    title: "Extreme Pre-Monsoon Heatwave",
    season: "Summer (April – June)",
    icon: Sun,
    iconColor: "#f59e0b",
    riskLevel: "PERSISTENT TEMPERATURE BIAS",
    riskBadgeColor: "bg-[#f59e0b]/15 text-[#f59e0b] border-[#f59e0b]/50",
    regions: "Rajasthan, Delhi NCR, Vidarbha, Telangana",
    synopticDescription:
      "Anti-cyclonic sinking motion and dry northwesterly advection. NWP surface boundary layers often moisten excessively, leading to cold bias in maximum temperatures.",
    failureModes: [
      "Maximum temperature under-predicted by 3°C to 5°C",
      "Delayed onset of maritime sea-breeze penetration inland",
      "Soil-moisture feedback over-attenuates daytime peak heating",
    ],
    targetLocation: { name: "New Delhi / NCR", lat: 28.6, lon: 77.2 },
    parameters: { rainfall: 0, windSpeed: 6.0, temp: 45.5, pressure: 1004, humidity: 22, leadDay: 4 },
  },
  {
    id: "break-monsoon",
    title: "Active-Break Monsoon Transition",
    season: "Monsoon (July – August)",
    icon: AlertCircle,
    iconColor: "#22c55e",
    riskLevel: "REGIME-SHIFT BUST RISK",
    riskBadgeColor: "bg-[#ef4444]/15 text-[#ef4444] border-[#ef4444]/50",
    regions: "Central India, Foot of Himalayas, Northeast",
    synopticDescription:
      "Shifting of monsoon trough to Himalayan foothills. Central India rainfall abruptly ceases while foothills experience devastating flash floods.",
    failureModes: [
      "NWP models predict continuation of rain over Central India during hiatus",
      "Subtle Rossby wave packet propagation timing errors",
      "Large run-to-run forecast revision volatility across consecutive cycles",
    ],
    targetLocation: { name: "Nagpur / Vidarbha Corridor", lat: 21.1458, lon: 79.0882 },
    parameters: { rainfall: 5, windSpeed: 5.0, temp: 32.0, pressure: 1008, humidity: 62, leadDay: 5 },
  },
];

const ICON_MAP: Record<string, any> = {
  CloudRain,
  Wind,
  Sun,
  Compass,
  AlertCircle,
};

export default function SynopticRegimes({ onSelectRegime }: SynopticRegimesProps) {
  const [regimes, setRegimes] = React.useState<any[]>(REGIMES);
  const [loading, setLoading] = React.useState<boolean>(false);

  React.useEffect(() => {
    setLoading(true);
    fetch("/api/synoptic_regimes")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.regimes && Array.isArray(data.regimes) && data.regimes.length > 0) {
          setRegimes(data.regimes);
        }
      })
      .catch((err) => console.warn("Failed to load regimes from MongoDB:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#232732] pb-5">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <ShieldAlert size={22} className="text-[#e4f222]" />
            <h2 className="text-xl font-bold text-white tracking-wide">
              High-Risk Synoptic Meteorological Regimes (MoES / NCMRWF Operational Focus)
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              {regimes.length} REGIMES IN DATABASE
            </span>
          </div>
          <p className="text-sm text-white/60 leading-relaxed">
            Operational medium-range NWP guidance exhibits peak forecast bust frequency during these {regimes.length} synoptic patterns across India. Click any regime to immediately inject its atmospheric state into the Live Overview.
          </p>
        </div>
      </div>

      {/* Grid of Regimes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {regimes.map((r) => {
          const IconComponent = typeof r.icon === "string" ? (ICON_MAP[r.icon] || CloudRain) : (r.icon || CloudRain);
          return (
            <div
              key={r.id}
              className="linear-card flex flex-col justify-between hover:border-[#384256] transition group p-6 rounded-2xl bg-[#0e1424]/90 border border-white/10 shadow-lg"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 border-b border-[#232732] pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-xl bg-[#151820] border border-[#232732] flex items-center justify-center shrink-0"
                      style={{ color: r.iconColor || "#38bdf8" }}
                    >
                      <IconComponent size={22} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-[#e4f222] transition-colors leading-snug">
                        {r.title}
                      </h3>
                      <span className="text-xs font-mono text-white/60 block mt-0.5 font-medium">
                        {r.season}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Threat Badge */}
                <div className="mb-3.5">
                  <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold border tracking-wider ${r.riskBadgeColor || "bg-rose-500/15 text-rose-300 border-rose-500/40"}`}>
                    {r.riskLevel}
                  </span>
                </div>

                {/* Affected Regions */}
                <div className="text-xs text-white/90 mb-3 font-medium">
                  <strong className="text-white font-bold">Affected Zones:</strong> {r.regions}
                </div>

                {/* Description */}
                <p className="text-xs text-white/70 leading-relaxed mb-4">
                  {r.synopticDescription}
                </p>

                {/* Failure Modes Checklist */}
                <div className="bg-[#080d18] p-4 rounded-xl border border-white/5 mb-5 space-y-2">
                  <span className="text-xs font-mono text-cyan-300 font-bold uppercase tracking-wider block">
                    Observed Model Failure Modes:
                  </span>
                  <ul className="text-xs text-white/70 space-y-1.5 pl-4 list-disc leading-relaxed">
                    {r.failureModes && r.failureModes.map((fm: string, idx: number) => (
                      <li key={idx}>{fm}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() =>
                  onSelectRegime({
                    name: r.targetLocation?.name || r.title,
                    lat: r.targetLocation?.lat || 20.0,
                    lon: r.targetLocation?.lon || 78.0,
                    ...r.parameters,
                  })
                }
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-white/5 hover:bg-[#e4f222]/15 hover:text-[#e4f222] hover:border-[#e4f222]/40 border border-white/10 transition-all cursor-pointer active:scale-95"
              >
                <span>Evaluate Profile in Overview</span>
                <ArrowUpRight size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
