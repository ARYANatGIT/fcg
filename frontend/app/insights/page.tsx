import Dashboard from "@/components/Dashboard";

export const metadata = {
  title: "ForecastGuard AI — Diagnostics & Explainability",
  description: "Deep NWP failure mode diagnostics, SHAP waterfalls, and ensemble spread analysis",
};

export default function InsightsPage() {
  return <Dashboard initialTab="insights" initialShowLanding={false} />;
}
