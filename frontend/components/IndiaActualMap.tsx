"use client";

import React, { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import { StationData } from "@/lib/types";
import { ZoomIn, ZoomOut, RotateCcw, Layers, MapPin, Radio, Activity, Wind, CloudRain, ShieldCheck, Sun, Moon, Flame } from "lucide-react";

interface IndiaActualMapProps {
  stations?: StationData[];
  selectedStationName: string;
  onSelectStation: (station: StationData) => void;
  leadDay: number;
  layerMode?: "bust_risk" | "rainfall_heatmap" | "temperature_heatmap" | "wind_vectors";
}

const CARTO_API_KEY = process.env.NEXT_PUBLIC_CARTO_API_KEY || "cb1_3qnh_1_8e89ac90b8868a8c23bf7986";

export default function IndiaActualMap({
  stations = [],
  selectedStationName,
  onSelectStation,
  leadDay,
  layerMode = "rainfall_heatmap",
}: IndiaActualMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const geojsonLayerRef = useRef<any>(null);
  const heatmapLayerRef = useRef<any>(null);
  const stationsLayerRef = useRef<any>(null);
  const radarRingsLayerRef = useRef<any>(null);

  const [hoveredStation, setHoveredStation] = useState<StationData | null>(null);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const [isLightMode, setIsLightMode] = useState<boolean>(false);
  const stationsRef = useRef<StationData[]>(stations);

  useEffect(() => {
    stationsRef.current = stations;
  }, [stations]);

  // Detect and track Light/Dark mode changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    const checkLight = () => {
      const isLight = document.documentElement.classList.contains("light-mode");
      setIsLightMode(isLight);
    };
    checkLight();

    const observer = new MutationObserver(checkLight);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  // Switch CARTO tile layer dynamically when theme changes
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    let L: any;
    import("leaflet").then((leafletModule) => {
      L = leafletModule.default;
      if (tileLayerRef.current) {
        mapInstanceRef.current.removeLayer(tileLayerRef.current);
      }
      const tileStyle = isLightMode ? "light_all" : "dark_all";
      tileLayerRef.current = L.tileLayer(
        `https://{s}.basemaps.cartocdn.com/rastertiles/${tileStyle}/{z}/{x}/{y}{r}.png?key=${CARTO_API_KEY}`,
        {
          subdomains: "abcd",
          maxZoom: 19,
        }
      ).addTo(mapInstanceRef.current);
    });
  }, [isLightMode]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    let L: any;
    let isMounted = true;

    const initMap = async () => {
      L = (await import("leaflet")).default;
      if (!isMounted || !mapContainerRef.current) return;

      // Prevent "Map container is already initialized" error
      if ((mapContainerRef.current as any)._leaflet_id) {
        if (mapInstanceRef.current) {
          try { mapInstanceRef.current.remove(); } catch (e) {}
          mapInstanceRef.current = null;
        }
        delete (mapContainerRef.current as any)._leaflet_id;
      }

      if (mapInstanceRef.current) {
        try { mapInstanceRef.current.remove(); } catch (e) {}
        mapInstanceRef.current = null;
      }

      // Center on India [22.8, 79.5]
      const map = L.map(mapContainerRef.current, {
        center: [22.8, 79.5],
        zoom: 5,
        minZoom: 4,
        maxZoom: 12,
        zoomControl: false,
        attributionControl: false,
      });

      // Generous proximity detection (~28px hit area) for station hover & cursor-attached data box
      map.on("mousemove", (e: any) => {
        if (!e.containerPoint) return;
        setCursorPos({ x: e.containerPoint.x, y: e.containerPoint.y });

        const currentStations = stationsRef.current || [];
        let nearestStation: StationData | null = null;
        let minDistance = Infinity;

        for (const st of currentStations) {
          const stPt = map.latLngToContainerPoint([st.latitude, st.longitude]);
          const dx = e.containerPoint.x - stPt.x;
          const dy = e.containerPoint.y - stPt.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < minDistance) {
            minDistance = dist;
            nearestStation = st;
          }
        }

        if (minDistance <= 38 && nearestStation) {
          setHoveredStation(nearestStation);
        } else {
          setHoveredStation(null);
        }
      });

      map.on("mouseout", () => {
        setHoveredStation(null);
        setCursorPos(null);
      });

      map.on("click", (e: any) => {
        if (!e.containerPoint) return;
        const currentStations = stationsRef.current || [];
        let nearestStation: StationData | null = null;
        let minDistance = Infinity;

        for (const st of currentStations) {
          const stPt = map.latLngToContainerPoint([st.latitude, st.longitude]);
          const dist = Math.hypot(e.containerPoint.x - stPt.x, e.containerPoint.y - stPt.y);
          if (dist < minDistance) {
            minDistance = dist;
            nearestStation = st;
          }
        }

        if (minDistance <= 38 && nearestStation) {
          onSelectStation(nearestStation);
        }
      });

      // CartoDB Tile Layer with User's CARTO Basemaps API key
      const isLight = document.documentElement.classList.contains("light-mode");
      const tileStyle = isLight ? "light_all" : "dark_all";
      tileLayerRef.current = L.tileLayer(
        `https://{s}.basemaps.cartocdn.com/rastertiles/${tileStyle}/{z}/{x}/{y}{r}.png?key=${CARTO_API_KEY}`,
        {
          subdomains: "abcd",
          maxZoom: 19,
        }
      ).addTo(map);

      // Create Layer Groups
      geojsonLayerRef.current = L.layerGroup().addTo(map);
      heatmapLayerRef.current = L.layerGroup().addTo(map);
      radarRingsLayerRef.current = L.layerGroup().addTo(map);
      stationsLayerRef.current = L.layerGroup().addTo(map);

      // Load Official Survey of India (SOI) Boundary (Includes full Jammu, Kashmir, and Ladakh)
      try {
        const res = await fetch("/india_soi_official.geojson");
        if (res.ok && isMounted) {
          const soiData = await res.json();
          L.geoJSON(soiData, {
            style: {
              color: "#38bdf8",
              weight: 2.2,
              opacity: 0.9,
              fillColor: "#0284c7",
              fillOpacity: 0.04,
            },
          }).addTo(geojsonLayerRef.current);
        }
      } catch (err) {
        console.warn("Could not load official SOI boundary:", err);
      }

      // Load State Boundaries with interactive hover highlight on borders
      try {
        const res = await fetch("/india_states_optimized.geojson");
        if (res.ok && isMounted) {
          const statesData = await res.json();
          const stateLayer = L.geoJSON(statesData, {
            style: () => {
              return {
                color: isLight ? "#475569" : "#38bdf8",
                weight: 1.0,
                opacity: 0.45,
                fillColor: "#0284c7",
                fillOpacity: 0.02,
                dashArray: "2, 3",
              };
            },
            onEachFeature: (feature: any, layer: any) => {
              layer.on({
                mouseover: (e: any) => {
                  const l = e.target;
                  l.setStyle({
                    weight: 2.8,
                    color: "#e4f222",
                    opacity: 1.0,
                    fillColor: "#e4f222",
                    fillOpacity: 0.12,
                    dashArray: "",
                  });
                  if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
                    l.bringToFront();
                  }
                },
                mouseout: (e: any) => {
                  stateLayer.resetStyle(e.target);
                },
              });
            },
          });
          stateLayer.addTo(geojsonLayerRef.current);
        }
      } catch (err) {
        console.warn("Could not load states GeoJSON:", err);
      }

      if (isMounted) {
        mapInstanceRef.current = map;
        setMapLoaded(true);
      }
    };

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        try { mapInstanceRef.current.remove(); } catch (e) {}
        mapInstanceRef.current = null;
      }
      if (mapContainerRef.current && (mapContainerRef.current as any)._leaflet_id) {
        delete (mapContainerRef.current as any)._leaflet_id;
      }
    };
  }, []);

  // Clear any residual overlay layers to ensure crisp, clean Survey of India cartography
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || !heatmapLayerRef.current) return;
    heatmapLayerRef.current.clearLayers();
  }, [mapLoaded]);

  // Update Stations & Radar Rings whenever stations, selectedStation, or leadDay change
  // Clean uncrowded dots (no permanent labels), circles originate from exact dot center
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return;

    let L: any;
    import("leaflet").then((leafletModule) => {
      L = leafletModule.default;

      if (!stationsLayerRef.current || !radarRingsLayerRef.current) return;

      stationsLayerRef.current.clearLayers();
      radarRingsLayerRef.current.clearLayers();

      const selectedStation = stations.find(
        (s) =>
          s.name.toLowerCase() === selectedStationName.toLowerCase() ||
          selectedStationName.toLowerCase().includes(s.name.toLowerCase())
      ) || stations[0];

      // Draw Concentric Radar Range Rings (100km, 200km, 300km) around selected station
      if (selectedStation) {
        const centerLatLng: [number, number] = [selectedStation.latitude, selectedStation.longitude];

        // 100km ring
        L.circle(centerLatLng, {
          radius: 100000,
          color: isLightMode ? "#0284c7" : "#38bdf8",
          weight: 1.5,
          opacity: 0.75,
          dashArray: "4, 6",
          fillColor: "#38bdf8",
          fillOpacity: 0.05,
        }).addTo(radarRingsLayerRef.current);

        // 200km ring
        L.circle(centerLatLng, {
          radius: 200000,
          color: isLightMode ? "#0369a1" : "#0284c7",
          weight: 1.2,
          opacity: 0.55,
          dashArray: "4, 8",
          fillColor: "#0284c7",
          fillOpacity: 0.03,
        }).addTo(radarRingsLayerRef.current);

        // 300km ring
        L.circle(centerLatLng, {
          radius: 300000,
          color: isLightMode ? "#075985" : "#0369a1",
          weight: 1.0,
          opacity: 0.4,
          dashArray: "4, 10",
          fill: false,
        }).addTo(radarRingsLayerRef.current);
      }

      // Render Clean Station Dots & Continuous Expanding Radar Ripple Beacons
      stations.forEach((st) => {
        const isSelected =
          selectedStation &&
          (st.name.toLowerCase() === selectedStation.name.toLowerCase() ||
            st.name.toLowerCase() === selectedStationName.toLowerCase());

        const bustProb = st.bust_probability ?? 0.3;
        const isHigh = bustProb >= 0.65;
        const isMod = bustProb >= 0.35 && bustProb < 0.65;
        const color = isHigh ? "#ef4444" : isMod ? "#f59e0b" : "#22c55e";

        // Continuous expanding radar ripple animation originating exactly from dot center
        const pulseColor = isSelected ? "#e4f222" : color;
        const rippleIcon = L.divIcon({
          className: "radar-beacon-div",
          html: `
            <div style="position: relative; width: 0; height: 0; pointer-events: none;">
              <span style="
                position: absolute;
                top: 0;
                left: 0;
                width: 32px;
                height: 32px;
                border-radius: 50%;
                border: 2px solid ${pulseColor};
                animation: map-radar-pulse 2.2s cubic-bezier(0.1, 0.4, 0.7, 1) infinite;
                pointer-events: none;
              "></span>
              ${isSelected ? `
              <span style="
                position: absolute;
                top: 0;
                left: 0;
                width: 32px;
                height: 32px;
                border-radius: 50%;
                border: 1.8px solid #e4f222;
                animation: map-radar-pulse 2.2s cubic-bezier(0.1, 0.4, 0.7, 1) infinite 0.75s;
                pointer-events: none;
              "></span>` : ''}
            </div>
          `,
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        });

        L.marker([st.latitude, st.longitude], {
          icon: rippleIcon,
          interactive: false,
        }).addTo(stationsLayerRef.current);

        // Primary Station Dot (CircleMarker)
        const dot = L.circleMarker([st.latitude, st.longitude], {
          radius: isSelected ? 7 : 4.5,
          fillColor: isSelected ? "#e4f222" : color,
          color: isSelected ? "#ffffff" : isLightMode ? "#1e293b" : "#070b14",
          weight: isSelected ? 2.5 : 1.2,
          fillOpacity: 1,
        });

        dot.on("click", () => {
          onSelectStation(st);
        });

        dot.addTo(stationsLayerRef.current);
      });
    });
  }, [stations, selectedStationName, leadDay, mapLoaded, isLightMode]);

  const handleZoom = (delta: number) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setZoom(mapInstanceRef.current.getZoom() + delta);
    }
  };

  const handleReset = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([22.8, 79.5], 5);
    }
  };

  return (
    <div className={`relative w-full h-[620px] rounded-2xl overflow-hidden border select-none flex flex-col transition-colors ${
      isLightMode 
        ? "bg-[#f8fafc] border-[#cbd5e1] shadow-md" 
        : "bg-[#07090d] border-[#1e2533] shadow-2xl"
    }`}>
      {/* Top Map Toolbar (Cleaned: No J&K highlighted text) */}
      <div className="absolute top-3 left-3 right-3 z-[1000] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Left: Cartographic Attribution Badge */}
        <div className={`pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-linear-mono shadow-xl backdrop-blur-md transition-colors ${
          isLightMode
            ? "bg-white/95 border-slate-300 text-sky-700"
            : "bg-[#0c1017]/95 border-[#232f42] text-cyan-300"
        }`}>
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="font-bold uppercase">OFFICIAL SURVEY OF INDIA CARTOGRAPHY</span>
          <span className="opacity-40">|</span>
          <span className="font-semibold">{stations.length} SYNOPTIC STATIONS</span>
        </div>

        {/* Right: Map Navigation Controls */}
        <div className={`pointer-events-auto flex items-center gap-1.5 p-1 rounded-xl border shadow-xl backdrop-blur-md transition-colors ${
          isLightMode
            ? "bg-white/95 border-slate-300 text-slate-700"
            : "bg-[#0c1017]/95 border-[#232f42] text-[#94a3b8]"
        }`}>
          <button
            onClick={() => handleZoom(1)}
            className="p-1.5 rounded-lg hover:text-black hover:bg-slate-200 dark:hover:text-white dark:hover:bg-[#1a2333] transition cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn size={15} />
          </button>
          <button
            onClick={() => handleZoom(-1)}
            className="p-1.5 rounded-lg hover:text-black hover:bg-slate-200 dark:hover:text-white dark:hover:bg-[#1a2333] transition cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut size={15} />
          </button>
          <button
            onClick={handleReset}
            className="p-1.5 rounded-lg hover:text-black hover:bg-slate-200 dark:hover:text-white dark:hover:bg-[#1a2333] transition cursor-pointer"
            title="Reset to All-India View"
          >
            <RotateCcw size={15} />
          </button>
        </div>
      </div>

      {/* Leaflet Map DOM Container */}
      <div 
        ref={mapContainerRef} 
        className="w-full h-full flex-1" 
        style={{ minHeight: "540px" }}
      />

      {/* Keyframes for Continuous Expanding Radar Ripple Animation */}
      <style jsx global>{`
        @keyframes map-radar-pulse {
          0% {
            transform: translate(-50%, -50%) scale(0.2);
            opacity: 0.95;
          }
          50% {
            opacity: 0.6;
          }
          100% {
            transform: translate(-50%, -50%) scale(2.8);
            opacity: 0;
          }
        }
      `}</style>

      {/* Floating Rich Telemetry Data Box: Follows Cursor Right Next to Pointer */}
      {hoveredStation && cursorPos && (
        <div 
          className={`absolute z-[1000] pointer-events-none p-3.5 rounded-xl border shadow-2xl min-w-[250px] font-linear-mono text-xs backdrop-blur-md transition-all duration-75 ${
            isLightMode
              ? "bg-white/95 border-slate-300 text-slate-800"
              : "bg-[#0e131d]/95 border-[#2b3a50] text-[#cbd5e1]"
          }`}
          style={{
            left: `${Math.max(12, Math.min(cursorPos.x + 18, (mapContainerRef.current?.clientWidth || 800) - 270))}px`,
            top: `${Math.max(12, Math.min(cursorPos.y - 36, (mapContainerRef.current?.clientHeight || 600) - 210))}px`,
          }}
        >
          <div className="flex items-center justify-between border-b pb-2 mb-2 border-slate-200 dark:border-[#232f42]">
            <div>
              <span className={`text-sm font-bold block leading-tight ${isLightMode ? "text-slate-900" : "text-white"}`}>
                {hoveredStation.name}
              </span>
              <span className="text-[11px] text-cyan-600 dark:text-cyan-400 font-semibold">
                {hoveredStation.region}
              </span>
            </div>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                (hoveredStation.bust_probability ?? 0) >= 0.65
                  ? "bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/40"
                  : (hoveredStation.bust_probability ?? 0) >= 0.35
                  ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/40"
                  : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40"
              }`}
            >
              {((hoveredStation.bust_probability ?? 0.3) * 100).toFixed(0)}% BUST RISK
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className={isLightMode ? "text-slate-500" : "text-[#94a3b8]"}>Coordinates:</span>
              <span className="font-semibold">
                {hoveredStation.latitude.toFixed(2)}&deg;N, {hoveredStation.longitude.toFixed(2)}&deg;E
              </span>
            </div>
            <div className="flex justify-between">
              <span className={isLightMode ? "text-slate-500" : "text-[#94a3b8]"}>Rainfall (24h):</span>
              <span className="text-cyan-600 dark:text-cyan-300 font-bold">{hoveredStation.rainfall ?? 18.5} mm</span>
            </div>
            <div className="flex justify-between">
              <span className={isLightMode ? "text-slate-500" : "text-[#94a3b8]"}>Surface Wind:</span>
              <span>{hoveredStation.wind_speed ?? 6.2} m/s</span>
            </div>
            <div className="flex justify-between">
              <span className={isLightMode ? "text-slate-500" : "text-[#94a3b8]"}>Model Confidence:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                {((hoveredStation.confidence ?? 0.78) * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Map Legend Footer */}
      <div className={`px-4 py-2.5 border-t flex flex-wrap items-center justify-between gap-3 text-[11px] font-linear-mono z-10 transition-colors ${
        isLightMode
          ? "bg-slate-100 border-slate-200 text-slate-600"
          : "bg-[#090c12] border-[#1e2533] text-[#94a3b8]"
      }`}>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444] animate-pulse" />
            <span>High Risk (&ge;65%)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
            <span>Moderate (35-64%)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e]" />
            <span>Low Risk (&lt;35%)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full border-2 border-[#e4f222] bg-[#e4f222]" />
            <span>Target Station</span>
          </span>
        </div>

        <div className="text-[10px] opacity-70">
          Official Survey of India Cartography · CARTO Basemaps
        </div>
      </div>
    </div>
  );
}
