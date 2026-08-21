# Audit de sécurité — MailPerch 1.2.0

Date : 7 août 2026
Statut : **contrôles locaux terminés — CI et scans GitHub à confirmer sur le commit distant avant publication**

## Périmètre

Audit de la branche 1.2.0 couvrant l’Experiment privilégié, le stockage et les migrations, les nouvelles notes/checklists/vues/statistiques, la synchronisation de tags Thunderbird, l’Agenda bidirectionnel, Options/dashboard, les workflows GitHub et les livrables.

Le dépôt a été revu depuis l’état courant de la branche, sans utiliser l’historique Git comme source de comportement. L’environnement ne fournit pas de worker Codex Security indépendant ni les exécutables locaux Gitleaks/Trivy/Opengrep/zizmor ; la revue statique de code a donc été conduite dans le processus principal et les scanners spécialisés doivent être rejoués par les workflows GitHub prévus à cet effet.

## Frontières et propriétés contrôlées

- aucune nouvelle permission WebExtension : `menus` reste la seule permission déclarée ;
- CSP des pages d’extension inchangée avec `connect-src 'none'` ;
- aucune URL réseau, télémétrie, publicité, CDN, police distante ou code distant ;
- aucun stockage du corps complet des messages ni du contenu des pièces jointes ;
- entrées privilégiées bornées et normalisées ;
- notes ≤ 4 000 caractères, checklist ≤ 50 éléments de 240 caractères, vues enregistrées ≤ 30 ;
- recherche globale limitée aux métadonnées MailPerch et Thunderbird déjà disponibles localement ;
- tags Thunderbird limités à un ensemble fermé `mailperch-*`, avec propriété vérifiée par clé **et** libellé ;
- toute collision de tag est validée avant la création de la première définition MailPerch ;
- synchronisation de tags désactivée par défaut et explicitement désactivée après import/restauration ;
- nettoyage des mots-clés avant suppression des seules définitions de tags reconnues comme possédées par MailPerch ;
- Agenda bidirectionnel reste opt-in et vérifie les capacités du calendrier avant écriture ;
- aucune primitive `eval`, `new Function`, `innerHTML` ou `outerHTML` ajoutée ;
- les interfaces dynamiques construisent le contenu utilisateur avec des nœuds DOM et `textContent` ;
- build limité aux fichiers suivis/explicitement listés, sans secrets locaux.

## Défauts trouvés et corrigés pendant l’audit

Deux défauts propres à la nouvelle 1.2.0 ont été détectés avant commit :

1. **Chaîne Agenda → tags** : `_syncReferenceTags()` est synchrone mais était traitée comme une Promise sur un chemin Agenda. Le chemin utilise désormais un `try/catch` synchrone et possède une garde de non-régression.
2. **Import d’une sauvegarde 1.2** : `enableThunderbirdTagSync` n’était pas encore neutralisé par le durcissement d’import. Il est désormais forcé à `false`, comme les autres automatismes produisant des effets de bord, et doit être réactivé explicitement par l’utilisateur.

Le pré-contrôle des collisions de tags a aussi été rendu atomique : toutes les clés réservées sont validées avant toute création, afin qu’un conflit ne laisse pas une configuration partiellement créée.

## Contrôles locaux exécutés

- `git diff --check` : **OK** ;
- `npm run check` : **OK** ;
- validation manifeste/package/état projet/modèle store : **OK** ;
- garde d’identité et de secrets sur l’arbre courant : **OK** ;
- garde d’identité et de secrets sur l’historique complet : **OK**, 0 finding et 0 exception historique ;
- `node --check` sur le code JavaScript 1.2 modifié : **OK** ;
- contrat du schéma Experiment : **OK** ;
- gardes UI, Agenda, menus, intégrité, accessibilité et localisation : **OK** ;
- gardes et modèles productivité 1.1 : **OK** ;
- gardes et modèles productivité 1.2 : **OK** ;
- modèles de stockage SQLite : **OK** ;
- build XPI/source reproductible : **OK** ;
- audit du plancher typographique explicite : **OK**, aucune taille déclarée sous 12 px.

La commande monolithique `npm run ci` dépasse la limite de durée d’un appel de cet environnement après le début de `npm test`. Chaque commande qui compose `npm run ci` a donc été exécutée en segments équivalents ; tous les segments ont réussi.

## Risques résiduels et validation réelle

Les contrôles statiques ne prouvent pas le comportement des API internes dans chaque version ou fournisseur Thunderbird. Les tags, l’Agenda bidirectionnel, la migration réelle 1.1.2 → 1.2.0, le rendu zoom 200 % et la matrice Thunderbird 128–153 restent dans `docs/MANUAL_TEST_PLAN.md` et `docs/KNOWN_LIMITATIONS.md` tant qu’ils n’ont pas été observés dans Thunderbird réel.

Les workflows GitHub `QA`, `Manual secret and identity guard` et `Manual repository security audit` restent les contrôles distants autoritatifs avant la release.

## Conclusion locale

Aucune vulnérabilité source-backed non corrigée n’a été identifiée dans le périmètre 1.2.0 au terme de la revue locale. Aucune permission, dépendance distante ou collecte de données n’a été ajoutée. Le statut de publication reste conditionné au passage des contrôles GitHub sur le commit poussé.
