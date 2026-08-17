/* MailPin theme bridge: keeps extension pages aligned with Thunderbird. */
(() => {
  "use strict";

  const root = document.documentElement;
  const darkPreference = matchMedia("(prefers-color-scheme: dark)");
  const themeApi = globalThis.messenger?.theme || globalThis.browser?.theme;

  function rgbFromColor(value) {
    const match = String(value || "").match(/rgba?\(\s*(\d+(?:\.\d+)?)\D+(\d+(?:\.\d+)?)\D+(\d+(?:\.\d+)?)/i);
    if (match) return match.slice(1, 4).map(Number);
    const hex = String(value || "").trim().match(/^#([0-9a-f]{6}|[0-9a-f]{3})$/i);
    if (!hex) return null;
    const normalized = hex[1].length === 3 ? [...hex[1]].map(char => char + char).join("") : hex[1];
    return [0, 2, 4].map(index => Number.parseInt(normalized.slice(index, index + 2), 16));
  }

  function relativeLuminance(rgb) {
    if (!rgb) return null;
    const channels = rgb.map(value => {
      const channel = Math.max(0, Math.min(255, value)) / 255;
      return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    });
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  }

  function setTheme(theme) {
    const normalized = theme === "dark" ? "dark" : "light";
    root.dataset.mpTheme = normalized;
    root.style.colorScheme = normalized;
  }

  function inferFromTheme(theme) {
    const colors = theme?.colors || {};
    const candidates = [
      colors.toolbar,
      colors.frame,
      colors.tab_selected,
      colors.popup,
      colors.sidebar
    ];
    for (const candidate of candidates) {
      const luminance = relativeLuminance(rgbFromColor(candidate));
      if (luminance !== null) return luminance < 0.32 ? "dark" : "light";
    }
    return darkPreference.matches ? "dark" : "light";
  }

  setTheme(darkPreference.matches ? "dark" : "light");

  const refresh = async () => {
    try {
      if (typeof themeApi?.getCurrent === "function") {
        setTheme(inferFromTheme(await themeApi.getCurrent()));
        return;
      }
    } catch {
      // The CSS media-query fallback remains authoritative when the API is absent.
    }
    setTheme(darkPreference.matches ? "dark" : "light");
  };

  darkPreference.addEventListener?.("change", refresh);
  themeApi?.onUpdated?.addListener?.(update => setTheme(inferFromTheme(update?.theme || update)));
  void refresh();
})();
