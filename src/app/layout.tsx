import { PwaRegister } from "@/components/shared/PwaRegister";
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NEOARCADE",
  description: "Consola retro open source. Juega con tu móvil como joystick.",
  icons: { icon: "/favicon.ico" },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "NEOARCADE",
  },
  openGraph: {
    title: "NEOARCADE",
    description: "Consola retro open source. Juega con tu móvil como joystick.",
    url: "https://arcadeneo.com",
    siteName: "NEOARCADE",
    images: [
      {
        url: "https://arcadeneo.com/logo.png",
        width: 512,
        height: 512,
        alt: "NEOARCADE logo",
      },
    ],
    locale: "es_AR",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "NEOARCADE",
    description: "Consola retro open source. Juega con tu móvil como joystick.",
    images: ["https://arcadeneo.com/logo.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0a0f",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
