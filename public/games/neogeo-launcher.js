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
      var pad = pads[playerIndex];
      var isPressed = data.state === "pressed";
      pad.timestamp = performance.now();
      if (BUTTON_MAP[data.button] !== undefined) {
        pad.buttons[BUTTON_MAP[data.button]] = createButtonState(isPressed);
      }
      if (DPAD_BUTTON_MAP[data.button] !== undefined) {
        pad.buttons[DPAD_BUTTON_MAP[data.button]] =
          createButtonState(isPressed);
      }
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
        // Los juegos FBNeo/NeoGeo son simuladores de arcade que requieren
        // insertar moneda (SELECT) antes de poder jugarse. Lo hacemos
        // automáticamente tras 1.5 s para que el emulador termine de
        // inicializar, luego el usuario presiona START para comenzar.
        setTimeout(function () {
          autoPress("select", 1, 150, function () {
            // Segunda moneda para que P2 también pueda iniciar su partida
            autoPress("select", 1, 150, null);
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
