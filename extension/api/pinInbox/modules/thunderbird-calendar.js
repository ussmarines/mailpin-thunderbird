(function(scope) {
  "use strict";

  function create(dependencies = {}) {
    const {cal, CalEvent, CalTodo, ChromeUtils} = dependencies;

    function calendars() {
      try { return [...(cal?.manager?.getCalendars?.() || [])]; } catch { return []; }
    }

    function calendarById(id) {
      const wanted = String(id || "");
      return calendars().find(calendar => String(calendar?.id || "") === wanted) || null;
    }

    function capabilitySupported(calendar, itemType) {
      const property = itemType === "event" ? "capabilities.events.supported" : "capabilities.tasks.supported";
      try {
        const value = calendar?.getProperty?.(property);
        return value !== false && value !== "false" && value !== 0;
      } catch { return true; }
    }

    function descriptor(calendar) {
      const readOnly = Boolean(calendar?.readOnly);
      let disabled = false;
      let aclWritable = !readOnly;
      try {
        const value = calendar?.getProperty?.("disabled");
        disabled = value === true || value === "true" || value === 1;
      } catch {}
      try {
        if (cal?.acl?.isCalendarWritable) aclWritable = Boolean(cal.acl.isCalendarWritable(calendar));
      } catch { aclWritable = false; }
      const taskSupported = capabilitySupported(calendar, "task");
      const eventSupported = capabilitySupported(calendar, "event");
      const writable = !readOnly && !disabled && aclWritable;
      return Object.freeze({
        id: String(calendar?.id || ""),
        name: String(calendar?.name || calendar?.id || ""),
        type: String(calendar?.type || ""),
        readOnly,
        disabled,
        aclWritable,
        writable,
        taskSupported,
        eventSupported,
        taskCompatible: writable && taskSupported,
        eventCompatible: writable && eventSupported
      });
    }

    function jsDateToDateTime(value) {
      return cal.dtz.jsDateToDateTime(value instanceof Date ? value : new Date(value));
    }

    function createItem(itemType, options = {}) {
      const type = itemType === "event" ? "event" : "task";
      const start = Number(options.startAt) || Date.now();
      let item;
      if (type === "event") {
        item = new CalEvent();
        item.startDate = jsDateToDateTime(start);
        item.endDate = jsDateToDateTime(Number(options.endAt) || start + 3_600_000);
      } else {
        item = new CalTodo();
        item.entryDate = jsDateToDateTime(Number(options.entryAt) || Date.now());
        item.dueDate = options.dueAt === 0 ? null : jsDateToDateTime(Number(options.dueAt) || start);
      }
      item.title = String(options.title || "");
      if (options.calendar) item.calendar = options.calendar;
      for (const [key, value] of Object.entries(options.properties || {})) item.setProperty(key, String(value ?? ""));
      return item;
    }

    function applySchedule(item, itemType, dueAt) {
      const type = itemType === "event" ? "event" : "task";
      const due = Number(dueAt) || 0;
      if (due) {
        const date = jsDateToDateTime(due);
        if (type === "event") {
          item.startDate = date;
          item.endDate = jsDateToDateTime(due + 3_600_000);
        } else item.dueDate = date;
      } else if (type !== "event") item.dueDate = null;
      return item;
    }

    function applyCompletion(item, completedAt) {
      const complete = Boolean(completedAt);
      item.percentComplete = complete ? 100 : 0;
      item.status = complete ? "COMPLETED" : "NEEDS-ACTION";
      item.completedDate = complete ? jsDateToDateTime(Number(completedAt)) : null;
      return item;
    }

    async function getItem(calendar, itemId) {
      if (!calendar || !itemId) return null;
      return calendar.getItem(itemId);
    }

    async function addItem(calendar, item) {
      return calendar.addItem(item);
    }

    async function modifyItem(calendar, item, oldItem) {
      return calendar.modifyItem(item, oldItem);
    }

    async function deleteItem(calendar, item) {
      return calendar.deleteItem(item);
    }

    function registerObservers(records, callbacks = {}, onError = null) {
      const target = records || new Map();
      const available = calendars();
      const activeIds = new Set(available.map(calendar => String(calendar?.id || "")));
      for (const [id, record] of target) {
        if (activeIds.has(String(id))) continue;
        try { record.calendar.removeObserver(record.observer); } catch {}
        target.delete(id);
      }
      for (const calendar of available) {
        const id = String(calendar?.id || "");
        if (!id || target.has(id)) continue;
        const observer = {
          QueryInterface: ChromeUtils.generateQI(["calIObserver"]),
          onStartBatch() {}, onEndBatch() {}, onLoad() {}, onError() {}, onPropertyChanged() {}, onPropertyDeleting() {},
          onAddItem(item) { callbacks.changed?.(item, false); },
          onModifyItem(newItem) { callbacks.changed?.(newItem, false); },
          onDeleteItem(item) { callbacks.changed?.(item, true); }
        };
        try { calendar.addObserver(observer); target.set(id, {calendar, observer}); }
        catch (error) { onError?.(calendar, error); }
      }
      return target;
    }

    function unregisterObservers(records) {
      for (const {calendar, observer} of records?.values?.() || []) {
        try { calendar.removeObserver(observer); } catch {}
      }
      records?.clear?.();
    }

    function capabilities() {
      return Object.freeze({
        manager: Boolean(cal?.manager?.getCalendars),
        dateConversion: Boolean(cal?.dtz?.jsDateToDateTime),
        acl: Boolean(cal?.acl?.isCalendarWritable),
        observers: Boolean(ChromeUtils?.generateQI),
        eventConstructor: typeof CalEvent === "function",
        taskConstructor: typeof CalTodo === "function"
      });
    }

    return Object.freeze({
      calendars,
      calendarById,
      capabilitySupported,
      descriptor,
      jsDateToDateTime,
      createItem,
      applySchedule,
      applyCompletion,
      getItem,
      addItem,
      modifyItem,
      deleteItem,
      registerObservers,
      unregisterObservers,
      capabilities
    });
  }

  scope.PinThunderbirdCalendar = Object.freeze({create});
})(this);
