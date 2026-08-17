# Audit de sécurité — MailPin 1.7.3

## Périmètre

MailPin 1.7.3 est une maintenance UI. Le diff runtime issu de la PR #49 supprime `extension/styles/interaction-stability.css`, retire son chargement dynamique de `theme.js` et consolide les règles dans `workspace.css`. Aucun accès privilégié, stockage, schéma, permission ou contrat réseau n’est modifié.

## Invariants

- Manifest V3 local ;
- ID `ussmarines.mailpin@addons.thunderbird.net` ;
- permission WebExtension `menus` uniquement ;
- `connect-src 'none'` ;
- aucune télémétrie, publicité, CDN ou code distant ;
- aucun corps complet ni pièce jointe stocké ;
- aucune nouvelle dépendance runtime/build tierce ;
- `PinCompatibility` et les adaptateurs Thunderbird sont inchangés.

## Preuve pré-versionnement

PR #49, head `caee1248495f8ba88e5f398b0dc9ff8db6711b8e` :

- QA Linux/Windows et garde sécurité : `32027919000` — PASS ;
- smoke Thunderbird 153 réel : `32027918991` — PASS ;
- squash vers `main` : `ed54686f64626c37d5d38236ebcda8ec8e94a094`.

## Gate release

La candidate versionnée MailPin 1.7.3 doit encore repasser la QA complète, la garde sécurité, le build reproductible et le smoke Thunderbird réel sur son head exact avant publication.

Codex Security n’est pas utilisé.
