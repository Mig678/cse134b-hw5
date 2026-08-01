(function () {
  function readTheme() {
    try {
      var value = localStorage.getItem("theme");

      if (value === "light" || value === "dark" || value === "system") {
        return value;
      }
    } catch (error) {
      // localStorage unavailable
    }

    return "system";
  }

  function applyTheme(preference) {
    if (preference === "light") {
      document.documentElement.setAttribute("data-theme", "light");
      return;
    }

    if (preference === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
      return;
    }

    document.documentElement.removeAttribute("data-theme");
  }

  function saveTheme(preference) {
    try {
      if (preference === "light") {
        localStorage.setItem("theme", "light");
        return;
      }

      if (preference === "dark") {
        localStorage.setItem("theme", "dark");
        return;
      }

      localStorage.setItem("theme", "system");
    } catch (error) {
      // localStorage unavailable
    }
  }

  function createThemePicker() {
    var header = document.querySelector("header");

    if (!header || document.getElementById("theme-select")) {
      return;
    }

    var wrapper = document.createElement("div");
    wrapper.className = "theme-picker";

    var label = document.createElement("label");
    label.setAttribute("for", "theme-select");
    label.textContent = "Theme";

    var select = document.createElement("select");
    select.id = "theme-select";
    select.name = "theme";
    select.setAttribute("aria-label", "Theme preference");

    var options = [
      { value: "system", text: "System" },
      { value: "light", text: "Light" },
      { value: "dark", text: "Dark" },
    ];

    for (var index = 0; index < options.length; index += 1) {
      var option = document.createElement("option");
      option.value = options[index].value;
      option.textContent = options[index].text;
      select.appendChild(option);
    }

    select.value = readTheme();

    select.addEventListener("change", function () {
      var preference = select.value;

      if (preference === "light") {
        localStorage.setItem("theme", "light");
        document.documentElement.setAttribute("data-theme", "light");
        return;
      }

      if (preference === "dark") {
        localStorage.setItem("theme", "dark");
        document.documentElement.setAttribute("data-theme", "dark");
        return;
      }

      localStorage.setItem("theme", "system");
      document.documentElement.removeAttribute("data-theme");
    });

    wrapper.appendChild(label);
    wrapper.appendChild(select);
    header.appendChild(wrapper);
  }

  applyTheme(readTheme());

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", createThemePicker);
  } else {
    createThemePicker();
  }
})();
