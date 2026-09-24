import Dashboard from "@/components/Dashboard";

export const metadata = {
  title: "ForecastGuard AI — Simulation Sandbox",
  description: "Counterfactual NWP parameter sensitivity perturbation and instant re-inference",
};

export default function SimulationPage() {
  return <Dashboard initialTab="sandbox" initialShowLanding={false} />;
}
