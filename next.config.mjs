import { withSentryConfig } from "@sentry/nextjs/config";

// Un solo nombre de variable (GLITCHTIP_DSN) para servidor y cliente.
// El servidor lo lee en runtime; el cliente necesita el valor en BUILD
// (Dockerfile: --build-arg GLITCHTIP_DSN=...), aquí se expone como NEXT_PUBLIC_*.
const glitchtipDsn = process.env.GLITCHTIP_DSN ?? "";
if (!glitchtipDsn && process.argv.includes("build")) {
  console.warn("[glitchtip] GLITCHTIP_DSN vacío en build: el bundle cliente NO reportará errores");
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Custom server (server.ts con Socket.io) — no standalone
  allowedDevOrigins: ["*.lhr.life", "*.ngrok-free.app", "*.ngrok-free.dev"],
  env: {
    NEXT_PUBLIC_GLITCHTIP_DSN: glitchtipDsn,
    NEXT_PUBLIC_GLITCHTIP_ENVIRONMENT: process.env.GLITCHTIP_ENVIRONMENT ?? "",
  },
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

export default withSentryConfig(nextConfig, {
  // GlitchTip self-hosted: sin subida de sourcemaps ni telemetría a sentry.io
  silent: true,
  telemetry: false,
  sourcemaps: { disable: true },
});
