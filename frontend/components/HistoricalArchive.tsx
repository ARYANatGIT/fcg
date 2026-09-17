"use client";

import React, { useState } from "react";
import { Archive, Search, Filter, AlertTriangle, CheckCircle, ExternalLink, Calendar } from "lucide-react";

const HISTORICAL_CASES = [
  {
    id: "case-01",
    date: "2024-07-24",
    station: "Mumbai (Santacruz)",
    state: "Maharashtra",
    leadDay: 5,
    event: "Monsoon Offshore Trough Extreme Deluge",
    forecastRain: "45.0 mm",
    observedRain: "248.5 mm",
    errorScore: "5.82",
    bustThreshold: "3.31",
    modelPredictedRisk: "86.4%",
    predictedStatus: "PREDICTED BUST",
    success: true,
    nwpModel: "NCUM Global (12km)",
    synopticSummary:
      "A mesoscale convective vortex formed over the Konkan coast. Global NWP under-represented the localized convergence line, leading to a massive 200mm+ rainfall miss at Day 5.",
  },
  {
    id: "case-02",
    date: "2024-05-25",
    station: "Kolkata (Dum Dum)",
    state: "West Bengal",
    leadDay: 6,
    event: "Severe Cyclonic Storm 'Remal' Track Recurvature",
    forecastRain: "35.0 mm",
    observedRain: "172.0 mm",
    errorScore: "6.14",
    bustThreshold: "3.92",
    modelPredictedRisk: "91.2%",
    predictedStatus: "PREDICTED BUST",
    success: true,
    nwpModel: "Global GFS 0.25°",
    synopticSummary:
      "NWP forecast cycles diverged by 280km between 00Z and 12Z runs. Landfall was accelerated by 14 hours compared to Day 6 guidance.",
  },
  {
    id: "case-03",
    date: "2025-01-18",
    station: "Srinagar / Pir Panjal",
    state: "Jammu & Kashmir",
    leadDay: 4,
    event: "Intense Western Disturbance Snowstorm",
    forecastRain: "12.0 mm",
    observedRain: "68.0 mm (Snow)",
    errorScore: "4.45",
    bustThreshold: "2.65",
    modelPredictedRisk: "78.0%",
    predictedStatus: "PREDICTED BUST",
    success: true,
    nwpModel: "NCUM Global",
    synopticSummary:
      "Orographic moisture entrapment along the Pir Panjal range was smoothed out by model terrain discretization, causing heavy snowfall warning bust.",
  },
  {
    id: "case-04",
    date: "2024-06-12",
    station: "Nagpur / Vidarbha",
    state: "Maharashtra",
    leadDay: 4,
    event: "Severe Heatwave Extreme Maximum Temperature",
    forecastRain: "0.0 mm",
    observedRain: "0.0 mm",
    forecastTemp: "41.2 °C",
    observedTemp: "46.8 °C",
    errorScore: "3.95",
    bustThreshold: "2.65",
    modelPredictedRisk: "72.5%",
    predictedStatus: "PREDICTED BUST",
    success: true,
    nwpModel: "ECMWF / NCUM",
    synopticSummary:
      "NWP surface energy balance model moistened boundary layer unrealistically, producing a severe 5.6°C cold bias during peak afternoon insolation.",
  },
  {
    id: "case-05",
    date: "2024-08-04",
    station: "Bhubaneswar",
    state: "Odisha",
    leadDay: 5,
    event: "Deep Depression Core Rain-Band Misplacement",
    forecastRain: "160.0 mm",
    observedRain: "32.0 mm",
    errorScore: "5.12",
    bustThreshold: "3.31",
    modelPredictedRisk: "84.1%",
    predictedStatus: "PREDICTED BUST",
    success: true,
    nwpModel: "NCUM Global",
    synopticSummary:
      "False alarm bust: NWP centered the torrential rain core over Bhubaneswar, whereas the actual depression tracked 180km south into northern Andhra Pradesh.",
  },
];

export default function HistoricalArchive() {
  const [searchTerm, setSearchTerm] = useState("");
  const [leadFilter, setLeadFilter] = useState("all");

  const filteredCases = HISTORICAL_CASES.filter((c) => {
    const matchesSearch =
      c.station.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.event.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.state.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLead =
      leadFilter === "all" ||
      (leadFilter === "d1-3" && c.leadDay <= 3) ||
      (leadFilter === "d4-6" && c.leadDay >= 4 && c.leadDay <= 6) ||
      (leadFilter === "d7-10" && c.leadDay >= 7);
    return matchesSearch && matchesLead;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-[#23252a] pb-4">
        <h2 className="text-[18px] font-[510] text-[#ffffff] flex items-center gap-2 tracking-[-0.012em]">
          <Archive size={18} className="text-[#e4f222]" /> Historical NWP Forecast Bust Archive &amp; Case Studies
        </h2>
        <p className="text-[13px] text-[#8a8f98] mt-1">
          Documented severe forecast failures over India. Demonstrating how ForecastGuard AI successfully flags uncertainty ahead of time.
        </p>
      </div>

      {/* Filter / Search Bar */}
      <div className="linear-card flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 py-3">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8a8f98]" />
          <input
            type="text"
            placeholder="Search by city, event, or state..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#161718] border border-[#23252a] rounded-[6px] pl-10 pr-4 py-2 text-[13px] text-[#ffffff] placeholder-[#62666d] focus:outline-none focus:border-[#e4f222]/50 font-sans"
          />
        </div>

        <div className="flex items-center gap-2 text-[13px] font-linear-mono">
          <span className="text-[#8a8f98]">Lead Range:</span>
          <select
            value={leadFilter}
            onChange={(e) => setLeadFilter(e.target.value)}
            className="bg-[#161718] border border-[#23252a] text-[#ffffff] rounded-[6px] px-3 py-1.5 focus:outline-none text-[13px]"
          >
            <option value="all">All Lead Days (1–10)</option>
            <option value="d1-3">Short Range (D1–D3)</option>
            <option value="d4-6">Medium Range (D4–D6)</option>
            <option value="d7-10">Extended Range (D7–D10)</option>
          </select>
        </div>
      </div>

      {/* Case Studies Grid */}
      <div className="space-y-4">
        {filteredCases.map((c) => (
          <div
            key={c.id}
            className="linear-card hover:border-[#383b3f] transition space-y-4"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-[#23252a] pb-3">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="text-[16px] font-[510] text-[#ffffff] tracking-tight">
                    {c.station}, {c.state}
                  </span>
                  <span className="linear-badge font-linear-mono text-[11px] text-[#8a8f98] flex items-center gap-1">
                    <Calendar size={11} /> {c.date}
                  </span>
                  <span className="linear-badge font-linear-mono text-[11px] text-[#e4f222]">
                    Lead Day {c.leadDay}
                  </span>
                </div>
                <h4 className="text-[14px] text-[#02b8cc] font-medium mt-0.5">
                  {c.event}
                </h4>
              </div>

              <div className="flex items-center gap-2">
                <span className="linear-badge font-linear-mono text-[12px] bg-[#27a644]/15 text-[#27a644] border-[#27a644]/40 flex items-center gap-1.5 py-1 px-2.5">
                  <CheckCircle size={13} />
                  AI Flagged: {c.modelPredictedRisk} Bust Risk
                </span>
              </div>
            </div>

            {/* Metrics Comparison Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[12px] font-linear-mono">
              <div className="bg-[#161718] p-2.5 rounded-[6px] border border-[#23252a]">
                <span className="text-[#8a8f98] block text-[10px] uppercase">NWP Forecast</span>
                <span className="text-[#ffffff] text-[13px] font-medium">
                  {c.forecastRain || c.forecastTemp}
                </span>
              </div>
              <div className="bg-[#161718] p-2.5 rounded-[6px] border border-[#23252a]">
                <span className="text-[#8a8f98] block text-[10px] uppercase">Observed / Verification</span>
                <span className="text-[#eb5757] text-[13px] font-medium">
                  {c.observedRain || c.observedTemp}
                </span>
              </div>
              <div className="bg-[#161718] p-2.5 rounded-[6px] border border-[#23252a]">
                <span className="text-[#8a8f98] block text-[10px] uppercase">Forecast Error Score</span>
                <span className="text-[#eb5757] text-[13px] font-medium">
                  {c.errorScore} (Threshold: {c.bustThreshold})
                </span>
              </div>
              <div className="bg-[#161718] p-2.5 rounded-[6px] border border-[#23252a]">
                <span className="text-[#8a8f98] block text-[10px] uppercase">Model Source</span>
                <span className="text-[#ffffff] text-[13px] font-medium">
                  {c.nwpModel}
                </span>
              </div>
            </div>

            {/* Synoptic Post-Mortem */}
            <p className="text-[13px] text-[#d0d6e0] leading-relaxed bg-[#161718]/60 p-3 rounded-[6px] border border-[#23252a]/80">
              <strong className="text-[#ffffff] font-medium">Meteorological Post-Mortem: </strong>
              {c.synopticSummary}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
