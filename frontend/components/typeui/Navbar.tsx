"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, Terminal, Sparkles, Menu, X } from "lucide-react";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#090909]/85 backdrop-blur-md">
      <div className="max-w-[1360px] mx-auto px-6 h-16 flex items-center justify-between">
        
        {/* Brand Logo / Wordmark */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded-[6px] bg-[#151515] border border-white/[0.12] flex items-center justify-center text-white group-hover:border-[#6366f1] transition-colors">
              <span className="font-mono text-[13px] font-bold tracking-tighter">I/</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[16px] font-[600] tracking-[-0.03em] text-[#F5F5F5]">
                INTENT.UI
              </span>
              <span className="hidden sm:inline-block px-1.5 py-0.5 rounded-[4px] bg-white/[0.05] border border-white/[0.08] text-[10px] font-mono text-[#8A8A8A]">
                BETA
              </span>
            </div>
          </Link>
        </div>

        {/* Center / Nav Links */}
        <nav className="hidden md:flex items-center gap-8 text-[14px] text-[#8A8A8A] font-medium tracking-tight">
          <a href="#product" className="hover:text-[#F5F5F5] transition-colors">
            Product
          </a>
          <a href="#features" className="hover:text-[#F5F5F5] transition-colors">
            Features
          </a>
          <a href="#components" className="hover:text-[#F5F5F5] transition-colors">
            Components
          </a>
          <a href="#code" className="hover:text-[#F5F5F5] transition-colors">
            Code
          </a>
          <a href="#pricing" className="hover:text-[#F5F5F5] transition-colors">
            Pricing
          </a>
          <Link href="/cockpit" className="text-[#38bdf8] hover:text-white transition-colors flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8] animate-pulse" />
            <span>Operational App</span>
          </Link>
        </nav>

        {/* Actions */}
        <div className="hidden sm:flex items-center gap-4">
          <button className="text-[14px] text-[#8A8A8A] hover:text-[#F5F5F5] transition-colors font-medium cursor-pointer">
            Log in
          </button>
          
          <a
            href="#pricing"
            className="h-9 px-4 rounded-[6px] bg-[#F5F5F5] text-[#090909] text-[13px] font-[550] tracking-tight hover:bg-white transition-all duration-150 flex items-center gap-1.5 shadow-sm group cursor-pointer"
          >
            <span>Start building</span>
            <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
          </a>
        </div>

        {/* Mobile Hamburger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-[6px] text-[#8A8A8A] hover:text-white hover:bg-white/[0.05]"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-white/[0.08] bg-[#0d0d0d] px-6 py-5 space-y-4">
          <div className="flex flex-col gap-3 text-[15px] text-[#8A8A8A]">
            <a href="#product" onClick={() => setMobileMenuOpen(false)} className="hover:text-white py-1">Product</a>
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="hover:text-white py-1">Features</a>
            <a href="#components" onClick={() => setMobileMenuOpen(false)} className="hover:text-white py-1">Components</a>
            <a href="#code" onClick={() => setMobileMenuOpen(false)} className="hover:text-white py-1">Code</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="hover:text-white py-1">Pricing</a>
            <Link href="/cockpit" onClick={() => setMobileMenuOpen(false)} className="text-[#38bdf8] py-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#38bdf8]" />
              <span>Operational App (ForecastGuard AI)</span>
            </Link>
          </div>
          <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between">
            <button className="text-[14px] text-[#8A8A8A] hover:text-white">Log in</button>
            <a href="#pricing" className="h-9 px-4 rounded-[6px] bg-[#F5F5F5] text-[#090909] text-[13px] font-[550] flex items-center gap-1.5">
              Start building
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
