"use client";

import React from "react";
import { CloudRain, Wind, Sun, Compass, AlertCircle, ArrowUpRight } from "lucide-react";

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
    iconColor: "#02b8cc",
    riskLevel: "HIGH BUST RISK (DAY 4+)",
    riskBadgeColor: "bg-[#eb5757]/15 text-[#eb5757] border-[#eb5757]/40",
    regions: "Odisha, Chhattisgarh, MP, Vidarbha, Gujarat",
    synopticDescription:
      "Vorticity center moving WNW along the monsoon trough. NWP models frequently misjudge the southern flank heavy convective rain bands and track velocity beyond Day 3.",
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
    iconColor: "#eb5757",
    riskLevel: "CRITICAL REVISION SENSITIVITY",
    riskBadgeColor: "bg-[#eb5757]/15 text-[#eb5757] border-[#eb5757]/40",
    regions: "Coastal Odisha, Andhra Pradesh, West Bengal, Gujarat",
    synopticDescription:
      "Intense cyclonic vortex over warm sea surface temperatures (>29°C). Medium-range NWP suffers from recurvature uncertainty and rapid intensification (RI) blindspots.",
    failureModes: [
      "Landfall timing error exceeding ±18 hours at Day 5",
      "Recurvature vs straight westward track divergence between runs",
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
    iconColor: "#8b5cf6",
    riskLevel: "MODERATE TO HIGH BUST RISK",
    riskBadgeColor: "bg-[#f59e0b]/15 text-[#f59e0b] border-[#f59e0b]/40",
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
    riskBadgeColor: "bg-[#f59e0b]/15 text-[#f59e0b] border-[#f59e0b]/40",
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
    iconColor: "#27a644",
    riskLevel: "REGIME-SHIFT BUST RISK",
    riskBadgeColor: "bg-[#eb5757]/15 text-[#eb5757] border-[#eb5757]/40",
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
      <div className="border-b border-[#23252a] pb-4">
        <h2 className="text-[18px] font-[510] text-[#ffffff] tracking-[-0.012em]">
          High-Risk Synoptic Meteorological Systems (MoES / NCMRWF Focus)
        </h2>
        <p className="text-[13px] text-[#8a8f98] mt-1">
          Medium-range forecasts demonstrate the highest error rates during these 5 dynamic regimes. Click any regime to evaluate its atmospheric profile in the cockpit.
        </p>
      </div>

      {/* Grid of 5 Regimes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {REGIMES.map((r) => {
          const IconComponent = r.icon;
          return (
            <div
              key={r.id}
              className="linear-card flex flex-col justify-between hover:border-[#383b3f] transition group"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 border-b border-[#23252a] pb-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-[6px] bg-[#161718] border border-[#23252a] flex items-center justify-center shrink-0"
                      style={{ color: r.iconColor }}
                    >
                      <IconComponent size={18} />
                    </div>
                    <div>
                      <h3 className="text-[15px] font-[510] text-[#ffffff] group-hover:text-[#e4f222] transition-colors tracking-tight">
                        {r.title}
                      </h3>
                      <span className="text-[11px] font-linear-mono text-[#8a8f98]">
                        {r.season}
                      </span>
                    </div>
                  </div>

                  <span className={`linear-badge font-linear-mono text-[10px] px-2 py-0.5 border font-medium ${r.riskBadgeColor}`}>
                    {r.riskLevel}
                  </span>
                </div>

                {/* Synoptic Description */}
                <p className="text-[12px] text-[#d0d6e0] leading-relaxed mb-3">
                  {r.synopticDescription}
                </p>

                {/* Regions Affected */}
                <div className="bg-[#161718] p-2.5 rounded-[6px] border border-[#23252a] mb-3 text-[12px] font-linear-mono">
                  <span className="text-[#8a8f98] block text-[10px] uppercase">Primary Affected Geography:</span>
                  <span className="text-[#ffffff]">{r.regions}</span>
                </div>

                {/* Classic NWP Failure Modes */}
                <div className="space-y-1.5 mb-4">
                  <span className="text-[11px] font-linear-mono text-[#8a8f98] uppercase tracking-wider block">
                    NWP Failure Mechanisms:
                  </span>
                  <ul className="text-[11px] text-[#8a8f98] space-y-1">
                    {r.failureModes.map((fm, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-[#e4f222] mt-0.5">•</span>
                        <span>{fm}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() =>
                  onSelectRegime({
                    name: r.targetLocation.name,
                    lat: r.targetLocation.lat,
                    lon: r.targetLocation.lon,
                    ...r.parameters,
                  })
                }
                className="w-full btn-ghost justify-center text-[13px] hover:border-[#e4f222] hover:text-[#e4f222] transition-colors cursor-pointer pt-2"
              >
                <span>Load {r.title} Profile</span>
                <ArrowUpRight size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
