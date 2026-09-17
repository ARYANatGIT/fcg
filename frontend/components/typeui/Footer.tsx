"use client";

import React from "react";
import Link from "next/link";
import { ArrowUp, Activity } from "lucide-react";

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="bg-[#070709] border-t border-white/[0.08] pt-16 pb-12 text-[#8A8A8A]">
      <div className="max-w-[1360px] mx-auto px-6 space-y-16">
        
        {/* Main Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          
          {/* Brand Column (2 cols on lg) */}
          <div className="lg:col-span-2 space-y-5">
            <div className="flex items-center gap-2">
              <span className="text-[17px] font-mono font-bold tracking-tight text-[#F5F5F5]">
                INTENT<span className="text-[#8b5cf6]">.UI</span>
              </span>
              <span className="text-[10px] font-mono text-[#8A8A8A] border border-white/[0.1] px-1.5 py-0.5 rounded">
                v2.4
              </span>
            </div>

            <p className="text-[14px] text-[#8A8A8A] leading-relaxed max-w-sm">
              A precision design system and UI engine built for developers, founders, and modern software teams. Zero bloat, pure code ownership.
            </p>

            {/* System Status Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#111114] border border-white/[0.08] text-[12px] font-mono text-[#cccccc]">
              <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
              <span>Operational: 99.99% Uptime</span>
            </div>
          </div>

          {/* Column 1: Architecture */}
          <div className="space-y-4">
            <h5 className="text-[12px] font-mono font-semibold uppercase tracking-wider text-[#F5F5F5]">
              Architecture
            </h5>
            <ul className="space-y-2.5 text-[13px] font-mono">
              <li>
                <a href="#hero" className="hover:text-[#F5F5F5] transition-colors">Design Tokens</a>
              </li>
              <li>
                <a href="#showcase" className="hover:text-[#F5F5F5] transition-colors">Studio Canvas</a>
              </li>
              <li>
                <a href="#features" className="hover:text-[#F5F5F5] transition-colors">AI Compiler</a>
              </li>
              <li>
                <a href="#code" className="hover:text-[#F5F5F5] transition-colors">CSS Variables</a>
              </li>
              <li>
                <a href="#code" className="hover:text-[#F5F5F5] transition-colors">Theme Schema</a>
              </li>
            </ul>
          </div>

          {/* Column 2: Components */}
          <div className="space-y-4">
            <h5 className="text-[12px] font-mono font-semibold uppercase tracking-wider text-[#F5F5F5]">
              Components
            </h5>
            <ul className="space-y-2.5 text-[13px] font-mono">
              <li>
                <a href="#gallery" className="hover:text-[#F5F5F5] transition-colors">Precision Buttons</a>
              </li>
              <li>
                <a href="#gallery" className="hover:text-[#F5F5F5] transition-colors">Command Inputs</a>
              </li>
              <li>
                <a href="#gallery" className="hover:text-[#F5F5F5] transition-colors">Haptic Switches</a>
              </li>
              <li>
                <a href="#gallery" className="hover:text-[#F5F5F5] transition-colors">Telemetry Cards</a>
              </li>
              <li>
                <a href="#gallery" className="hover:text-[#F5F5F5] transition-colors">Segmented Controls</a>
              </li>
            </ul>
          </div>

          {/* Column 3: Operational Cockpit */}
          <div className="space-y-4">
            <h5 className="text-[12px] font-mono font-semibold uppercase tracking-wider text-[#F5F5F5]">
              Applications
            </h5>
            <ul className="space-y-2.5 text-[13px] font-mono">
              <li>
                <Link href="/cockpit" className="text-[#10b981] hover:underline flex items-center gap-1.5">
                  <Activity size={12} /> ForecastGuard AI
                </Link>
              </li>
              <li>
                <span className="text-[#666666]">Problem ID: 26079</span>
              </li>
              <li>
                <span className="text-[#666666]">MoES / NCMRWF Specs</span>
              </li>
              <li>
                <a href="#pricing" className="hover:text-[#F5F5F5] transition-colors">Pricing & Plans</a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-[12px] font-mono text-[#666666]">
          <div>
            © 2026 INTENT.UI Systems Inc. MIT Licensed Primitives.
          </div>

          <div className="flex items-center gap-6">
            <span className="hover:text-[#8A8A8A] cursor-pointer">Privacy</span>
            <span className="hover:text-[#8A8A8A] cursor-pointer">Terms</span>
            <span className="hover:text-[#8A8A8A] cursor-pointer">Security</span>
            
            <button
              onClick={scrollToTop}
              className="flex items-center gap-1 text-[#8A8A8A] hover:text-[#F5F5F5] transition-colors ml-2"
              title="Back to top"
            >
              <span>Top</span>
              <ArrowUp size={13} />
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
}
