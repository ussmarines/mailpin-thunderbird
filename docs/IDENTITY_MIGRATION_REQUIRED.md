# Migration d’identité vers MailPin

## Statut

**Décision approuvée le 13 août 2026 avant la première publication ATN.**

Identifiant public définitif :

`ussmarines.mailpin@addons.thunderbird.net`

Nom public : **MailPin — Email Follow-up & Productivity** (forme ATN ≤ 50 caractères depuis 1.7.5).

## Pourquoi l’identifiant change

Les releases GitHub jusqu’à 1.5.4 utilisaient `pin-mails@MailPerch.local`. Avant la première soumission officielle à addons.thunderbird.net, le produit a été renommé MailPin et l’identifiant a été remplacé par la forme pérenne recommandée lorsque le projet ne s’appuie pas sur son propre domaine public : `<utilisateur>.<module>@addons.thunderbird.net`.

Aucune version utilisant l’ancien identifiant n’a été publiée sur ATN. La 1.6.0 devient donc la première identité destinée au catalogue public.

## Conséquence technique

Thunderbird traite un changement d’ID comme une nouvelle extension. Une installation locale 1.5.4 ne doit pas être supposée mise à jour automatiquement vers 1.6.0 et son stockage privé n’est pas automatiquement rattaché au nouvel ID.

Les formats de sauvegarde/import, la base logique `pin-mails-v2.sqlite`, les préfixes `pin-mails-*` et l’API Experiment `pinInbox` restent volontairement stables afin de permettre une migration contrôlée des données sans refonte de format.

## Procédure de migration pour les testeurs 1.5.4

1. Ouvrir l’installation 1.5.4 et exporter une sauvegarde vérifiable.
2. Conserver une copie du profil Thunderbird avant désinstallation.
3. Désinstaller l’ancienne extension seulement après la sauvegarde.
4. Installer `MailPin_v1.6.0.xpi`.
5. Importer la sauvegarde via l’interface MailPin.
6. Vérifier épingles, groupes, notes, sous-tâches, affaires, règles, rappels, paramètres et liens Agenda.
7. Redémarrer Thunderbird et contrôler à nouveau les données.

## Fichiers synchronisés dans cette migration

- `extension/manifest.json`
- `release/manifest-store-template.json`
- `docs/PROJECT_STATE.json`
- `PROJECT_MEMORY.md`
- `docs/CODEX_HANDOFF.md`
- `AGENTS.md`
- `scripts/check_repo.py`
- `tests/static_checks.py`
- `tests/test_project_metadata.py`
- `BRANDING.md`
- `README.md` / `README.en.md`

## Immutabilité après publication

Une fois MailPin soumis ou publié sur ATN avec `ussmarines.mailpin@addons.thunderbird.net`, cet identifiant devient immuable. Toute release ultérieure doit conserver exactement la même chaîne et la même casse.
