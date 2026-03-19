import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Custom server (server.ts con Socket.io) — no standalone
  allowedDevOrigins: ["*.lhr.life", "*.ngrok-free.app"],
};

export default nextConfig;
