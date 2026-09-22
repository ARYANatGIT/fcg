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
        "outline-[#AEB796]",
        "bg-[#AEB796]/15",
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
        "outline-[#AEB796]",
        "bg-[#AEB796]/15",
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
        className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-[#D8D8D3] hover:text-[#E8E8E5] text-xs font-mono-tech transition cursor-pointer shadow-sm"
        title="Quick Jump to any Station or View (Ctrl+K)"
      >
        <Search size={14} className="text-[#AEB796]" />
        <span className="hidden md:inline">Search...</span>
        <kbd className="hidden md:inline-block px-1.5 py-0.5 rounded bg-white/[0.06] text-[10px] font-mono text-[#8B8B87]">
          Ctrl+K
        </kbd>
      </button>

      {/* 2. Read Page Aloud (1-Click Toggle: Start / Stop with Word Highlighting) */}
      <button
        onClick={handleToggleSpeak}
        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-mono-tech transition cursor-pointer shadow-sm ${
          isSpeaking
            ? "bg-[#AEB796]/20 text-[#D6DDA9] border-[#AEB796]/50 animate-pulse font-semibold"
            : "bg-white/[0.04] hover:bg-white/[0.08] text-[#D8D8D3] border-white/10"
        }`}
        title={isSpeaking ? "Click to Stop Reading" : "Click to Read Page Aloud with Word Highlighting"}
      >
        {isSpeaking ? (
          <>
            <VolumeX size={14} className="text-[#D6DDA9]" />
            <span className="font-semibold">Stop Reading</span>
          </>
        ) : (
          <>
            <Volume2 size={14} className="text-[#8B8B87]" />
            <span className="hidden sm:inline font-medium">Read Aloud</span>
          </>
        )}
      </button>

      {/* 3. Light / Dark Mode Toggle */}
      <button
        onClick={toggleTheme}
        className="p-2 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-[#D8D8D3] hover:text-white transition cursor-pointer shadow-sm"
        title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
        aria-label="Toggle Theme Mode"
      >
        {theme === "dark" ? (
          <Sun size={15} className="text-[#AEB796]" />
        ) : (
          <Moon size={15} className="text-[#AEB796]" />
        )}
      </button>

      {/* Floating Teleprompter HUD: Displays current word in sage highlight while reading */}
      {isSpeaking && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] max-w-2xl w-[92vw] bg-[#0c0c0c]/95 border border-[#AEB796]/50 text-[#E8E8E5] px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-2xl flex items-center gap-3 font-mono-tech">
          <div className="w-8 h-8 rounded-full bg-[#AEB796]/20 border border-[#AEB796]/40 flex items-center justify-center text-[#D6DDA9] shrink-0 animate-pulse">
            <Volume2 size={18} />
          </div>
          <div className="flex-1 min-w-0 text-xs sm:text-sm">
            <div className="text-[10px] text-[#AEB796] uppercase tracking-wider font-semibold mb-0.5">
              Reading Page Aloud
            </div>
            <div className="truncate text-[#D8D8D3]">
              {speakingSentence ? (
                <span>
                  {currentWord ? (
                    <>
                      <span>{speakingSentence.split(currentWord)[0]}</span>
                      <span className="bg-[#E8E8E4] text-[#141414] font-bold px-1.5 py-0.5 rounded shadow-sm">
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
            className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-400 hover:text-red-300 rounded-full text-xs font-semibold transition shrink-0 cursor-pointer"
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
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-start justify-center pt-20 px-4 animate-in fade-in duration-150"
          onClick={() => setSearchOpen(false)}
        >
          <div 
            className="w-full max-w-xl glass-feature border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col bg-[#0c0c0c]/95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input Bar */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/10 bg-white/[0.02]">
              <Search size={18} className="text-[#AEB796] shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Jump to any Station (Delhi, Mumbai...), View, or Synoptic Regime..."
                className="w-full bg-transparent text-sm text-[#E8E8E5] placeholder-[#8B8B87] focus:outline-none font-mono-tech"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="p-1 rounded text-[#8B8B87] hover:text-[#E8E8E5] transition cursor-pointer"
                >
                  <X size={16} />
                </button>
              )}
              <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] text-xs font-mono text-[#8B8B87]">
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
                      className="w-full px-3 py-2.5 rounded-xl flex items-center justify-between text-left hover:bg-white/[0.06] transition group cursor-pointer border border-transparent hover:border-white/10"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/10 flex items-center justify-center text-[#AEB796] group-hover:text-[#D6DDA9] transition-colors">
                          <Icon size={16} />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-[#E8E8E5] group-hover:text-white transition-colors">
                            {item.title}
                          </div>
                          <div className="text-xs text-[#8B8B87] font-mono-tech">
                            {item.subtitle}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/[0.06] text-[#8B8B87]">
                        {item.type}
                      </span>
                    </button>
                  );
                })
              ) : (
                <div className="py-8 text-center text-[#8B8B87] text-xs font-mono">
                  {searchQuery ? "No matching stations, views, or regimes found." : "Type station name (e.g. Kolkata, Goa) or view name to jump immediately."}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-4 py-2 bg-black/40 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-[#8B8B87]">
              <span>Use &uarr; &darr; to navigate, Enter to select</span>
              <span>43 Synoptic Meteorological Hubs Indexed</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

}
