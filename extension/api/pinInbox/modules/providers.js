(function(scope) {
  "use strict";

  function normalizeHost(value) {
    return String(value || "").trim().toLowerCase().replace(/\.+$/, "");
  }

  function hostMatches(host, domain) {
    return host === domain || host.endsWith(`.${domain}`);
  }

  function hostMatchesAny(host, domains) {
    return domains.some(domain => hostMatches(host, domain));
  }

  function providerFor(server = {}) {
    const host = normalizeHost(server.hostName || server.realHostName || "");
    const type = String(server.type || "unknown").toLowerCase();
    if (type === "none" || type === "local") return "local";
    if (hostMatchesAny(host, ["gmail.com", "googlemail.com"])) return "gmail";
    if (hostMatchesAny(host, ["outlook.com", "office365.com", "hotmail.com", "live.com"])) return "microsoft";
    if (hostMatchesAny(host, ["yahoo.com"])) return "yahoo";
    if (hostMatchesAny(host, ["icloud.com", "me.com"])) return "icloud";
    if (type === "pop3") return "pop";
    if (type === "imap") return "imap";
    return type || "unknown";
  }

  function descriptor(account, inboxes = []) {
    const server = account?.incomingServer || account?.server || {};
    const provider = String(account?.provider || "") || providerFor(server);
    const protocol = String(account?.protocol || server?.type || "unknown").toLowerCase();
    return {
      accountKey: String(account?.key || account?.accountKey || server?.key || ""),
      accountName: String(account?.name || account?.accountName || ""),
      provider,
      protocol,
      secure: account?.secure !== undefined ? Boolean(account.secure) : Boolean(server?.socketType && Number(server.socketType) > 0),
      offlineSupport: account?.offlineSupport !== undefined ? Boolean(account.offlineSupport) : Boolean(server?.offlineSupportLevel || provider === "local" || provider === "pop"),
      inboxCount: inboxes.length,
      supportsFolders: account?.supportsFolders !== undefined ? Boolean(account.supportsFolders) : provider !== "pop",
      knownRisks: provider === "gmail"
        ? ["labels-and-copies", "duplicate-message-id"]
        : provider === "microsoft"
          ? ["server-side-archive", "delayed-flags"]
          : provider === "pop"
            ? ["single-device-local-state"]
            : []
    };
  }

  function matrix(accounts = [], calendars = []) {
    const rows = accounts.map(account => descriptor(account, account.inboxes || []));
    return {
      checkedAt: Date.now(),
      accounts: rows,
      providers: [...new Set(rows.map(row => row.provider))].sort(),
      calendars: (calendars || []).map(calendar => ({
        id: String(calendar.id || ""),
        name: String(calendar.name || ""),
        type: String(calendar.type || "unknown"),
        writable: Boolean(calendar.writable),
        taskCompatible: Boolean(calendar.taskCompatible),
        eventCompatible: Boolean(calendar.eventCompatible),
        reason: String(calendar.reason || "")
      }))
    };
  }

  scope.PinProviders = Object.freeze({providerFor, descriptor, matrix});
})(this);
