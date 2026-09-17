"use client";

import React, { useState } from "react";
import { Check, Sparkles, ArrowRight, ShieldCheck, HelpCircle } from "lucide-react";

export default function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(true);

  const plans = [
    {
      name: "Community",
      badge: "Open Source",
      description: "For individual hackers and indie makers building modern interfaces.",
      priceMonthly: 0,
      priceAnnual: 0,
      features: [
        "48+ core React & Tailwind components",
        "Full CLI code ownership (no lock-in)",
        "CSS token system with dark-mode defaults",
        "Community Discord & GitHub discussions",
        "Unlimited public & personal projects",
      ],
      cta: "Get Started Free",
      ctaVariant: "outline",
      popular: false,
    },
    {
      name: "Pro Developer",
      badge: "Recommended",
      description: "For professional engineers and founders shipping commercial SaaS.",
      priceMonthly: 19,
      priceAnnual: 15,
      features: [
        "Everything in Community",
        "AI Component Engine (unlimited prompts)",
        "Design Token Studio sync & visual editor",
        "Advanced data visualization & telemetry charts",
        "Private NPM registry access",
        "Priority GitHub issue triage",
      ],
      cta: "Start 14-Day Free Trial",
      ctaVariant: "accent",
      popular: true,
    },
    {
      name: "Team Studio",
      badge: "Enterprise",
      description: "For design system squads needing team synchronization and SLA.",
      priceMonthly: 49,
      priceAnnual: 39,
      features: [
        "Everything in Pro Developer",
        "Multi-repository monorepo synchronization",
        "Custom token exporter for React Native & Flutter",
        "SAML SSO & role-based team permissions",
        "Automated accessibility CI/CD regression testing",
        "Dedicated Slack channel & 99.99% SLA",
      ],
      cta: "Book Team Demo",
      ctaVariant: "outline",
      popular: false,
    },
  ];

  const faqs = [
    {
      q: "Do I own the code once I install components?",
      a: "Yes. All components copy directly into your repository. There is zero runtime dependency on external servers or subscription locks for your deployed code.",
    },
    {
      q: "Can I use Intent.UI in commercial client work?",
      a: "Absolutely. You can use all generated primitives and components across client deliverables, proprietary SaaS applications, and enterprise products.",
    },
    {
      q: "How does the AI Component Engine work?",
      a: "It's a specialized fine-tuned agent that strictly enforces your local design token constraints, contrast ratios, and accessible keyboard semantics when generating new UI.",
    },
  ];

  return (
    <section id="pricing" className="py-24 md:py-32 bg-[#090909] border-t border-white/[0.08]">
      <div className="max-w-[1360px] mx-auto px-6">
        
        {/* Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto mb-14">
          <span className="text-[12px] font-mono text-[#8b5cf6] font-semibold tracking-wider uppercase block">
            TRANSPARENT PRICING
          </span>
          <h2 className="text-[34px] sm:text-[48px] font-[600] tracking-[-0.035em] text-[#F5F5F5] leading-[1.08]">
            Predictable tiers. Zero hidden seats.
          </h2>
          <p className="text-[16px] text-[#8A8A8A]">
            Start free with the open-source CLI. Upgrade when your team needs collaborative design token sync and AI automation.
          </p>

          {/* Billing Toggle */}
          <div className="pt-4 flex items-center justify-center gap-3">
            <span className={`text-[13px] font-mono ${!isAnnual ? "text-[#F5F5F5]" : "text-[#8A8A8A]"}`}>
              Monthly
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className="w-12 h-6 rounded-full bg-[#1c1c22] border border-white/[0.1] p-0.5 relative transition-colors"
            >
              <div
                className={`w-5 h-5 rounded-full bg-[#8b5cf6] shadow transform transition-transform ${
                  isAnnual ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
            <span className={`text-[13px] font-mono flex items-center gap-1.5 ${isAnnual ? "text-[#F5F5F5]" : "text-[#8A8A8A]"}`}>
              Annual
              <span className="text-[10px] font-mono font-semibold uppercase bg-[#10b981]/15 text-[#10b981] px-2 py-0.5 rounded-full">
                Save 20%
              </span>
            </span>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan) => {
            const price = isAnnual ? plan.priceAnnual : plan.priceMonthly;

            return (
              <div
                key={plan.name}
                className={`bg-[#111114] rounded-[16px] p-8 flex flex-col justify-between relative transition-all ${
                  plan.popular
                    ? "border-2 border-[#8b5cf6] shadow-2xl shadow-violet-500/10"
                    : "border border-white/[0.08] hover:border-white/[0.18]"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#8b5cf6] text-white text-[11px] font-mono font-semibold uppercase px-3 py-0.5 rounded-full shadow-md">
                    Most Popular
                  </div>
                )}

                <div className="space-y-6">
                  {/* Top Name & Badge */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-[20px] font-[600] text-[#F5F5F5]">{plan.name}</h3>
                      <p className="text-[13px] text-[#8A8A8A] mt-1">{plan.description}</p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="pt-2 flex items-baseline gap-1">
                    <span className="text-[42px] font-bold font-mono tracking-tight text-[#F5F5F5]">
                      ${price}
                    </span>
                    <span className="text-[13px] font-mono text-[#8A8A8A]">
                      {plan.priceMonthly === 0 ? "/ forever" : "/ month"}
                    </span>
                  </div>

                  {/* Feature Checklist */}
                  <div className="pt-4 border-t border-white/[0.06] space-y-3">
                    <span className="text-[11px] font-mono text-[#8A8A8A] uppercase tracking-wider block">
                      Included Capabilities:
                    </span>
                    {plan.features.map((feat, i) => (
                      <div key={i} className="flex items-start gap-3 text-[13px] text-[#cccccc]">
                        <Check size={16} className="text-[#8b5cf6] shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA Button */}
                <div className="pt-8">
                  <button
                    className={`w-full py-3 px-4 rounded-[8px] text-[13px] font-mono font-medium transition-all flex items-center justify-center gap-2 ${
                      plan.ctaVariant === "accent"
                        ? "bg-[#8b5cf6] text-white hover:bg-[#7c3aed] shadow-lg shadow-violet-500/25"
                        : "bg-[#18181b] border border-white/[0.12] text-[#F5F5F5] hover:bg-white/[0.06] hover:border-white/[0.25]"
                    }`}
                  >
                    <span>{plan.cta}</span>
                    <ArrowRight size={14} />
                  </button>
                  <p className="text-[11px] font-mono text-[#666666] text-center mt-3">
                    {plan.priceMonthly === 0 ? "No credit card required" : "14-day money-back guarantee"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Minimal FAQ Strip */}
        <div className="mt-20 pt-16 border-t border-white/[0.08] max-w-3xl mx-auto space-y-8">
          <div className="text-center">
            <h4 className="text-[18px] font-[600] text-[#F5F5F5] flex items-center justify-center gap-2">
              <HelpCircle size={18} className="text-[#8b5cf6]" /> Frequently Asked Questions
            </h4>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="bg-[#111114] border border-white/[0.06] rounded-[10px] p-5 space-y-2">
                <div className="text-[14px] font-medium text-[#F5F5F5]">{faq.q}</div>
                <div className="text-[13px] text-[#8A8A8A] leading-relaxed">{faq.a}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
