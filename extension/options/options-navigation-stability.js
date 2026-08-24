"use strict";

(() => {
  const nav = document.getElementById("settings-nav");
  const form = document.getElementById("settings-form");
  if (!nav || !form) return;

  let frame = 0;
  let applying = false;
  let currentSectionId = "";

  const sections = () => [...form.querySelectorAll(":scope > section")]
    .filter(section => !section.hidden && section.dataset.experienceHidden !== "true" && getComputedStyle(section).display !== "none");

  const links = () => [...nav.querySelectorAll(".settings-nav-link[data-section-id]")];

  function navigationLine() {
    const header = document.querySelector(".settings-organic-stage > .page-header");
    const headerBottom = header?.getBoundingClientRect().bottom || 0;
    return Math.max(0, headerBottom) + 36;
  }

  function sectionForViewport() {
    const available = sections();
    if (!available.length) return null;
    const line = navigationLine();
    let candidate = available[0];
    for (const section of available) {
      const rect = section.getBoundingClientRect();
      if (rect.top <= line) candidate = section;
      else break;
    }
    return candidate;
  }

  function setActiveSection(sectionId, updateHash = true) {
    if (!sectionId) return;
    applying = true;
    currentSectionId = sectionId;
    for (const link of links()) {
      const active = link.dataset.sectionId === sectionId;
      link.classList.toggle("is-active", active);
      if (active) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    }
    if (updateHash && location.hash !== `#${sectionId}`) {
      history.replaceState(null, "", `#${sectionId}`);
    }
    queueMicrotask(() => { applying = false; });
  }

  function syncFromViewport() {
    frame = 0;
    const section = sectionForViewport();
    if (section) setActiveSection(section.id);
  }

  function scheduleSync() {
    if (frame) return;
    frame = requestAnimationFrame(syncFromViewport);
  }

  nav.addEventListener("click", event => {
    const link = event.target instanceof Element ? event.target.closest(".settings-nav-link[data-section-id]") : null;
    if (!link || !nav.contains(link)) return;
    const section = document.getElementById(link.dataset.sectionId || "");
    if (!section || section.hidden || section.dataset.experienceHidden === "true") return;

    /* Capture the navigation before the legacy smooth-scroll listener. Long
     * sections otherwise let IntersectionObserver keep the previous item active. */
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    section.scrollIntoView({behavior: "auto", block: "start"});
    setActiveSection(section.id);
    scheduleSync();
  }, true);

  window.addEventListener("scroll", scheduleSync, {passive: true});
  window.addEventListener("resize", scheduleSync, {passive: true});

  const navObserver = new MutationObserver(() => {
    if (!applying) scheduleSync();
  });
  navObserver.observe(nav, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["class", "aria-current", "hidden"]
  });

  const formObserver = new MutationObserver(scheduleSync);
  formObserver.observe(form, {
    subtree: true,
    attributes: true,
    attributeFilter: ["hidden", "data-experience-hidden"]
  });

  window.addEventListener("pagehide", () => {
    if (frame) cancelAnimationFrame(frame);
    navObserver.disconnect();
    formObserver.disconnect();
  }, {once: true});

  const hashId = decodeURIComponent(location.hash.replace(/^#/, ""));
  const hashSection = hashId ? document.getElementById(hashId) : null;
  if (hashSection && sections().includes(hashSection)) {
    hashSection.scrollIntoView({behavior: "auto", block: "start"});
    setActiveSection(hashSection.id, false);
  } else if (currentSectionId) {
    setActiveSection(currentSectionId, false);
  }
  scheduleSync();
})();
