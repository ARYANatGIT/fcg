"use client";

import React from "react";

interface CircularGaugeProps {
  value: number; // 0 to 1
  label: string;
  sublabel?: string;
  size?: number;
  strokeWidth?: number;
  color?: string;
}

export default function CircularGauge({
  value,
  label,
  sublabel,
  size = 200,
  strokeWidth = 14,
  color,
}: CircularGaugeProps) {
  const percentage = Math.min(Math.max(value * 100, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // 240-degree sweep for precision instrument meter
  const arcFraction = 0.72;
  const arcLength = circumference * arcFraction;
  const strokeDashoffset = arcLength - (arcLength * percentage) / 100;

  // Determine operational threat color
  const gaugeColor =
    color ||
    (percentage >= 65
      ? "#ef4444" // Red (High Risk)
      : percentage >= 35
      ? "#f59e0b" // Amber (Moderate Risk)
      : "#AEB796"); // Sage Accent (Safe/Robust)

  const threatLabel =
    percentage >= 65 ? "CRITICAL RISK" : percentage >= 35 ? "ELEVATED RISK" : "ROBUST FORECAST";

  return (
    <div className="flex flex-col items-center justify-center relative select-none">
      <div className="relative" style={{ width: size, height: size * 0.9 }}>
        <svg
          width={size}
          height={size}
          className="transform -rotate-215"
          style={{ overflow: "visible" }}
        >
          {/* Background Track with Subtle Glow */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="rgba(255, 255, 255, 0.07)"
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
          />

          {/* Calibrated Threshold Markers (Subtle tick overlay) */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="rgba(255, 255, 255, 0.12)"
            strokeWidth={strokeWidth + 2}
            strokeDasharray={`2 ${arcLength * 0.35 - 2} 2 ${arcLength * 0.30 - 2} 2 ${circumference}`}
            strokeLinecap="butt"
            opacity={0.6}
          />

          {/* Foreground Dynamic Colored Arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={gaugeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
            style={{
              filter: `drop-shadow(0 0 12px ${gaugeColor}50)`,
            }}
          />
        </svg>

        {/* Center Digital Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
          <div className="flex items-baseline gap-0.5">
            <span
              className="text-[44px] font-bold font-sans tracking-[-0.05em] leading-none text-[#E8E8E5]"
            >
              {percentage.toFixed(1)}
            </span>
            <span className="text-[16px] font-semibold font-mono-tech text-[#8B8B87]">
              %
            </span>
          </div>

          <span className="text-[11px] font-mono-tech text-[#8B8B87] uppercase tracking-wider mt-1">
            {label}
          </span>

          <span
            className="text-[10px] font-mono-tech font-semibold px-2.5 py-0.5 rounded-full border mt-1.5 uppercase tracking-wide"
            style={{
              color: gaugeColor,
              borderColor: `${gaugeColor}40`,
              backgroundColor: `${gaugeColor}15`,
            }}
          >
            {threatLabel}
          </span>
        </div>
      </div>

      {/* Dedicated Model Confidence Pill */}
      {sublabel && (
        <div className="mt-2.5 flex items-center gap-2 bg-white/[0.04] px-3.5 py-1 rounded-full border border-white/10 shadow-sm">
          <span className="status-dot-active" />
          <span className="text-[12px] font-mono-tech text-[#D8D8D3] font-medium tracking-wide">
            {sublabel}
          </span>
        </div>
      )}
    </div>
  );
}

