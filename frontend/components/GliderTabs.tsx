"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";

export interface GliderTabItem<T extends string = string> {
  id: T;
  label: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  tag?: string;
}

interface GliderTabsProps<T extends string = string> {
  tabs: GliderTabItem<T>[];
  activeTab: T;
  onChange: (id: T) => void;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function GliderTabs<T extends string = string>({
  tabs,
  activeTab,
  onChange,
  className = "",
  size = "md",
}: GliderTabsProps<T>) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const [gliderStyle, setGliderStyle] = useState<{ left: number; width: number }>({
    left: 0,
    width: 0,
  });
  const [isReady, setIsReady] = useState(false);

  const measure = useCallback(() => {
    const activeBtn = buttonRefs.current[activeTab];
    if (activeBtn && containerRef.current) {
      setGliderStyle({
        left: activeBtn.offsetLeft,
        width: activeBtn.offsetWidth,
      });
      setIsReady(true);
    }
  }, [activeTab]);

  useEffect(() => {
    measure();
    const handleResize = () => measure();
    window.addEventListener("resize", handleResize);

    const activeBtn = buttonRefs.current[activeTab];
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => measure());
      if (activeBtn) ro.observe(activeBtn);
      if (containerRef.current) ro.observe(containerRef.current);
    }

    if (typeof document !== "undefined" && (document as any).fonts?.ready) {
      (document as any).fonts.ready.then(measure);
    }

    const t1 = setTimeout(measure, 50);
    const t2 = setTimeout(measure, 200);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (ro) ro.disconnect();
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [measure, activeTab]);

  const paddingClasses =
    size === "sm"
      ? "px-3 py-1 text-[11px]"
      : size === "lg"
      ? "px-5 py-2.5 text-sm"
      : "px-4 py-2 text-xs";

  return (
    <div
      ref={containerRef}
      className={`nav-shell relative inline-flex items-center gap-1 p-1 rounded-full border border-white/10 bg-black/40 max-w-full overflow-x-auto select-none shrink-0 scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${className}`}
    >
      {/* Gliding Capsule (Anchored at top-1 bottom-1 left-0, perfectly positioned behind text) */}
      <div
        className="nav-glider pointer-events-none absolute top-1 bottom-1 left-0 rounded-full z-0 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] shadow-md"
        style={{
          transform: `translate3d(${gliderStyle.left}px, 0, 0)`,
          width: `${gliderStyle.width}px`,
          opacity: isReady && gliderStyle.width > 0 ? 1 : 0,
        }}
        aria-hidden="true"
      />

      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            ref={(el) => {
              buttonRefs.current[tab.id] = el;
            }}
            type="button"
            onClick={() => onChange(tab.id)}
            aria-current={isActive ? "step" : undefined}
            className={`relative z-10 ${paddingClasses} rounded-full font-mono-tech flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 transition-colors duration-300 font-semibold ${
              className?.includes("w-full") ? "flex-1" : ""
            } ${
              isActive
                ? "nav-item-active font-bold bg-transparent"
                : "text-[#8B8B87] hover:text-white"
            }`}
          >
            {Icon && (
              <Icon
                size={size === "sm" ? 12 : 14}
                className={`shrink-0 transition-colors duration-300 ${
                  isActive ? "text-inherit" : "text-[#8B8B87]"
                }`}
              />
            )}
            <span>{tab.label}</span>
            {tab.tag && (
              <span className={`text-[10px] ml-1 opacity-75 font-normal ${isActive ? "text-inherit" : "text-[#8B8B87]"}`}>
                {tab.tag}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
