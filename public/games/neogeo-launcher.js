(function () {
  var DB_NAME = "neoarcade-assets";
  var STORE_NAME = "files";
  var BIOS_KEY = "neogeo-bios";
  var INPUT_EVENT_TYPES = { input: true, "neoarcade-input": true };
  var BUTTON_MAP = { a: 1, b: 0, x: 2, y: 3, select: 8, start: 9 };
  var AXIS_MAP = { left: [0, -1], right: [0, 1], up: [1, -1], down: [1, 1] };
  var DPAD_BUTTON_MAP = { up: 12, down: 13, left: 14, right: 15 };

  function openDatabase() {
    return new Promise(function (resolve, reject) {
      var request = indexedDB.open(DB_NAME, 1);

      request.onupgradeneeded = function () {
        var db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };

      request.onsuccess = function () {
        resolve(request.result);
      };

      request.onerror = function () {
        reject(request.error || new Error("No se pudo abrir IndexedDB"));
      };
    });
  }

  function loadStoredBios() {
    return openDatabase().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(STORE_NAME, "readonly");
        var store = tx.objectStore(STORE_NAME);
        var request = store.get(BIOS_KEY);

        request.onsuccess = function () {
          resolve(request.result || null);
        };

        request.onerror = function () {
          reject(request.error || new Error("No se pudo leer el BIOS"));
        };
      }).finally(function () {
        db.close();
      });
    });
  }

  function saveBiosFile(file) {
    return openDatabase().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(STORE_NAME, "readwrite");
        var store = tx.objectStore(STORE_NAME);
        var request = store.put(file, BIOS_KEY);

        request.onsuccess = function () {
          resolve(file);
        };

        request.onerror = function () {
          reject(request.error || new Error("No se pudo guardar el BIOS"));
        };
      }).finally(function () {
        db.close();
      });
    });
  }

  function loadServerBios(url) {
    if (!url) return Promise.resolve(null);

    return fetch(url, { cache: "no-store" })
      .then(function (response) {
        if (!response.ok) return null;
        return response.blob().then(function (blob) {
          if (!blob || !blob.size) return null;
          return new File([blob], "neogeo.zip", {
            type: blob.type || "application/zip",
          });
        });
      })
      .catch(function () {
        return null;
      });
  }

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
        pad.buttons[DPAD_BUTTON_MAP[data.button]] =
          createButtonState(isPressed);
      }

      if (!pad.connected) {
        pad.connected = true;
        if (!announced[playerIndex] && typeof GamepadEvent === "function") {
          announced[playerIndex] = true;
          window.dispatchEvent(
            new GamepadEvent("gamepadconnected", { gamepad: pad }),
          );
        }
      }
    });

    navigator.getGamepads = function () {
      return pads;
    };
  }

  function setText(node, value) {
    if (node) node.textContent = value;
  }

  function launchEmulator(config, biosUrl) {
    window.EJS_player = config.playerSelector;
    window.EJS_core = "fbneo";
    window.EJS_gameUrl = config.romUrl;
    window.EJS_biosUrl = biosUrl;
    window.EJS_pathtodata = "https://cdn.emulatorjs.org/latest/data/";
    window.EJS_startOnLoaded = true;
    window.EJS_language = "en";
    window.EJS_dontExtractRom = true;
    window.EJS_onGameStart = function () {
      if (config.onGameStart) config.onGameStart();
    };

    var script = document.createElement("script");
    script.src = "https://cdn.emulatorjs.org/latest/data/loader.js";
    script.async = true;
    script.onerror = function () {
      if (config.onFatalError) {
        config.onFatalError(
          "No se pudo cargar EmulatorJS desde el CDN. Revisa tu conexión e intenta otra vez.",
        );
      }
    };
    document.body.appendChild(script);
  }

  function waitForBiosSelection(config) {
    return new Promise(function (resolve, reject) {
      var input = document.getElementById(config.biosInputId);
      var button = document.getElementById(config.biosButtonId);

      if (!input || !button) {
        reject(new Error("Falta el selector de BIOS en la página"));
        return;
      }

      function resetButton() {
        button.disabled = false;
        setText(button, config.buttonLabel || "USAR BIOS NEO GEO");
      }

      function cleanup() {
        button.removeEventListener("click", handleButtonClick);
        input.removeEventListener("change", handleSelection);
      }

      function handleButtonClick() {
        input.click();
      }

      function handleSelection() {
        var file = input.files && input.files[0];
        if (!file) {
          resetButton();
          return;
        }

        if (file.name.toLowerCase() !== "neogeo.zip") {
          input.value = "";
          setText(button, "ARCHIVO INVALIDO");
          setTimeout(function () {
            resetButton();
          }, 1200);
          return;
        }

        button.disabled = true;
        setText(button, "GUARDANDO BIOS...");

        saveBiosFile(file)
          .then(function (savedFile) {
            cleanup();
            resolve(savedFile);
          })
          .catch(function (error) {
            cleanup();
            reject(error);
          })
          .finally(function () {
            input.value = "";
            resetButton();
          });
      }

      button.addEventListener("click", handleButtonClick);
      input.addEventListener("change", handleSelection);
    });
  }

  function withTimeout(promise, ms, errorMessage) {
    return new Promise(function (resolve, reject) {
      var settled = false;
      var timeoutId = setTimeout(function () {
        if (settled) return;
        settled = true;
        reject(new Error(errorMessage));
      }, ms);

      promise
        .then(function (value) {
          if (settled) return;
          settled = true;
          clearTimeout(timeoutId);
          resolve(value);
        })
        .catch(function (error) {
          if (settled) return;
          settled = true;
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  window.NEOARCADE_NEO_GEO = {
    bootstrap: function (config) {
      installBridge();

      var loadingOverlay = document.getElementById(config.loadingOverlayId);
      var statusNode = document.getElementById(config.loadingStatusId);
      var biosPanel = document.getElementById(config.biosPanelId);
      var errorPanel = document.getElementById(config.errorPanelId);
      var errorText = document.getElementById(config.errorTextId);
      var retryButton = document.getElementById(config.retryButtonId);

      function showLoading(message) {
        if (loadingOverlay) loadingOverlay.classList.remove("hidden");
        if (biosPanel) biosPanel.classList.add("hidden");
        if (errorPanel) errorPanel.classList.add("hidden");
        setText(statusNode, message || config.loadingText);
      }

      function showBiosPrompt() {
        if (loadingOverlay) loadingOverlay.classList.add("hidden");
        if (errorPanel) errorPanel.classList.add("hidden");
        if (biosPanel) biosPanel.classList.remove("hidden");
      }

      function showError(message) {
        if (loadingOverlay) loadingOverlay.classList.add("hidden");
        if (biosPanel) biosPanel.classList.add("hidden");
        if (errorPanel) errorPanel.classList.remove("hidden");
        setText(errorText, message || "No se pudo iniciar el juego.");
      }

      function startWithBios(file) {
        showLoading("INICIANDO " + config.gameTitle.toUpperCase() + "...");
        var biosUrl = URL.createObjectURL(file);
        var gameStarted = false;

        launchEmulator(
          {
            playerSelector: config.playerSelector,
            romUrl: config.romUrl,
            onGameStart: function () {
              gameStarted = true;
              if (loadingOverlay) loadingOverlay.classList.add("hidden");
              if (biosPanel) biosPanel.classList.add("hidden");
              if (errorPanel) errorPanel.classList.add("hidden");
            },
            onFatalError: function (message) {
              URL.revokeObjectURL(biosUrl);
              showError(message);
            },
          },
          biosUrl,
        );

        withTimeout(
          new Promise(function (resolve) {
            var pollId = setInterval(function () {
              if (!gameStarted) return;
              clearInterval(pollId);
              resolve();
            }, 150);
          }),
          20000,
          "El emulador no arrancó. Lo más común es que el BIOS o la ROM no coincidan con FBNeo.",
        ).catch(function (error) {
          showError(error.message);
        });
      }

      function bootstrapGame() {
        showLoading(config.loadingText);
        loadServerBios(config.serverBiosUrl)
          .then(function (serverFile) {
            if (serverFile) {
              startWithBios(serverFile);
              return;
            }

            return loadStoredBios().then(function (storedFile) {
              if (storedFile) {
                startWithBios(storedFile);
                return;
              }

              showBiosPrompt();
              return waitForBiosSelection(config).then(function (selectedFile) {
                startWithBios(selectedFile);
              });
            });
          })
          .catch(function (error) {
            showError(error.message || "No se pudo preparar el BIOS Neo Geo.");
          });
      }

      if (retryButton) {
        retryButton.addEventListener("click", function () {
          location.reload();
        });
      }

      bootstrapGame();
    },
  };
})();
