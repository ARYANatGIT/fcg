"use client";

import React, { useState } from "react";
import { Sliders, Cpu, Box, BarChart3, Check, ArrowRight, Sparkles, Terminal, Shield, RefreshCw } from "lucide-react";

export default function FeatureSections() {
  // Interactive Feature 1: Token Swatches
  const [selectedHue, setSelectedHue] = useState("violet");

  // Interactive Feature 2: Agent prompt simulation
  const [promptInput, setPromptInput] = useState("Add an accessible date-picker with keyboard navigation");
  const [isGenerating, setIsGenerating] = useState(false);

  // Interactive Feature 3: Component preview toggle
  const [activeTabFeature, setActiveTabFeature] = useState("metrics");

  const handleSimulateAgent = () => {
    setIsGenerating(true);
    setTimeout(() => setIsGenerating(false), 1200);
  };

  return (
    <section id="features" className="py-24 md:py-32 bg-[#090909] space-y-28 md:space-y-36">
      <div className="max-w-[1360px] mx-auto px-6 space-y-28 md:space-y-36">
        
        {/* ========================================================
            FEATURE 01: DESIGN SYSTEMS
            ======================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Text (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            <span className="text-[12px] font-mono text-[#6366f1] font-semibold tracking-wider uppercase block">
              01 — DESIGN SYSTEMS
            </span>
            <h3 className="text-[36px] sm:text-[48px] font-[600] tracking-[-0.035em] text-[#F5F5F5] leading-[1.05]">
              Give every interface a consistent visual language.
            </h3>
            <p className="text-[16px] text-[#8A8A8A] leading-relaxed">
              Design systems should be functional code, not static Figma files that get desynchronized on day two. Define spacing, typography, and contrast tokens once—consume them anywhere.
            </p>
            
            <div className="pt-2 flex items-center gap-4 text-[13px] font-mono text-[#8A8A8A]">
              <span className="flex items-center gap-1.5"><Check size={14} className="text-[#22c55e]" /> Pure CSS variables</span>
              <span className="flex items-center gap-1.5"><Check size={14} className="text-[#22c55e]" /> Strict type-safety</span>
            </div>
          </div>

          {/* Right Interactive Token Matrix (7 cols) */}
          <div className="lg:col-span-7 bg-[#111111] border border-white/[0.08] rounded-[14px] p-6 sm:p-8 shadow-xl">
            <div className="flex justify-between items-center pb-4 border-b border-white/[0.08] mb-6">
              <span className="text-[12px] font-mono text-[#8A8A8A]">tokens.theme.ts</span>
              <span className="text-[11px] font-mono text-[#6366f1] bg-[#6366f1]/10 px-2 py-0.5 rounded">LIVE PREVIEW</span>
            </div>

            <div className="space-y-6">
              {/* Color Swatches */}
              <div className="space-y-2.5">
                <span className="text-[12px] font-mono text-[#8A8A8A] uppercase">Accent Chromatic Palette:</span>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { id: "violet", name: "Electric Violet", color: "#8b5cf6" },
                    { id: "cyan", name: "Signal Cyan", color: "#38bdf8" },
                    { id: "lime", name: "Acid Lime", color: "#e4f222" },
                    { id: "mono", name: "Pure Paper", color: "#F5F5F5" }
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedHue(s.id)}
                      className={`p-3 rounded-[8px] border text-left transition cursor-pointer ${
                        selectedHue === s.id ? "border-white bg-white/[0.08]" : "border-white/[0.08] bg-[#151515]"
                      }`}
                    >
                      <div className="w-5 h-5 rounded-full mb-2" style={{ backgroundColor: s.color }} />
                      <div className="text-[12px] font-mono font-semibold text-white truncate">{s.name}</div>
                      <div className="text-[10px] font-mono text-[#8A8A8A]">{s.color}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sample Rendered Badge & Alert */}
              <div className="p-4 rounded-[10px] bg-[#090909] border border-white/[0.08] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor:
                        selectedHue === "violet" ? "#8b5cf6" :
                        selectedHue === "cyan" ? "#38bdf8" :
                        selectedHue === "lime" ? "#e4f222" : "#F5F5F5"
                    }}
                  />
                  <span className="text-[13px] font-mono text-white">Dynamic accent token rendered cleanly</span>
                </div>
                <span className="px-2.5 py-1 rounded bg-white/[0.06] text-[11px] font-mono text-[#8A8A8A]">
                  var(--color-accent)
                </span>
              </div>
            </div>
          </div>
        </div>


        {/* ========================================================
            FEATURE 02: AI WORKFLOWS
            ======================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Interactive Prompt Sandbox (7 cols, swapped) */}
          <div className="lg:col-span-7 order-2 lg:order-1 bg-[#111111] border border-white/[0.08] rounded-[14px] p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-white/[0.08]">
              <span className="text-[12px] font-mono text-[#8A8A8A] flex items-center gap-2">
                <Terminal size={14} className="text-[#6366f1]" /> agent.prompt.md
              </span>
              <span className="text-[11px] font-mono text-[#22c55e]">CONNECTED TO CURSOR / CLAUDE</span>
            </div>

            <div className="space-y-3">
              <label className="text-[12px] font-mono text-[#8A8A8A] block">Prompt sent to coding model:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  className="flex-1 h-11 bg-[#090909] border border-white/[0.12] rounded-[8px] px-3.5 text-[13px] font-mono text-white focus:outline-none focus:border-[#6366f1]"
                />
                <button
                  onClick={handleSimulateAgent}
                  className="h-11 px-4 bg-[#F5F5F5] text-black font-semibold text-[13px] rounded-[8px] hover:bg-white transition cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  {isGenerating ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  <span>Compile</span>
                </button>
              </div>
            </div>

            {/* Generated Code Output Box */}
            <div className="p-4 rounded-[10px] bg-[#090909] border border-white/[0.08] space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono text-[#8A8A8A]">
                <span>AGENT COMPILED TSX:</span>
                <span className="text-[#22c55e]">0 LINT ERRORS</span>
              </div>
              <pre className="text-[12px] font-mono text-[#cbd5e1] leading-relaxed overflow-x-auto">
                <code>{`// Injected system rules ensure accessible semantic HTML
export function AccessibleDatePicker() {
  return <DatePicker aria-label="Select Target Date" format="YYYY-MM-DD" />;
}`}</code>
              </pre>
            </div>
          </div>

          {/* Right Text (5 cols) */}
          <div className="lg:col-span-5 order-1 lg:order-2 space-y-5">
            <span className="text-[12px] font-mono text-[#6366f1] font-semibold tracking-wider uppercase block">
              02 — AI WORKFLOWS
            </span>
            <h3 className="text-[36px] sm:text-[48px] font-[600] tracking-[-0.035em] text-[#F5F5F5] leading-[1.05]">
              Turn design decisions into reusable instructions for your agent.
            </h3>
            <p className="text-[16px] text-[#8A8A8A] leading-relaxed">
              When an AI agent writes UI, it usually falls back to generic, bloated Tailwind templates. INTENT.UI injects system prompts and design tokens into Cursor, Copilot, and Claude so generated code matches your exact design system automatically.
            </p>
          </div>
        </div>


        {/* ========================================================
            FEATURE 03: COMPONENTS
            ======================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Text (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            <span className="text-[12px] font-mono text-[#6366f1] font-semibold tracking-wider uppercase block">
              03 — COMPONENTS
            </span>
            <h3 className="text-[36px] sm:text-[48px] font-[600] tracking-[-0.035em] text-[#F5F5F5] leading-[1.05]">
              Build polished interfaces from a flexible component library.
            </h3>
            <p className="text-[16px] text-[#8A8A8A] leading-relaxed">
              Over 40 copy-paste components constructed with zero unnecessary dependencies. Fully accessible with WAI-ARIA conformance, dark-mode substrate, and keyboard navigation out of the box.
            </p>
          </div>

          {/* Right Interactive Component Showcase (7 cols) */}
          <div className="lg:col-span-7 bg-[#111111] border border-white/[0.08] rounded-[14px] p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-white/[0.08]">
              <span className="text-[12px] font-mono text-[#8A8A8A]">Interactive UI Primitives</span>
              <div className="flex gap-1">
                {["metrics", "dialog", "status"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTabFeature(tab)}
                    className={`px-3 py-1 rounded text-[11px] font-mono transition cursor-pointer ${
                      activeTabFeature === tab ? "bg-white text-black font-semibold" : "text-[#8A8A8A] hover:text-white"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Rendered Primitive Card */}
            {activeTabFeature === "metrics" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-[10px] bg-[#090909] border border-white/[0.08] space-y-2">
                  <span className="text-[11px] font-mono text-[#8A8A8A] uppercase">Active Users</span>
                  <div className="text-[28px] font-bold text-white tracking-tight">24,819</div>
                  <span className="text-[11px] font-mono text-[#22c55e]">+18.4% from last cycle</span>
                </div>
                <div className="p-4 rounded-[10px] bg-[#090909] border border-white/[0.08] space-y-2">
                  <span className="text-[11px] font-mono text-[#8A8A8A] uppercase">Avg Latency</span>
                  <div className="text-[28px] font-bold text-white tracking-tight">14.2ms</div>
                  <span className="text-[11px] font-mono text-[#6366f1]">Edge compute valid</span>
                </div>
              </div>
            )}

            {activeTabFeature === "dialog" && (
              <div className="p-6 rounded-[10px] bg-[#090909] border border-white/[0.08] space-y-4">
                <h4 className="text-[16px] font-semibold text-white">Confirm Production Deployment</h4>
                <p className="text-[13px] text-[#8A8A8A]">Are you sure you want to push component registry changes to your distributed edge CDN?</p>
                <div className="flex justify-end gap-2 pt-2">
                  <button className="h-9 px-3 rounded text-[12px] font-mono text-[#8A8A8A] hover:text-white">Cancel</button>
                  <button className="h-9 px-4 rounded bg-[#F5F5F5] text-black text-[12px] font-mono font-bold hover:bg-white">Confirm</button>
                </div>
              </div>
            )}

            {activeTabFeature === "status" && (
              <div className="space-y-3">
                {[
                  { label: "Design Token Compiler", status: "Operational", color: "#22c55e" },
                  { label: "LLM Agent Prompt Registry", status: "Operational", color: "#22c55e" },
                  { label: "Component Synchronization", status: "Active (0ms delay)", color: "#6366f1" }
                ].map((s, i) => (
                  <div key={i} className="p-3 rounded-[8px] bg-[#090909] border border-white/[0.08] flex items-center justify-between text-[13px] font-mono">
                    <span className="text-white">{s.label}</span>
                    <span className="flex items-center gap-1.5 text-[12px]" style={{ color: s.color }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }} />
                      {s.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>


        {/* ========================================================
            FEATURE 04: ANALYTICS & TELEMETRY
            ======================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Visual (7 cols, swapped) */}
          <div className="lg:col-span-7 order-2 lg:order-1 bg-[#111111] border border-white/[0.08] rounded-[14px] p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-white/[0.08]">
              <span className="text-[12px] font-mono text-[#8A8A8A] flex items-center gap-2">
                <BarChart3 size={14} className="text-[#6366f1]" /> telemetry.telemetry_stream
              </span>
              <span className="text-[11px] font-mono text-[#22c55e]">REAL-TIME AUDIT</span>
            </div>

            {/* Sparkline & Event Log */}
            <div className="space-y-3">
              <div className="p-4 rounded-[10px] bg-[#090909] border border-white/[0.08] flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-mono text-[#8A8A8A] uppercase">Component Render Time</span>
                  <div className="text-[24px] font-bold text-white font-mono">0.84ms</div>
                </div>
                <span className="px-2.5 py-1 rounded bg-[#22c55e]/15 text-[#22c55e] text-[12px] font-mono font-bold">
                  99.9% 60 FPS
                </span>
              </div>

              <div className="p-3 rounded-[8px] bg-[#090909] border border-white/[0.06] text-[12px] font-mono text-[#8A8A8A] flex justify-between">
                <span>EVENT: Button clicked (id: action_deploy)</span>
                <span className="text-white">12:04:18.420</span>
              </div>
            </div>
          </div>

          {/* Right Text (5 cols) */}
          <div className="lg:col-span-5 order-1 lg:order-2 space-y-5">
            <span className="text-[12px] font-mono text-[#6366f1] font-semibold tracking-wider uppercase block">
              04 — ANALYTICS
            </span>
            <h3 className="text-[36px] sm:text-[48px] font-[600] tracking-[-0.035em] text-[#F5F5F5] leading-[1.05]">
              Understand how users interact with what you build.
            </h3>
            <p className="text-[16px] text-[#8A8A8A] leading-relaxed">
              Automatic instrumentation for interactions, accessibility focus traps, and render latency. Monitor layout shifts and component usage across your entire production application.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}

