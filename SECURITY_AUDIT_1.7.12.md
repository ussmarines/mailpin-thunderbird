# Revue différentielle de sécurité — MailPin 1.7.12

## Périmètre

Changement de la borne de compatibilité Thunderbird 158.* → 159.*, versionnement 1.7.12 et adaptation du workflow smoke à Thunderbird 159.0. Aucun changement dans le runtime métier, l’Experiment ou `PinCompatibility`. Identité `ussmarines.mailpin@addons.thunderbird.net`, `menus`, CSP, schémas, stockage local, politique sans réseau et protections des tags personnels inchangés.

## Gates

- Contrôles statiques, identité, versions et confidentialité : **en attente de CI sur la candidate exacte**.
- Smoke réel 159.0 (téléchargement SHA-256 officiel et geckodriver inchangé) : **en attente**.
- CodeQL existant et publication : **en attente**.

Aucun scan Codex Security global. Aucun PASS historique 158 n’est présenté comme preuve de compatibilité 159.
