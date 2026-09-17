"use client";

import React, { useState } from "react";
import { ArrowRight, Sparkles, Command, Check, Copy, Sliders, Layers, MousePointer } from "lucide-react";

export default function HeroSection() {
  const [activeToken, setActiveToken] = useState("radius");
  const [copied, setCopied] = useState(false);
  const [sliderValue, setSliderValue] = useState(8);

  const handleCopyInstall = () => {
    navigator.clipboard.writeText("npx intent-ui@latest init");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="relative pt-24 pb-20 md:pt-32 md:pb-28 overflow-hidden bg-[#090909]">
      {/* Subtle Abstract Grid Background */}
      <div className="absolute inset-0 typeui-grid-bg opacity-70 pointer-events-none" />
      
      {/* Radial ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#6366f1]/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative max-w-[1360px] mx-auto px-6">
        
        {/* Eyebrow Label */}
        <div className="flex items-center gap-2 mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#151515] border border-white/[0.1] text-[12px] font-mono text-[#8A8A8A]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#6366f1] animate-pulse" />
            <span className="text-[#F5F5F5] font-semibold">AI DESIGN SYSTEM FOR DEVELOPERS</span>
            <span className="text-white/[0.2]">—</span>
            <span>v2.4 RELEASE</span>
          </div>
        </div>

        {/* Huge Multi-Line Editorial Headline */}
        <h1 className="text-[52px] sm:text-[76px] lg:text-[104px] font-[600] tracking-[-0.04em] text-[#F5F5F5] leading-[0.95] max-w-5xl mb-8 selection:bg-white selection:text-black">
          Build interfaces <br />
          that feel <br />
          <span className="text-white/40 italic font-serif font-normal">intentional.</span>
        </h1>

        {/* Supporting Copy & CTAs Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end mb-16">
          <div className="lg:col-span-7">
            <p className="text-[18px] sm:text-[21px] text-[#8A8A8A] font-normal leading-relaxed max-w-2xl">
              Give your AI coding workflow a powerful visual language with reusable components, design systems, and intelligent UI tools.
            </p>
          </div>

          <div className="lg:col-span-5 flex flex-wrap items-center lg:justify-end gap-3.5">
            {/* Primary CTA */}
            <a
              href="#pricing"
              className="h-12 px-6 rounded-[8px] bg-[#F5F5F5] text-[#090909] text-[15px] font-[550] tracking-tight hover:bg-white transition-all flex items-center gap-2 shadow-sm group cursor-pointer"
            >
              <span>Start building</span>
              <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
            </a>

            {/* Secondary CTA */}
            <a
              href="#components"
              className="h-12 px-6 rounded-[8px] bg-[#151515] border border-white/[0.1] text-[#F5F5F5] text-[15px] font-medium tracking-tight hover:bg-white/[0.06] hover:border-white/[0.2] transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Explore components</span>
            </a>
          </div>
        </div>

        {/* Interactive CLI Install Pill */}
        <div className="flex items-center gap-3 pt-2 pb-8 border-t border-white/[0.08]">
          <div className="flex items-center gap-2 text-[13px] font-mono text-[#8A8A8A]">
            <span className="text-[#6366f1] font-bold">$</span>
            <span className="text-[#F5F5F5]">npx intent-ui@latest init</span>
          </div>

          <button
            onClick={handleCopyInstall}
            className="px-2.5 py-1 rounded-[4px] bg-white/[0.04] hover:bg-white/[0.08] text-[11px] font-mono text-[#8A8A8A] hover:text-white transition cursor-pointer flex items-center gap-1.5"
            title="Copy install command"
          >
            {copied ? <Check size={12} className="text-[#22c55e]" /> : <Copy size={12} />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
        </div>

        {/* Understated Interactive Hero Visual: Live Precision Token Playground */}
        <div className="w-full bg-[#111111] border border-white/[0.08] rounded-[14px] p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          {/* Subtle Corner Badge */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-red-500/60" />
              <span className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <span className="w-3 h-3 rounded-full bg-green-500/60" />
              <span className="text-[12px] font-mono text-[#8A8A8A] ml-2">intent.config.ts — Dynamic Token Inspector</span>
            </div>

            <div className="flex items-center gap-2 text-[12px] font-mono text-[#8A8A8A]">
              <span className="text-[#6366f1]">●</span>
              <span>SYNCHRONIZED WITH AGENT RUNTIME</span>
            </div>
          </div>

          {/* Interactive Token Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6 items-center">
            
            {/* Left Controls (5 cols) */}
            <div className="lg:col-span-5 space-y-5">
              <div className="space-y-2">
                <div className="flex justify-between text-[13px] font-mono">
                  <span className="text-[#8A8A8A]">token: border-radius</span>
                  <span className="text-[#F5F5F5] font-bold">{sliderValue}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="24"
                  value={sliderValue}
                  onChange={(e) => setSliderValue(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {["radius", "stroke", "contrast", "elevation"].map((token) => (
                  <button
                    key={token}
                    onClick={() => setActiveToken(token)}
                    className={`px-3 py-1.5 rounded-[6px] text-[12px] font-mono transition cursor-pointer ${
                      activeToken === token
                        ? "bg-white/[0.12] text-white border border-white/[0.2]"
                        : "bg-white/[0.02] text-[#8A8A8A] border border-white/[0.06] hover:text-white"
                    }`}
                  >
                    ${token}
                  </button>
                ))}
              </div>
            </div>

            {/* Right Live Visual Card Preview (7 cols) */}
            <div className="lg:col-span-7 bg-[#090909] border border-white/[0.08] p-6 flex flex-col sm:flex-row items-center justify-between gap-6" style={{ borderRadius: `${sliderValue}px` }}>
              <div className="space-y-1.5">
                <div className="inline-block px-2 py-0.5 rounded-[4px] bg-[#6366f1]/15 border border-[#6366f1]/30 text-[#6366f1] text-[11px] font-mono font-semibold">
                  ACTIVE PREVIEW
                </div>
                <h4 className="text-[17px] font-[600] text-[#F5F5F5]">Command Palette Action</h4>
                <p className="text-[13px] text-[#8A8A8A]">Adaptive typography with calculated contrast ratios.</p>
              </div>

              <button
                className="h-10 px-4 bg-[#F5F5F5] text-[#090909] font-medium text-[13px] transition hover:bg-white cursor-pointer shrink-0"
                style={{ borderRadius: `${Math.max(4, sliderValue - 2)}px` }}
              >
                Trigger Execution
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
