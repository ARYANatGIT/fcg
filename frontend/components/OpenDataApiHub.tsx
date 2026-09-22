"use client";

import React, { useState } from "react";
import { 
  Database, 
  Download, 
  Key, 
  Copy, 
  Check, 
  Code, 
  ShieldCheck, 
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
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "https://forecastguard-api.onrender.com";
    const downloadUrl = `${backendUrl}/api/export/dataset?format=${format}`;
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
curl -X GET "https://forecastguard-api.onrender.com/api/latest_prediction?station=New%20Delhi&lead_day=5" \\
  -H "Authorization: Bearer ${apiKey || 'YOUR_API_KEY'}" \\
  -H "Accept: application/json"`,

    python: `import requests

API_KEY = "${apiKey || 'YOUR_API_KEY'}"
BASE_URL = "https://forecastguard-api.onrender.com/api"

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
const API_KEY = "${apiKey || 'YOUR_API_KEY'}";
const BASE_URL = "https://forecastguard-api.onrender.com/api";

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
      <div className="glass-feature p-5 rounded-2xl border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center text-[#E8E8E5]">
              <Database size={16} />
            </div>
            <h2 className="text-lg font-bold text-[#E8E8E5] tracking-tight font-sans">
              Developer API &amp; Open Data Hub
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono-tech bg-white/[0.05] text-[#D8D8D3] border border-white/10">
              MoES Open Data
            </span>
          </div>
          <p className="text-xs text-[#92928C] leading-relaxed max-w-3xl">
            Access high-frequency NWP forecast bust datasets, verified analog archives, and production REST APIs for operational and meteorological researchers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-xs font-mono-tech text-[#D8D8D3]">
            <ShieldCheck size={14} className="text-[#AEB796]" />
            <span>Open Science License (CC-BY 4.0)</span>
          </div>
        </div>
      </div>

      {/* Grid: Dataset Downloads (6 Cols) + API Key Manager (6 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Complete Dataset Export Downloads */}
        <div className="lg:col-span-6 detail-card flex flex-col justify-between space-y-6 p-6 rounded-2xl">
          <div>
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Download size={16} className="text-[#AEB796]" />
                <h3 className="text-base font-semibold text-[#E8E8E5]">Full Dataset Downloads</h3>
              </div>
              <span className="text-[11px] font-mono-tech text-[#8B8B87]">Updated Hourly</span>
            </div>

            <p className="text-xs text-[#92928C] mb-4 leading-relaxed">
              Download complete medium-range NWP predictions (D1–D10), historical bust records, atmospheric variables, and SHAP attribution vectors across 43 Indian meteorological stations.
            </p>

            <div className="space-y-3">
              {/* JSON Dataset */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-white/25 transition">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center text-[#E8E8E5]">
                    <FileText size={18} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#E8E8E5]">Complete Telemetry &amp; Forecast Archive</div>
                    <div className="text-[11px] text-[#8B8B87] font-mono-tech">JSON Format · ~4.2 MB · Multi-Station Grid</div>
                  </div>
                </div>
                <button
                  onClick={() => handleDownloadDataset("json")}
                  disabled={downloadingFormat === "json"}
                  className="px-3.5 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-[#E8E8E5] border border-white/10 text-xs font-mono-tech flex items-center gap-1.5 transition cursor-pointer active:scale-[0.99]"
                >
                  <Download size={13} />
                  <span>{downloadingFormat === "json" ? "Downloading..." : "JSON"}</span>
                </button>
              </div>

              {/* ZIP Archive */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-white/25 transition">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center text-[#E8E8E5]">
                    <FileArchive size={18} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#E8E8E5]">Raw NetCDF/GRIB &amp; Station CSV Package</div>
                    <div className="text-[11px] text-[#8B8B87] font-mono-tech">ZIP Bundle · Includes Parquet &amp; Metadata</div>
                  </div>
                </div>
                <button
                  onClick={() => handleDownloadDataset("zip")}
                  disabled={downloadingFormat === "zip"}
                  className="px-3.5 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-[#E8E8E5] border border-white/10 text-xs font-mono-tech flex items-center gap-1.5 transition cursor-pointer active:scale-[0.99]"
                >
                  <Download size={13} />
                  <span>{downloadingFormat === "zip" ? "Downloading..." : "ZIP"}</span>
                </button>
              </div>

              {/* CSV Format */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-white/25 transition">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center text-[#E8E8E5]">
                    <FileSpreadsheet size={18} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#E8E8E5]">43 Stations Observation Time-Series</div>
                    <div className="text-[11px] text-[#8B8B87] font-mono-tech">CSV Format · Compatible with Excel / Pandas</div>
                  </div>
                </div>
                <button
                  onClick={() => handleDownloadDataset("csv")}
                  disabled={downloadingFormat === "csv"}
                  className="px-3.5 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-[#E8E8E5] border border-white/10 text-xs font-mono-tech flex items-center gap-1.5 transition cursor-pointer active:scale-[0.99]"
                >
                  <Download size={13} />
                  <span>{downloadingFormat === "csv" ? "Downloading..." : "CSV"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Data Usage Notice */}
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10 text-[11px] text-[#8B8B87] flex items-center gap-2 font-mono-tech">
            <AlertCircle size={14} className="shrink-0 text-[#AEB796]" />
            <span>Open for academic research, operational meteorological forecasting, and NWP model verification.</span>
          </div>
        </div>

        {/* Right: API Key Generator & Key Management */}
        <div className="lg:col-span-6 detail-card flex flex-col justify-between space-y-6 p-6 rounded-2xl">
          <div>
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Key size={16} className="text-[#AEB796]" />
                <h3 className="text-base font-semibold text-[#E8E8E5]">Developer API Key Generator</h3>
              </div>
              <span className="text-[11px] font-mono-tech text-[#D8D8D3]">Quota: 1,000 Req/Day</span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono-tech text-[#92928C] mb-1.5">
                  Organization / Agency Name:
                </label>
                <input
                  type="text"
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/10 rounded-full px-4 py-2 text-xs text-[#E8E8E5] font-mono-tech focus:outline-none focus:border-white/30"
                  placeholder="e.g. Atmospheric Research Lab, State Met Centre..."
                />
              </div>

              <div>
                <label className="block text-xs font-mono-tech text-[#92928C] mb-1.5">
                  Production API Key:
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-white/[0.03] border border-white/10 rounded-full px-4 py-2 text-xs font-mono-tech select-all overflow-x-auto min-h-[38px] flex items-center">
                    {apiKey ? (
                      <span className="text-[#E8E8E5] font-bold">{apiKey}</span>
                    ) : (
                      <span className="text-[#5E5E5B] italic">Click &quot;Generate New Key&quot; to create your API credentials</span>
                    )}
                  </div>
                  {apiKey && (
                    <button
                      onClick={handleCopyKey}
                      className="px-3.5 py-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-[#E8E8E5] text-xs font-mono-tech flex items-center gap-1.5 transition cursor-pointer shrink-0"
                      title="Copy API Key"
                    >
                      {copied ? <Check size={14} className="text-[#AEB796]" /> : <Copy size={14} />}
                      <span>{copied ? "Copied" : "Copy"}</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  onClick={handleGenerateKey}
                  disabled={isGenerating}
                  className="px-4 py-2 rounded-full bg-[#E8E8E4] hover:bg-white text-[#141414] font-bold text-xs font-mono-tech flex items-center gap-2 transition cursor-pointer active:scale-[0.99] shadow-sm"
                >
                  <RefreshCw size={13} className={isGenerating ? "animate-spin" : ""} />
                  <span>{isGenerating ? "Generating..." : "Generate New Key"}</span>
                </button>
                <span className="text-[11px] font-mono-tech text-[#8B8B87]">
                  Bearer Token Auth &middot; TLS 1.3
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10 text-[11px] font-mono-tech text-[#8B8B87] flex items-center justify-between">
            <span>Daily Rate: 1,000 requests/day</span>
            <span>Status: {apiKey ? "ACTIVE" : "READY"}</span>
          </div>
        </div>
      </div>

      {/* Code Snippets & Integration SDK */}
      <div className="detail-card space-y-4 p-6 rounded-2xl">
        <div className="flex flex-wrap items-center justify-between border-b border-white/10 pb-3 gap-3">
          <div className="flex items-center gap-2">
            <Code size={16} className="text-[#AEB796]" />
            <h3 className="text-base font-semibold text-[#E8E8E5]">Integration Code Snippets</h3>
          </div>

          {/* Language Switcher */}
          <div className="flex items-center gap-1 bg-white/[0.03] p-1 rounded-full border border-white/10">
            <button
              onClick={() => setActiveCodeTab("python")}
              className={`px-3 py-1 rounded-full text-xs font-mono-tech transition cursor-pointer ${
                activeCodeTab === "python" ? "is-active bg-[#E8E8E4] text-[#141414] font-bold shadow-sm" : "text-[#8B8B87] hover:text-[#E8E8E5]"
              }`}
            >
              Python
            </button>
            <button
              onClick={() => setActiveCodeTab("curl")}
              className={`px-3 py-1 rounded-full text-xs font-mono-tech transition cursor-pointer ${
                activeCodeTab === "curl" ? "is-active bg-[#E8E8E4] text-[#141414] font-bold shadow-sm" : "text-[#8B8B87] hover:text-[#E8E8E5]"
              }`}
            >
              cURL
            </button>
            <button
              onClick={() => setActiveCodeTab("node")}
              className={`px-3 py-1 rounded-full text-xs font-mono-tech transition cursor-pointer ${
                activeCodeTab === "node" ? "is-active bg-[#E8E8E4] text-[#141414] font-bold shadow-sm" : "text-[#8B8B87] hover:text-[#E8E8E5]"
              }`}
            >
              JavaScript
            </button>
          </div>
        </div>

        {/* Code View Area */}
        <div className="relative bg-black/60 border border-white/10 rounded-xl p-4 overflow-x-auto">
          <pre className="text-xs font-mono-tech text-[#D8D8D3] leading-relaxed">
            <code>{codeSnippets[activeCodeTab]}</code>
          </pre>
          <button
            onClick={() => {
              navigator.clipboard.writeText(codeSnippets[activeCodeTab]);
              alert("Code snippet copied to clipboard!");
            }}
            className="absolute top-3 right-3 px-3 py-1 rounded-full bg-white/[0.08] hover:bg-white/[0.15] border border-white/10 text-[11px] font-mono-tech text-[#E8E8E5] flex items-center gap-1.5 transition cursor-pointer active:scale-[0.99]"
          >
            <Copy size={12} />
            <span>Copy</span>
          </button>
        </div>
      </div>
    </div>
  );
}
