# Préparation MailPin 1.7.3

## État

- **Version source :** 1.7.3 — candidate
- **Dernière release publique :** 1.7.2
- **Dernière publication :** `v1.7.2`, commit `225fcb77aa6b3fa101bbaa56e43e7bb8c5a1c2ad`
- **Baseline candidate 1.7.3 :** `main` à `ed54686f64626c37d5d38236ebcda8ec8e94a094`
- **ID permanent :** `ussmarines.mailpin@addons.thunderbird.net`
- **Compatibilité :** Thunderbird 153.0 à 153.*

## Portée 1.7.3

La 1.7.3 consolide les corrections UI directement dans `extension/styles/workspace.css`, supprime la feuille corrective `interaction-stability.css`, augmente l’espace entre groupes de paramètres et corrige le contraste du bouton Annuler dans la barre de sauvegarde.

Aucune permission WebExtension, logique métier, migration, schéma, stockage, dépendance runtime, connexion réseau, télémétrie, publicité, code distant ou identité n’est modifié.

## Preuve runtime avant versionnement

PR #49, head `caee1248495f8ba88e5f398b0dc9ff8db6711b8e` :
- QA Linux/Windows + garde sécurité `32027919000` — PASS ;
- smoke Thunderbird réel `32027918991` — PASS ;
- squash dans `main` : `ed54686f64626c37d5d38236ebcda8ec8e94a094`.

## Artefacts attendus

- `MailPin_v1.7.3.xpi` ;
- `MailPin_GitHub_Repository_v1.7.3.zip` ;
- `SHA256SUMS.txt`.

## Gates avant publication

- [ ] QA Linux/Windows sur la candidate 1.7.3 exacte ;
- [ ] garde sécurité/identité ;
- [ ] build reproductible et structure XPI ;
- [ ] smoke Thunderbird 153 réel sur la candidate exacte ;
- [ ] merge PR release sur `main` ;
- [ ] workflow Release depuis `main` ;
- [ ] vérification de `v1.7.3` et des empreintes des artefacts.

Codex Security n’est pas utilisé.
