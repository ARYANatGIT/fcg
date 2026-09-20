"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  AlertTriangle, 
  ShieldAlert, 
  Info, 
  CloudLightning, 
  Wind, 
  Flame, 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  ExternalLink,
  MapPin,
  Calendar,
  Layers,
  Sparkles,
  TrendingUp,
  Filter
} from "lucide-react";

interface WeatherArticle {
  id: string;
  title: string;
  summary: string;
  severity: "WARNING" | "WATCH" | "ADVISORY" | "INFO";
  severity_color: "red" | "orange" | "yellow" | "blue";
  category: string;
  region: string;
  source: string;
  published_at: string;
  affected_states: string[];
  confidence_impact: string;
  bust_risk_factor: string;
}

export default function WeatherNewsFeed() {
  const [articles, setArticles] = useState<WeatherArticle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedSeverity, setSelectedSeverity] = useState<string>("ALL");
  const [selectedRegion, setSelectedRegion] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [lastRefreshed, setLastRefreshed] = useState<string>("");

  const fetchNews = useCallback(async () => {
    try {
      setLoading(true);
      let res = await fetch("/api/weather_news").catch(() => null);
      if (!res || !res.ok) {
        res = await fetch("http://localhost:8000/api/weather_news").catch(() => null);
      }
      if (res && res.ok) {
        const data = await res.json();
        if (data.articles) {
          setArticles(data.articles);
        }
      }
      setLastRefreshed(new Date().toLocaleTimeString());
    } catch (err) {
      console.warn("Failed to fetch weather news:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  // Filter articles based on severity, region, category, and search query
  const filteredArticles = articles.filter((article) => {
    const matchesSeverity = selectedSeverity === "ALL" || article.severity === selectedSeverity;
    const matchesRegion = selectedRegion === "ALL" || article.region.toLowerCase() === selectedRegion.toLowerCase();
    const matchesCategory = selectedCategory === "ALL" || article.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch = 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.affected_states.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
      article.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSeverity && matchesRegion && matchesCategory && matchesSearch;
  });

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "western_disturbance":
        return <Wind className="w-4 h-4 text-cyan-400" />;
      case "cyclone":
        return <AlertTriangle className="w-4 h-4 text-rose-400" />;
      case "monsoon":
        return <CloudLightning className="w-4 h-4 text-blue-400" />;
      case "heatwave":
        return <Flame className="w-4 h-4 text-amber-400" />;
      case "heavy_rainfall":
        return <CloudLightning className="w-4 h-4 text-indigo-400" />;
      case "fog":
        return <Wind className="w-4 h-4 text-slate-300" />;
      default:
        return <Layers className="w-4 h-4 text-white/60" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "WARNING":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm shadow-rose-950/50">
            SEVERE WARNING
          </span>
        );
      case "WATCH":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-950/50">
            WEATHER WATCH
          </span>
        );
      case "ADVISORY":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider bg-yellow-500/20 text-yellow-300 border border-yellow-500/40">
            ADVISORY
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/40">
            INFORMATION
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0e1424]/80 backdrop-blur-md p-5 rounded-2xl border border-white/10 shadow-xl">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
            </span>
            <h2 className="text-xl font-bold text-white tracking-wide">
              Live Meteorological Intelligence & Synoptic Disruptions
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              {articles.length} ACTIVE BULLETINS
            </span>
          </div>
          <p className="text-xs text-white/60 font-mono">
            Dynamic alerts and synoptic advisories compiled from IMD, NCMRWF, and MoES National Bulletins
          </p>
        </div>

        <div className="flex items-center gap-3">
          {lastRefreshed && (
            <span className="text-xs font-mono text-white/50 hidden sm:inline">
              Updated: {lastRefreshed}
            </span>
          )}
          <button
            onClick={fetchNews}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 active:scale-95 text-white/90 hover:text-white rounded-xl border border-white/10 text-xs font-semibold transition-all cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-cyan-400" : ""}`} />
            <span>Sync Feed</span>
          </button>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: "ALL", label: "All Categories" },
          { id: "western_disturbance", label: "Western Disturbance" },
          { id: "cyclone", label: "Cyclonic Vortices" },
          { id: "monsoon", label: "Monsoon Dynamics" },
          { id: "heatwave", label: "Heatwaves" },
          { id: "heavy_rainfall", label: "Heavy Rain / Cloudburst" },
          { id: "fog", label: "Fog & Cold Waves" },
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
              selectedCategory === cat.id
                ? "bg-cyan-500 text-black border-cyan-400 font-bold shadow-md shadow-cyan-500/20"
                : "bg-[#0e1424]/80 text-white/70 border-white/10 hover:text-white hover:border-white/20"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Filter Controls & Search */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        {/* Search Bar */}
        <div className="md:col-span-5 relative">
          <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by state, city, phenomena, or keyword..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#0e1424]/80 border border-white/10 rounded-xl text-xs text-white placeholder-white/40 focus:outline-none focus:border-cyan-500/50 transition-colors font-medium"
          />
        </div>

        {/* Severity Filter Tabs */}
        <div className="md:col-span-4 flex items-center gap-1 bg-[#0e1424]/80 p-1 rounded-xl border border-white/10">
          {[
            { id: "ALL", label: "All" },
            { id: "WARNING", label: "Warnings" },
            { id: "WATCH", label: "Watches" },
            { id: "ADVISORY", label: "Advisories" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedSeverity(tab.id)}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedSeverity === tab.id
                  ? "bg-white/15 text-white font-bold shadow-sm"
                  : "text-white/60 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Region Filter Dropdown */}
        <div className="md:col-span-3">
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="w-full py-2.5 px-3.5 bg-[#0e1424]/80 border border-white/10 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-cyan-500/50 cursor-pointer"
          >
            <option value="ALL">All Regions (43 Stations)</option>
            <option value="North">North (Western Himalayas & Plains)</option>
            <option value="West">West (Konkan, Gujarat & Arabian Sea)</option>
            <option value="Central">Central (Vidarbha & Malwa)</option>
            <option value="South">South (Peninsula & Bay of Bengal)</option>
            <option value="East">East (Gangetic Delta & Odisha)</option>
            <option value="Northeast">Northeast (Brahmaputra Valley)</option>
          </select>
        </div>
      </div>

      {/* Articles Grid */}
      {loading && articles.length === 0 ? (
        <div className="py-20 text-center text-white/50 font-mono text-sm">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3 text-cyan-400" />
          Fetching live synoptic disruption bulletins...
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="py-16 text-center text-white/50 font-mono text-sm bg-[#0e1424]/40 rounded-2xl border border-white/5">
          No disruption alerts matching current filter parameters ({articles.length} total in database).
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredArticles.map((article) => (
            <div
              key={article.id}
              className="bg-[#0e1424]/90 backdrop-blur-sm p-5 rounded-2xl border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between shadow-lg hover:shadow-cyan-950/20 group"
            >
              <div>
                {/* Card Top Badges */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-white/5 border border-white/5">
                      {getCategoryIcon(article.category)}
                    </span>
                    <span className="text-xs font-mono text-white/70 uppercase tracking-wider font-semibold">
                      {article.region} Zone
                    </span>
                  </div>
                  {getSeverityBadge(article.severity)}
                </div>

                {/* Title */}
                <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors leading-snug mb-2.5">
                  {article.title}
                </h3>

                {/* Summary */}
                <p className="text-sm text-white/80 leading-relaxed mb-4">
                  {article.summary}
                </p>

                {/* Affected States */}
                <div className="mb-4">
                  <span className="text-xs font-mono uppercase text-white/50 block mb-1.5 font-semibold">
                    Impacted States / Subdivisions:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {article.affected_states.map((state) => (
                      <span
                        key={state}
                        className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-xs text-white/90 font-mono font-medium"
                      >
                        {state}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Medium-Range Bust Impact Diagnostic Box */}
                <div className="bg-white/[0.03] p-3.5 rounded-xl border border-white/5 mb-4 space-y-2">
                  <div className="flex items-start gap-2 text-xs">
                    <TrendingUp className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-white/50 font-mono uppercase text-xs block font-semibold">
                        Forecast Bust Risk Driver:
                      </span>
                      <span className="text-white/90 font-medium text-xs">
                        {article.bust_risk_factor}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 text-xs">
                    <ShieldAlert className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-white/50 font-mono uppercase text-xs block font-semibold">
                        Confidence Impact:
                      </span>
                      <span className="text-amber-200/90 font-mono text-xs">
                        {article.confidence_impact}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-white/50 font-mono">
                <span>{article.source}</span>
                <span>{article.published_at}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

