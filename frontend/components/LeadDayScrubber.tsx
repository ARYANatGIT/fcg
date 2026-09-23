"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";

interface LeadDayScrubberProps {
  leadDay: number;
  onChange: (day: number) => void;
  leadCurve?: Array<{ lead_day: number; bust_probability: number }>;
}

export default function LeadDayScrubber({
  leadDay,
  onChange,
  leadCurve = [],
}: LeadDayScrubberProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonRefs = useRef<{ [key: number]: HTMLButtonElement | null }>({});
  const [gliderStyle, setGliderStyle] = useState<{ left: number; width: number }>({
    left: 0,
    width: 0,
  });
  const [isReady, setIsReady] = useState(false);

  const measure = useCallback(() => {
    if (typeof window === "undefined") return;
    window.requestAnimationFrame(() => {
      const activeBtn = buttonRefs.current[leadDay];
      if (activeBtn && containerRef.current) {
        setGliderStyle({
          left: activeBtn.offsetLeft,
          width: activeBtn.offsetWidth,
        });
        setIsReady(true);
      }
    });
  }, [leadDay]);

  useEffect(() => {
    measure();
    const handleResize = () => measure();
    window.addEventListener("resize", handleResize);

    const activeBtn = buttonRefs.current[leadDay];
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => measure());
      if (activeBtn) ro.observe(activeBtn);
      if (containerRef.current) ro.observe(containerRef.current);
    }

    if (typeof document !== "undefined" && (document as any).fonts?.ready) {
      (document as any).fonts.ready.then(measure);
    }

    const t1 = setTimeout(measure, 30);
    const t2 = setTimeout(measure, 150);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (ro) ro.disconnect();
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [measure, leadDay]);

  const days = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  return (
    <div
      ref={containerRef}
      className="nav-shell relative inline-flex items-center gap-2 sm:gap-2.5 p-2.5 sm:p-3 rounded-2xl border border-white/10 bg-black/40 select-none shrink-0"
    >
      {/* Single Smooth Gliding Capsule with generous margins */}
      <div
        className="nav-glider pointer-events-none absolute top-2.5 bottom-2.5 sm:top-3 sm:bottom-3 left-0 rounded-xl z-0 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] shadow-md"
        style={{
          transform: `translate3d(${gliderStyle.left}px, 0, 0)`,
          width: `${gliderStyle.width}px`,
          opacity: isReady && gliderStyle.width > 0 ? 1 : 0,
        }}
        aria-hidden="true"
      />

      {days.map((d) => {
        const isSelected = leadDay === d;
        const dayPoint = leadCurve.find((pt) => pt.lead_day === d);
        const dayRiskPct = dayPoint
          ? dayPoint.bust_probability
          : d >= 6
          ? 70
          : d >= 4
          ? 45
          : 15;
        const isHigh = dayRiskPct >= 65;
        const isMod = dayRiskPct >= 35 && dayRiskPct < 65;

        return (
          <button
            key={d}
            ref={(el) => {
              buttonRefs.current[d] = el;
            }}
            type="button"
            onClick={() => onChange(d)}
            aria-current={isSelected ? "step" : undefined}
            className={`relative z-10 w-12 h-13 sm:w-14 sm:h-14 min-w-[48px] sm:min-w-[54px] p-0 flex flex-col items-center justify-center font-mono rounded-xl cursor-pointer transition-colors duration-300 bg-transparent border-0 outline-none shrink-0 ${
              isSelected
                ? "nav-item-active font-bold text-white dark:text-black"
                : "text-[#8B8B87] hover:text-white"
            }`}
            title={`Select Forecast Lead Day ${d} (${dayRiskPct}% Bust Risk)`}
          >
            <span className="leading-none text-xs sm:text-sm font-bold">D{d}</span>
            <span
              className={`scrubber-dot ${
                isSelected
                  ? "scrubber-dot-selected scale-110"
                  : isHigh
                  ? "scrubber-dot-high"
                  : isMod
                  ? "scrubber-dot-mod"
                  : "scrubber-dot-low"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}

