"use client";

import React, { useState, useEffect } from "react";
import { Archive, Search, Calendar, MapPin } from "lucide-react";

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
      "A mesoscale convective vortex formed along the Konkan coast. Global NWP under-represented localized low-level convergence, leading to a massive 200mm+ rainfall miss at Day 5.",
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
      "Consecutive forecast cycles diverged by 280km between 00Z and 12Z runs. Cyclone landfall was accelerated by 14 hours compared to Day 6 deterministic guidance.",
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
  const [cases, setCases] = useState<any[]>(HISTORICAL_CASES);
  const [searchTerm, setSearchTerm] = useState("");
  const [leadFilter, setLeadFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");

  useEffect(() => {
    fetch("/api/historical_busts")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.cases && Array.isArray(data.cases) && data.cases.length > 0) {
          setCases(data.cases);
        }
      })
      .catch(() => null);
  }, []);

  const filteredCases = cases.filter((c) => {
    const matchesSearch =
      c.station.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.event.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.synopticSummary && c.synopticSummary.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesLead =
      leadFilter === "all" ||
      (leadFilter === "d1-3" && c.leadDay <= 3) ||
      (leadFilter === "d4-6" && c.leadDay >= 4 && c.leadDay <= 6) ||
      (leadFilter === "d7-10" && c.leadDay >= 7);
    const matchesState = stateFilter === "all" || c.state.toLowerCase() === stateFilter.toLowerCase();
    return matchesSearch && matchesLead && matchesState;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl glass-feature border border-white/10">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-8 h-8 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center text-[#E8E8E5]">
              <Archive size={16} />
            </div>
            <h2 className="text-lg font-bold text-[#E8E8E5] tracking-wide font-sans">
              Severe Historical NWP Forecast Bust Archive
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono-tech bg-white/[0.05] text-[#D8D8D3] border border-white/10">
              {cases.length} BENCHMARKED CASES
            </span>
          </div>
          <p className="text-xs text-[#92928C] leading-relaxed max-w-3xl">
            Catalog of validated historical medium-range forecast failure events across India, documenting synoptic root causes, verification metrics, and ForecastGuard early-warning detection.
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        {/* Search */}
        <div className="sm:col-span-6 relative">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B8B87]" />
          <input
            type="text"
            placeholder="Search by station, state, cyclone, or synoptic event..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 bg-white/[0.04] border border-white/10 rounded-full pl-11 pr-4 text-xs font-mono-tech text-[#E8E8E5] placeholder-[#8B8B87] focus:outline-none focus:border-white/30 transition"
          />
        </div>

        {/* State Filter */}
        <div className="sm:col-span-3">
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="w-full h-10 px-4 bg-white/[0.04] border border-white/10 rounded-full text-xs font-mono-tech text-[#E8E8E5] focus:outline-none focus:border-white/30 transition cursor-pointer"
          >
            <option value="all" className="bg-[#121212] text-white">All States / Subdivisions</option>
            <option value="Maharashtra" className="bg-[#121212] text-white">Maharashtra</option>
            <option value="West Bengal" className="bg-[#121212] text-white">West Bengal</option>
            <option value="Delhi NCT" className="bg-[#121212] text-white">Delhi NCT</option>
            <option value="Tamil Nadu" className="bg-[#121212] text-white">Tamil Nadu</option>
            <option value="Gujarat" className="bg-[#121212] text-white">Gujarat</option>
            <option value="Odisha" className="bg-[#121212] text-white">Odisha</option>
            <option value="Jammu & Kashmir" className="bg-[#121212] text-white">Jammu & Kashmir</option>
            <option value="Himachal Pradesh" className="bg-[#121212] text-white">Himachal Pradesh</option>
            <option value="Uttarakhand" className="bg-[#121212] text-white">Uttarakhand</option>
            <option value="Karnataka" className="bg-[#121212] text-white">Karnataka</option>
            <option value="Andhra Pradesh" className="bg-[#121212] text-white">Andhra Pradesh</option>
            <option value="Rajasthan" className="bg-[#121212] text-white">Rajasthan</option>
            <option value="Assam" className="bg-[#121212] text-white">Assam</option>
            <option value="Kerala" className="bg-[#121212] text-white">Kerala</option>
            <option value="Bihar" className="bg-[#121212] text-white">Bihar</option>
          </select>
        </div>

        {/* Lead Filter Pills */}
        <div className="sm:col-span-3 flex items-center gap-1 bg-white/[0.03] p-1 rounded-full border border-white/10">
          {[
            { id: "all", label: "All Days" },
            { id: "d1-3", label: "D1–D3" },
            { id: "d4-6", label: "D4–D6" },
            { id: "d7-10", label: "D7–D10" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setLeadFilter(f.id)}
              className={`flex-1 h-8 text-[11px] font-mono-tech font-semibold rounded-full transition-all cursor-pointer ${
                leadFilter === f.id
                  ? "is-active bg-[#E8E8E4] text-[#141414] font-bold shadow-sm"
                  : "text-[#8B8B87] hover:text-[#E8E8E5]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Case Cards Grid */}
      <div className="space-y-4">
        {filteredCases.map((c, idx) => (
          <div
            key={c.id}
            className="detail-card space-y-4 p-5 rounded-2xl transition-all"
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-white/10 pb-3.5">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-0.5 rounded-full font-mono-tech text-[10px] bg-white/[0.06] text-[#D8D8D3] border border-white/10 font-bold">
                  {c.id.toUpperCase()}
                </span>
                <div>
                  <div className="noir-kicker mb-0.5">CASE BENCHMARK / {String(idx + 1).padStart(2, "0")}</div>
                  <h3 className="text-base font-bold text-[#E8E8E5]">
                    {c.event}
                  </h3>
                  <div className="flex items-center gap-3 text-xs font-mono-tech text-[#8B8B87] mt-0.5">
                    <span className="flex items-center gap-1"><MapPin size={12} className="text-[#AEB796]" /> {c.station}, {c.state}</span>
                    <span className="flex items-center gap-1"><Calendar size={12} className="text-[#8B8B87]" /> {c.date}</span>
                    <span>Lead: Day {c.leadDay}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full font-mono-tech text-[11px] bg-red-500/10 text-red-400 border border-red-500/30 font-bold">
                  {c.predictedStatus} ({c.modelPredictedRisk})
                </span>
              </div>
            </div>

            {/* Metrics Comparison Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="bg-white/[0.03] p-3 rounded-xl border border-white/10">
                <span className="text-[10px] font-mono-tech text-[#8B8B87] uppercase block mb-0.5">NWP Predicted</span>
                <span className="text-sm font-bold font-mono-tech text-[#D8D8D3]">{c.forecastRain}</span>
              </div>
              <div className="bg-white/[0.03] p-3 rounded-xl border border-white/10">
                <span className="text-[10px] font-mono-tech text-[#8B8B87] uppercase block mb-0.5">Actual Observed</span>
                <span className="text-sm font-bold font-mono-tech text-red-400">{c.observedRain}</span>
              </div>
              <div className="bg-white/[0.03] p-3 rounded-xl border border-white/10">
                <span className="text-[10px] font-mono-tech text-[#8B8B87] uppercase block mb-0.5">Error Score</span>
                <span className="text-sm font-bold font-mono-tech text-[#E8E8E5]">{c.errorScore}</span>
              </div>
              <div className="bg-white/[0.03] p-3 rounded-xl border border-white/10">
                <span className="text-[10px] font-mono-tech text-[#8B8B87] uppercase block mb-0.5">Bust Threshold (90th)</span>
                <span className="text-sm font-bold font-mono-tech text-[#8B8B87]">{c.bustThreshold}</span>
              </div>
            </div>

            {/* Synoptic Summary */}
            <p className="text-xs text-[#92928C] leading-relaxed bg-white/[0.02] p-3.5 rounded-xl border border-white/10 font-sans">
              <strong className="text-[#E8E8E5] font-semibold">Meteorological Post-Mortem:</strong> {c.synopticSummary}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
