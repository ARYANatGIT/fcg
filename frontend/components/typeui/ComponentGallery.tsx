"use client";

import React, { useState } from "react";
import { 
  Copy, Check, Search, Command, ArrowRight, ShieldCheck, 
  Sparkles, Sliders, Bell, ChevronRight, Eye, CheckCircle2, 
  Layers, Lock, Play, Flame
} from "lucide-react";

type Category = "all" | "actions" | "inputs" | "overlays" | "data";

interface ComponentItem {
  id: string;
  name: string;
  category: Category;
  description: string;
  cli: string;
}

const COMPONENTS: ComponentItem[] = [
  {
    id: "button-variants",
    name: "Precision Button",
    category: "actions",
    description: "Hairline border, optical hover alignment, loading & success micro-states.",
    cli: "npx intent-ui add button",
  },
  {
    id: "search-input",
    name: "Command Search Bar",
    category: "inputs",
    description: "Integrated shortcut badge with autofocus and clear actions.",
    cli: "npx intent-ui add command-input",
  },
  {
    id: "switch-primitive",
    name: "Haptic Switch",
    category: "inputs",
    description: "Tactile toggle with spring physics and accessible ARIA attributes.",
    cli: "npx intent-ui add switch",
  },
  {
    id: "telemetry-badge",
    name: "Telemetry Metric Card",
    category: "data",
    description: "Real-time state indicator with live pulse and delta percentage.",
    cli: "npx intent-ui add metric-card",
  },
  {
    id: "command-dialog",
    name: "Command Palette Dialog",
    category: "overlays",
    description: "Sub-millisecond fuzzy search overlay with key navigation.",
    cli: "npx intent-ui add command-palette",
  },
  {
    id: "segmented-tabs",
    name: "Segmented Control",
    category: "actions",
    description: "Precision sliding indicator with zero layout shift.",
    cli: "npx intent-ui add segmented-control",
  },
];

export default function ComponentGallery() {
  const [activeCategory, setActiveCategory] = useState<Category>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Interactive states for cards
  const [buttonLoading, setButtonLoading] = useState(false);
  const [buttonSuccess, setButtonSuccess] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const [switchOn, setSwitchOn] = useState(true);
  const [selectedSegment, setSelectedSegment] = useState("overview");

  const handleCopy = (id: string, cli: string) => {
    navigator.clipboard.writeText(cli);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleButtonClick = () => {
    setButtonLoading(true);
    setTimeout(() => {
      setButtonLoading(false);
      setButtonSuccess(true);
      setTimeout(() => setButtonSuccess(false), 1600);
    }, 700);
  };

  const filtered = activeCategory === "all" 
    ? COMPONENTS 
    : COMPONENTS.filter((c) => c.category === activeCategory);

  return (
    <section id="gallery" className="py-24 md:py-32 bg-[#090909] border-t border-white/[0.08]">
      <div className="max-w-[1360px] mx-auto px-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-3">
            <span className="text-[12px] font-mono text-[#8b5cf6] font-semibold tracking-wider uppercase block">
              COMPONENT LIBRARY
            </span>
            <h2 className="text-[34px] sm:text-[46px] font-[600] tracking-[-0.035em] text-[#F5F5F5] leading-[1.08]">
              Engineered for tactile precision.
            </h2>
            <p className="text-[16px] text-[#8A8A8A] max-w-xl">
              Copy-paste accessible primitives built with Tailwind and React. Zero bundle lock-in, full code ownership.
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-[#111111] border border-white/[0.08] rounded-[10px] self-start md:self-auto overflow-x-auto">
            {(["all", "actions", "inputs", "overlays", "data"] as Category[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3.5 py-1.5 rounded-[7px] text-[12px] font-mono capitalize transition-all whitespace-nowrap ${
                  activeCategory === cat
                    ? "bg-[#1f1f23] text-[#F5F5F5] font-medium shadow-sm"
                    : "text-[#8A8A8A] hover:text-[#F5F5F5]"
                }`}
              >
                {cat === "all" ? "All Components" : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Component Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="group bg-[#111111] border border-white/[0.08] rounded-[14px] overflow-hidden hover:border-white/[0.2] transition-all flex flex-col justify-between"
            >
              {/* Interactive Preview Canvas */}
              <div className="h-[210px] bg-[#0c0c0e] flex items-center justify-center p-6 relative border-b border-white/[0.06] overflow-hidden">
                {/* Subtle Dot Grid */}
                <div 
                  className="absolute inset-0 opacity-[0.08] pointer-events-none"
                  style={{
                    backgroundImage: "radial-gradient(rgba(255,255,255,0.4) 1px, transparent 1px)",
                    backgroundSize: "16px 16px",
                  }}
                />

                {/* Specific Card Previews */}
                {item.id === "button-variants" && (
                  <div className="flex flex-col gap-3 items-center w-full max-w-[240px]">
                    <button
                      onClick={handleButtonClick}
                      disabled={buttonLoading}
                      className={`w-full py-2.5 px-4 rounded-[8px] text-[13px] font-medium transition-all flex items-center justify-center gap-2 border ${
                        buttonSuccess
                          ? "bg-[#10b981]/20 border-[#10b981]/40 text-[#10b981]"
                          : buttonLoading
                          ? "bg-[#18181b] border-white/[0.15] text-[#8A8A8A]"
                          : "bg-[#F5F5F5] text-[#090909] hover:bg-[#ffffff] active:scale-[0.98] border-transparent font-medium"
                      }`}
                    >
                      {buttonSuccess ? (
                        <>
                          <CheckCircle2 size={15} /> Executed
                        </>
                      ) : buttonLoading ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Processing
                        </>
                      ) : (
                        <>Deploy Instance</>
                      )}
                    </button>

                    <div className="flex gap-2 w-full">
                      <button className="flex-1 py-1.5 rounded-[6px] border border-white/[0.12] bg-[#141416] text-[12px] font-mono text-[#8A8A8A] hover:text-[#F5F5F5] hover:border-white/[0.25] transition-all">
                        Cancel
                      </button>
                      <button className="flex-1 py-1.5 rounded-[6px] border border-[#8b5cf6]/40 bg-[#8b5cf6]/10 text-[12px] font-mono text-[#a78bfa] hover:bg-[#8b5cf6]/20 transition-all">
                        Inspect
                      </button>
                    </div>
                  </div>
                )}

                {item.id === "search-input" && (
                  <div className="w-full max-w-[260px] relative">
                    <div className="relative flex items-center">
                      <Search size={14} className="absolute left-3.5 text-[#8A8A8A]" />
                      <input
                        type="text"
                        placeholder="Search symbols or files..."
                        value={searchVal}
                        onChange={(e) => setSearchVal(e.target.value)}
                        className="w-full bg-[#151518] border border-white/[0.12] rounded-[8px] pl-9 pr-14 py-2 text-[13px] text-[#F5F5F5] placeholder-[#666666] focus:outline-none focus:border-[#8b5cf6]/60 transition-all font-mono"
                      />
                      <kbd className="absolute right-2.5 px-1.5 py-0.5 bg-[#222227] border border-white/[0.08] text-[10px] font-mono text-[#8A8A8A] rounded">
                        ⌘K
                      </kbd>
                    </div>
                    <span className="text-[11px] font-mono text-[#666666] mt-2 block text-center">
                      Try typing in the input above
                    </span>
                  </div>
                )}

                {item.id === "switch-primitive" && (
                  <div className="bg-[#151518] border border-white/[0.1] rounded-[10px] p-4 w-full max-w-[250px] flex items-center justify-between">
                    <div>
                      <div className="text-[13px] font-medium text-[#F5F5F5]">Hardware GPU</div>
                      <div className="text-[11px] font-mono text-[#8A8A8A]">Metal & CUDA acceleration</div>
                    </div>
                    <button
                      onClick={() => setSwitchOn(!switchOn)}
                      className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
                        switchOn ? "bg-[#8b5cf6]" : "bg-[#27272a]"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-[#FFFFFF] shadow-sm transform transition-transform ${
                          switchOn ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                )}

                {item.id === "telemetry-badge" && (
                  <div className="bg-[#151518] border border-white/[0.1] rounded-[10px] p-4 w-full max-w-[250px] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono text-[#8A8A8A]">GPU Cluster Node 04</span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#10b981] bg-[#10b981]/10 px-1.5 py-0.5 rounded">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-ping" />
                        Healthy
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-[22px] font-bold text-[#F5F5F5] font-mono">99.98%</span>
                      <span className="text-[12px] font-mono text-[#10b981]">+0.04% avg</span>
                    </div>
                    <div className="w-full bg-[#27272a] h-1.5 rounded-full overflow-hidden">
                      <div className="bg-[#8b5cf6] h-full w-[82%]" />
                    </div>
                  </div>
                )}

                {item.id === "command-dialog" && (
                  <div className="w-full max-w-[260px] bg-[#151518] border border-white/[0.1] rounded-[8px] shadow-lg p-2.5 space-y-1">
                    <div className="text-[10px] font-mono text-[#8A8A8A] px-2 py-1 uppercase tracking-wider">
                      Actions
                    </div>
                    <div className="flex items-center justify-between px-2 py-1.5 bg-[#8b5cf6]/15 text-[#a78bfa] rounded-[6px] text-[12px]">
                      <span className="flex items-center gap-2">
                        <Sparkles size={13} />
                        Synthesize Tokens
                      </span>
                      <span className="text-[10px] font-mono text-[#8b5cf6]">↵</span>
                    </div>
                    <div className="flex items-center justify-between px-2 py-1.5 text-[#8A8A8A] rounded-[6px] text-[12px] hover:bg-white/[0.04]">
                      <span className="flex items-center gap-2">
                        <Layers size={13} />
                        Branch Components
                      </span>
                      <span className="text-[10px] font-mono text-[#666666]">⌘B</span>
                    </div>
                  </div>
                )}

                {item.id === "segmented-tabs" && (
                  <div className="p-1 bg-[#151518] border border-white/[0.1] rounded-[8px] flex items-center gap-1 w-full max-w-[250px]">
                    {["overview", "analytics", "logs"].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setSelectedSegment(tab)}
                        className={`flex-1 py-1.5 rounded-[6px] text-[11px] font-mono capitalize transition-all ${
                          selectedSegment === tab
                            ? "bg-[#27272a] text-[#F5F5F5] font-medium shadow-sm"
                            : "text-[#8A8A8A] hover:text-[#F5F5F5]"
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Card Meta & CLI Copy */}
              <div className="p-5 flex flex-col justify-between flex-1 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-[15px] font-[600] text-[#F5F5F5] group-hover:text-white transition-colors">
                      {item.name}
                    </h4>
                    <span className="text-[10px] font-mono text-[#8A8A8A] uppercase px-1.5 py-0.5 rounded bg-white/[0.04]">
                      {item.category}
                    </span>
                  </div>
                  <p className="text-[13px] text-[#8A8A8A] leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* CLI install bar */}
                <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
                  <span className="text-[12px] font-mono text-[#666666] truncate max-w-[190px]">
                    {item.cli}
                  </span>
                  <button
                    onClick={() => handleCopy(item.id, item.cli)}
                    className="flex items-center gap-1 text-[11px] font-mono text-[#8b5cf6] hover:text-[#a78bfa] transition-colors px-2 py-1 rounded bg-[#8b5cf6]/10"
                    title="Copy CLI command"
                  >
                    {copiedId === item.id ? (
                      <>
                        <Check size={12} className="text-[#10b981]" />
                        <span className="text-[#10b981]">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* View full catalog footer note */}
        <div className="mt-12 text-center">
          <p className="text-[14px] text-[#8A8A8A]">
            Over <span className="text-[#F5F5F5] font-medium">48+ production primitives</span> available in the registry.{" "}
            <a href="#code" className="text-[#8b5cf6] hover:underline font-mono inline-flex items-center gap-1 ml-1">
              Explore Code Implementation <ArrowRight size={13} />
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
