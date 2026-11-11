import Script from "next/script";

// Solo cuenta visitas servidas desde el dominio de producción
// (no localhost, forks ni el WebView del APK).
const UMAMI_DOMAINS = "arcadeneo.com,www.arcadeneo.com";

export function UmamiScript() {
  const src = process.env.NEXT_PUBLIC_UMAMI_SRC;
  const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
  if (!src || !websiteId) return null;

  return (
    <Script
      src={src}
      data-website-id={websiteId}
      data-domains={UMAMI_DOMAINS}
      strategy="afterInteractive"
    />
  );
}
