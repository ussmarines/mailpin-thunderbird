(function(scope) {
  "use strict";
  function issue(id, severity, title, detail, action = "") {
    return {id, severity, title, detail, action};
  }

  function build(context = {}) {
    const refs = Object.values(context.data?.refs || {});
    const groups = new Set((context.data?.groups || []).map(item => item.id));
    const cases = new Set((context.data?.cases || []).map(item => item.id));
    const templates = new Set((context.data?.templates || []).map(item => item.id));
    const now = Number(context.now) || Date.now();
    const issues = [];
    const broken = refs.filter(ref => ref.missingSince);
    const orphanGroups = refs.filter(ref => ref.groupId && !groups.has(ref.groupId));
    const orphanCases = refs.filter(ref => ref.caseId && !cases.has(ref.caseId));
    const orphanTemplates = refs.filter(ref => ref.templateId && !templates.has(ref.templateId));
    const calendarErrors = refs.filter(ref => ref.calendarSyncError);
    const staleNoReply = refs.filter(ref => ref.noReplyTracking && ref.noReplyAt && ref.noReplyAt < now - 30 * 86400000);
    const overdue = refs.filter(ref => !ref.completedAt && ((ref.dueAt && ref.dueAt < now) || (ref.followUpAt && ref.followUpAt < now)));

    if (context.integrity && !context.integrity.ok) issues.push(issue("storage-integrity", "critical", "Base locale à vérifier", "Le contrôle SQLite a détecté une anomalie.", "integrity-check"));
    if (broken.length) issues.push(issue("missing-messages", broken.length > 20 ? "warning" : "info", `${broken.length} message(s) introuvable(s)`, "Ces références peuvent correspondre à des messages déplacés, supprimés ou non encore synchronisés.", "repair"));
    if (orphanGroups.length || orphanCases.length || orphanTemplates.length) issues.push(issue("orphan-links", "warning", "Liens d’organisation incomplets", `${orphanGroups.length} groupe(s), ${orphanCases.length} affaire(s) et ${orphanTemplates.length} modèle(s) sont orphelins.`, "repair-health"));
    if (calendarErrors.length) issues.push(issue("calendar-errors", "warning", `${calendarErrors.length} synchronisation(s) Agenda en erreur`, "Le calendrier cible peut être indisponible, en lecture seule ou incompatible.", "sync-calendar"));
    if (context.backup?.stale) issues.push(issue("backup-stale", "warning", "Sauvegarde locale en retard", "La dernière sauvegarde dépasse l’intervalle configuré.", "run-backup"));
    if (context.compatibility?.reduced) issues.push(issue("compatibility-reduced", "warning", "Mode de compatibilité réduit", `Fonctions manquantes : ${(context.compatibility.missing || []).join(", ") || "inconnues"}.`, "compat-check"));
    if ((context.performance?.lastRenderMs || 0) > 120) issues.push(issue("slow-render", "info", "Affichage du panneau lent", `Dernier rendu : ${context.performance.lastRenderMs} ms.`, "performance"));
    if (staleNoReply.length) issues.push(issue("stale-no-reply", "info", `${staleNoReply.length} relance(s) très ancienne(s)`, "Ces suivis sans réponse dépassent 30 jours.", "smart-no-reply"));
    if (overdue.length) issues.push(issue("overdue", "info", `${overdue.length} suivi(s) en retard`, "Utilisez la vue intelligente En retard pour les traiter.", "smart-overdue"));
    if ((context.diagnostics?.counts?.error || 0) > 0) issues.push(issue("diagnostic-errors", "warning", `${context.diagnostics.counts.error} erreur(s) récente(s)`, "Consultez ou exportez le diagnostic local.", "diagnostic"));

    const weights = {critical: 35, warning: 12, info: 2};
    const score = Math.max(0, 100 - issues.reduce((sum, item) => sum + (weights[item.severity] || 0), 0));
    const status = score >= 90 ? "healthy" : score >= 70 ? "attention" : "critical";
    return {
      generatedAt: Date.now(),
      score,
      status,
      issues,
      counts: {
        pinned: refs.length,
        broken: broken.length,
        overdue: overdue.length,
        calendarErrors: calendarErrors.length,
        noReply: refs.filter(ref => ref.noReplyTracking).length,
        groups: groups.size,
        cases: cases.size,
        templates: templates.size
      }
    };
  }

  scope.PinHealth = Object.freeze({build});
})(this);
