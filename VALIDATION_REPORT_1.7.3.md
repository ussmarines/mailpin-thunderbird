# Rapport de validation — MailPin 1.7.3

## Objet

La candidate 1.7.3 durcit la composition Organic Workspace en intégrant en dur les corrections UI dans le stylesheet canonique et en supprimant la feuille corrective runtime `interaction-stability.css`.

## Critères PASS

- `interaction-stability.css` absent du tree et non chargé par `theme.js` ;
- espacement structurel explicite entre les groupes de paramètres, y compris Agenda, Règles et Centre de santé ;
- bouton Annuler utilisant des tokens sémantiques lisibles en clair/sombre ;
- corrections 1.7.2 sur statistiques, navigation, save dock, notifications, Agenda et raccourcis préservées ;
- aucune permission, migration, schéma, logique métier ou réseau modifié ;
- QA Linux/Windows, garde sécurité, build reproductible et smoke Thunderbird réel PASS sur le candidat exact.

## Preuve pré-versionnement

PR #49 head `caee1248495f8ba88e5f398b0dc9ff8db6711b8e` :

- QA `32027919000` — PASS ;
- smoke Thunderbird réel `32027918991` — PASS ;
- merge `ed54686f64626c37d5d38236ebcda8ec8e94a094`.

## État candidate

Les validations de la candidate versionnée MailPin 1.7.3 ne sont pas encore consignées ici comme PASS. Elles seront démontrées par les workflows de la PR release avant merge/publication.

Une appréciation visuelle humaine pixel par pixel reste distincte du smoke automatisé.
