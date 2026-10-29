import type { Metadata, Viewport } from "next";
import { Figtree } from "next/font/google";
import "./globals.css";

const cuerpo = Figtree({ subsets: ["latin"], variable: "--font-cuerpo", display: "swap" });

export const metadata: Metadata = {
  title: "CRM del equipo",
  description: "Los clientes de todas las apps, cargados por el equipo.",
  robots: { index: false, follow: false },
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={cuerpo.variable}>
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
