"use client";

import React, { useState } from "react";
import { Copy, Check, Terminal, Play, Sparkles, Layers, Sliders, Cpu, CheckCircle2 } from "lucide-react";

type CodeTab = "button" | "tokens" | "hook" | "schema";

const CODE_SNIPPETS: Record<CodeTab, { filename: string; language: string; size: string; code: string[] }> = {
  button: {
    filename: "Button.tsx",
    language: "typescript",
    size: "1.1 kB",
    code: [
      'import React from "react";',
      'import { cva, type VariantProps } from "class-variance-authority";',
      '',
      'const buttonStyles = cva(',
      '  "inline-flex items-center justify-center font-medium font-mono text-[13px] rounded-[7px] transition-all focus:outline-none focus:ring-1 focus:ring-violet-500/50",',
      '  {',
      '    variants: {',
      '      variant: {',
      '        solid: "bg-[#F5F5F5] text-[#090909] hover:bg-white active:scale-[0.98]",',
      '        outline: "border border-white/10 text-[#F5F5F5] hover:border-white/25 hover:bg-white/[0.03]",',
      '        accent: "bg-[#8b5cf6] text-white hover:bg-[#7c3aed] shadow-sm shadow-violet-500/20",',
      '        ghost: "text-[#8A8A8A] hover:text-[#F5F5F5] hover:bg-white/[0.04]",',
      '      },',
      '      size: {',
      '        sm: "h-8 px-3 text-[12px]",',
      '        md: "h-9 px-4 text-[13px]",',
      '        lg: "h-11 px-5 text-[14px]",',
      '      },',
      '    },',
      '    defaultVariants: { variant: "solid", size: "md" },',
      '  }',
      ');',
      '',
      'export interface ButtonProps',
      '  extends React.ButtonHTMLAttributes<HTMLButtonElement>,',
      '    VariantProps<typeof buttonStyles> {',
      '  isLoading?: boolean;',
      '}',
      '',
      'export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(',
      '  ({ variant, size, isLoading, children, className, ...props }, ref) => (',
      '    <button ref={ref} className={buttonStyles({ variant, size, className })} {...props}>',
      '      {isLoading ? <span className="animate-spin mr-2">◌</span> : null}',
      '      {children}',
      '    </button>',
      '  )',
      ');',
    ],
  },
  tokens: {
    filename: "tokens.css",
    language: "css",
    size: "0.6 kB",
    code: [
      ':root {',
      '  /* Core Surfaces */',
      '  --canvas-primary: #090909;',
      '  --surface-raised: #111111;',
      '  --surface-overlay: #18181b;',
      '',
      '  /* Typography Contrast Scales */',
      '  --text-high-contrast: #F5F5F5;',
      '  --text-muted: #8A8A8A;',
      '  --text-subtle: #52525b;',
      '',
      '  /* Hairline Borders */',
      '  --hairline-border: rgba(255, 255, 255, 0.08);',
      '  --hairline-hover: rgba(255, 255, 255, 0.20);',
      '',
      '  /* Laser Accents */',
      '  --accent-laser: #8b5cf6;',
      '  --accent-success: #10b981;',
      '  --accent-caution: #f59e0b;',
      '}',
    ],
  },
  hook: {
    filename: "useTheme.ts",
    language: "typescript",
    size: "0.8 kB",
    code: [
      'import { useState, useEffect } from "react";',
      '',
      'export function useTactileTheme() {',
      '  const [activeHue, setActiveHue] = useState<"violet" | "emerald" | "amber">("violet");',
      '  const [isHighContrast, setIsHighContrast] = useState(false);',
      '',
      '  useEffect(() => {',
      '    document.documentElement.dataset.contrast = isHighContrast ? "high" : "standard";',
      '  }, [isHighContrast]);',
      '',
      '  return { activeHue, setActiveHue, isHighContrast, setIsHighContrast };',
      '}',
    ],
  },
  schema: {
    filename: "intent.config.json",
    language: "json",
    size: "0.4 kB",
    code: [
      '{',
      '  "$schema": "https://intent-ui.dev/schema.json",',
      '  "framework": "nextjs",',
      '  "styling": "tailwindcss-v4",',
      '  "typescript": true,',
      '  "components": ["button", "command", "dialog", "metrics"],',
      '  "aliases": {',
      '    "components": "@/components/ui",',
      '    "utils": "@/lib/utils"',
      '  }',
      '}',
    ],
  },
};

export default function InteractiveCodeSection() {
  const [activeTab, setActiveTab] = useState<CodeTab>("button");
  const [copied, setCopied] = useState(false);

  // Live component playground state
  const [selectedVariant, setSelectedVariant] = useState<"solid" | "outline" | "accent" | "ghost">("solid");
  const [selectedSize, setSelectedSize] = useState<"sm" | "md" | "lg">("md");
  const [isLoading, setIsLoading] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const [buttonFeedback, setButtonFeedback] = useState<string | null>(null);

  const handleCopyCode = () => {
    const text = CODE_SNIPPETS[activeTab].code.join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTestClick = () => {
    if (isDisabled || isLoading) return;
    setButtonFeedback("Dispatched!");
    setTimeout(() => setButtonFeedback(null), 1500);
  };

  const currentSnippet = CODE_SNIPPETS[activeTab];

  return (
    <section id="code" className="py-24 md:py-32 bg-[#090909] border-t border-white/[0.08]">
      <div className="max-w-[1360px] mx-auto px-6">
        
        {/* Section Header */}
        <div className="mb-14 space-y-3 max-w-2xl">
          <span className="text-[12px] font-mono text-[#8b5cf6] font-semibold tracking-wider uppercase block">
            CODE ARCHITECTURE
          </span>
          <h2 className="text-[34px] sm:text-[48px] font-[600] tracking-[-0.035em] text-[#F5F5F5] leading-[1.08]">
            Copy it into your repo. Own every byte.
          </h2>
          <p className="text-[16px] text-[#8A8A8A]">
            No black-box node_modules. Every component ships as clean, copy-pasteable TypeScript and Tailwind primitives you can extend indefinitely.
          </p>
        </div>

        {/* Split Screen Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left: Code Editor (7 cols) */}
          <div className="lg:col-span-7 bg-[#0d0d10] border border-white/[0.08] rounded-[14px] overflow-hidden shadow-2xl">
            {/* Editor Top Bar with File Tabs */}
            <div className="flex items-center justify-between border-b border-white/[0.08] bg-[#111114] px-4 py-2">
              <div className="flex items-center gap-1 overflow-x-auto">
                {(["button", "tokens", "hook", "schema"] as CodeTab[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1.5 rounded-[6px] text-[12px] font-mono transition-all flex items-center gap-2 ${
                      activeTab === tab
                        ? "bg-[#1c1c22] text-[#F5F5F5] font-medium border border-white/[0.08]"
                        : "text-[#8A8A8A] hover:text-[#d4d4d8]"
                    }`}
                  >
                    <span>{CODE_SNIPPETS[tab].filename}</span>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono text-[#666666] hidden sm:inline-block">
                  {currentSnippet.size}
                </span>
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 text-[12px] font-mono text-[#8A8A8A] hover:text-[#F5F5F5] px-2.5 py-1 rounded border border-white/[0.08] hover:border-white/[0.2] transition-colors"
                >
                  {copied ? (
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

            {/* Code Lines with Line Numbers */}
            <div className="p-4 sm:p-6 overflow-x-auto max-h-[480px] font-mono text-[13px] leading-[1.65]">
              <table className="w-full border-collapse">
                <tbody>
                  {currentSnippet.code.map((line, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.02]">
                      <td className="w-10 text-right pr-4 select-none text-[#444444] text-[12px] align-top">
                        {idx + 1}
                      </td>
                      <td className="whitespace-pre text-[#d4d4d8]">
                        {/* Tokenized Syntax Highlighting */}
                        {line.startsWith("import") || line.startsWith("export") ? (
                          <span className="text-[#8b5cf6]">{line}</span>
                        ) : line.includes("interface") || line.includes("type ") ? (
                          <span className="text-[#38bdf8]">{line}</span>
                        ) : line.includes("const ") || line.includes("function ") ? (
                          <span>
                            <span className="text-[#8b5cf6]">{line.slice(0, 5)}</span>
                            <span className="text-[#f43f5e]">{line.slice(5)}</span>
                          </span>
                        ) : line.includes(":") && !line.includes("{") ? (
                          <span>
                            <span className="text-[#94a3b8]">{line.split(":")[0]}:</span>
                            <span className="text-[#a78bfa]">{line.split(":")[1]}</span>
                          </span>
                        ) : line.includes('"') || line.includes("'") ? (
                          <span className="text-[#a3e635]">{line}</span>
                        ) : line.startsWith("/*") || line.startsWith("  /*") ? (
                          <span className="text-[#52525b] italic">{line}</span>
                        ) : (
                          line
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right: Live Interactive Sandbox (5 cols) */}
          <div className="lg:col-span-5 bg-[#111114] border border-white/[0.08] rounded-[14px] p-6 sm:p-8 space-y-8 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
                  <span className="text-[12px] font-mono text-[#F5F5F5] font-medium">LIVE COMPONENT SANDBOX</span>
                </div>
                <span className="text-[11px] font-mono text-[#8A8A8A] bg-white/[0.04] px-2 py-0.5 rounded">
                  client-side
                </span>
              </div>

              {/* Rendered Live Preview Stage */}
              <div className="h-[180px] bg-[#09090b] border border-white/[0.06] rounded-[10px] flex flex-col items-center justify-center p-6 relative">
                <div 
                  className="absolute inset-0 opacity-[0.06] pointer-events-none"
                  style={{
                    backgroundImage: "radial-gradient(rgba(255,255,255,0.4) 1px, transparent 1px)",
                    backgroundSize: "14px 14px",
                  }}
                />

                {/* The Live Interactive Button */}
                <button
                  onClick={handleTestClick}
                  disabled={isDisabled || isLoading}
                  className={`relative font-mono transition-all flex items-center justify-center gap-2 select-none ${
                    selectedVariant === "solid"
                      ? "bg-[#F5F5F5] text-[#090909] hover:bg-white active:scale-[0.98] font-medium"
                      : selectedVariant === "outline"
                      ? "border border-white/20 text-[#F5F5F5] hover:border-white/40 hover:bg-white/[0.05]"
                      : selectedVariant === "accent"
                      ? "bg-[#8b5cf6] text-white hover:bg-[#7c3aed] shadow-lg shadow-violet-500/20"
                      : "text-[#8A8A8A] hover:text-[#F5F5F5] hover:bg-white/[0.04]"
                  } ${
                    selectedSize === "sm"
                      ? "h-8 px-3 text-[12px] rounded-[6px]"
                      : selectedSize === "md"
                      ? "h-10 px-5 text-[13px] rounded-[8px]"
                      : "h-12 px-6 text-[15px] rounded-[10px]"
                  } ${isDisabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  {isLoading && (
                    <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  )}
                  <span>{isLoading ? "Executing..." : buttonFeedback || "Dispatch Workflow"}</span>
                </button>

                {buttonFeedback && (
                  <span className="text-[11px] font-mono text-[#10b981] mt-3 animate-fade-in flex items-center gap-1">
                    <CheckCircle2 size={12} /> State transition verified
                  </span>
                )}
              </div>

              {/* Sandbox Controls */}
              <div className="space-y-4">
                <span className="text-[11px] font-mono text-[#8A8A8A] uppercase tracking-wider block">
                  Interactive Props Matrix
                </span>

                {/* Variant selection */}
                <div className="space-y-1.5">
                  <span className="text-[12px] font-mono text-[#666666]">Variant:</span>
                  <div className="grid grid-cols-4 gap-2">
                    {(["solid", "outline", "accent", "ghost"] as const).map((v) => (
                      <button
                        key={v}
                        onClick={() => setSelectedVariant(v)}
                        className={`py-1.5 px-2 rounded-[6px] text-[11px] font-mono capitalize transition-all border ${
                          selectedVariant === v
                            ? "bg-[#1e1e24] text-[#F5F5F5] border-[#8b5cf6]/50"
                            : "bg-[#141416] text-[#8A8A8A] border-white/[0.06] hover:border-white/[0.15]"
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Size selection */}
                <div className="space-y-1.5">
                  <span className="text-[12px] font-mono text-[#666666]">Size:</span>
                  <div className="grid grid-cols-3 gap-2">
                    {(["sm", "md", "lg"] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => setSelectedSize(s)}
                        className={`py-1.5 px-2 rounded-[6px] text-[11px] font-mono uppercase transition-all border ${
                          selectedSize === s
                            ? "bg-[#1e1e24] text-[#F5F5F5] border-[#8b5cf6]/50"
                            : "bg-[#141416] text-[#8A8A8A] border-white/[0.06] hover:border-white/[0.15]"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Boolean toggles */}
                <div className="flex gap-4 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isLoading}
                      onChange={(e) => setIsLoading(e.target.checked)}
                      className="rounded bg-[#1a1a1e] border-white/[0.15] text-[#8b5cf6] focus:ring-0"
                    />
                    <span className="text-[12px] font-mono text-[#8A8A8A]">isLoading</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isDisabled}
                      onChange={(e) => setIsDisabled(e.target.checked)}
                      className="rounded bg-[#1a1a1e] border-white/[0.15] text-[#8b5cf6] focus:ring-0"
                    />
                    <span className="text-[12px] font-mono text-[#8A8A8A]">disabled</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Performance telemetry footer */}
            <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between text-[11px] font-mono text-[#666666]">
              <span>Hydration: 0.14ms</span>
              <span>WCAG AAA Compliant</span>
              <span>Dependencies: 0</span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

