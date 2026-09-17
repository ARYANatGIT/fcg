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
    targetLocation: { name: "Waranga / Vidarbha", lat: 20.0, lon: 80.0 },
    parameters: { rainfall: 5, windSpeed: 5.0, temp: 32.0, pressure: 1008, humidity: 62, leadDay: 5 },
  },
];

export default function SynopticRegimes({ onSelectRegime }: SynopticRegimesProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-[#232732] pb-5">
        <h2 className="text-[20px] font-[600] text-[#ffffff] tracking-[-0.025em] flex items-center gap-2.5">
          <ShieldAlert size={22} className="text-[#e4f222]" />
          High-Risk Synoptic Meteorological Regimes (MoES / NCMRWF Operational Focus)
        </h2>
        <p className="text-[14px] text-[#94a3b8] mt-1.5 leading-relaxed">
          Operational medium-range NWP guidance exhibits peak forecast bust frequency during these 5 synoptic patterns. Click any regime to immediately inject its atmospheric state into the Operational Cockpit.
        </p>
      </div>

      {/* Grid of 5 Regimes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {REGIMES.map((r) => {
          const IconComponent = r.icon;
          return (
            <div
              key={r.id}
              className="linear-card flex flex-col justify-between hover:border-[#384256] transition group"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 border-b border-[#232732] pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-[8px] bg-[#151820] border border-[#232732] flex items-center justify-center shrink-0"
                      style={{ color: r.iconColor }}
                    >
                      <IconComponent size={22} />
                    </div>
                    <div>
                      <h3 className="text-[16px] font-[600] text-[#ffffff] group-hover:text-[#e4f222] transition-colors leading-snug">
                        {r.title}
                      </h3>
                      <span className="text-[12px] font-linear-mono text-[#94a3b8] block mt-0.5">
                        {r.season}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Threat Badge */}
                <div className="mb-3.5">
                  <span className={`linear-badge font-linear-mono text-[12px] px-3 py-1 font-semibold ${r.riskBadgeColor}`}>
                    {r.riskLevel}
                  </span>
                </div>

                {/* Affected Regions */}
                <div className="text-[13px] text-[#cbd5e1] mb-3">
                  <strong className="text-white">Affected Zones:</strong> {r.regions}
                </div>

                {/* Description */}
                <p className="text-[13px] text-[#94a3b8] leading-relaxed mb-4">
                  {r.synopticDescription}
                </p>

                {/* Failure Modes Checklist */}
                <div className="bg-[#12151c] p-3.5 rounded-[8px] border border-[#232732] mb-5 space-y-2">
                  <span className="text-[12px] font-linear-mono text-[#cbd5e1] font-semibold uppercase tracking-wider block">
                    Observed Model Failure Modes:
                  </span>
                  <ul className="text-[12px] text-[#94a3b8] space-y-1.5 pl-4 list-disc leading-relaxed">
                    {r.failureModes.map((fm, idx) => (
                      <li key={idx}>{fm}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Button (Min 44px height) */}
              <button
                onClick={() =>
                  onSelectRegime({
                    name: r.targetLocation.name,
                    lat: r.targetLocation.lat,
                    lon: r.targetLocation.lon,
                    ...r.parameters,
                  })
                }
                className="btn-ghost w-full justify-center min-h-[44px] text-[14px] font-medium hover:bg-[#e4f222]/10 hover:text-[#e4f222] hover:border-[#e4f222]/40 transition cursor-pointer"
              >
                <span>Evaluate Profile in Cockpit</span>
                <ArrowUpRight size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
