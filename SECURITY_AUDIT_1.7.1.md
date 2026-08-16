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

Les contrôles locaux ciblés et `npm run ci` sont verts. Deux mutations temporaires ont confirmé que les ressources distantes HTML puis CSS sont effectivement refusées par le garde. Les workflows PR et le smoke Thunderbird réel du candidat exact restent les gates distants avant release. Les identifiants des runs finaux seront consignés après leur exécution, sans inventer de résultat à l’avance.
