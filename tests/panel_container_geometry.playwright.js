async page => {
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  await page.setViewportSize({width: 1100, height: 800});
  await page.goto("http://127.0.0.1:8765/tests/fixtures/panel_responsive_153.html");
  const observations = [];
  for (let width = 800; width >= 280; width -= 20) {
    const result = await page.evaluate(async value => {
      document.querySelector("#pane").style.width = `${value}px`;
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const panel = document.querySelector("#pin-mails-panel");
      const header = panel.querySelector(".pin-mails-panel-header");
      const tools = panel.querySelector(".pin-mails-panel-tools");
      const actions = panel.querySelector(".pin-mails-card-actions");
      const panelRect = panel.getBoundingClientRect();
      const escaped = [...panel.querySelectorAll("button, input, select, .pin-mails-title-wrap, .pin-mails-card")]
        .filter(node => getComputedStyle(node).display !== "none")
        .map(node => ({node, rect: node.getBoundingClientRect()}))
        .filter(({rect}) => rect.left < panelRect.left - 1 || rect.right > panelRect.right + 1)
        .map(({node}) => node.className);
      return {
        width: value,
        overflow: panel.scrollWidth - panel.clientWidth,
        escaped,
        headerHeight: header.getBoundingClientRect().height,
        toolsDirection: getComputedStyle(tools).flexDirection,
        actionsVisibility: getComputedStyle(actions).visibility,
        actionsPointerEvents: getComputedStyle(actions).pointerEvents,
        secondaryDisplay: getComputedStyle(panel.querySelector('[data-secondary]')).display
      };
    }, width);
    assert(result.overflow <= 1, `${width}px: panel must not overflow horizontally (${result.overflow}px)`);
    assert(result.escaped.length === 0, `${width}px: controls escaped the panel: ${result.escaped.join(", ")}`);
    if (width <= 390) {
      assert(result.headerHeight >= 68, `${width}px: narrow header must wrap into a stable second row`);
      assert(result.toolsDirection === "row", `${width}px: search and filter must share the available narrow row`);
      assert(result.actionsVisibility === "visible" && result.actionsPointerEvents === "auto", `${width}px: card actions must remain usable`);
    } else if (width <= 600) {
      assert(result.secondaryDisplay === "none", `${width}px: medium state must hide only the secondary sort control`);
    }
    observations.push(result);
  }
  await page.screenshot({path: "output/playwright/panel-container-280.png"});
  return {samples: observations.length, narrow: observations.at(-1), large: observations[0]};
}
