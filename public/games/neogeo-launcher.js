// NEOARCADE - NeoGeo Launcher
// neogeo.zip BIOS lives in the same directory as each game ROM so EmulatorJS
// writes it at the correct VFS path ("neogeo.zip") where FBNeo looks for it.
(function () {
  var INPUT_EVENT_TYPES = { input: true, "neoarcade-input": true };
  // NeoGeo/FBNeo usa botones digitales de D-pad (12-15 en la API Gamepad),
  // no ejes analógicos. Los botones de acción siguen la convención RetroArch:
  //   a (1=BUTTON_2) → RETRO B → NeoGeo A (disparar)
  //   b (0=BUTTON_1) → RETRO A → NeoGeo B (saltar)
  //   y (3=BUTTON_4) → RETRO Y → NeoGeo C (granada/tercer botón)
  //   select (8) → RETRO SELECT → insertar moneda
  //   start  (9) → RETRO START  → comenzar 1P
  var BUTTON_MAP = { a: 1, b: 0, x: 2, y: 3, select: 8, start: 9 };
  var DPAD_BUTTON_MAP = { up: 12, down: 13, left: 14, right: 15 };
  // Mapeo directo a IDs de botón RetroArch para simulateInput(playerIndex, retroBtnId, value).
  // defaultControllers[0] de EmulatorJS define: btn0→BUTTON_2, btn8→BUTTON_1, etc.
  // Por eso "a" (mobile) → RETRO B (id 0), "b" (mobile) → RETRO A (id 8), etc.
  var RETRO_MAP = { a: 0, b: 8, x: 9, y: 1, select: 2, start: 3 };
  var RETRO_DPAD = { up: 4, down: 5, left: 6, right: 7 };
  // Bindings de gamepad para P2 (mismo esquema que defaultControllers[0] de EmulatorJS)
  var P2_GAMEPAD_BINDINGS = {
    0: { value2: "BUTTON_2" },
    1: { value2: "BUTTON_4" },
    2: { value2: "SELECT" },
    3: { value2: "START" },
    4: { value2: "DPAD_UP" },
    5: { value2: "DPAD_DOWN" },
    6: { value2: "DPAD_LEFT" },
    7: { value2: "DPAD_RIGHT" },
    8: { value2: "BUTTON_1" },
    9: { value2: "BUTTON_3" },
    10: { value2: "LEFT_TOP_SHOULDER" },
    11: { value2: "RIGHT_TOP_SHOULDER" },
  };
  // Referencia al método simulateInput de EJS_GameManager (disponible tras iniciar el juego)
  var directSimulate = null;

  function createButtonState(pressed) {
    return { pressed: !!pressed, touched: !!pressed, value: pressed ? 1 : 0 };
  }

  function createPad(index) {
    return {
      id: "NEOARCADE-P" + (index + 1),
      index: index,
      connected: true,
      timestamp: performance.now(),
      mapping: "standard",
      axes: new Float64Array(4),
      buttons: Array.from({ length: 17 }, function () {
        return createButtonState(false);
      }),
    };
  }

  function installBridge() {
    var pads = [createPad(0), createPad(1)];
    window.addEventListener("message", function (event) {
      var data = event.data;
      if (!data || !INPUT_EVENT_TYPES[data.type]) return;
      var playerIndex = (data.player || 1) - 1;
      if (playerIndex < 0 || playerIndex > 1) return;
      var isPressed = data.state === "pressed";
      var value = isPressed ? 1 : 0;
      // Tras iniciar el juego: inyecta directamente en RetroArch WASM,
      // bypaseando controls[player] (que en P2 está vacío por diseño de EmulatorJS).
      if (directSimulate) {
        if (RETRO_MAP[data.button] !== undefined)
          directSimulate(playerIndex, RETRO_MAP[data.button], value);
        if (RETRO_DPAD[data.button] !== undefined)
          directSimulate(playerIndex, RETRO_DPAD[data.button], value);
        return;
      }
      // Antes del inicio: actualiza el pad virtual para que GamepadHandler
      // detecte correctamente ambos gamepads durante la carga.
      var pad = pads[playerIndex];
      pad.timestamp = performance.now();
      if (BUTTON_MAP[data.button] !== undefined)
        pad.buttons[BUTTON_MAP[data.button]] = createButtonState(isPressed);
      if (DPAD_BUTTON_MAP[data.button] !== undefined)
        pad.buttons[DPAD_BUTTON_MAP[data.button]] =
          createButtonState(isPressed);
    });
    navigator.getGamepads = function () {
      return pads;
    };
  }

  window.NEOARCADE_NEO_GEO = {
    bootstrap: function (config) {
      installBridge();
      var overlay = document.getElementById(config.loadingOverlayId);
      var statusNode = document.getElementById(config.loadingStatusId);
      if (statusNode) {
        statusNode.textContent =
          "CARGANDO " + (config.gameTitle || "JUEGO").toUpperCase() + "...";
      }
      window.EJS_player = config.playerSelector;
      window.EJS_core = "arcade";
      window.EJS_gameUrl = config.romUrl;
      window.EJS_biosUrl = "neogeo.zip";
      window.EJS_dontExtractBIOS = true;
      window.EJS_dontExtractRom = true;
      window.EJS_pathtodata = "/emulatorjs/data/";
      window.EJS_startOnLoaded = true;
      window.EJS_disableAutoLang = false;
      // Controles por defecto con P2 ya configurado.
      // EmulatorJS deja defaultControllers[1]={} vacío — esto lo corrige
      // ANTES de que loadSettings() lo sobrescriba desde localStorage.
      window.EJS_defaultControls = {
        0: {
          0: { value: "x", value2: "BUTTON_2" },
          1: { value: "s", value2: "BUTTON_4" },
          2: { value: "v", value2: "SELECT" },
          3: { value: "enter", value2: "START" },
          4: { value: "up arrow", value2: "DPAD_UP" },
          5: { value: "down arrow", value2: "DPAD_DOWN" },
          6: { value: "left arrow", value2: "DPAD_LEFT" },
          7: { value: "right arrow", value2: "DPAD_RIGHT" },
          8: { value: "z", value2: "BUTTON_1" },
          9: { value: "a", value2: "BUTTON_3" },
          10: { value: "", value2: "LEFT_TOP_SHOULDER" },
          11: { value: "", value2: "RIGHT_TOP_SHOULDER" },
        },
        1: {
          0: { value2: "BUTTON_2" },
          1: { value2: "BUTTON_4" },
          2: { value2: "SELECT" },
          3: { value2: "START" },
          4: { value2: "DPAD_UP" },
          5: { value2: "DPAD_DOWN" },
          6: { value2: "DPAD_LEFT" },
          7: { value2: "DPAD_RIGHT" },
          8: { value2: "BUTTON_1" },
          9: { value2: "BUTTON_3" },
          10: { value2: "LEFT_TOP_SHOULDER" },
          11: { value2: "RIGHT_TOP_SHOULDER" },
        },
        2: {},
        3: {},
      };
      // Envía un input simulado usando el mismo bridge de mensajes
      function simBtn(btn, player, state) {
        window.dispatchEvent(
          new MessageEvent("message", {
            data: {
              type: "neoarcade-input",
              player: player,
              button: btn,
              state: state,
            },
          }),
        );
      }
      function autoPress(btn, player, holdMs, thenFn) {
        simBtn(btn, player, "pressed");
        setTimeout(function () {
          simBtn(btn, player, "released");
          if (thenFn) setTimeout(thenFn, 200);
        }, holdMs || 150);
      }

      window.EJS_onGameStart = function () {
        if (overlay) overlay.classList.add("hidden");
        if (typeof config.onGameStart === "function") config.onGameStart();
        // Activar bypass directo a RetroArch WASM para P1 y P2.
        // EmulatorJS deja defaultControllers[1]={} (P2 vacío por diseño),
        // por lo que su routing de input silenciosamente ignora a P2.
        // simulateInput(player, retroBtnId, value) llama directamente a WASM.
        var ejs = window.EJS_emulator;
        if (
          ejs &&
          ejs.gameManager &&
          typeof ejs.gameManager.simulateInput === "function"
        ) {
          directSimulate = ejs.gameManager.simulateInput.bind(ejs.gameManager);
        }
        // Reparar bindings de P2. loadSettings() puede restaurar controls[1]={}
        // desde localStorage si hay una sesión vieja con P2 vacío. Lo reparamos
        // aquí, borramos la entrada corrupta de localStorage y volvemos a guardar.
        if (ejs && ejs.controls) {
          var p2 = ejs.controls[1] || {};
          var hasBindings = Object.keys(p2).some(function (k) {
            return p2[k] && p2[k].value2;
          });
          if (!hasBindings) {
            ejs.controls[1] = JSON.parse(JSON.stringify(P2_GAMEPAD_BINDINGS));
            try {
              if (typeof ejs.getLocalStorageKey === "function") {
                localStorage.removeItem(ejs.getLocalStorageKey());
              }
            } catch (e) {}
            if (typeof ejs.saveSettings === "function") ejs.saveSettings();
          }
        }
        // Los juegos FBNeo/NeoGeo son simuladores de arcade que requieren
        // insertar moneda (SELECT) antes de poder jugarse. Lo hacemos
        // automáticamente tras 1.5 s para que el emulador termine de
        // inicializar, luego el usuario presiona START para comenzar.
        setTimeout(function () {
          // Moneda para P1
          autoPress("select", 1, 150, function () {
            // Moneda para P2 (cada jugador necesita su propia moneda en NeoGeo)
            autoPress("select", 2, 150, null);
          });
        }, 1500);
      };
      var retryBtn = document.getElementById("retry-button");
      if (retryBtn)
        retryBtn.onclick = function () {
          location.reload();
        };
      var script = document.createElement("script");
      script.src = "/emulatorjs/data/loader.js";
      script.async = true;
      document.body.appendChild(script);
    },
  };
})();
