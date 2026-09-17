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
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-3">
          <div className="flex items-baseline gap-0.5">
            <span
              className="text-[46px] font-[600] font-sans tracking-[-0.035em] leading-none"
              style={{ color: gaugeColor }}
            >
              {percentage.toFixed(1)}
            </span>
            <span className="text-[20px] font-[500] font-linear-mono text-[#94a3b8]">
              %
            </span>
          </div>

          <span className="text-[13px] font-linear-mono text-[#cbd5e1] font-medium tracking-wide uppercase mt-1.5">
            {label}
          </span>

          <span
            className="text-[12px] font-linear-mono font-semibold px-2 py-0.5 rounded-full border mt-1"
            style={{
              color: gaugeColor,
              borderColor: `${gaugeColor}40`,
              backgroundColor: `${gaugeColor}15`,
            }}
          >
            {threatLabel}
          </span>

          {sublabel && (
            <span className="text-[12px] font-linear-mono text-[#94a3b8] mt-1 font-medium">
              {sublabel}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
