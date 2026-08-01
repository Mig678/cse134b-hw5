const STORAGE_KEY = "theme-preference";
const VALID_THEMES = new Set(["system", "light", "dark"]);

function readStoredTheme() {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (VALID_THEMES.has(value)) {
      return value;
    }
  } catch {
    // localStorage unavailable or blocked
  }
  return "system";
}

function writeStoredTheme(preference) {
  try {
    localStorage.setItem(STORAGE_KEY, preference);
  } catch {
    // ignore write failures
  }
}

function applyTheme(preference) {
  const root = document.documentElement;

  if (preference === "light") {
    root.setAttribute("data-theme", "light");
  } else if (preference === "dark") {
    root.setAttribute("data-theme", "dark");
  } else {
    root.removeAttribute("data-theme");
  }
}

function createThemePicker() {
  const header = document.querySelector("header");
  if (!header) {
    return;
  }

  const wrapper = document.createElement("div");
  wrapper.className = "theme-picker";

  const label = document.createElement("label");
  label.setAttribute("for", "theme-select");
  label.textContent = "Theme";

  const select = document.createElement("select");
  select.id = "theme-select";
  select.name = "theme";
  select.setAttribute("aria-label", "Theme preference");

  const options = [
    { value: "system", text: "System" },
    { value: "light", text: "Light" },
    { value: "dark", text: "Dark" },
  ];

  for (const optionData of options) {
    const option = document.createElement("option");
    option.value = optionData.value;
    option.textContent = optionData.text;
    select.appendChild(option);
  }

  select.value = readStoredTheme();

  select.addEventListener("change", () => {
    const preference = select.value;
    if (!VALID_THEMES.has(preference)) {
      return;
    }
    applyTheme(preference);
    writeStoredTheme(preference);
  });

  wrapper.appendChild(label);
  wrapper.appendChild(select);
  header.appendChild(wrapper);
}

createThemePicker();
