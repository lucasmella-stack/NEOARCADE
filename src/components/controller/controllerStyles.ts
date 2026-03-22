// ─── Color palette ────────────────────────────────────────────────────────────

export const C = {
  body: "#1a3a8a",
  bodyLight: "#2a55b8",
  bodyDark: "#0e2260",
  dpad: "#1a1a2e",
  dpadFace: "#252540",
  btnPink: "#e83a7d",
  btnPinkDark: "#b0285d",
  btnYellow: "#f5c842",
  btnYellowDark: "#c89e28",
  cyan: "#58FAFD",
  cyanGlow: "#20E9FB",
  bg: "#0d0d1a",
  white: "#f0f0f5",
} as const;

// ─── Pad CSS (injected via <style> tag inside .pad-root) ──────────────────────

export const padStyles = `
  /* ── Base button reset ── */
  .ctrl-btn {
    border: none;
    outline: none;
    padding: 0;
    background: none;
    -webkit-tap-highlight-color: transparent;
    touch-action: none;
  }

  /* ── Root ── */
  .pad-root {
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100dvh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: linear-gradient(160deg, #141428, ${C.bg});
    overflow: hidden;
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
  }

  /* ── iOS pseudo-fullscreen: safe area insets when address bar is hidden ── */
  html.pad-ios-full .pad-root {
    padding-top: env(safe-area-inset-top);
    padding-bottom: env(safe-area-inset-bottom);
    padding-left: env(safe-area-inset-left);
    padding-right: env(safe-area-inset-right);
  }

  /* ── Fullscreen button ── */
  .pad-fs-btn {
    position: fixed;
    top: 10px;
    right: 12px;
    z-index: 20;
    font-family: "Courier New", monospace;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.12em;
    color: ${C.white};
    background: linear-gradient(180deg, ${C.btnPink}, ${C.btnPinkDark});
    border: none;
    border-radius: 10px;
    padding: 8px 18px;
    cursor: pointer;
    touch-action: manipulation;
    box-shadow:
      0 4px 0 ${C.btnPinkDark},
      0 6px 12px rgba(0,0,0,0.4);
    -webkit-tap-highlight-color: transparent;
  }
  .pad-fs-btn:active {
    transform: translateY(3px);
    box-shadow: 0 1px 0 ${C.btnPinkDark};
  }

  /* ── Gamepad body ── */
  .pad-body {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 92%;
    max-width: 720px;
    height: 78%;
    max-height: 320px;
    background: linear-gradient(170deg, ${C.bodyLight}, ${C.body});
    border: 3px solid ${C.bodyDark};
    border-radius: 28px;
    box-shadow:
      0 6px 0 ${C.bodyDark},
      0 10px 24px rgba(0,0,0,0.5),
      inset 0 2px 0 rgba(255,255,255,0.08);
    padding: 0 4%;
    position: relative;
  }
  .pad-body-fs {
    width: 96%;
    max-width: 860px;
    height: 88%;
    max-height: 400px;
  }

  /* ── Left section (D-Pad) ── */
  .pad-left {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
  }

  /* ── D-Pad ── */
  .dpad {
    position: relative;
    width: clamp(160px, 50vmin, 240px);
    height: clamp(160px, 50vmin, 240px);
  }

  .dpad-cross-h, .dpad-cross-v {
    position: absolute;
    background: linear-gradient(145deg, ${C.dpadFace}, ${C.dpad});
    border: 2px solid #11112a;
    box-shadow:
      0 3px 0 #0a0a18,
      inset 0 1px 0 rgba(255,255,255,0.06);
  }
  .dpad-cross-h {
    top: 50%;
    left: 0;
    right: 0;
    height: 36%;
    transform: translateY(-50%);
    border-radius: 8px;
  }
  .dpad-cross-v {
    left: 50%;
    top: 0;
    bottom: 0;
    width: 36%;
    transform: translateX(-50%);
    border-radius: 8px;
  }

  .dpad-center-dot {
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 14px; height: 14px;
    border-radius: 50%;
    background: radial-gradient(circle, #333355, #1a1a30);
    border: 1.5px solid #0a0a18;
    box-shadow: inset 0 1px 3px rgba(0,0,0,0.5);
    z-index: 3;
    pointer-events: none;
  }

  .dpad-arrow {
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255,255,255,0.5);
    pointer-events: none;
  }
  .dpad-arr-up    { top: 6%; left: 50%; transform: translateX(-50%); }
  .dpad-arr-down  { bottom: 6%; left: 50%; transform: translateX(-50%); }
  .dpad-arr-left  { left: 6%; top: 50%; transform: translateY(-50%); }
  .dpad-arr-right { right: 6%; top: 50%; transform: translateY(-50%); }

  /* ── Center section ── */
  .pad-center {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    flex: 1 1 auto;
    min-width: 0;
  }
  .pad-center-logo {
    width: 28px; height: 28px;
    object-fit: contain;
    filter: drop-shadow(0 1px 2px rgba(0,0,0,0.4));
  }
  .pad-logo {
    font-family: "Courier New", monospace;
    font-size: clamp(9px, 2.5vmin, 13px);
    font-weight: 800;
    letter-spacing: 0.3em;
    color: ${C.white};
    text-shadow: 0 1px 0 rgba(0,0,0,0.4);
    text-transform: uppercase;
  }
  .pad-sys-row {
    display: flex;
    gap: 12px;
    align-items: center;
  }
  .sys-btn {
    height: 30px;
    min-width: 110px;
    padding: 0 18px;
    border-radius: 8px;
    font-family: "Courier New", monospace;
    font-size: clamp(8px, 2vmin, 11px);
    font-weight: 800;
    letter-spacing: 0.12em;
    color: ${C.white};
    background: linear-gradient(180deg, #444466, #333350);
    border: 2px solid #28283e;
    cursor: pointer;
    outline: none;
    -webkit-tap-highlight-color: transparent;
    box-shadow:
      0 3px 0 #1a1a2e,
      0 5px 8px rgba(0,0,0,0.3),
      inset 0 1px 0 rgba(255,255,255,0.1);
    touch-action: manipulation;
  }
  .sys-btn:active {
    transform: translateY(2px);
    box-shadow: 0 1px 0 #1a1a2e;
    background: #28283e;
  }
  .pad-indicators {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .pad-player {
    font-family: "Courier New", monospace;
    font-size: 13px;
    font-weight: 800;
    color: ${C.btnYellow};
    letter-spacing: 0.1em;
    text-shadow: 0 1px 0 rgba(0,0,0,0.3);
  }
  .pad-dot {
    width: 10px; height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
    border: 1.5px solid rgba(0,0,0,0.2);
  }

  /* ── Right section (A / B / Y) ── */
  .pad-right {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
  }
  .abxy-diamond {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: clamp(4px, 1.5vmin, 8px);
  }
  .abxy-mid {
    display: flex;
    gap: clamp(2px, 1vmin, 6px);
    align-items: center;
  }
  .action-btn {
    width: clamp(68px, 20vmin, 100px);
    height: clamp(68px, 20vmin, 100px);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: "Courier New", monospace;
    font-size: clamp(15px, 4.5vmin, 24px);
    font-weight: 900;
    cursor: pointer;
    outline: none;
    -webkit-tap-highlight-color: transparent;
    border: 3px solid;
    touch-action: manipulation;
  }
  .btn-a {
    color: ${C.white};
    background: linear-gradient(145deg, ${C.btnPink}, ${C.btnPinkDark});
    border-color: ${C.btnPinkDark};
    box-shadow: 0 4px 0 ${C.btnPinkDark}, 0 6px 12px rgba(0,0,0,0.35), inset 0 2px 0 rgba(255,255,255,0.15);
    text-shadow: 0 1px 2px rgba(0,0,0,0.3);
  }
  .btn-a:active {
    transform: translateY(3px);
    box-shadow: 0 1px 0 ${C.btnPinkDark}, inset 0 2px 6px rgba(0,0,0,0.3);
  }
  .btn-b {
    color: ${C.white};
    background: linear-gradient(145deg, ${C.btnYellow}, ${C.btnYellowDark});
    border-color: ${C.btnYellowDark};
    box-shadow: 0 4px 0 ${C.btnYellowDark}, 0 6px 12px rgba(0,0,0,0.35), inset 0 2px 0 rgba(255,255,255,0.2);
    text-shadow: 0 1px 2px rgba(0,0,0,0.3);
  }
  .btn-b:active {
    transform: translateY(3px);
    box-shadow: 0 1px 0 ${C.btnYellowDark}, inset 0 2px 6px rgba(0,0,0,0.3);
  }
  .btn-y {
    color: ${C.white};
    background: linear-gradient(145deg, #44cc66, #28884a);
    border-color: #28884a;
    box-shadow: 0 4px 0 #28884a, 0 6px 12px rgba(0,0,0,0.35), inset 0 2px 0 rgba(255,255,255,0.18);
    text-shadow: 0 1px 2px rgba(0,0,0,0.3);
  }
  .btn-y:active {
    transform: translateY(3px);
    box-shadow: 0 1px 0 #28884a, inset 0 2px 6px rgba(0,0,0,0.3);
  }

  /* ── Status text ── */
  .pad-status {
    position: fixed;
    bottom: 6px;
    left: 50%;
    transform: translateX(-50%);
    font-family: "Courier New", monospace;
    font-size: 9px;
    letter-spacing: 0.2em;
    color: rgba(255,255,255,0.25);
    z-index: 10;
  }

  /* ── Portrait fallback ── */
  @media (orientation: portrait) {
    .pad-root {
      inset: unset;
      position: fixed;
      width: 100dvh;
      height: 100dvw;
      top: calc((100dvh - 100dvw) / 2);
      left: calc((100dvw - 100dvh) / 2);
      transform: rotate(90deg);
      transform-origin: center center;
    }
    .pad-fs-btn {
      top: unset;
      bottom: 12px;
      right: 10px;
    }
  }
`;
