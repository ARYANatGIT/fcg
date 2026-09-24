import Dashboard from "@/components/Dashboard";

export const metadata = {
  title: "ForecastGuard AI — Model Benchmarks & Governance",
  description: "Chronological validation benchmarks, LightGBM ROC/PR curves, and global SHAP hierarchy",
};

export default function BenchmarksPage() {
  return <Dashboard initialTab="model" initialShowLanding={false} />;
}
