"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Terminal, Copy, Check, ArrowRight, Sparkles, Activity } from "lucide-react";

export default function FinalCTA() {
  const [copied, setCopied] = useState(false);
  const command = "npx intent-ui@latest init";

  const handleCopy = () => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="py-28 md:py-36 bg-[#090909] border-t border-white/[0.08] relative overflow-hidden">
      {/* Background Radial Light */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#8b5cf6]/10 rounded-full blur-[140px] pointer-events-none"
      />

      <div className="max-w-[1100px] mx-auto px-6 text-center space-y-8 relative z-10">
        
        {/* Monospace Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#151518] border border-white/[0.1] text-[12px] font-mono text-[#8b5cf6]">
          <Sparkles size={13} />
          <span>START IN 60 SECONDS</span>
        </div>

        {/* Dramatic Headline */}
        <h2 className="text-[40px] sm:text-[62px] font-[650] tracking-[-0.04em] text-[#F5F5F5] leading-[1.03] max-w-4xl mx-auto">
          Your interface shouldn&apos;t look generated.
        </h2>

        <p className="text-[17px] sm:text-[19px] text-[#8A8A8A] max-w-2xl mx-auto leading-relaxed">
          Build software that communicates precision, intentionality, and speed from the very first commit.
        </p>

        {/* Interactive CLI Terminal Pill */}
        <div className="max-w-md mx-auto pt-2">
          <div className="flex items-center justify-between bg-[#111114] border border-white/[0.14] hover:border-white/[0.3] rounded-[10px] p-2 pl-4 transition-all shadow-xl group">
            <div className="flex items-center gap-3 font-mono text-[13px] text-[#F5F5F5] overflow-hidden">
              <span className="text-[#8b5cf6]">$</span>
              <span className="truncate">{command}</span>
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-[12px] font-mono px-3 py-1.5 rounded-[6px] bg-[#1c1c22] border border-white/[0.08] text-[#8A8A8A] group-hover:text-[#F5F5F5] hover:border-white/[0.2] transition-all"
              title="Copy to clipboard"
            >
              {copied ? (
                <>
                  <Check size={13} className="text-[#10b981]" />
                  <span className="text-[#10b981]">Copied</span>
                </>
              ) : (
                <>
                  <Copy size={13} />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <a
            href="#gallery"
            className="px-6 py-3 rounded-[8px] bg-[#F5F5F5] text-[#090909] hover:bg-white text-[14px] font-mono font-medium transition-all flex items-center gap-2 shadow-lg shadow-white/5 active:scale-[0.98]"
          >
            <span>Explore Component Catalog</span>
            <ArrowRight size={15} />
          </a>

          <Link
            href="/cockpit"
            className="px-6 py-3 rounded-[8px] bg-[#151518] border border-white/[0.12] hover:border-white/[0.25] text-[#F5F5F5] text-[14px] font-mono transition-all flex items-center gap-2 active:scale-[0.98]"
          >
            <Activity size={15} className="text-[#10b981]" />
            <span>Launch Operational Cockpit</span>
          </Link>
        </div>

        {/* Secondary Subtext */}
        <div className="pt-6 text-[12px] font-mono text-[#666666] flex items-center justify-center gap-6">
          <span>Pure React & Tailwind v4</span>
          <span>•</span>
          <span>Zero Runtime Dependencies</span>
          <span>•</span>
          <span>MIT Licensed Primitives</span>
        </div>

      </div>
    </section>
  );
}
