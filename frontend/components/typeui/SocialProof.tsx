"use client";

import React from "react";
import { Star, GitFork, Check, Quote, ArrowUpRight } from "lucide-react";

export default function SocialProof() {
  const metrics = [
    { label: "Weekly Downloads", value: "4.8M+", detail: "via npm registry" },
    { label: "Runtime Footprint", value: "< 1.2 kB", detail: "zero global CSS bloat" },
    { label: "Accessibility Score", value: "100%", detail: "WCAG AAA automated pass" },
    { label: "Production Apps", value: "24,000+", detail: "deployed across 90+ countries" },
  ];

  const wordmarks = [
    { name: "VERCEL", style: "tracking-[0.25em]" },
    { name: "LINEAR", style: "tracking-[0.3em]" },
    { name: "SUPABASE", style: "tracking-[0.2em]" },
    { name: "RAYCAST", style: "tracking-[0.22em]" },
    { name: "RESEND", style: "tracking-[0.25em]" },
    { name: "RAILWAY", style: "tracking-[0.2em]" },
  ];

  const testimonials = [
    {
      quote: "Intent.UI gave our engineering org the speed of standard primitives with the visual maturity and hairline precision of an elite design studio.",
      author: "Elena Rostova",
      role: "VP of Product Engineering",
      team: "HyperScale Cloud",
    },
    {
      quote: "The typography hierarchy and zero-compromise contrast scale immediately made our developer tools feel precision-machined.",
      author: "Marcus Chen",
      role: "Staff Infrastructure Engineer",
      team: "VectorPulse AI",
    },
    {
      quote: "No runtime lock-in. We copied the tokens into our monorepo and shipped our core dashboard 3 weeks ahead of schedule.",
      author: "Sarah Jenkins",
      role: "Design Systems Lead",
      team: "Aura Robotics",
    },
  ];

  return (
    <section className="py-20 md:py-28 bg-[#090909] border-t border-white/[0.08]">
      <div className="max-w-[1360px] mx-auto px-6 space-y-20">
        
        {/* GitHub & Open Source Status Pill */}
        <div className="flex flex-col items-center text-center space-y-4">
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-[#111114] border border-white/[0.12] hover:border-white/[0.25] transition-all group"
          >
            <span className="flex items-center gap-1.5 text-[12px] font-mono text-[#F5F5F5]">
              <Star size={13} className="text-[#eab308] fill-[#eab308]" /> 14,820 Stars
            </span>
            <span className="w-1 h-1 rounded-full bg-[#333333]" />
            <span className="flex items-center gap-1.5 text-[12px] font-mono text-[#8A8A8A]">
              <GitFork size={13} /> 1,240 Forks
            </span>
            <span className="w-1 h-1 rounded-full bg-[#333333]" />
            <span className="text-[11px] font-mono text-[#8b5cf6] font-medium flex items-center gap-0.5 group-hover:underline">
              v2.4.0 Release <ArrowUpRight size={11} />
            </span>
          </a>

          <h3 className="text-[20px] sm:text-[24px] font-[500] tracking-[-0.02em] text-[#8A8A8A] max-w-xl">
            Trusted by founders, design engineers, and infrastructure teams worldwide.
          </h3>
        </div>

        {/* Wordmarks Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6 items-center justify-items-center py-4 border-y border-white/[0.06]">
          {wordmarks.map((brand) => (
            <div
              key={brand.name}
              className={`font-mono text-[13px] font-bold text-[#555555] hover:text-[#F5F5F5] transition-colors cursor-default select-none ${brand.style}`}
            >
              {brand.name}
            </div>
          ))}
        </div>

        {/* Hard Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((m) => (
            <div
              key={m.label}
              className="bg-[#111114] border border-white/[0.08] rounded-[12px] p-6 space-y-2 hover:border-white/[0.18] transition-colors"
            >
              <span className="text-[12px] font-mono text-[#8A8A8A] uppercase tracking-wider block">
                {m.label}
              </span>
              <div className="text-[32px] sm:text-[38px] font-bold font-mono tracking-tight text-[#F5F5F5]">
                {m.value}
              </div>
              <p className="text-[12px] font-mono text-[#666666]">
                {m.detail}
              </p>
            </div>
          ))}
        </div>

        {/* Editorial Testimonials */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="bg-[#111114] border border-white/[0.08] rounded-[14px] p-6 sm:p-7 flex flex-col justify-between space-y-6 hover:border-white/[0.18] transition-colors"
            >
              <div className="space-y-4">
                <Quote size={20} className="text-[#8b5cf6]/60" />
                <p className="text-[15px] text-[#cccccc] leading-relaxed">
                  "{t.quote}"
                </p>
              </div>

              <div className="pt-4 border-t border-white/[0.06] space-y-1">
                <div className="text-[14px] font-medium text-[#F5F5F5]">
                  {t.author}
                </div>
                <div className="text-[12px] font-mono text-[#8A8A8A]">
                  {t.role} · <span className="text-[#8b5cf6]">{t.team}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

