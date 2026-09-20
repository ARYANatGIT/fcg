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
      ? "#ef4444" // Coral Red (High Risk)
      : percentage >= 35
      ? "#f59e0b" // Signal Amber (Moderate Risk)
      : "#22c55e"); // Pulse Green (Safe/Low)

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
            stroke="#1c212c"
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
            stroke="#273042"
            strokeWidth={strokeWidth + 2}
            strokeDasharray={`2 ${arcLength * 0.35 - 2} 2 ${arcLength * 0.30 - 2} 2 ${circumference}`}
            strokeLinecap="butt"
            opacity={0.7}
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
              filter: `drop-shadow(0 0 10px ${gaugeColor}60)`,
            }}
          />
        </svg>

        {/* Center Digital Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
          <div className="flex items-baseline gap-0.5">
            <span
              className="text-[42px] font-[700] font-sans tracking-[-0.035em] leading-none"
              style={{ color: gaugeColor }}
            >
              {percentage.toFixed(1)}
            </span>
            <span className="text-[18px] font-[600] font-linear-mono text-[#94a3b8]">
              %
            </span>
          </div>

          <span className="text-[12px] font-linear-mono text-[#cbd5e1] font-semibold tracking-wide uppercase mt-1">
            {label}
          </span>

          <span
            className="text-[11px] font-linear-mono font-bold px-2.5 py-0.5 rounded-full border mt-1.5"
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

      {/* Dedicated Model Confidence Pill - Rendered Cleanly Below Gauge to Prevent Any Text Overlap */}
      {sublabel && (
        <div className="mt-2.5 flex items-center gap-2 bg-[#151820] px-3.5 py-1.5 rounded-full border border-[#232732] shadow-sm">
          <span className="w-2 h-2 rounded-full bg-[#38bdf8] animate-pulse" />
          <span className="text-[13px] font-linear-mono text-[#e2e8f0] font-semibold tracking-wide">
            {sublabel}
          </span>
        </div>
      )}
    </div>
  );
}

