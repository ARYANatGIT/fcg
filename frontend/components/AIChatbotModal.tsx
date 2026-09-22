"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Bot,
  Sparkles,
  X,
  Send,
  Minimize2,
  Maximize2,
  RotateCcw,
  Activity,
  AlertTriangle,
  Wind,
  Droplets,
  CloudRain,
  ShieldCheck,
  ChevronRight,
  Info,
  ExternalLink,
  MessageSquare
} from "lucide-react";

interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
  city?: string;
  telemetry?: any;
  bustEvaluation?: any;
}

const QUICK_PROMPTS = [
  { label: "📍 Mumbai Live Risk", query: "What is the weather and bust risk in Mumbai?" },
  { label: "📍 New Delhi Status", query: "Check current weather and bust probability for New Delhi" },
  { label: "⚠️ Active Alerts", query: "What weather warnings and disruption bulletins are active?" },
  { label: "🌀 Baroclinic Eady Rate", query: "Explain the Baroclinic Eady growth rate and formula" },
  { label: "💧 Moisture Flux (MFC)", query: "What is Moisture Flux Convergence (MFC) and how does it detect busts?" },
  { label: "⚡ CAPE Instability", query: "Explain Convective Available Potential Energy (CAPE) thresholds" },
  { label: "🌨️ Western Disturbances", query: "What is a Western Disturbance and why do NWP models bust?" },
  { label: "🌀 Tropical Cyclones", query: "How do tropical cyclones form and why do intensity forecasts bust?" },
  { label: "🤖 Model Architecture", query: "Explain the LightGBM bust detection model architecture and accuracy" },
  { label: "🌐 ECMWF vs GFS", query: "Compare ECMWF IFS vs NOAA GFS numerical models" },
];

export default function AIChatbotModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputQuery, setInputQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Ephemeral browser session ID for temporary MongoDB storage
  const [sessionId, setSessionId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      let sid = sessionStorage.getItem("fg_chat_session_id");
      if (!sid) {
        sid = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        sessionStorage.setItem("fg_chat_session_id", sid);
      }
      return sid;
    }
    return `sess_${Date.now()}`;
  });

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-1",
      sender: "bot",
      text: `### 🌍 ForecastGuard Meteorological Assistant
Welcome to the **MoES / NCMRWF ForecastGuard Copilot**. 

I am continuously synchronized with:
* **43 Indian Synoptic Stations** (real-time telemetry & calibrated bust risks)
* **ECMWF IFS (9km) & NOAA GFS** multi-model numerical discrepancy feeds
* **Physical Atmospheric Diagnostics** (Baroclinic Eady rate, MFC, CAPE, and SSR)
* **Official IMD & MoES Disruption Bulletins**

Click any quick prompt below or ask any question about stations, bust detection, or atmospheric physics!`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Auto-delete session history when website or tab is closed
  useEffect(() => {
    if (!sessionId) return;

    const cleanupSession = () => {
      const deleteUrl = `/api/chat/session/delete?session_id=${encodeURIComponent(sessionId)}`;
      if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        navigator.sendBeacon(deleteUrl);
      } else {
        fetch(deleteUrl, { method: "POST", keepalive: true }).catch(() => null);
      }
    };

    window.addEventListener("beforeunload", cleanupSession);
    window.addEventListener("pagehide", cleanupSession);

    return () => {
      window.removeEventListener("beforeunload", cleanupSession);
      window.removeEventListener("pagehide", cleanupSession);
    };
  }, [sessionId]);

  // Load existing session history on mount if available
  useEffect(() => {
    if (!sessionId) return;
    fetch(`/api/chat/session?session_id=${encodeURIComponent(sessionId)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.messages && data.messages.length > 0) {
          const restored: ChatMessage[] = data.messages.map((m: any, i: number) => ({
            id: `restored-${i}`,
            sender: m.sender || "bot",
            text: m.text || "",
            timestamp: m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            city: m.city
          }));
          setMessages(restored);
        }
      })
      .catch(() => null);
  }, [sessionId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isMinimized]);

  // Focus input on modal open
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, isMinimized]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");
    setIsLoading(true);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "https://forecastguard-api.onrender.com";
      const headers = { 
        "Content-Type": "application/json",
        "x-frontend-client": "forecastguard-web",
      };
      let res = await fetch("/api/chat", {
        method: "POST",
        headers,
        body: JSON.stringify({ query, session_id: sessionId }),
      }).catch(() => null);

      if (!res || !res.ok) {
        res = await fetch(`${backendUrl}/api/chat`, {
          method: "POST",
          headers,
          body: JSON.stringify({ query, session_id: sessionId }),
        }).catch(() => null);
      }

      if (res && res.ok) {
        const data = await res.json();
        const botMsg: ChatMessage = {
          id: `bot-${Date.now()}`,
          sender: "bot",
          text: data.response || "No response received from meteorological engine.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          city: data.city,
          telemetry: data.telemetry,
          bustEvaluation: data.bust_evaluation
        };
        setMessages((prev) => [...prev, botMsg]);
      } else {
        throw new Error("Chat service unavailable");
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: "bot",
          text: "⚠️ **Connection Error:** Unable to reach ForecastGuard Chat service. Please verify that the backend API is running on port 8000.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    if (sessionId) {
      fetch(`/api/chat/session/delete?session_id=${encodeURIComponent(sessionId)}`, { method: "POST" }).catch(() => null);
    }
    const newSid = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    if (typeof window !== "undefined") {
      sessionStorage.setItem("fg_chat_session_id", newSid);
    }
    setSessionId(newSid);
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: "bot",
        text: "Chat session refreshed. How can I assist your meteorological analysis today?",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }
    ]);
  };

  // Custom lightweight markdown renderer
  const renderFormattedContent = (content: string) => {
    const lines = content.split("\n");
    return lines.map((line, idx) => {
      // Header 3
      if (line.startsWith("### ")) {
        return (
          <h3 key={idx} className="text-xs font-semibold text-[#E8E8E5] mt-2.5 mb-1.5 flex items-center gap-1.5 tracking-wide">
            {line.replace("### ", "")}
          </h3>
        );
      }
      // Header 4
      if (line.startsWith("#### ")) {
        return (
          <h4 key={idx} className="text-[11px] font-semibold text-[#D8D8D3] mt-2 mb-1 tracking-wide">
            {line.replace("#### ", "")}
          </h4>
        );
      }
      // Blockquote
      if (line.startsWith("> ")) {
        return (
          <blockquote key={idx} className="border-l-2 border-white/40 bg-white/[0.02] pl-3 py-1.5 text-xs text-[#92928C] my-1 rounded-r">
            {line.replace("> ", "")}
          </blockquote>
        );
      }
      // Bullet point
      if (line.startsWith("* ") || line.startsWith("- ")) {
        const bulletText = line.substring(2);
        return (
          <div key={idx} className="flex items-start gap-2 text-xs text-[#D8D8D3] my-0.5 pl-1 leading-relaxed">
            <span className="text-white shrink-0 mt-0.5">•</span>
            <div>{renderInlineFormatting(bulletText)}</div>
          </div>
        );
      }
      // Math equation block ($$...$$)
      if (line.startsWith("$$") && line.endsWith("$$")) {
        return (
          <div key={idx} className="my-2 p-2 bg-black/60 border border-white/10 rounded-lg text-center font-mono-tech text-xs text-white overflow-x-auto">
            {line.replace(/\$\$/g, "")}
          </div>
        );
      }
      // Empty line
      if (!line.trim()) {
        return <div key={idx} className="h-1.5" />;
      }
      // Regular paragraph
      return (
        <p key={idx} className="text-xs text-[#D8D8D3] leading-relaxed my-0.5">
          {renderInlineFormatting(line)}
        </p>
      );
    });
  };

  // Inline formatting for **bold**, `code`, and $math$
  const renderInlineFormatting = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|`.*?`|\$.*?\$)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i} className="text-[#E8E8E5] font-semibold">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code key={i} className="px-1 py-0.5 rounded bg-white/[0.06] text-[#E8E8E5] font-mono-tech text-xs border border-white/10">
            {part.slice(1, -1)}
          </code>
        );
      }
      if (part.startsWith("$") && part.endsWith("$")) {
        return (
          <span key={i} className="font-mono-tech text-white px-0.5 text-xs">
            {part.slice(1, -1)}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <>
      {/* 1. Floating Distinguished Pill in Bottom Right */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center">
          <button
            onClick={() => {
              setIsOpen(true);
              setIsMinimized(false);
            }}
            className="copilot-trigger group flex items-center gap-3.5 pl-4 pr-2 py-2 rounded-full bg-gradient-to-r from-white/[0.14] to-white/[0.06] hover:from-white/[0.22] hover:to-white/[0.12] border border-white/25 hover:border-white/50 text-white shadow-[0_14px_45px_rgba(0,0,0,0.65),0_0_24px_rgba(255,255,255,0.16)] hover:shadow-[0_18px_55px_rgba(0,0,0,0.75),0_0_32px_rgba(255,255,255,0.28)] backdrop-blur-2xl transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] cursor-pointer"
            title="Open ForecastGuard Meteorological AI Copilot"
            aria-label="Open ForecastGuard Copilot"
          >
            <div className="flex flex-col text-left">
              <span className="text-[11px] font-mono-tech tracking-widest font-bold uppercase text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                AI COPILOT
              </span>
              <span className="text-[10px] font-mono-tech text-[#A3A3A3] group-hover:text-white/80 transition-colors">
                Synoptic Intelligence
              </span>
            </div>

            <div className="copilot-icon w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-md shrink-0 transition-transform group-hover:rotate-12">
              <Bot size={20} className="text-black" />
            </div>
          </button>
        </div>
      )}

      {/* 2. Chatbot Dialog Modal */}
      {isOpen && (
        <div
          className={`fixed right-4 sm:right-6 bottom-4 sm:bottom-6 z-50 flex flex-col bg-[#0b0b0a]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_30px_80px_rgba(0,0,0,0.7)] transition-all duration-200 overflow-hidden ${
            isMinimized
              ? "w-[320px] h-[52px]"
              : "w-[94vw] sm:w-[440px] h-[620px] max-h-[85vh]"
          }`}
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-4 py-3 bg-white/[0.03] border-b border-white/[0.08] shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center text-white">
                  <Bot className="w-4 h-4" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-white border border-[#080808]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-semibold text-[#E8E8E5] font-mono-tech tracking-wider">
                    FORECASTGUARD COPILOT
                  </h3>
                  <span className="px-1.5 py-0.5 rounded-full text-xs font-mono-tech bg-white/[0.05] text-white border border-white/10">
                    AI RAG
                  </span>
                </div>
                {!isMinimized && (
                  <p className="text-xs text-[#92928C] font-mono-tech tracking-tight">
                    43 Synoptic Stations • IMD Sync • Physical Models
                  </p>
                )}
              </div>
            </div>

            {/* Header Controls */}
            <div className="flex items-center gap-1">
              {!isMinimized && (
                <button
                  onClick={clearChat}
                  className="p-1.5 text-[#92928C] hover:text-[#E8E8E5] rounded-full hover:bg-white/[0.06] transition cursor-pointer"
                  title="Clear Chat History"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 text-[#92928C] hover:text-[#E8E8E5] rounded-full hover:bg-white/[0.06] transition cursor-pointer"
                title={isMinimized ? "Expand" : "Minimize"}
              >
                {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-[#92928C] hover:text-rose-400 rounded-full hover:bg-white/[0.06] transition cursor-pointer"
                title="Close Assistant"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body & Messages Area (Visible when not minimized) */}
          {!isMinimized && (
            <>
              {/* Messages Scroll Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono-tech">
                {messages.map((msg) => {
                  const isUser = msg.sender === "user";
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs shadow-md ${
                          isUser
                            ? "bg-white/[0.09] border border-white/15 text-[#E8E8E5] rounded-br-sm font-sans"
                            : "bg-white/[0.03] border border-white/[0.08] text-[#D8D8D3] rounded-bl-sm font-sans"
                        }`}
                      >
                        {isUser ? (
                          <p className="leading-relaxed">{msg.text}</p>
                        ) : (
                          <div className="space-y-1">
                            {renderFormattedContent(msg.text)}
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-[#5E5E5B] mt-1 px-1 font-mono-tech">
                        {msg.timestamp}
                      </span>
                    </div>
                  );
                })}

                {/* Loading indicator */}
                {isLoading && (
                  <div className="flex items-center gap-2 bg-white/[0.04] border border-white/10 text-white text-xs px-3.5 py-2 rounded-2xl rounded-bl-sm max-w-[75%] font-mono-tech animate-pulse">
                    <Activity className="w-3.5 h-3.5 animate-spin text-white" />
                    <span>Querying MoES database & physics engine...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompt Chips */}
              <div className="px-3.5 py-2.5 bg-white/[0.02] border-t border-white/[0.06]">
                <div className="text-xs text-[#8B8B87] uppercase font-mono-tech tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-white" /> Suggested Meteorological Queries
                </div>
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {QUICK_PROMPTS.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(p.query)}
                      disabled={isLoading}
                      className="px-3 py-1 rounded-full bg-white/[0.03] hover:bg-white/[0.08] text-[#92928C] hover:text-[#E8E8E5] border border-white/[0.08] hover:border-white/20 text-xs font-mono-tech shrink-0 transition cursor-pointer"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Bar */}
              <div className="p-3 bg-white/[0.02] border-t border-white/[0.08] shrink-0">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputQuery}
                    onChange={(e) => setInputQuery(e.target.value)}
                    placeholder="Ask about stations, bust risk, physics..."
                    disabled={isLoading}
                    className="flex-1 bg-white/[0.04] border border-white/10 focus:border-white/40 rounded-full px-4 py-2 text-xs text-[#E8E8E5] placeholder-[#5E5E5B] focus:outline-none transition font-sans"
                  />
                  <button
                    type="submit"
                    disabled={!inputQuery.trim() || isLoading}
                    className="w-8 h-8 rounded-full bg-[#E8E8E4] hover:bg-white disabled:bg-white/[0.08] text-[#141414] disabled:text-[#5E5E5B] flex items-center justify-center transition cursor-pointer disabled:cursor-not-allowed shrink-0 shadow-md"
                    title="Send message"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
                <div className="text-[10px] text-[#5E5E5B] font-mono-tech text-center mt-2 tracking-tight">
                  MoES / NCMRWF ForecastGuard • Grounded in 43-station real-time telemetry
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}

