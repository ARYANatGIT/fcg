import Dashboard from "@/components/Dashboard";

export const metadata = {
  title: "ForecastGuard AI — Severe Weather Alerts",
  description: "Real-time synoptic warnings, watches, and advisories (<10-day active window)",
};

export default function NewsPage() {
  return <Dashboard initialTab="news" initialShowLanding={false} />;
}
