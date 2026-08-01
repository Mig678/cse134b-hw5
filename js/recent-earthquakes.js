const ENDPOINT =
  "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson";
const CACHE_KEY = "recent-earthquakes-usgs-all-day";
const CACHE_TTL_MS = 5 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 8000;
const USGS_HOME = "https://earthquake.usgs.gov/";

let staticTemplate = null;

function getStaticTemplate() {
  if (staticTemplate) {
    return staticTemplate;
  }

  const template = document.createElement("template");
  const ui = document.createElement("div");
  ui.className = "earthquake-ui";

  const heading = document.createElement("h3");
  heading.className = "earthquake-heading";
  heading.textContent = "Live Feed";

  const status = document.createElement("p");
  status.className = "earthquake-status";
  status.setAttribute("aria-live", "polite");

  const list = document.createElement("ol");
  list.className = "earthquake-list";

  const retry = document.createElement("button");
  retry.type = "button";
  retry.className = "earthquake-retry";
  retry.hidden = true;
  retry.textContent = "Retry";

  const attribution = document.createElement("p");
  attribution.className = "earthquake-attribution";
  attribution.appendChild(document.createTextNode("Data provided by the "));

  const attributionLink = document.createElement("a");
  attributionLink.href = USGS_HOME;
  attributionLink.textContent = "U.S. Geological Survey";
  attributionLink.setAttribute("rel", "noopener noreferrer");
  attribution.appendChild(attributionLink);
  attribution.appendChild(document.createTextNode("."));

  ui.appendChild(heading);
  ui.appendChild(status);
  ui.appendChild(list);
  ui.appendChild(retry);
  ui.appendChild(attribution);
  template.content.appendChild(ui);
  staticTemplate = template;
  return staticTemplate;
}

function readCache() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (
      !parsed ||
      typeof parsed.timestamp !== "number" ||
      !parsed.data ||
      !Array.isArray(parsed.data.features)
    ) {
      return null;
    }

    if (Date.now() - parsed.timestamp > CACHE_TTL_MS) {
      return null;
    }

    return parsed.data;
  } catch {
    return null;
  }
}

function writeCache(data) {
  try {
    sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        timestamp: Date.now(),
        data,
      }),
    );
  } catch {
    // sessionStorage unavailable
  }
}

function isSafeHttpsUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function parseCountAttribute(value) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isInteger(parsed) && parsed >= 1 && parsed <= 10) {
    return parsed;
  }
  return 5;
}

function formatMagnitude(mag) {
  if (typeof mag === "number" && !Number.isNaN(mag)) {
    return `M ${mag.toFixed(1)}`;
  }
  return "M unknown";
}

function formatPlace(place) {
  if (typeof place === "string" && place.trim()) {
    return place.trim();
  }
  return "Unknown location";
}

function formatTime(time) {
  if (typeof time === "number" && !Number.isNaN(time)) {
    return new Date(time).toLocaleString();
  }
  return "Unknown time";
}

const STATE_IDLE = "idle";
const STATE_LOADING = "loading";
const STATE_READY = "ready";
const STATE_ERROR = "error";

class RecentEarthquakes extends HTMLElement {
  static observedAttributes = ["count"];

  abortController = null;
  timeoutId = null;
  memoryCache = null;
  uiReady = false;
  statusEl = null;
  listEl = null;
  retryBtn = null;

  connectedCallback() {
    this.ensureUi();
    this.setComponentState(STATE_IDLE);
    this.statusEl.textContent =
      "Recent earthquake data will load from the U.S. Geological Survey.";
    this.loadData();
  }

  disconnectedCallback() {
    this.cancelRequest();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name !== "count" || oldValue === newValue || !this.isConnected) {
      return;
    }

    if (!this.isUiInitialized()) {
      return;
    }

    const cached = this.memoryCache || readCache();
    if (cached && Array.isArray(cached.features)) {
      this.renderFeatures(cached.features);
      return;
    }

    if (
      this.getAttribute("data-state") === STATE_READY ||
      this.getAttribute("data-state") === STATE_ERROR
    ) {
      this.loadData();
    }
  }

  get count() {
    if (!this.hasAttribute("count")) {
      return 5;
    }
    return parseCountAttribute(this.getAttribute("count"));
  }

  ensureUi() {
    if (this.uiReady) {
      return;
    }

    if (!this.querySelector(".earthquake-fallback")) {
      const fallback = document.createElement("div");
      fallback.className = "earthquake-fallback";
      while (this.firstChild) {
        fallback.appendChild(this.firstChild);
      }
      this.appendChild(fallback);
    }

    const fragment = getStaticTemplate().content.cloneNode(true);
    this.appendChild(fragment);

    const ui = this.querySelector(".earthquake-ui");
    this.statusEl = ui.querySelector(".earthquake-status");
    this.listEl = ui.querySelector(".earthquake-list");
    this.retryBtn = ui.querySelector(".earthquake-retry");
    this.retryBtn.addEventListener("click", () => {
      this.loadData(true);
    });

    this.uiReady = true;
  }

  isUiInitialized() {
    return (
      this.uiReady &&
      this.listEl instanceof Element &&
      this.statusEl instanceof Element &&
      this.retryBtn instanceof HTMLButtonElement
    );
  }

  setComponentState(state) {
    this.setAttribute("data-state", state);
  }

  cancelRequest() {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  async loadData(forceFetch = false) {
    this.ensureUi();

    if (!forceFetch) {
      const cached = this.memoryCache || readCache();
      if (cached && Array.isArray(cached.features)) {
        this.memoryCache = cached;
        this.setComponentState(STATE_LOADING);
        this.statusEl.textContent = "Loading recent earthquake data…";
        this.retryBtn.hidden = true;
        this.renderFeatures(cached.features);
        return;
      }
    }

    this.cancelRequest();
    this.setComponentState(STATE_LOADING);
    this.statusEl.textContent = "Loading recent earthquake data…";
    this.listEl.replaceChildren();
    this.retryBtn.hidden = true;

    this.abortController = new AbortController();
    const signal = this.abortController.signal;
    let timedOut = false;

    this.timeoutId = setTimeout(() => {
      timedOut = true;
      this.abortController.abort();
    }, REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(ENDPOINT, { signal });

      if (this.timeoutId !== null) {
        clearTimeout(this.timeoutId);
        this.timeoutId = null;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      if (!data || !Array.isArray(data.features)) {
        throw new Error("Invalid feed format");
      }

      this.memoryCache = data;
      writeCache(data);

      if (!this.isConnected) {
        return;
      }

      if (data.features.length === 0) {
        this.setComponentState(STATE_IDLE);
        this.statusEl.textContent =
          "No recent earthquakes were found in the current feed.";
        this.listEl.replaceChildren();
        return;
      }

      this.renderFeatures(data.features);
    } catch (error) {
      if (this.timeoutId !== null) {
        clearTimeout(this.timeoutId);
        this.timeoutId = null;
      }

      if (!this.isConnected) {
        return;
      }

      if (error.name === "AbortError" && !timedOut) {
        return;
      }

      this.setComponentState(STATE_ERROR);
      this.listEl.replaceChildren();

      if (error.name === "AbortError" && timedOut) {
        this.statusEl.textContent =
          "The earthquake feed timed out after 8 seconds.";
      } else {
        this.statusEl.textContent =
          "Unable to load recent earthquake data right now.";
      }

      this.retryBtn.hidden = false;
    } finally {
      this.abortController = null;
    }
  }

  renderFeatures(features) {
    if (!this.isUiInitialized()) {
      return;
    }

    this.listEl.replaceChildren();
    const items = features.slice(0, this.count);

    if (items.length === 0) {
      this.setComponentState(STATE_IDLE);
      this.statusEl.textContent =
        "No usable earthquake results are available to display.";
      return;
    }

    for (const feature of items) {
      const properties =
        feature && typeof feature === "object" && feature.properties
          ? feature.properties
          : {};

      const item = document.createElement("li");
      item.className = "earthquake-item";

      const summary = document.createElement("p");
      summary.className = "earthquake-summary";

      const magnitude = document.createElement("span");
      magnitude.className = "earthquake-magnitude";
      magnitude.textContent = formatMagnitude(properties.mag);

      const place = document.createElement("span");
      place.className = "earthquake-place";
      place.textContent = formatPlace(properties.place);

      const time = document.createElement("time");
      time.className = "earthquake-time";
      if (typeof properties.time === "number" && !Number.isNaN(properties.time)) {
        time.dateTime = new Date(properties.time).toISOString();
      }
      time.textContent = formatTime(properties.time);

      summary.appendChild(magnitude);
      summary.appendChild(document.createTextNode(" — "));
      summary.appendChild(place);
      summary.appendChild(document.createTextNode(" — "));
      summary.appendChild(time);
      item.appendChild(summary);

      if (
        typeof properties.url === "string" &&
        isSafeHttpsUrl(properties.url)
      ) {
        const link = document.createElement("a");
        link.href = properties.url;
        link.textContent = "View event on USGS (official page)";
        link.setAttribute("rel", "noopener noreferrer");
        item.appendChild(link);
      }

      this.listEl.appendChild(item);
    }

    this.setComponentState(STATE_READY);
    this.statusEl.textContent = `Showing ${items.length} recent earthquake${items.length === 1 ? "" : "s"}.`;
    this.retryBtn.hidden = true;
  }
}

if (!customElements.get("recent-earthquakes")) {
  customElements.define("recent-earthquakes", RecentEarthquakes);
}
