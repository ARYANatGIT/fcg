import Dashboard from "@/components/Dashboard";

export const metadata = {
  title: "ForecastGuard AI — Verified Forecast Bust Archive",
  description: "Searchable repository of verified historical forecast bust case studies (2020-2025)",
};

export default function ArchivePage() {
  return <Dashboard initialTab="archive" initialShowLanding={false} />;
}
