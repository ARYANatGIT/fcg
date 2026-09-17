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
  size = 180,
  strokeWidth = 12,
  color,
}: CircularGaugeProps) {
  const percentage = Math.min(Math.max(value * 100, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // Use a 260-degree arc for a gauge look
  const arcLength = circumference * 0.75;
  const strokeDashoffset = arcLength - (arcLength * percentage) / 100;

  // Determine color if not provided
  const gaugeColor =
    color ||
    (percentage >= 65
      ? "#eb5757" // Coral Red
      : percentage >= 35
      ? "#f59e0b" // Amber
      : "#27a644"); // Pulse Green

  return (
    <div className="flex flex-col items-center justify-center relative select-none">
      <div className="relative" style={{ width: size, height: size * 0.85 }}>
        <svg
          width={size}
          height={size}
          className="transform -rotate-225"
          style={{ overflow: "visible" }}
        >
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="#161718"
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
          />

          {/* Foreground Colored Arc */}
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
              filter: `drop-shadow(0 0 6px ${gaugeColor}40)`,
            }}
          />
        </svg>

        {/* Center Readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
          <span
            className="text-[44px] font-[510] font-sans tracking-[-0.03em] leading-none transition-colors duration-300"
            style={{ color: gaugeColor }}
          >
            {percentage.toFixed(1)}%
          </span>
          <span className="text-[12px] font-linear-mono text-[#8a8f98] uppercase tracking-wider mt-1 font-medium">
            {label}
          </span>
          {sublabel && (
            <span className="text-[11px] font-linear-mono text-[#62666d] mt-0.5">
              {sublabel}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
