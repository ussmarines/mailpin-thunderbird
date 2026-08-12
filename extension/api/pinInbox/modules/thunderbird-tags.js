(function(scope) {
  "use strict";

  const COLOR_RE = /^#[0-9a-f]{6}$/i;

  function create(dependencies = {}) {
    const {MailServices, ExtensionError = Error} = dependencies;
    const tags = MailServices?.tags;

    function metadataForHeader(header, limit = 3) {
      let keywords = "";
      try { keywords = header?.getStringProperty?.("keywords") || ""; } catch { return []; }
      const result = [];
      for (const key of keywords.split(/\s+/).filter(Boolean)) {
        try {
          const name = tags?.getTagForKey?.(key);
          if (!name) continue;
          const color = String(tags?.getColorForKey?.(key) || "");
          result.push({key, name, color: COLOR_RE.test(color) ? color.toLowerCase() : "currentColor"});
        } catch {}
      }
      return result.slice(0, Math.max(0, Number(limit) || 0));
    }

    function validateDefinitions(definitions = []) {
      for (const definition of definitions) {
        if (!tags?.isValidKey?.(definition.key)) continue;
        const existing = String(tags.getTagForKey(definition.key) || "");
        if (existing !== String(definition.label || "")) {
          throw new ExtensionError(`Le tag Thunderbird « ${definition.key} » existe déjà et n’appartient pas à MailPin.`);
        }
      }
      return true;
    }

    function ensureDefinitions(definitions = []) {
      if (!tags) return 0;
      validateDefinitions(definitions);
      let created = 0;
      for (const definition of definitions) {
        if (tags.isValidKey(definition.key)) {
          try {
            if (tags.getColorForKey(definition.key) !== definition.color) tags.setColorForKey(definition.key, definition.color);
          } catch {}
        } else {
          tags.addTagForKey(definition.key, definition.label, definition.color, "");
          created += 1;
        }
      }
      return created;
    }

    function ownedKeys(definitions = []) {
      const owned = new Set();
      for (const definition of definitions) {
        try {
          if (tags?.isValidKey?.(definition.key) && String(tags.getTagForKey(definition.key) || "") === definition.label) {
            owned.add(definition.key);
          }
        } catch {}
      }
      return owned;
    }

    function removeDefinitions(definitions = [], onError = null) {
      let removed = 0;
      const owned = ownedKeys(definitions);
      for (const key of owned) {
        try { tags.deleteKey(key); removed += 1; } catch (error) { onError?.(key, error); }
      }
      return removed;
    }

    function keywordsForHeader(header) {
      try { return new Set(String(header?.getStringProperty?.("keywords") || "").split(/\s+/).filter(Boolean)); }
      catch { return new Set(); }
    }

    function batchKeywords(headers = [], keys = [], add = true) {
      const cleanKeys = [...new Set((keys || []).map(key => String(key || "").trim()).filter(Boolean))];
      if (!cleanKeys.length) return {headers: 0, folders: 0};
      const byFolder = new Map();
      for (const header of headers || []) {
        if (!header?.folder) continue;
        const list = byFolder.get(header.folder) || [];
        list.push(header);
        byFolder.set(header.folder, list);
      }
      for (const [folder, list] of byFolder) {
        if (add) folder.addKeywordsToMessages(list, cleanKeys.join(" "));
        else folder.removeKeywordsFromMessages(list, cleanKeys.join(" "));
      }
      return {headers: [...byFolder.values()].reduce((sum, list) => sum + list.length, 0), folders: byFolder.size};
    }

    function capabilities() {
      return Object.freeze({
        registry: Boolean(tags?.isValidKey && tags?.getTagForKey && tags?.addTagForKey && tags?.deleteKey),
        colors: Boolean(tags?.getColorForKey && tags?.setColorForKey)
      });
    }

    return Object.freeze({
      metadataForHeader,
      validateDefinitions,
      ensureDefinitions,
      ownedKeys,
      removeDefinitions,
      keywordsForHeader,
      batchKeywords,
      capabilities
    });
  }

  scope.PinThunderbirdTags = Object.freeze({create});
})(this);
