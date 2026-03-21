import type { CSSProperties } from "react";

/**
 * Shared neon-blue button/panel style used across TopBar, QrPanel,
 * InstructionsModal and any other layout-layer components.
 */
export const NEON_BTN: CSSProperties = {
  background: "linear-gradient(180deg, #0a1a5c, #011246)",
  color: "#58FAFD",
  border: "2px solid #024DD6",
  boxShadow: "0 2px 0 #010224",
  fontFamily: '"Courier New", monospace',
};
