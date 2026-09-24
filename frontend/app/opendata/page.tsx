import Dashboard from "@/components/Dashboard";

export const metadata = {
  title: "ForecastGuard AI — Developer Open Data Hub",
  description: "REST API keys, daily quotas, and verified meteorological dataset exports",
};

export default function OpenDataPage() {
  return <Dashboard initialTab="opendata" initialShowLanding={false} />;
}
