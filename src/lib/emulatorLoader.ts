export const CORES = {
  GB: "gambatte",
  GBC: "gambatte",
  NES: "fceumm",
  SNES: "snes9x",
  NeoGeo: "arcade",
  Arcade: "arcade",
  GBA: "mgba",
  N64: "mupen64plus_next",
  Genesis: "genesis_plus_gx",
} as const;

export type CoreKey = keyof typeof CORES;

export function loadEmulator(
  container: HTMLElement,
  romUrl: string,
  core: string,
  fileName: string,
) {
  const oldScript = document.querySelector("script[data-emulatorjs]");
  if (oldScript) oldScript.remove();

  container.innerHTML = "";

  const win = window as unknown as Record<string, unknown>;

  win.EJS_player = "#emulator";
  win.EJS_gameUrl = romUrl;
  win.EJS_core = core;
  win.EJS_pathtodata = "https://cdn.emulatorjs.org/latest/data/";
  win.EJS_startOnLoaded = true;
  win.EJS_dontExtractRom = true;

  if (core === "arcade") {
    win.EJS_biosUrl = "/games/bios/neogeo.zip";
  }

  win.EJS_DEBUG_XX = false;
  win.EJS_gameName = fileName.replace(/\.\w+$/, "");
  win.EJS_color = "#00d4ff";
  win.EJS_backgroundBlur = true;
  win.EJS_backgroundColor = "#0a0a0f";
  win.EJS_defaultControls = true;
  win.EJS_multitap = false;
  win.EJS_Buttons = [
    { value: "ArrowUp", player: 1, button: "up" },
    { value: "ArrowDown", player: 1, button: "down" },
    { value: "ArrowLeft", player: 1, button: "left" },
    { value: "ArrowRight", player: 1, button: "right" },
    { value: "KeyZ", player: 1, button: "b", input: "button" },
    { value: "KeyX", player: 1, button: "a", input: "button" },
    { value: "Enter", player: 1, button: "start", input: "button" },
    { value: "ShiftRight", player: 1, button: "select", input: "button" },
  ];

  const script = document.createElement("script");
  script.src = "https://cdn.emulatorjs.org/latest/data/loader.js";
  script.async = true;
  script.setAttribute("data-emulatorjs", "1");
  document.body.appendChild(script);
}
