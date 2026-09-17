import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata = {
  title: "ForecastGuard AI — MoES / NCMRWF Forecast Bust Detection",
  description: "AI-Based Medium-Range Weather Forecast Bust Detection & Confidence Platform (Problem Statement 26079)",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="antialiased min-h-screen bg-[#08090a] text-[#e2e8f0]">
        {children}
      </body>
    </html>
  );
}
