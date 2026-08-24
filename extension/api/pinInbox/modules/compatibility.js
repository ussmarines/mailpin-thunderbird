(function(scope) {
  "use strict";

  function create(dependencies = {}) {
    const messages = scope.PinThunderbirdMessages?.create?.(dependencies) || null;
    const tags = scope.PinThunderbirdTags?.create?.(dependencies) || null;
    const calendar = scope.PinThunderbirdCalendar?.create?.(dependencies) || null;

    function snapshot() {
      const groups = {
        messages: messages?.capabilities?.() || {},
        tags: tags?.capabilities?.() || {},
        calendar: calendar?.capabilities?.() || {}
      };
      const missing = [];
      for (const [group, values] of Object.entries(groups)) {
        for (const [capability, available] of Object.entries(values)) {
          if (!available) missing.push(`${group}.${capability}`);
        }
      }
      return Object.freeze({groups: Object.freeze(groups), missing: Object.freeze(missing)});
    }

    return Object.freeze({messages, tags, calendar, snapshot});
  }

  scope.PinCompatibility = Object.freeze({create});
})(this);
