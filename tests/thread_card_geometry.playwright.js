async page => {
  const url = "http://127.0.0.1:8765/tests/fixtures/thread_card_153.html";
  const assert = (condition, message) => {
    if (!condition) throw new Error(message);
  };
  const rounded = value => Math.round(value * 100) / 100;

  await page.goto(url);
  await page.locator("#card-selected .card-container").hover();

  const measure = async label => {
    const rows = await page.locator("tr.card-layout").evaluateAll((items, scenario) => {
      const rect = element => {
        const box = element.getBoundingClientRect();
        return {
          top: box.top,
          right: box.right,
          bottom: box.bottom,
          left: box.left,
          width: box.width,
          height: box.height,
          cx: box.left + box.width / 2,
          cy: box.top + box.height / 2
        };
      };
      const hit = box => {
        const target = document.elementFromPoint(box.cx, box.cy);
        return target?.className || target?.localName || "";
      };
      return items.map(row => {
        const container = rect(row.querySelector(".card-container"));
        const railElement = row.querySelector(".pin-mails-card-action-rail");
        const rail = rect(railElement);
        const pinElement = row.querySelector(".pin-mails-independent-button, [data-pin-mails-native-star]");
        const nativeStarElement = row.querySelector(".button-star");
        const pin = rect(pinElement);
        const star = rect(nativeStarElement);
        const attachmentElement = row.querySelector(".attachment-icon");
        const attachment = attachmentElement ? rect(attachmentElement) : null;
        const menu = rect(row.querySelector(".tree-button-more"));
        return {
          scenario,
          id: row.id,
          container,
          rail,
          pin,
          star,
          attachment,
          menu,
          pinHit: hit(pin),
          starHit: hit(star),
          railDisplay: getComputedStyle(railElement).display,
          pinPosition: getComputedStyle(pinElement).position
        };
      });
    }, label);

    for (const row of rows) {
      const {container, rail, pin, star, attachment, menu} = row;
      assert(row.railDisplay === "flex", `${label}/${row.id}: the action rail is not flex`);
      assert(Math.abs(pin.cy - star.cy) <= 1, `${label}/${row.id}: pin and star centers differ`);
      assert(pin.top >= container.top && pin.bottom <= container.bottom,
        `${label}/${row.id}: pin leaves the card`);
      assert(star.top >= container.top && star.bottom <= container.bottom,
        `${label}/${row.id}: star leaves the card`);
      assert(container.bottom - pin.bottom >= 8, `${label}/${row.id}: pin bottom gap is below 8px`);
      assert(container.bottom - star.bottom >= 8, `${label}/${row.id}: star bottom gap is below 8px`);
      assert(rail.top >= container.top && rail.bottom <= container.bottom,
        `${label}/${row.id}: rail leaves the card`);
      if (label !== "nativeStar") {
        assert(pin.right <= star.left || star.right <= pin.left,
          `${label}/${row.id}: pin overlaps star`);
      }
      if (attachment) {
        assert(attachment.right <= pin.left || pin.right <= attachment.left,
          `${label}/${row.id}: attachment overlaps pin`);
      }
      assert(rail.left >= menu.right || rail.top >= menu.bottom || rail.bottom <= menu.top,
        `${label}/${row.id}: action rail overlaps menu`);
      assert(String(row.pinHit).includes("pin-mails-independent-button") || String(row.pinHit).includes("button-star"),
        `${label}/${row.id}: pin center is not clickable`);
      assert(String(row.starHit).includes("button-star"), `${label}/${row.id}: star center is not clickable`);
    }
    return rows;
  };

  const results = {};
  results.normal = await measure("normal");

  await page.locator("#threadTree").evaluate(node => node.classList.add("cards-row-compact"));
  results.compact = await measure("compact");

  await page.locator("html").evaluate(node => node.setAttribute("uidensity", "touch"));
  results.touch = await measure("touch");

  await page.locator("body").evaluate(node => { node.style.zoom = "1.25"; });
  results.zoom125 = await measure("zoom125");

  await page.locator("body").evaluate(node => { node.style.zoom = "1"; });
  await page.locator("#threadTree").evaluate(node => node.classList.remove("cards-row-compact"));
  await page.locator("html").evaluate(node => {
    node.removeAttribute("uidensity");
    node.setAttribute("pin-mails-native-star", "");
  });
  await page.locator("tr.card-layout").evaluateAll(rows => {
    for (const row of rows) {
      row.querySelector(".pin-mails-independent-button")?.remove();
      const star = row.querySelector(".button-star");
      star.setAttribute("data-pin-mails-native-star", "");
      star.classList.add("pin-mails-row-button");
    }
  });
  results.nativeStar = await measure("nativeStar");
  for (const row of results.nativeStar) {
    assert(row.pinPosition !== "absolute", `nativeStar/${row.id}: star must not be absolutely positioned`);
  }

  return Object.fromEntries(Object.entries(results).map(([scenario, rows]) => [
    scenario,
    rows.map(row => ({
      id: row.id,
      cardHeight: rounded(row.container.height),
      pinCenterY: rounded(row.pin.cy - row.container.top),
      starCenterY: rounded(row.star.cy - row.container.top),
      bottomGap: rounded(row.container.bottom - row.pin.bottom),
      pinPosition: row.pinPosition
    }))
  ]));
}
