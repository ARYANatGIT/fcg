"use client";

import React from "react";
import { CloudRain, Wind, Sun, Compass, AlertCircle, ArrowUpRight, ShieldAlert } from "lucide-react";

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
    riskLevel: "HIGH BUST RISK (DAY 4+)",
    riskBadgeColor: "bg-red-500/10 text-red-400 border-red-500/30",
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
    riskLevel: "CRITICAL REVISION SENSITIVITY",
    riskBadgeColor: "bg-red-500/10 text-red-400 border-red-500/30",
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
    riskLevel: "MODERATE TO HIGH BUST RISK",
    riskBadgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/30",
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
    riskLevel: "PERSISTENT TEMPERATURE BIAS",
    riskBadgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/30",
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
    riskLevel: "REGIME-SHIFT BUST RISK",
    riskBadgeColor: "bg-red-500/10 text-red-400 border-red-500/30",
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

  React.useEffect(() => {
    fetch("/api/synoptic_regimes")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.regimes && Array.isArray(data.regimes) && data.regimes.length > 0) {
          setRegimes(data.regimes);
        }
      })
      .catch(() => null);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl glass-feature border border-white/10">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-9 h-9 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center text-white">
              <ShieldAlert size={18} />
            </div>
            <h2 className="text-xl font-bold text-white tracking-wide font-sans">
              High-Risk Synoptic Meteorological Regimes
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono-tech bg-white/[0.06] text-white border border-white/15">
              {regimes.length} REGIMES
            </span>
          </div>
          <p className="text-sm text-[#A3A3A3] leading-relaxed max-w-3xl">
            Operational medium-range NWP guidance exhibits peak forecast bust frequency during these synoptic patterns across India. Select any regime to evaluate its atmospheric state in the Live Cockpit.
          </p>
        </div>
      </div>

      {/* Grid of Regimes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {regimes.map((r, idx) => {
          const IconComponent = typeof r.icon === "string" ? (ICON_MAP[r.icon] || CloudRain) : (r.icon || CloudRain);
          return (
            <div
              key={r.id}
              className="detail-card flex flex-col justify-between p-6 rounded-2xl transition-all"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 border-b border-white/10 pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center text-white shrink-0">
                      <IconComponent size={18} />
                    </div>
                    <div>
                      <div className="noir-kicker mb-0.5">REGIME / {String(idx + 1).padStart(2, "0")}</div>
                      <h3 className="text-lg font-bold text-white leading-snug">
                        {r.title}
                      </h3>
                      <span className="text-xs text-[#A3A3A3] block mt-0.5 font-mono-tech">
                        {r.season}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Threat Badge */}
                <div className="mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-mono-tech font-semibold border tracking-wider ${r.riskBadgeColor || "bg-red-500/10 text-red-400 border-red-500/30"}`}>
                    {r.riskLevel}
                  </span>
                </div>

                {/* Affected Regions */}
                <div className="text-sm text-white/90 mb-3">
                  <strong className="text-white font-semibold">Affected Zones:</strong> {r.regions}
                </div>

                {/* Description */}
                <p className="text-sm text-[#A3A3A3] leading-relaxed mb-4">
                  {r.synopticDescription}
                </p>

                {/* Failure Modes Checklist */}
                <div className="bg-white/[0.03] p-4 rounded-xl border border-white/10 mb-5 space-y-2">
                  <span className="noir-kicker block">
                    Observed Model Failure Modes:
                  </span>
                  <ul className="text-sm text-white/90 space-y-1.5 pl-4 list-disc leading-relaxed">
                    {r.failureModes && r.failureModes.map((fm: string, fIdx: number) => (
                      <li key={fIdx}>{fm}</li>
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
                className="w-full flex items-center justify-between py-2.5 px-4 rounded-full text-xs font-mono-tech font-semibold text-white bg-white/[0.05] hover:bg-white/[0.12] border border-white/10 transition-all cursor-pointer active:scale-[0.99]"
              >
                <span>Evaluate in Live Overview</span>
                <ArrowUpRight size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
