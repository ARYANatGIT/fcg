"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Volume2, 
  VolumeX, 
  Sun, 
  Moon, 
  Search, 
  X, 
  MapPin, 
  Navigation, 
  CloudRain, 
  Activity, 
  Sliders, 
  Archive, 
  Cpu, 
  Database,
  ExternalLink
} from "lucide-react";

interface TopRightToolbarProps {
  onSelectStation?: (stationName: string) => void;
  onSelectTab?: (tabId: string) => void;
  stations?: { id: string; name: string; state: string }[];
}

export default function TopRightToolbar({
  onSelectStation,
  onSelectTab,
  stations = [],
}: TopRightToolbarProps) {
  // TTS State
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const activeHighlightedElementRef = useRef<HTMLElement | null>(null);

  // Theme State
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // Search Bar State
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize Theme from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("fg_theme");
      if (savedTheme === "light") {
        setTheme("light");
        document.documentElement.classList.add("light-mode");
      } else {
        setTheme("dark");
        document.documentElement.classList.remove("light-mode");
      }
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("fg_theme", next);
      if (next === "light") {
        document.documentElement.classList.add("light-mode");
      } else {
        document.documentElement.classList.remove("light-mode");
      }
    }
  };

  // Keyboard shortcut for search: Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      if (e.key === "Escape" && searchOpen) {
        setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [searchOpen]);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  const [currentWord, setCurrentWord] = useState<string>("");
  const [speakingSentence, setSpeakingSentence] = useState<string>("");

  // Clean up highlighting
  const clearHighlight = () => {
    if (activeHighlightedElementRef.current) {
      activeHighlightedElementRef.current.classList.remove(
        "outline",
        "outline-2",
        "outline-[#e4f222]",
        "bg-[#e4f222]/10",
        "rounded-lg",
        "transition-all"
      );
      activeHighlightedElementRef.current = null;
    }
    setCurrentWord("");
    setSpeakingSentence("");
  };

  const handleStopSpeaking = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    clearHighlight();
    setIsSpeaking(false);
    setIsPaused(false);
  };

  // Simple, rock-solid 1-click start / 1-click stop TTS engine
  const handleToggleSpeak = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      alert("Text-to-Speech is not supported in this browser.");
      return;
    }

    // If currently speaking or active, clicking again immediately stops reading
    if (isSpeaking || window.speechSynthesis.speaking) {
      handleStopSpeaking();
      return;
    }

    // Cancel any previous utterances
    window.speechSynthesis.cancel();
    clearHighlight();

    // Collect all visible text blocks across the active main view
    const mainContainer = document.querySelector("main") || document.body;
    const candidates: HTMLElement[] = Array.from(
      mainContainer.querySelectorAll("h1, h2, h3, h4, h5, p, [data-tts], td, th, label, .font-linear-mono")
    ).filter((el): el is HTMLElement => {
      if (!(el instanceof HTMLElement)) return false;
      if (el.closest("nav") || el.closest("button") || el.closest("aside") || el.closest("script") || el.offsetParent === null) return false;
      const text = el.innerText?.trim() || "";
      return text.length >= 3;
    });

    // Deduplicate: filter out parent containers whose text matches children
    const readableBlocks: HTMLElement[] = candidates.filter((el, i) => {
      for (let j = 0; j < candidates.length; j++) {
        if (i !== j && candidates[j].contains(el) && candidates[j] !== el) {
          if (candidates[j].innerText.trim() === el.innerText.trim()) {
            return false;
          }
        }
      }
      return true;
    });

    if (readableBlocks.length === 0) {
      alert("No readable text found on the current page.");
      return;
    }

    let currentIndex = 0;
    setIsSpeaking(true);
    setIsPaused(false);

    const speakNextBlock = () => {
      if (currentIndex >= readableBlocks.length) {
        clearHighlight();
        setIsSpeaking(false);
        setIsPaused(false);
        return;
      }

      const node = readableBlocks[currentIndex];
      const text = node.innerText?.trim() || "";

      if (!text || text.length < 2) {
        currentIndex++;
        speakNextBlock();
        return;
      }

      clearHighlight();
      activeHighlightedElementRef.current = node;
      node.classList.add(
        "outline",
        "outline-2",
        "outline-[#e4f222]",
        "bg-[#e4f222]/10",
        "rounded-lg",
        "transition-all"
      );
      node.scrollIntoView({ behavior: "smooth", block: "nearest" });
      setSpeakingSentence(text);

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.lang = "en-US";

      // Track exact spoken word via boundary event
      utterance.onboundary = (event: SpeechSynthesisEvent) => {
        if (event.name === "word" && typeof event.charIndex === "number") {
          const charIndex = event.charIndex;
          const charLength = event.charLength || (text.slice(charIndex).match(/^\S+/)?.[0]?.length ?? 5);
          const word = text.substring(charIndex, charIndex + charLength);
          setCurrentWord(word);
        }
      };

      utterance.onend = () => {
        currentIndex++;
        speakNextBlock();
      };

      utterance.onerror = (e) => {
        console.warn("TTS Error:", e);
        currentIndex++;
        speakNextBlock();
      };

      utteranceRef.current = utterance;
      (window as any).__currentUtterance = utterance;
      window.speechSynthesis.speak(utterance);
    };

    speakNextBlock();
  };

  const escapeHtml = (str: string) => {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  };

  // Search Results Compilation
  const searchResults = React.useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return [];

    const results: Array<{
      type: "VIEW" | "STATION" | "REGIME";
      title: string;
      subtitle: string;
      id: string;
      icon: any;
    }> = [];

    // Views
    const views = [
      { id: "cockpit", title: "Live Overview", subtitle: "Lead-Day Scrubber, SOI Vector Map & Calibrated Gauge", icon: Navigation },
      { id: "windy", title: "Wind & Radar", subtitle: "Multi-Source Synoptic Wind, Rain & Pressure Dynamics", icon: Activity },
      { id: "news", title: "Weather Alerts", subtitle: "Severe Weather Bulletins & Meteorological Advisories", icon: Volume2 },
      { id: "insights", title: "Diagnostics", subtitle: "Lead-Curve, Multi-Model Consensus & SHAP Attribution", icon: Sliders },
      { id: "sandbox", title: "Simulation", subtitle: "Counterfactual Atmospheric Perturbation Simulator", icon: Sliders },
      { id: "regimes", title: "Threat Matrix", subtitle: "Monsoon Lows, Western Disturbances & Cyclone Regimes", icon: CloudRain },
      { id: "model", title: "Model Benchmarks", subtitle: "LightGBM + XGBoost Reliability Curves & Brier Score", icon: Cpu },
      { id: "archive", title: "Bust Archive", subtitle: "Searchable Repository of Past Forecast Busts", icon: Archive },
      { id: "opendata", title: "Developer API", subtitle: "Download Full Datasets (JSON/ZIP) & Manage API Keys", icon: Database },
    ];

    views.forEach((v) => {
      if (v.title.toLowerCase().includes(q) || v.subtitle.toLowerCase().includes(q)) {
        results.push({
          type: "VIEW",
          title: v.title,
          subtitle: v.subtitle,
          id: v.id,
          icon: v.icon,
        });
      }
    });

    // Stations
    stations.forEach((s) => {
      if (s.name.toLowerCase().includes(q) || s.state.toLowerCase().includes(q) || s.id.toLowerCase().includes(q)) {
        results.push({
          type: "STATION",
          title: s.name,
          subtitle: `${s.state} (Station Met Node)`,
          id: s.name,
          icon: MapPin,
        });
      }
    });

    // Regimes
    const regimes = [
      { id: "monsoon-low", name: "Monsoon Low & Depression", state: "Bay of Bengal & Central India" },
      { id: "western-disturbance", name: "Western Disturbance", state: "NW India & Western Himalayas" },
      { id: "cyclonic-storm", name: "Tropical Cyclonic System", state: "East & West Coasts" },
      { id: "heatwave-regime", name: "Dry Heatwave & Anti-Cyclonic", state: "Northwest & Central Plains" },
    ];

    regimes.forEach((r) => {
      if (r.name.toLowerCase().includes(q) || r.state.toLowerCase().includes(q)) {
        results.push({
          type: "REGIME",
          title: r.name,
          subtitle: `${r.state} (Synoptic Pattern)`,
          id: "regimes",
          icon: CloudRain,
        });
      }
    });

    return results.slice(0, 8);
  }, [searchQuery, stations]);

  return (
    <div className="flex items-center gap-2">
      {/* 1. Global Search Trigger (Ctrl+K) */}
      <button
        onClick={() => setSearchOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#151820] hover:bg-[#1e2330] border border-[#232732] text-[#cbd5e1] hover:text-white text-xs font-linear-mono transition cursor-pointer shadow-sm"
        title="Quick Jump to any Station or View (Ctrl+K)"
      >
        <Search size={14} className="text-cyan-400" />
        <span className="hidden md:inline">Search...</span>
        <kbd className="hidden md:inline-block px-1.5 py-0.5 rounded bg-[#232732] text-[10px] font-mono text-[#94a3b8]">
          Ctrl+K
        </kbd>
      </button>

      {/* 2. Read Page Aloud (1-Click Toggle: Start / Stop with Word Highlighting) */}
      <button
        onClick={handleToggleSpeak}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-linear-mono transition cursor-pointer shadow-sm ${
          isSpeaking
            ? "bg-[#e4f222]/20 text-[#e4f222] border-[#e4f222]/60 animate-pulse font-bold"
            : "bg-[#151820] hover:bg-[#1e2330] text-[#cbd5e1] border-[#232732]"
        }`}
        title={isSpeaking ? "Click to Stop Reading" : "Click to Read Page Aloud with Word Highlighting"}
      >
        {isSpeaking ? (
          <>
            <VolumeX size={14} className="text-[#e4f222]" />
            <span className="font-semibold">Stop Reading</span>
          </>
        ) : (
          <>
            <Volume2 size={14} className="text-[#94a3b8]" />
            <span className="hidden sm:inline font-medium">Read Aloud</span>
          </>
        )}
      </button>

      {/* 3. Light / Dark Mode Toggle */}
      <button
        onClick={toggleTheme}
        className="p-2 rounded-lg bg-[#151820] hover:bg-[#1e2330] border border-[#232732] text-[#cbd5e1] hover:text-white transition cursor-pointer shadow-sm"
        title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
        aria-label="Toggle Theme Mode"
      >
        {theme === "dark" ? (
          <Sun size={15} className="text-[#e4f222]" />
        ) : (
          <Moon size={15} className="text-cyan-400" />
        )}
      </button>

      {/* Floating Teleprompter HUD: Displays current word in neon yellow while reading */}
      {isSpeaking && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] max-w-2xl w-[92vw] bg-[#0c1017]/95 border-2 border-[#e4f222]/80 text-white px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center gap-3 font-linear-mono">
          <div className="w-8 h-8 rounded-xl bg-[#e4f222]/20 border border-[#e4f222]/50 flex items-center justify-center text-[#e4f222] shrink-0 animate-pulse">
            <Volume2 size={18} />
          </div>
          <div className="flex-1 min-w-0 text-xs sm:text-sm">
            <div className="text-[10px] text-[#e4f222] uppercase tracking-wider font-bold mb-0.5">
              Reading Page Aloud
            </div>
            <div className="truncate text-slate-200">
              {speakingSentence ? (
                <span>
                  {currentWord ? (
                    <>
                      <span>{speakingSentence.split(currentWord)[0]}</span>
                      <span className="bg-[#e4f222] text-black font-bold px-1.5 py-0.5 rounded shadow-sm">
                        {currentWord}
                      </span>
                      <span>{speakingSentence.split(currentWord).slice(1).join(currentWord)}</span>
                    </>
                  ) : (
                    speakingSentence
                  )}
                </span>
              ) : (
                "Speaking..."
              )}
            </div>
          </div>
          <button
            onClick={handleStopSpeaking}
            className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-400 hover:text-red-300 rounded-lg text-xs font-bold transition shrink-0 cursor-pointer"
          >
            Stop
          </button>
        </div>
      )}

      {/* ========================================================
          SEARCH MODAL OVERLAY (Ctrl+K)
          ======================================================== */}
      {searchOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-start justify-center pt-20 px-4 animate-in fade-in duration-150"
          onClick={() => setSearchOpen(false)}
        >
          <div 
            className="w-full max-w-xl bg-[#0e1219] border border-[#232e42] rounded-xl shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input Bar */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#232e42] bg-[#121722]">
              <Search size={18} className="text-cyan-400 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Jump to any Station (Delhi, Mumbai...), View, or Synoptic Regime..."
                className="w-full bg-transparent text-sm text-white placeholder-[#64748b] focus:outline-none font-linear-mono"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="p-1 rounded text-[#64748b] hover:text-white transition"
                >
                  <X size={16} />
                </button>
              )}
              <kbd className="px-1.5 py-0.5 rounded bg-[#1e2738] text-xs font-mono text-[#94a3b8]">
                ESC
              </kbd>
            </div>

            {/* Results List */}
            <div className="p-2 max-h-[380px] overflow-y-auto space-y-1">
              {searchResults.length > 0 ? (
                searchResults.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={`${item.type}-${item.id}-${idx}`}
                      onClick={() => {
                        if (item.type === "STATION" && onSelectStation) {
                          onSelectStation(item.id);
                        } else if (onSelectTab) {
                          onSelectTab(item.id);
                        }
                        setSearchOpen(false);
                      }}
                      className="w-full px-3 py-2.5 rounded-lg flex items-center justify-between text-left hover:bg-[#182130] transition group cursor-pointer border border-transparent hover:border-[#283850]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#151c28] border border-[#232e42] flex items-center justify-center text-cyan-400 group-hover:text-[#e4f222] transition-colors">
                          <Icon size={16} />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white group-hover:text-cyan-200 transition-colors">
                            {item.title}
                          </div>
                          <div className="text-xs text-[#94a3b8] font-linear-mono">
                            {item.subtitle}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#1e2738] text-[#94a3b8]">
                        {item.type}
                      </span>
                    </button>
                  );
                })
              ) : (
                <div className="py-8 text-center text-[#64748b] text-xs font-mono">
                  {searchQuery ? "No matching stations, views, or regimes found." : "Type station name (e.g. Kolkata, Goa) or view name to jump immediately."}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-4 py-2 bg-[#0a0d14] border-t border-[#1e2738] flex items-center justify-between text-[11px] font-mono text-[#64748b]">
              <span>Use &uarr; &darr; to navigate, Enter to select</span>
              <span>43 Synoptic Meteorological Hubs Indexed</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
