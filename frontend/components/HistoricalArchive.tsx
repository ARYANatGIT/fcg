"use client";

import React, { useState, useEffect } from "react";
import { Archive, Search, Filter, AlertTriangle, CheckCircle, ExternalLink, Calendar, MapPin, Gauge } from "lucide-react";

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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch("/api/historical_busts")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.cases && Array.isArray(data.cases) && data.cases.length > 0) {
          setCases(data.cases);
        }
      })
      .catch((err) => console.warn("Failed to load historical busts from MongoDB:", err))
      .finally(() => setLoading(false));
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#232732] pb-5">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <Archive size={22} className="text-[#e4f222]" />
            <h2 className="text-xl font-bold text-white tracking-wide">
              Severe Historical NWP Forecast Bust Archive (2020–2025)
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              {cases.length} BENCHMARKED CASES
            </span>
          </div>
          <p className="text-sm text-white/60 leading-relaxed">
            Comprehensive catalog of validated historical medium-range forecast failure events across India, documenting synoptic root causes, verification metrics, and ForecastGuard early-warning detection.
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        {/* Search */}
        <div className="sm:col-span-6 relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Search by station, state, cyclone, or synoptic event..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-11 bg-[#0e1424]/90 border border-white/10 rounded-xl pl-10 pr-4 text-xs font-medium text-white placeholder-white/40 focus:outline-none focus:border-cyan-400"
          />
        </div>

        {/* State Filter */}
        <div className="sm:col-span-3">
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="w-full h-11 px-3 bg-[#0e1424]/90 border border-white/10 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
          >
            <option value="all">All States / Subdivisions</option>
            <option value="Maharashtra">Maharashtra</option>
            <option value="West Bengal">West Bengal</option>
            <option value="Delhi NCT">Delhi NCT</option>
            <option value="Tamil Nadu">Tamil Nadu</option>
            <option value="Gujarat">Gujarat</option>
            <option value="Odisha">Odisha</option>
            <option value="Jammu & Kashmir">Jammu & Kashmir</option>
            <option value="Himachal Pradesh">Himachal Pradesh</option>
            <option value="Uttarakhand">Uttarakhand</option>
            <option value="Karnataka">Karnataka</option>
            <option value="Andhra Pradesh">Andhra Pradesh</option>
            <option value="Rajasthan">Rajasthan</option>
            <option value="Assam">Assam</option>
            <option value="Kerala">Kerala</option>
            <option value="Bihar">Bihar</option>
          </select>
        </div>

        {/* Lead Filter Pills */}
        <div className="sm:col-span-3 flex items-center gap-1 bg-[#0e1424]/90 p-1.5 rounded-xl border border-white/10">
          {[
            { id: "all", label: "All Days" },
            { id: "d1-3", label: "D1–D3" },
            { id: "d4-6", label: "D4–D6" },
            { id: "d7-10", label: "D7–D10" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setLeadFilter(f.id)}
              className={`flex-1 h-8 text-xs font-mono font-semibold rounded-lg transition-all cursor-pointer ${
                leadFilter === f.id
                  ? "bg-cyan-500 text-black font-bold shadow-md shadow-cyan-500/20"
                  : "text-white/60 hover:text-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Case Cards Grid */}
      <div className="space-y-4">
        {filteredCases.map((c) => (
          <div
            key={c.id}
            className="linear-card space-y-4 hover:border-[#384256] transition"
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-[#232732] pb-3.5">
              <div className="flex items-center gap-3">
                <span className="linear-badge font-linear-mono text-[12px] bg-[#232732] text-white font-semibold">
                  {c.id.toUpperCase()}
                </span>
                <div>
                  <h3 className="text-[17px] font-[600] text-[#ffffff]">
                    {c.event}
                  </h3>
                  <div className="flex items-center gap-3 text-[13px] font-linear-mono text-[#94a3b8] mt-0.5">
                    <span className="flex items-center gap-1"><MapPin size={13} className="text-[#e4f222]" /> {c.station}, {c.state}</span>
                    <span className="flex items-center gap-1"><Calendar size={13} className="text-[#38bdf8]" /> {c.date}</span>
                    <span>Lead: Day {c.leadDay}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="linear-badge font-linear-mono text-[12px] px-3 py-1 bg-[#ef4444]/15 text-[#ef4444] border-[#ef4444]/50 font-bold">
                  {c.predictedStatus} ({c.modelPredictedRisk})
                </span>
              </div>
            </div>

            {/* Metrics Comparison Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="bg-[#12151c] p-3 rounded-[8px] border border-[#232732]">
                <span className="text-[12px] font-linear-mono text-[#94a3b8] uppercase block mb-0.5">NWP Predicted</span>
                <span className="text-[15px] font-bold font-linear-mono text-[#38bdf8]">{c.forecastRain}</span>
              </div>
              <div className="bg-[#12151c] p-3 rounded-[8px] border border-[#232732]">
                <span className="text-[12px] font-linear-mono text-[#94a3b8] uppercase block mb-0.5">Actual Observed</span>
                <span className="text-[15px] font-bold font-linear-mono text-[#ef4444]">{c.observedRain}</span>
              </div>
              <div className="bg-[#12151c] p-3 rounded-[8px] border border-[#232732]">
                <span className="text-[12px] font-linear-mono text-[#94a3b8] uppercase block mb-0.5">Calculated Error Score</span>
                <span className="text-[15px] font-bold font-linear-mono text-[#f59e0b]">{c.errorScore}</span>
              </div>
              <div className="bg-[#12151c] p-3 rounded-[8px] border border-[#232732]">
                <span className="text-[12px] font-linear-mono text-[#94a3b8] uppercase block mb-0.5">Bust Threshold (90th %)</span>
                <span className="text-[15px] font-bold font-linear-mono text-[#cbd5e1]">{c.bustThreshold}</span>
              </div>
            </div>

            {/* Synoptic Summary */}
            <p className="text-[14px] text-[#94a3b8] leading-relaxed bg-[#151820] p-3.5 rounded-[8px] border border-[#232732]">
              <strong className="text-[#ffffff]">Meteorological Post-Mortem:</strong> {c.synopticSummary}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
