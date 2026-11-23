import type { Metadata, Viewport } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import "./globals.css";

const display = Barlow_Condensed({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--f-display" });
const body = Barlow({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--f-body" });

const url = process.env.APP_URL?.replace(/\/$/, "") || "https://clubs-bot.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(url),
  title: "STARLINK FCX · Club de EA FC 27",
  description: "Búscanos en EA FC 27 → Clubs como STARLINK FCX (PS5, crossplay) y entra al Discord del club.",
  openGraph: {
    title: "STARLINK FCX · Club de EA FC 27",
    description: "Nombre exacto del club, resultados reales y el Discord para unirte.",
    images: [{ url: "/escudo.jpg", width: 600, height: 800 }],
    locale: "es_VE",
    type: "website",
  },
};

export const viewport: Viewport = { themeColor: "#03060c", colorScheme: "dark" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-VE" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
