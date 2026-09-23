import { Manrope, DM_Mono, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import siteSettings from "../config/siteSettings.json";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-ibm-mono",
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata = {
  title: "ForecastGuard — Medium-Range Forecast Bust Detection Platform",
  description: "AI-Based Medium-Range Weather Forecast Bust Detection & Confidence Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${manrope.variable} ${dmMono.variable} ${ibmPlexMono.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href={siteSettings.faviconUrl} />
      </head>
      <body className="antialiased min-h-screen bg-[var(--noir-canvas)] text-[var(--noir-text)] selection:bg-zinc-800 selection:text-white">
        {children}
      </body>
    </html>
  );
}

