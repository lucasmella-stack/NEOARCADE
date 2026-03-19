#!/usr/bin/env node
/**
 * dev-tunnel.mjs
 * Lanza ngrok y escribe NEXT_PUBLIC_SOCKET_URL en .env.local con la URL del túnel.
 * Uso: node dev-tunnel.mjs
 */

import { spawn } from "child_process";
import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, ".env.local");

// Lanzar ngrok en background
// Path de ngrok en WinGet (fallback si no está en PATH)
const NGROK_PATH =
  process.env.NGROK_PATH ??
  `${process.env.LOCALAPPDATA}\\Microsoft\\WinGet\\Packages\\Ngrok.Ngrok_Microsoft.Winget.Source_8wekyb3d8bbwe\\ngrok.exe`;

const NGROK_AUTH_TOKEN = process.env.NGROK_AUTHTOKEN ?? "";

// Configurar token antes de lanzar el túnel
if (NGROK_AUTH_TOKEN) {
  const { execSync } = await import("child_process");
  try {
    execSync(`"${NGROK_PATH}" config add-authtoken ${NGROK_AUTH_TOKEN}`, { stdio: "ignore" });
    console.log("✅ Auth token configurado");
  } catch {
    console.warn("⚠ No se pudo configurar el auth token de ngrok");
  }
} else {
  console.log("ℹ Sin NGROK_AUTHTOKEN — usando token previamente configurado");
}

console.log("🚇 Iniciando ngrok en el puerto 3000...");
const ngrok = spawn(NGROK_PATH, ["http", "3000", "--log=stdout"], {
  stdio: ["ignore", "pipe", "pipe"],
});

let url = null;

ngrok.stdout.on("data", (chunk) => {
  const text = chunk.toString();
  process.stdout.write(text); // mostrar log de ngrok
  // ngrok v3 formato: url=https://xxxx.ngrok-free.app o url=https://xxxx.ngrok.io
  const match = text.match(/url=(https:\/\/[^\s]+)/);
  if (match && !url) {
    url = match[1].trim();
    onTunnelReady(url);
  }
});

ngrok.stderr.on("data", (chunk) => {
  const text = chunk.toString();
  process.stdout.write(text);
  const match = text.match(/url=(https:\/\/[^\s]+)/);
  if (match && !url) {
    url = match[1].trim();
    onTunnelReady(url);
  }
});

// Fallback: consultar API local de ngrok (puerto 4040)
const pollApi = async () => {
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    if (url) return;
    try {
      const res = await fetch("http://localhost:4040/api/tunnels");
      const data = await res.json();
      const tunnel = data.tunnels?.find((t) => t.proto === "https");
      if (tunnel?.public_url && !url) {
        url = tunnel.public_url;
        onTunnelReady(url);
        return;
      }
    } catch {
      // API no disponible aún, seguir esperando
    }
  }
  if (!url) {
    console.error("❌ No se pudo detectar la URL de ngrok.");
    console.log("\n👉 Copia la URL de ngrok manualmente y ponla en .env.local:");
    console.log("   NEXT_PUBLIC_SOCKET_URL=https://xxxx.ngrok-free.app");
  }
};

pollApi();

function onTunnelReady(publicUrl) {
  console.log(`\n✅ Túnel activo: ${publicUrl}`);
  console.log(`\n📱 Abre esto en tu móvil:\n   ${publicUrl}`);
  console.log(`\n🎮 QR del controller apuntará a:\n   ${publicUrl}/controller?room=<id>`);

  // Actualizar .env.local
  try {
    let env = readFileSync(envPath, "utf-8");
    env = env.replace(
      /^NEXT_PUBLIC_SOCKET_URL=.*/m,
      `NEXT_PUBLIC_SOCKET_URL=${publicUrl}`
    );
    writeFileSync(envPath, env, "utf-8");
    console.log("\n📝 .env.local actualizado con la URL del túnel");
    console.log("⚡ Reinicia el servidor (pnpm dev) para que tome efecto\n");
  } catch (err) {
    console.error("Error actualizando .env.local:", err.message);
  }
}

// Cleanup al cerrar
process.on("SIGINT", () => {
  ngrok.kill();
  // Restaurar URL local
  try {
    let env = readFileSync(envPath, "utf-8");
    env = env.replace(
      /^NEXT_PUBLIC_SOCKET_URL=.*/m,
      "NEXT_PUBLIC_SOCKET_URL=http://localhost:3000"
    );
    writeFileSync(envPath, env);
    console.log("\n🔄 .env.local restaurado a localhost");
  } catch {}
  process.exit(0);
});
