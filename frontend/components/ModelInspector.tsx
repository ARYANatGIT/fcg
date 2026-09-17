"use client";

import React from "react";
import { ShieldCheck, Cpu, BarChart2, CheckCircle2, AlertCircle } from "lucide-react";

const MODEL_BENCHMARK = [
  {
    model: "LightGBM (Primary)",
    type: "Gradient Boosted Trees (GBDT)",
    valPrAuc: "0.339",
    valRocAuc: "0.752",
    testPrAuc: "0.325",
    testRocAuc: "0.739",
    brier: "0.164",
    f1: "0.334",
    status: "ACTIVE DEPLOYED",
    isPrimary: true,
  },
  {
    model: "Random Forest",
    type: "Ensemble Bagging",
    valPrAuc: "0.321",
    valRocAuc: "0.739",
    testPrAuc: "0.327",
    testRocAuc: "0.743",
    brier: "0.171",
    f1: "0.341",
    status: "BENCHMARK",
    isPrimary: false,
  },
  {
    model: "Logistic Regression",
    type: "Linear Baseline (L2 Regularized)",
    valPrAuc: "0.213",
    valRocAuc: "0.617",
    testPrAuc: "0.187",
    testRocAuc: "0.585",
    brier: "0.208",
    f1: "0.219",
    status: "BASELINE",
    isPrimary: false,
  },
];

const GLOBAL_SHAP_FEATURES = [
  { rank: 1, feature: "forecast_rainfall", name: "Accumulated Rainfall (Log1p)", shap: 0.4767, pct: 100, role: "Primary convective miss signal" },
  { rank: 2, feature: "lead_day", name: "Forecast Lead Time", shap: 0.3663, pct: 76.8, role: "Medium-range compounding uncertainty" },
  { rank: 3, feature: "forecast_pressure", name: "Surface Atmospheric Pressure", shap: 0.2360, pct: 49.5, role: "Baroclinic low/trough intensity" },
  { rank: 4, feature: "forecast_temperature", name: "2m Air Temperature", shap: 0.2024, pct: 42.5, role: "Sensible heating / thermal gradient" },
  { rank: 5, feature: "forecast_wind_pressure_interact", name: "Wind × Pressure Interaction", shap: 0.1184, pct: 24.8, role: "Cyclonic vortex dynamic coupling" },
  { rank: 6, feature: "forecast_temp_humidity_interact", name: "Temp × Humidity Convective Index", shap: 0.0737, pct: 15.5, role: "Pre-convective CAPE proxy" },
  { rank: 7, feature: "forecast_wind_speed", name: "10m Wind Speed Magnitude", shap: 0.0692, pct: 14.5, role: "Frontal / squall momentum" },
  { rank: 8, feature: "forecast_humidity", name: "2m Relative Humidity", shap: 0.0572, pct: 12.0, role: "Boundary layer moisture availability" },
];

export default function ModelInspector() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-[#23252a] pb-4">
        <h2 className="text-[18px] font-[510] text-[#ffffff] flex items-center gap-2 tracking-[-0.012em]">
          <Cpu size={18} className="text-[#e4f222]" /> ML Architecture, Benchmark &amp; Explainability Deck
        </h2>
        <p className="text-[13px] text-[#8a8f98] mt-1">
          Detailed meteorological ML evaluation metrics, model comparison benchmarks, global SHAP feature hierarchy, and anti-leakage audit compliance.
        </p>
      </div>

      {/* Model Benchmark Table */}
      <div className="linear-card space-y-4">
        <div className="flex justify-between items-center border-b border-[#23252a] pb-3">
          <div>
            <h3 className="text-[15px] font-[510] text-[#ffffff]">
              Model Comparison &amp; Validation Benchmark
            </h3>
            <p className="text-[12px] text-[#8a8f98] mt-0.5">
              Evaluated strictly using chronological validation &amp; holdout test splits (PR-AUC prioritized due to ~10% positive bust imbalance).
            </p>
          </div>
          <span className="linear-badge font-linear-mono text-[11px]">
            CHRONOLOGICAL SPLIT (70 / 15 / 15)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] font-linear-mono border-collapse">
            <thead>
              <tr className="border-b border-[#23252a] text-[#8a8f98] text-[11px] uppercase tracking-wider">
                <th className="py-2.5 px-3">Model Architecture</th>
                <th className="py-2.5 px-3">Val PR-AUC</th>
                <th className="py-2.5 px-3">Val ROC-AUC</th>
                <th className="py-2.5 px-3">Test PR-AUC</th>
                <th className="py-2.5 px-3">Test ROC-AUC</th>
                <th className="py-2.5 px-3">Brier Score</th>
                <th className="py-2.5 px-3">F1-Score</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#23252a]/60">
              {MODEL_BENCHMARK.map((m) => (
                <tr
                  key={m.model}
                  className={`hover:bg-[#161718] transition ${m.isPrimary ? "bg-[#e4f222]/5" : ""}`}
                >
                  <td className="py-3 px-3 font-sans">
                    <span className="font-semibold text-[#ffffff] block">{m.model}</span>
                    <span className="text-[11px] text-[#8a8f98] font-linear-mono">{m.type}</span>
                  </td>
                  <td className="py-3 px-3 text-[#e4f222] font-semibold">{m.valPrAuc}</td>
                  <td className="py-3 px-3 text-[#ffffff]">{m.valRocAuc}</td>
                  <td className="py-3 px-3 text-[#02b8cc] font-semibold">{m.testPrAuc}</td>
                  <td className="py-3 px-3 text-[#ffffff]">{m.testRocAuc}</td>
                  <td className="py-3 px-3 text-[#27a644] font-semibold">{m.brier}</td>
                  <td className="py-3 px-3 text-[#ffffff]">{m.f1}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`linear-badge text-[10px] ${
                        m.isPrimary
                          ? "bg-[#e4f222]/15 text-[#e4f222] border-[#e4f222]/40"
                          : "text-[#8a8f98]"
                      }`}
                    >
                      {m.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two Column Section: Global SHAP + Leakage Certificate */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Global SHAP Hierarchy (7 cols) */}
        <div className="lg:col-span-7 linear-card space-y-4">
          <div className="flex justify-between items-center border-b border-[#23252a] pb-3">
            <div>
              <h3 className="text-[15px] font-[510] text-[#ffffff] flex items-center gap-2">
                <BarChart2 size={16} className="text-[#e4f222]" /> Global SHAP Feature Importance Hierarchy
              </h3>
              <p className="text-[12px] text-[#8a8f98] mt-0.5">
                Mean absolute SHAP value across 6,750 validation cases.
              </p>
            </div>
            <span className="linear-badge font-linear-mono text-[11px]">
              N = 19 FEATURES
            </span>
          </div>

          <div className="space-y-3">
            {GLOBAL_SHAP_FEATURES.map((f) => (
              <div key={f.feature} className="space-y-1">
                <div className="flex justify-between items-center text-[12px] font-linear-mono">
                  <span className="text-[#ffffff] font-medium font-sans flex items-center gap-2">
                    <span className="text-[#8a8f98] font-linear-mono w-4">#{f.rank}</span>
                    <span>{f.name}</span>
                  </span>
                  <span className="text-[#e4f222] font-semibold">|SHAP| = {f.shap.toFixed(4)}</span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-[#161718] h-2 rounded-full overflow-hidden border border-[#23252a]">
                  <div
                    className="h-full bg-gradient-to-r from-[#02b8cc] to-[#e4f222] rounded-full transition-all duration-500"
                    style={{ width: `${f.pct}%` }}
                  />
                </div>
                <div className="text-[11px] text-[#8a8f98] italic font-sans">
                  Role: {f.role}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Leakage Audit & Calibration Certificate (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="linear-card flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 border-b border-[#23252a] pb-3">
                <ShieldCheck size={20} className="text-[#27a644]" />
                <div>
                  <h3 className="text-[15px] font-[510] text-[#ffffff]">
                    Meteorological Integrity &amp; Anti-Leakage Audit
                  </h3>
                  <span className="text-[11px] font-linear-mono text-[#27a644]">
                    COMPLIANCE VERIFIED: 100% PASS
                  </span>
                </div>
              </div>

              <div className="space-y-3 text-[12px] font-sans">
                <div className="bg-[#161718] p-3 rounded-[6px] border border-[#23252a] space-y-1">
                  <div className="text-[#ffffff] font-medium flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-[#27a644]" />
                    Zero Observation Feature Leakage
                  </div>
                  <p className="text-[#8a8f98]">
                    Input matrix X strictly forbids any observation variable (&quot;observed_*&quot;) or error metric (&quot;error_*&quot;). Verified by automated runtime middleware.
                  </p>
                </div>

                <div className="bg-[#161718] p-3 rounded-[6px] border border-[#23252a] space-y-1">
                  <div className="text-[#ffffff] font-medium flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-[#27a644]" />
                    Strict Chronological Time Partitioning
                  </div>
                  <p className="text-[#8a8f98]">
                    Split strictly by forecast initialization time. Random cross-validation is mathematically forbidden to prevent time-series lookahead leakage.
                  </p>
                </div>

                <div className="bg-[#161718] p-3 rounded-[6px] border border-[#23252a] space-y-1">
                  <div className="text-[#ffffff] font-medium flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-[#27a644]" />
                    Isotonic Probability Calibration
                  </div>
                  <p className="text-[#8a8f98]">
                    Raw tree scores mapped to true probabilities via isotonic regression fitted exclusively on the validation set. Brier score optimized to 0.164.
                  </p>
                </div>

                <div className="bg-[#161718] p-3 rounded-[6px] border border-[#23252a] space-y-1">
                  <div className="text-[#ffffff] font-medium flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-[#27a644]" />
                    Historical Analogs Prior-Time Isolation
                  </div>
                  <p className="text-[#8a8f98]">
                    Analog nearest-neighbor search enforces t_init &lt; T_query. Historical cases cannot access future verification events.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#23252a] text-[11px] text-[#62666d] italic">
              Audit certified by automated Pytest test suite (48/48 tests passed).
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
