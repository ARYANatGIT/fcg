"use client";

import React, { useState } from "react";
import { 
  Database, 
  Download, 
  Key, 
  Copy, 
  Check, 
  Code, 
  Terminal, 
  ShieldCheck, 
  ExternalLink, 
  RefreshCw, 
  FileText, 
  FileSpreadsheet, 
  FileArchive,
  AlertCircle
} from "lucide-react";

export default function OpenDataApiHub() {
  const [apiKey, setApiKey] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [agencyName, setAgencyName] = useState<string>("Regional Meteorological Division");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [activeCodeTab, setActiveCodeTab] = useState<"curl" | "python" | "node">("python");
  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null);

  const handleGenerateKey = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const randomHex = Array.from({ length: 24 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join("");
      setApiKey(`fg_live_${randomHex}`);
      setIsGenerating(false);
    }, 500);
  };

  const handleCopyKey = () => {
    if (!apiKey) return;
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadDataset = (format: "json" | "zip" | "csv") => {
    setDownloadingFormat(format);
    // Trigger download via API endpoint or blob
    const downloadUrl = `http://127.0.0.1:8000/api/export/dataset?format=${format}`;
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.setAttribute("download", `forecastguard_full_dataset_${new Date().toISOString().slice(0,10)}.${format}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setDownloadingFormat(null);
    }, 1500);
  };

  const codeSnippets = {
    curl: `# Query live bust probability & SHAP attribution for New Delhi
curl -X GET "http://127.0.0.1:8000/api/latest_prediction?station=New%20Delhi&lead_day=5" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Accept: application/json"`,

    python: `import requests

API_KEY = "${apiKey}"
BASE_URL = "http://127.0.0.1:8000/api"

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Accept": "application/json"
}

# 1. Fetch live prediction & SHAP attribution
response = requests.get(
    f"{BASE_URL}/latest_prediction",
    params={"station": "New Delhi", "lead_day": 5},
    headers=headers
)
data = response.json()
print("Calibrated Bust Risk:", data["data"]["prediction_and_explanation"]["bust_probability"])

# 2. Fetch spatial grid of all 43 stations
spatial_res = requests.get(f"{BASE_URL}/spatial_grid?lead_day=5", headers=headers)
stations = spatial_res.json()["data"]["stations"]
print(f"Loaded {len(stations)} synoptic telemetry nodes.")`,

    node: `// Node.js (v18+) Native Fetch
const API_KEY = "${apiKey}";
const BASE_URL = "http://127.0.0.1:8000/api";

async function getForecastGuardTelemetry() {
  const res = await fetch(\`\${BASE_URL}/latest_prediction?station=Mumbai&lead_day=5\`, {
    headers: {
      "Authorization": \`Bearer \${API_KEY}\`,
      "Accept": "application/json"
    }
  });
  
  const result = await res.json();
  console.log("Prediction Details:", result.data.prediction_and_explanation);
}

getForecastGuardTelemetry();`
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="linear-card flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <Database className="text-[#e4f222]" size={22} />
            <h2 className="text-xl font-bold text-white tracking-tight">
              Developer API &amp; Open Data Hub
            </h2>
            <span className="px-2.5 py-0.5 rounded text-[11px] font-linear-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-semibold">
              MoES Open Data Initiative
            </span>
          </div>
          <p className="text-sm text-[#94a3b8]">
            Access high-frequency NWP forecast bust datasets, verified analog archives, and production REST APIs for operational and meteorological researchers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#121722] border border-[#232f42] text-xs font-linear-mono text-[#cbd5e1]">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>Open Science License (CC-BY 4.0)</span>
          </div>
        </div>
      </div>

      {/* Grid: Dataset Downloads (6 Cols) + API Key Manager (6 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Complete Dataset Export Downloads */}
        <div className="lg:col-span-6 linear-card flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between border-b border-[#232732] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Download size={18} className="text-cyan-400" />
                <h3 className="text-base font-semibold text-white">Full Dataset Downloads</h3>
              </div>
              <span className="text-xs font-linear-mono text-[#94a3b8]">Updated: Hourly</span>
            </div>

            <p className="text-xs text-[#94a3b8] mb-4">
              Download complete medium-range NWP predictions (D1–D10), historical bust records, atmospheric variables, and SHAP attribution vectors across 43 Indian meteorological stations.
            </p>

            <div className="space-y-3">
              {/* JSON Dataset */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#121722] border border-[#1e2738] hover:border-cyan-500/40 transition">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                    <FileText size={20} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">Complete Telemetry &amp; Forecast Archive</div>
                    <div className="text-xs text-[#94a3b8] font-linear-mono">JSON Format · ~4.2 MB · Multi-Station Grid</div>
                  </div>
                </div>
                <button
                  onClick={() => handleDownloadDataset("json")}
                  disabled={downloadingFormat === "json"}
                  className="px-3 py-1.5 rounded-lg bg-[#1a2333] hover:bg-cyan-600 hover:text-white text-cyan-300 border border-cyan-500/30 text-xs font-linear-mono flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Download size={13} />
                  <span>{downloadingFormat === "json" ? "Downloading..." : "JSON"}</span>
                </button>
              </div>

              {/* ZIP Archive */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#121722] border border-[#1e2738] hover:border-cyan-500/40 transition">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#e4f222]/10 border border-[#e4f222]/20 flex items-center justify-center text-[#e4f222]">
                    <FileArchive size={20} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">Raw NetCDF/GRIB &amp; Station CSV Package</div>
                    <div className="text-xs text-[#94a3b8] font-linear-mono">ZIP Bundle · Includes Parquet &amp; Metadata</div>
                  </div>
                </div>
                <button
                  onClick={() => handleDownloadDataset("zip")}
                  disabled={downloadingFormat === "zip"}
                  className="px-3 py-1.5 rounded-lg bg-[#1a2333] hover:bg-[#e4f222] hover:text-[#08090a] text-[#e4f222] border border-[#e4f222]/30 text-xs font-linear-mono flex items-center gap-1.5 transition cursor-pointer font-bold"
                >
                  <Download size={13} />
                  <span>{downloadingFormat === "zip" ? "Downloading..." : "ZIP"}</span>
                </button>
              </div>

              {/* CSV Format */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#121722] border border-[#1e2738] hover:border-cyan-500/40 transition">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <FileSpreadsheet size={20} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">43 Stations Observation Time-Series</div>
                    <div className="text-xs text-[#94a3b8] font-linear-mono">CSV Format · Compatible with Excel / Pandas</div>
                  </div>
                </div>
                <button
                  onClick={() => handleDownloadDataset("csv")}
                  disabled={downloadingFormat === "csv"}
                  className="px-3 py-1.5 rounded-lg bg-[#1a2333] hover:bg-emerald-600 hover:text-white text-emerald-300 border border-emerald-500/30 text-xs font-linear-mono flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Download size={13} />
                  <span>{downloadingFormat === "csv" ? "Downloading..." : "CSV"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Data Usage Notice */}
          <div className="p-3 rounded-lg bg-[#0a0d14] border border-[#1e2533] text-[11px] text-[#64748b] flex items-center gap-2 font-linear-mono">
            <AlertCircle size={14} className="shrink-0 text-cyan-400" />
            <span>Open for academic research, operational meteorological forecasting, and NWP model verification.</span>
          </div>
        </div>

        {/* Right: API Key Generator & Key Management */}
        <div className="lg:col-span-6 linear-card flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between border-b border-[#232732] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Key size={18} className="text-[#e4f222]" />
                <h3 className="text-base font-semibold text-white">Developer API Key Generator</h3>
              </div>
              <span className="text-xs font-linear-mono text-emerald-400 font-semibold">Quota: 1,000 Req/Day</span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-linear-mono text-[#cbd5e1] mb-1.5">
                  Organization / Agency Name:
                </label>
                <input
                  type="text"
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                  className="w-full bg-[#121722] border border-[#1e2738] rounded-lg px-3.5 py-2 text-sm text-white font-linear-mono focus:outline-none focus:border-cyan-400"
                  placeholder="e.g. Atmospheric Research Lab, State Met Centre..."
                />
              </div>

              <div>
                <label className="block text-xs font-linear-mono text-[#cbd5e1] mb-1.5">
                  Production API Key:
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-[#090c12] border border-[#232f42] rounded-lg px-3 py-2 text-xs font-mono select-all overflow-x-auto min-h-[38px] flex items-center">
                    {apiKey ? (
                      <span className="text-cyan-300 font-bold">{apiKey}</span>
                    ) : (
                      <span className="text-[#64748b] italic">Click &quot;Generate New Key&quot; to create your API credentials</span>
                    )}
                  </div>
                  {apiKey && (
                    <button
                      onClick={handleCopyKey}
                      className="px-3 py-2 rounded-lg bg-[#151c28] hover:bg-[#1f293a] border border-[#232f42] text-white text-xs font-linear-mono flex items-center gap-1.5 transition cursor-pointer shrink-0"
                      title="Copy API Key"
                    >
                      {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      <span>{copied ? "Copied" : "Copy"}</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  onClick={handleGenerateKey}
                  disabled={isGenerating}
                  className="px-4 py-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-linear-mono font-semibold flex items-center gap-2 transition cursor-pointer"
                >
                  <RefreshCw size={13} className={isGenerating ? "animate-spin" : ""} />
                  <span>{isGenerating ? "Generating..." : "Generate New Key"}</span>
                </button>
                <span className="text-[11px] font-linear-mono text-[#64748b]">
                  Bearer Token Auth &middot; TLS 1.3
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#0a0d14] border border-[#1e2533] text-[11px] font-linear-mono text-[#64748b] flex items-center justify-between">
            <span>Daily Rate: 1,000 requests/day</span>
            <span>Status: {apiKey ? "ACTIVE" : "READY"}</span>
          </div>
        </div>
      </div>

      {/* Code Snippets & Integration SDK */}
      <div className="linear-card space-y-4">
        <div className="flex flex-wrap items-center justify-between border-b border-[#232732] pb-3 gap-3">
          <div className="flex items-center gap-2">
            <Code size={18} className="text-cyan-400" />
            <h3 className="text-base font-semibold text-white">Integration Code Snippets</h3>
          </div>

          {/* Language Switcher */}
          <div className="flex items-center gap-1 bg-[#121722] p-1 rounded-lg border border-[#1e2738]">
            <button
              onClick={() => setActiveCodeTab("python")}
              className={`px-3 py-1 rounded text-xs font-linear-mono transition cursor-pointer ${
                activeCodeTab === "python" ? "bg-[#1f293a] text-cyan-300 font-bold" : "text-[#94a3b8] hover:text-white"
              }`}
            >
              Python
            </button>
            <button
              onClick={() => setActiveCodeTab("curl")}
              className={`px-3 py-1 rounded text-xs font-linear-mono transition cursor-pointer ${
                activeCodeTab === "curl" ? "bg-[#1f293a] text-cyan-300 font-bold" : "text-[#94a3b8] hover:text-white"
              }`}
            >
              cURL
            </button>
            <button
              onClick={() => setActiveCodeTab("node")}
              className={`px-3 py-1 rounded text-xs font-linear-mono transition cursor-pointer ${
                activeCodeTab === "node" ? "bg-[#1f293a] text-cyan-300 font-bold" : "text-[#94a3b8] hover:text-white"
              }`}
            >
              JavaScript (Node)
            </button>
          </div>
        </div>

        {/* Code View Area */}
        <div className="relative bg-[#07090e] border border-[#1e2738] rounded-xl p-4 overflow-x-auto">
          <pre className="text-xs font-mono text-cyan-100/90 leading-relaxed">
            <code>{codeSnippets[activeCodeTab]}</code>
          </pre>
          <button
            onClick={() => {
              navigator.clipboard.writeText(codeSnippets[activeCodeTab]);
              alert("Code snippet copied to clipboard!");
            }}
            className="absolute top-3 right-3 px-2.5 py-1 rounded bg-[#151c28] hover:bg-[#1f293a] border border-[#2b3a50] text-[11px] font-mono text-[#cbd5e1] flex items-center gap-1.5 transition cursor-pointer"
          >
            <Copy size={12} />
            <span>Copy</span>
          </button>
        </div>
      </div>
    </div>
  );
}
