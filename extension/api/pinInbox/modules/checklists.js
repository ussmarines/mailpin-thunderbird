(function(scope) {
  "use strict";

  const MAX_ITEMS = 50;
  const MAX_TEXT = 240;
  const ID_RE = /^[a-z0-9_-]{1,80}$/i;

  function normalizeItem(value, index = 0) {
    if (!value || typeof value !== "object") return null;
    const fallback = `task-${index + 1}`;
    const rawId = String(value.id || fallback).replace(/[^a-z0-9_-]/gi, "-").slice(0, 80);
    const id = ID_RE.test(rawId) ? rawId : fallback;
    const text = String(value.text || "").trim().slice(0, MAX_TEXT);
    if (!text) return null;
    const completed = Boolean(value.completed);
    return {
      id,
      text,
      completed,
      createdAt: Math.max(0, Number(value.createdAt) || Date.now()),
      completedAt: completed ? Math.max(0, Number(value.completedAt) || Date.now()) : 0
    };
  }

  function normalize(value) {
    const source = Array.isArray(value) ? value : [];
    const result = [];
    const ids = new Set();
    for (let index = 0; index < source.length && result.length < MAX_ITEMS; index += 1) {
      const item = normalizeItem(source[index], index);
      if (!item || ids.has(item.id)) continue;
      ids.add(item.id);
      result.push(item);
    }
    return result;
  }

  function stats(value) {
    const items = normalize(value);
    const completed = items.filter(item => item.completed).length;
    return {
      total: items.length,
      completed,
      pending: items.length - completed,
      progress: items.length ? completed / items.length : 0
    };
  }

  function searchableText(value) {
    return normalize(value).map(item => item.text).join(" ");
  }

  scope.PinChecklists = Object.freeze({MAX_ITEMS, MAX_TEXT, normalizeItem, normalize, stats, searchableText});
})(this);
