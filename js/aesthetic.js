(function () {
  var STORAGE_KEY = "portfolio-aesthetic";
  var MODE_DEFAULT = "default";
  var MODE_ARCADECORE = "arcadecore";

  function readMode() {
    try {
      var value = localStorage.getItem(STORAGE_KEY);

      if (value === MODE_ARCADECORE) {
        return MODE_ARCADECORE;
      }
    } catch (error) {
      // localStorage unavailable
    }

    return MODE_DEFAULT;
  }

  function saveMode(mode) {
    try {
      if (mode === MODE_ARCADECORE) {
        localStorage.setItem(STORAGE_KEY, "arcadecore");
        return;
      }

      localStorage.setItem(STORAGE_KEY, "default");
    } catch (error) {
      // localStorage unavailable
    }
  }

  function applyMode(mode) {
    if (mode === MODE_ARCADECORE) {
      document.documentElement.dataset.aesthetic = "arcadecore";
      return;
    }

    document.documentElement.removeAttribute("data-aesthetic");
  }

  function updateButton(button, mode) {
    var isArcadecore = mode === MODE_ARCADECORE;

    button.textContent = isArcadecore
      ? "Return to default design"
      : "Enter Arcade Mode";
    button.setAttribute("aria-pressed", isArcadecore ? "true" : "false");
  }

  function getActiveMode() {
    if (document.documentElement.dataset.aesthetic === "arcadecore") {
      return MODE_ARCADECORE;
    }

    return MODE_DEFAULT;
  }

  function createPicker() {
    var header = document.querySelector("header");

    if (!header || document.querySelector(".aesthetic-picker")) {
      return;
    }

    var wrapper = document.createElement("div");
    wrapper.className = "aesthetic-picker";

    var button = document.createElement("button");
    button.type = "button";
    button.className = "aesthetic-toggle";
    button.setAttribute("aria-label", "Toggle Arcadecore aesthetic mode");

    var currentMode = readMode();
    applyMode(currentMode);
    updateButton(button, currentMode);

    button.addEventListener("click", function () {
      var nextMode =
        getActiveMode() === MODE_ARCADECORE ? MODE_DEFAULT : MODE_ARCADECORE;

      applyMode(nextMode);
      saveMode(nextMode);
      updateButton(button, nextMode);
    });

    wrapper.appendChild(button);
    header.appendChild(wrapper);
  }

  applyMode(readMode());

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", createPicker);
  } else {
    createPicker();
  }
})();
