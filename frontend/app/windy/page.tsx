import Dashboard from "@/components/Dashboard";

export const metadata = {
  title: "ForecastGuard AI — Atmospheric Dynamics Studio & Radar",
  description: "Live synoptic wind streamlines, 3D Skew-T thermodynamic sounding, and ECMWF IFS numerical guidance",
};

export default function WindyPage() {
  return <Dashboard initialTab="windy" initialShowLanding={false} />;
}
