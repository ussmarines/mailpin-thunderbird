# Audit sécurité standard — MailPin 1.7.1

## Périmètre

La 1.7.1 est une maintenance de préparation release. Le runtime métier reste celui de 1.7.0 ; seuls la version distribuée, les documents actifs, les gardes de cohérence et le contrôle des sous-ressources locales changent. Codex Security n’est pas utilisé.

## Invariants

- Manifest V3 et ID `ussmarines.mailpin@addons.thunderbird.net` inchangés ;
- permission WebExtension `menus` uniquement ;
- CSP avec `connect-src 'none'` ;
- aucun réseau runtime, télémétrie, publicité, CDN ou code distant ;
- aucun corps complet de message ni contenu de pièce jointe stocké ;
- frontière `PinCompatibility`, validation privilégiée, SQLite transactionnel/sérialisé et nettoyage lifecycle inchangés.

## Durcissement 1.7.1

`scripts/check_repo.py` refuse désormais explicitement les sous-ressources HTML/CSS distantes au lieu de compter uniquement sur la CSP runtime. Les liens externes intentionnels ouverts par l’utilisateur (support/don) ne sont pas des sous-ressources et restent autorisés. La détection statique des API réseau JavaScript couvre également `WebTransport` et `sendBeacon`.

## Validation

Les contrôles locaux ciblés et `npm run ci` sont verts. Deux mutations temporaires ont confirmé que les ressources distantes HTML puis CSS sont effectivement refusées par le garde. PR #43 a passé QA Linux/Windows et la garde identité/sécurité (`31950636397`) ainsi que le smoke Thunderbird 153 réel (`31950636456`). Après squash sur `c2b886677413a205d57a191234b1dac6279b86d6`, `main` a repassé QA (`31950703455`) et smoke (`31950703452`). Le workflow Release `31951120772` a reconstruit et publié les artefacts depuis ce commit exact.
