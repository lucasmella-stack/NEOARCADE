import { ControllerPage } from "@/components/controller/ControllerPage";
import type { Metadata, Viewport } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "NEOARCADE — Controller",
  description: "Joystick virtual para NEOARCADE",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0a0a0f",
  viewportFit: "cover",
};

export default function Controller() {
  return (
    <Suspense>
      <ControllerPage />
    </Suspense>
  );
}
