import Navbar from "@/components/typeui/Navbar";
import HeroSection from "@/components/typeui/HeroSection";
import ProductShowcase from "@/components/typeui/ProductShowcase";
import FeatureSections from "@/components/typeui/FeatureSections";
import ComponentGallery from "@/components/typeui/ComponentGallery";
import InteractiveCodeSection from "@/components/typeui/InteractiveCodeSection";
import SocialProof from "@/components/typeui/SocialProof";
import PricingSection from "@/components/typeui/PricingSection";
import FinalCTA from "@/components/typeui/FinalCTA";
import Footer from "@/components/typeui/Footer";

export const metadata = {
  title: "INTENT.UI — Precision Design System & UI Primitives",
  description:
    "An editorial, typography-driven UI engine built for developers, founders, and modern software studios. Zero runtime bloat, pure code ownership.",
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#090909] text-[#F5F5F5] selection:bg-[#8b5cf6]/30 selection:text-[#F5F5F5] antialiased">
      {/* Sticky Editorial Navigation */}
      <Navbar />

      {/* Main Content Flow */}
      <main>
        {/* 01. Editorial Multi-Line Typography Hero + Token Swatch Playground */}
        <HeroSection />

        {/* 02. Interactive Studio Canvas & Component Inspector */}
        <ProductShowcase />

        {/* 03. Alternating Numbered Feature Matrix (01-04) */}
        <FeatureSections />

        {/* 04. Tactile Component Gallery with 1-Click Code Copy */}
        <ComponentGallery />

        {/* 05. Split-Screen Developer Code Architecture & Live Props Sandbox */}
        <InteractiveCodeSection />

        {/* 06. Understated Developer Proof, Metrics & Testimonials */}
        <SocialProof />

        {/* 07. Minimal 3-Tier Pricing with Annual/Monthly Toggle */}
        <PricingSection />

        {/* 08. Dramatic Final Statement & Fast Terminal Install */}
        <FinalCTA />
      </main>

      {/* 09. Editorial Multi-Column Footer with System Status & Operational Cockpit link */}
      <Footer />
    </div>
  );
}