(function(scope) {
  "use strict";

  const STRINGS = Object.freeze({
    fr: Object.freeze({
      pinnedMessages: "Messages épinglés",
      pinned: "Épinglés",
      allMessages: "Tous les messages",
      panelScope: "Portée du panneau",
      sortPins: "Tri des épingles",
      currentInbox: "Cette boîte",
      currentAccount: "Ce compte",
      allAccounts: "Tous les comptes",
      manualOrder: "Ordre manuel",
      pinDate: "Épinglage",
      messageDate: "Date",
      deadline: "Échéance",
      priority: "Priorité",
      sender: "Expéditeur",
      account: "Compte",
      pinConversation: "Épingler la conversation sélectionnée",
      openDashboard: "Ouvrir le tableau de bord global",
      createGroup: "Créer un groupe",
      searchPins: "Rechercher dans les épingles…",
      searchPinsLabel: "Rechercher dans les messages épinglés",
      smartView: "Vue intelligente",
      readUnread: "Lu/non lu",
      complete: "Terminer",
      noReply: "Relancer sans réponse",
      archive: "Archiver",
      group: "Grouper",
      unpin: "Désépingler",
      delete: "Supprimer",
      pinMessage: "Épingler le message",
      unpinMessage: "Désépingler le message",
      moreActions: "Plus d’actions",
      cardActions: "Actions du message épinglé",
      openMessage: "Ouvrir le message",
      reply: "Répondre",
      markReadUnread: "Marquer lu / non lu",
      waiting: "Mettre en attente",
      planned: "Planifier",
      markComplete: "Marquer comme terminé",
      assignGroup: "Classer dans un groupe",
      trackNoReply: "Me relancer si aucune réponse",
      cancelNoReply: "Arrêter le suivi sans réponse",
      snoozeOneHour: "Reporter le rappel d’une heure",
      calendarTask: "Créer ou synchroniser une tâche",
      calendarEvent: "Créer ou synchroniser un événement",
      editFollowUp: "Modifier le suivi",
      noPinned: "Aucun message épinglé",
      noResult: "Aucun résultat",
      expandPinned: "Développer la section Épinglés",
      collapsePinned: "Réduire la section Épinglés",
      selectCalendarTask: "Choisir le calendrier de la tâche",
      selectCalendarEvent: "Choisir le calendrier de l’événement",
      calendarTarget: "Calendrier cible",
      cancel: "Annuler",
      continue: "Continuer",
      healthAttention: "Santé MailPerch à vérifier",
      healthHealthy: "Santé MailPerch correcte"
    }),
    en: Object.freeze({
      pinnedMessages: "Pinned messages",
      pinned: "Pinned",
      allMessages: "All messages",
      panelScope: "Panel scope",
      sortPins: "Sort pinned messages",
      currentInbox: "This inbox",
      currentAccount: "This account",
      allAccounts: "All accounts",
      manualOrder: "Manual order",
      pinDate: "Pinned date",
      messageDate: "Message date",
      deadline: "Deadline",
      priority: "Priority",
      sender: "Sender",
      account: "Account",
      pinConversation: "Pin the selected conversation",
      openDashboard: "Open the global dashboard",
      createGroup: "Create a group",
      searchPins: "Search pinned messages…",
      searchPinsLabel: "Search pinned messages",
      smartView: "Smart view",
      readUnread: "Read/unread",
      complete: "Complete",
      noReply: "Follow up if unanswered",
      archive: "Archive",
      group: "Group",
      unpin: "Unpin",
      delete: "Delete",
      pinMessage: "Pin message",
      unpinMessage: "Unpin message",
      moreActions: "More actions",
      cardActions: "Pinned message actions",
      openMessage: "Open message",
      reply: "Reply",
      markReadUnread: "Mark read/unread",
      waiting: "Set waiting",
      planned: "Plan",
      markComplete: "Mark complete",
      assignGroup: "Assign to a group",
      trackNoReply: "Remind me if there is no reply",
      cancelNoReply: "Stop no-reply tracking",
      snoozeOneHour: "Snooze reminder for one hour",
      calendarTask: "Create or sync a task",
      calendarEvent: "Create or sync an event",
      editFollowUp: "Edit follow-up",
      noPinned: "No pinned messages",
      noResult: "No results",
      expandPinned: "Expand Pinned section",
      collapsePinned: "Collapse Pinned section",
      selectCalendarTask: "Choose the task calendar",
      selectCalendarEvent: "Choose the event calendar",
      calendarTarget: "Target calendar",
      cancel: "Cancel",
      continue: "Continue",
      healthAttention: "MailPerch health needs attention",
      healthHealthy: "MailPerch health is good"
    })
  });

  function language(locale) {
    return String(locale || "fr").toLowerCase().startsWith("en") ? "en" : "fr";
  }

  function interpolate(value, variables = {}) {
    return String(value || "").replace(/\{([a-zA-Z0-9_]+)\}/g, (_match, key) =>
      Object.prototype.hasOwnProperty.call(variables, key) ? String(variables[key]) : `{${key}}`
    );
  }

  function t(locale, key, fallback = "", variables = {}) {
    const lang = language(locale);
    return interpolate(STRINGS[lang]?.[key] || STRINGS.fr?.[key] || fallback || key, variables);
  }

  scope.PinLocalization = Object.freeze({STRINGS, language, interpolate, t});
})(this);
