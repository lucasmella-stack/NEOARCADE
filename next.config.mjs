/** @type {import('next').NextConfig} */
const nextConfig = {
  // Custom server (server.ts con Socket.io) — no standalone
  allowedDevOrigins: ["*.lhr.life", "*.ngrok-free.app", "*.ngrok-free.dev"],
  async headers() {
    return [
      {
        // Force revalidation on all game files so the browser never serves stale content
        source: "/games/:path*",
        headers: [{ key: "Cache-Control", value: "no-cache, must-revalidate" }],
      },
    ];
  },
};

export default nextConfig;
