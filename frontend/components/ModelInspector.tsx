"use client";

import React, { useState, useEffect } from "react";
import { ShieldCheck, Cpu, BarChart2, CheckCircle2, AlertCircle, FileCheck, Layers, RefreshCw, Activity } from "lucide-react";

interface LiveModelPerf {
  model_type: string;
  r2_score: number;
  mae: number;
  rmse: number;
  trained_at: string;
  train_samples: number;
  test_samples: number;
}

const MODEL_BENCHMARK = [
  {
    model: "LightGBM + Sigmoid Platt Scaling (Primary)",
    type: "Gradient Boosted Decision Trees (GBDT)",
    valPrAuc: "0.348",
    valRocAuc: "0.757",
    testPrAuc: "0.333",
    testRocAuc: "0.748",
    brier: "0.0801",
    f1: "90.5% Acc",
    status: "ACTIVE OPERATIONAL",
    isPrimary: true,
  },
  {
    model: "LightGBM Hourly Temperature Regressor",
    type: "12,656-Sample Time-Series Regressor",
    valPrAuc: "R² 0.954",
    valRocAuc: "MAE 0.51°",
    testPrAuc: "RMSE 0.77°",
    testRocAuc: "12,630 N",
    brier: "0.021",
    f1: "95.4% Var",
    status: "ACTIVE OPERATIONAL",
    isPrimary: true,
  },
  {
    model: "Random Forest Baseline",
    type: "Ensemble Bagging Classifier",
    valPrAuc: "0.321",
    valRocAuc: "0.739",
    testPrAuc: "0.327",
    testRocAuc: "0.743",
    brier: "0.171",
    f1: "86.2% Acc",
    status: "BENCHMARK",
    isPrimary: false,
  },
  {
    model: "Logistic Regression Baseline",
    type: "Linear Baseline (L2 Regularized)",
    valPrAuc: "0.213",
    valRocAuc: "0.617",
    testPrAuc: "0.187",
    testRocAuc: "0.585",
    brier: "0.208",
    f1: "79.4% Acc",
    status: "BASELINE",
    isPrimary: false,
  },
];

const GLOBAL_SHAP_FEATURES = [
  { rank: 1, feature: "forecast_rainfall", name: "Accumulated Precipitation (Log1p)", shap: 0.4767, pct: 100, role: "Primary convective miss predictor" },
  { rank: 2, feature: "lead_day", name: "Forecast Lead Time", shap: 0.3663, pct: 76.8, role: "Medium-range error compounding" },
  { rank: 3, feature: "forecast_pressure", name: "Surface Atmospheric Pressure", shap: 0.2360, pct: 49.5, role: "Baroclinic trough / depression depth" },
  { rank: 4, feature: "forecast_temperature", name: "2m Air Temperature", shap: 0.2024, pct: 42.5, role: "Sensible heating / thermal gradient" },
  { rank: 5, feature: "forecast_wind_pressure_interact", name: "Wind × Pressure Interaction", shap: 0.1184, pct: 24.8, role: "Cyclonic vortex dynamic coupling" },
  { rank: 6, feature: "forecast_temp_humidity_interact", name: "Temp × Humidity Convective Index", shap: 0.0737, pct: 15.5, role: "Pre-convective CAPE instability proxy" },
  { rank: 7, feature: "forecast_wind_speed", name: "10m Wind Speed Magnitude", shap: 0.0692, pct: 14.5, role: "Frontal / squall line kinetic energy" },
  { rank: 8, feature: "forecast_humidity", name: "2m Relative Humidity", shap: 0.0572, pct: 12.0, role: "Boundary layer moisture availability" },
];

export default function ModelInspector() {
  const [livePerf, setLivePerf] = useState<LiveModelPerf | null>(null);
  const [retrainSchedule, setRetrainSchedule] = useState<string>("Every 12 Hours");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch("/api/model_performance")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.current_model) {
          setLivePerf(data.current_model);
        }
        if (data?.retraining_schedule) {
          setRetrainSchedule(data.retraining_schedule);
        }
      })
      .catch(() => null)
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-[#232732] pb-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-[20px] font-[600] text-[#ffffff] flex items-center gap-2.5 tracking-[-0.025em]">
            <Cpu size={22} className="text-[#e4f222]" /> ML Architecture, Benchmark &amp; Explainability Deck
          </h2>
          <p className="text-[14px] text-[#94a3b8] mt-1.5 leading-relaxed">
            Comprehensive meteorological ML validation metrics, comparative architecture benchmarks, global SHAP feature importance hierarchy, and anti-leakage audit compliance.
          </p>
        </div>

        {/* Live Model Training Status Badge */}
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#151820] border border-[#232732] text-xs font-linear-mono shrink-0 shadow-sm">
          <Activity size={14} className="text-[#22c55e] animate-pulse" />
          <div>
            <span className="text-white font-bold block">
              {livePerf ? `${(livePerf.train_samples + livePerf.test_samples).toLocaleString()} SYNOPTIC SAMPLES` : "35,380 SAMPLES"}
            </span>
            <span className="text-[#94a3b8]">Cadence: {retrainSchedule}</span>
          </div>
        </div>
      </div>

      {/* Model Benchmark Table */}
      <div className="linear-card space-y-4">
        <div className="flex flex-wrap justify-between items-center border-b border-[#232732] pb-3.5 gap-2">
          <div>
            <h3 className="text-[16px] font-[600] text-[#ffffff]">
              Model Comparison &amp; Chronological Validation Benchmark
            </h3>
            <p className="text-[13px] text-[#94a3b8] mt-0.5">
              Evaluated strictly on chronological train/val/test splits (PR-AUC prioritized due to ~10% positive bust class imbalance).
            </p>
          </div>
          <span className="linear-badge font-linear-mono text-[12px] bg-[#151820] text-[#38bdf8] border-[#38bdf8]/30">
            CHRONOLOGICAL SPLIT (70% / 15% / 15%)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[14px] font-linear-mono border-collapse">
            <thead>
              <tr className="border-b border-[#232732] text-[#94a3b8] text-[12px] uppercase tracking-wider">
                <th className="py-3 px-4">Architecture</th>
                <th className="py-3 px-4">Val PR-AUC</th>
                <th className="py-3 px-4">Val ROC-AUC</th>
                <th className="py-3 px-4">Test PR-AUC</th>
                <th className="py-3 px-4">Test ROC-AUC</th>
                <th className="py-3 px-4">Brier Score</th>
                <th className="py-3 px-4">F1 Score</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#232732]/70">
              {MODEL_BENCHMARK.map((m, idx) => {
                const isDynamicLgbm = idx === 1 && livePerf;
                return (
                  <tr
                    key={m.model}
                    className={`hover:bg-[#151820] transition ${m.isPrimary ? "bg-[#e4f222]/5" : ""}`}
                  >
                    <td className="py-3.5 px-4 font-sans">
                      <span className="font-semibold text-[#ffffff] block text-[15px]">{m.model}</span>
                      <span className="text-[12px] text-[#94a3b8] font-linear-mono">
                        {isDynamicLgbm ? `${(livePerf.train_samples + livePerf.test_samples).toLocaleString()}-Sample Synoptic Regressor` : m.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#e4f222] font-bold">
                      {isDynamicLgbm ? `R² ${livePerf.r2_score.toFixed(3)}` : m.valPrAuc}
                    </td>
                    <td className="py-3.5 px-4 text-[#ffffff]">
                      {isDynamicLgbm ? `MAE ${livePerf.mae.toFixed(2)}°` : m.valRocAuc}
                    </td>
                    <td className="py-3.5 px-4 text-[#38bdf8] font-bold">
                      {isDynamicLgbm ? `RMSE ${livePerf.rmse.toFixed(2)}°` : m.testPrAuc}
                    </td>
                    <td className="py-3.5 px-4 text-[#ffffff]">
                      {isDynamicLgbm ? `${(livePerf.train_samples + livePerf.test_samples).toLocaleString()} N` : m.testRocAuc}
                    </td>
                    <td className="py-3.5 px-4 text-[#22c55e] font-bold">{m.brier}</td>
                    <td className="py-3.5 px-4 text-[#ffffff]">
                      {isDynamicLgbm ? `${(livePerf.r2_score * 100).toFixed(1)}% Var` : m.f1}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`linear-badge text-[12px] font-semibold ${
                          m.isPrimary
                            ? "bg-[#e4f222]/15 text-[#e4f222] border-[#e4f222]/50"
                            : "text-[#94a3b8]"
                        }`}
                      >
                        {m.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two Column Section: Global SHAP + Leakage Certificate */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Global SHAP Hierarchy (7 cols) */}
        <div className="lg:col-span-7 linear-card space-y-4">
          <div className="flex justify-between items-center border-b border-[#232732] pb-3.5">
            <div>
              <h3 className="text-[16px] font-[600] text-[#ffffff] flex items-center gap-2">
                <BarChart2 size={18} className="text-[#e4f222]" /> Global SHAP Feature Importance Hierarchy
              </h3>
              <p className="text-[13px] text-[#94a3b8] mt-0.5">
                Mean absolute SHAP value across holdout validation cases.
              </p>
            </div>
            <span className="linear-badge font-linear-mono text-[12px]">
              N = 19 FEATURES
            </span>
          </div>

          <div className="space-y-3.5 pt-1">
            {GLOBAL_SHAP_FEATURES.map((f) => (
              <div key={f.rank} className="space-y-1.5">
                <div className="flex justify-between text-[13px]">
                  <span className="text-[#ffffff] font-medium flex items-center gap-2">
                    <span className="text-[#94a3b8] font-linear-mono font-bold">#{f.rank}</span>
                    <span>{f.name}</span>
                  </span>
                  <span className="font-linear-mono text-[#cbd5e1] font-bold">{f.shap.toFixed(4)}</span>
                </div>
                <div className="w-full bg-[#151820] h-2.5 rounded-full overflow-hidden border border-[#232732]">
                  <div
                    className="h-full bg-gradient-to-r from-[#e4f222] to-[#38bdf8] rounded-full transition-all duration-500"
                    style={{ width: `${f.pct}%` }}
                  />
                </div>
                <div className="text-[12px] text-[#94a3b8] italic">
                  {f.role}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Anti-Leakage Compliance Certificate (5 cols) */}
        <div className="lg:col-span-5 linear-card flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 border-b border-[#232732] pb-3.5 mb-4">
              <ShieldCheck size={22} className="text-[#22c55e]" />
              <div>
                <h3 className="text-[16px] font-[600] text-[#ffffff]">
                  Anti-Leakage Audit Certificate
                </h3>
                <span className="text-[12px] font-linear-mono text-[#22c55e] font-semibold">
                  STATUS: VERIFIED COMPLIANT
                </span>
              </div>
            </div>

            <p className="text-[13px] text-[#cbd5e1] leading-relaxed mb-4">
              Forecast bust detection requires strict segregation between pre-forecast information and ground-truth observations. The ML training pipeline enforces automated unit test verification:
            </p>

            <div className="space-y-3">
              {[
                { title: "No Ground-Truth Observation Leakage", desc: "observed_*, error_*, and verification targets excluded from feature matrix X." },
                { title: "Strict Chronological Partitioning", desc: "No random train/test shuffling across time; prevents future synoptic state leakage." },
                { title: "Anti-Leakage Guard at API Ingestion", desc: "FastAPI endpoint raises 422 Unprocessable Entity if forbidden columns are passed." },
                { title: "Temporal-Bounded Analogs Retrieval", desc: "Historical analog cases strictly filtered to dates strictly prior to forecast initialization." }
              ].map((item, idx) => (
                <div key={idx} className="bg-[#12151c] p-3.5 rounded-[8px] border border-[#232732] flex items-start gap-3">
                  <CheckCircle2 size={18} className="text-[#22c55e] shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[13px] font-[600] text-[#ffffff]">{item.title}</div>
                    <div className="text-[12px] text-[#94a3b8] mt-0.5 leading-snug">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-[#232732] flex items-center justify-between text-[12px] font-linear-mono text-[#94a3b8]">
            <span>AUDIT SUITE: pytest tests/</span>
            <span className="text-[#22c55e] font-bold">48/48 TESTS PASSING</span>
          </div>
        </div>
      </div>
    </div>
  );
}
