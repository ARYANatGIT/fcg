import Dashboard from "@/components/Dashboard";

export const metadata = {
  title: "ForecastGuard AI — Threat Matrix & Synoptic Regimes",
  description: "Indian atmospheric regime vulnerability analysis, failure modes, and spatial hotspots",
};

export default function RegimesPage() {
  return <Dashboard initialTab="regimes" initialShowLanding={false} />;
}
