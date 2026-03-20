// NEOARCADE - NeoGeo Launcher
// neogeo.zip BIOS lives in the same directory as each game ROM so EmulatorJS
// writes it at the correct VFS path ("neogeo.zip") where FBNeo looks for it.
(function () {
  var INPUT_EVENT_TYPES = { input: true, "neoarcade-input": true };
  var BUTTON_MAP = { a: 1, b: 0, x: 2, y: 3, select: 8, start: 9 };
  var AXIS_MAP = { left: [0, -1], right: [0, 1], up: [1, -1], down: [1, 1] };
  var DPAD_BUTTON_MAP = { up: 12, down: 13, left: 14, right: 15 };

  function createButtonState(pressed) {
    return { pressed: !!pressed, touched: !!pressed, value: pressed ? 1 : 0 };
  }

  function createPad(index) {
    return {
      id: "NEOARCADE-P" + (index + 1),
      index: index,
      connected: false,
      timestamp: 0,
      mapping: "standard",
      axes: new Float64Array(4),
      buttons: Array.from({ length: 17 }, function () {
        return createButtonState(false);
      }),
    };
  }

  function installBridge() {
    var pads = [createPad(0), createPad(1)];
    var announced = [false, false];
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
      if (AXIS_MAP[data.button]) {
        var axisConfig = AXIS_MAP[data.button];
        pad.axes[axisConfig[0]] = isPressed ? axisConfig[1] : 0;
      }
      if (DPAD_BUTTON_MAP[data.button] !== undefined) {
        pad.buttons[DPAD_BUTTON_MAP[data.button]] = createButtonState(isPressed);
      }
      if (!pad.connected) {
        pad.connected = true;
        if (!announced[playerIndex] && typeof GamepadEvent === "function") {
          announced[playerIndex] = true;
          window.dispatchEvent(new GamepadEvent("gamepadconnected", { gamepad: pad }));
        }
      }
    });
    navigator.getGamepads = function () { return pads; };
  }

  window.NEOARCADE_NEO_GEO = {
    bootstrap: function (config) {
      installBridge();
      var overlay = document.getElementById(config.loadingOverlayId);
      var statusNode = document.getElementById(config.loadingStatusId);
      if (statusNode) {
        statusNode.textContent = "CARGANDO " + (config.gameTitle || "JUEGO").toUpperCase() + "...";
      }
      window.EJS_player = config.playerSelector;
      window.EJS_core = "arcade";
      window.EJS_gameUrl = config.romUrl;
      window.EJS_biosUrl = "neogeo.zip";
      window.EJS_dontExtractBIOS = true;
      window.EJS_dontExtractRom = true;
      window.EJS_pathtodata = "/emulatorjs/data/";
      window.EJS_startOnLoaded = true;
      window.EJS_language = "en";
      window.EJS_onGameStart = function () {
        if (overlay) overlay.classList.add("hidden");
        if (typeof config.onGameStart === "function") config.onGameStart();
      };
      var script = document.createElement("script");
      script.src = "/emulatorjs/data/loader.js";
      script.async = true;
      document.body.appendChild(script);
    },
  };
})();