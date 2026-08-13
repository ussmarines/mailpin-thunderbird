# Identité de marque MailPin

## Identité canonique

- **Nom du produit :** MailPin
- **Nom complet pour le store :** MailPin — Email Follow-up & Productivity for Thunderbird
- **Baseline canonique :** Email Follow-up & Productivity for Thunderbird
- **Signature secondaire EN :** Stay on top. Follow through. Get results.
- **Signature secondaire FR :** Gardez le cap. Assurez le suivi. Avancez.
- **Dépôt :** `ussmarines/mailpin-thunderbird`
- **Nom du paquet npm privé :** `mailpin-thunderbird`
- **Nom des builds :** `MailPin_v<VERSION>.xpi`
- **Nom des archives source :** `MailPin_GitHub_Repository_v<VERSION>.zip`

## Concept visuel

Le symbole combine une enveloppe et un repère/pin. Il représente le geste central du produit : sélectionner un e-mail, le garder à portée et le faire progresser dans un workflow de suivi.

La direction produit **Organic Workspace** est éditoriale, spatiale et command-first : rail de navigation, canvas de travail, contexte secondaire et micro-interactions fonctionnelles. Elle ne reprend plus Fluent comme langage visuel. Pas de dégradés, verre, glow ou texture générative ; la marque sert la hiérarchie plutôt que la décoration.

## Palette

- **Ink** `#171A18` — texte, commandes structurantes et contraste.
- **Slate** `#46575D` — information secondaire et structure.
- **Sage** `#4E7569` — progression et action.
- **Sage Deep** `#2D5148` — action forte / état pressé.
- **Brass** `#9B7040` — accent ponctuel de contexte.
- **Warm Paper** `#F4F1E9` — canvas clair.

Les valeurs runtime vivent dans `extension/styles/tokens.css`. Les thèmes clair, sombre, contraste forcé et réduction du mouvement restent pris en charge.

## Typographie

Pile locale uniquement : `Segoe UI Variable Display` / `Aptos Display` pour les titres, `Segoe UI Variable Text` / `Aptos` pour le texte et repli système ; `Cascadia Code` / `Consolas` pour le mono. Aucune police distante, CDN ou dépendance ajoutée.

## Assets canoniques

- `extension/icons/mailpin-icon.svg` — icône couleur scalable du module.
- `extension/icons/mailpin-icon-mono.svg` — variante monochrome.
- `assets/brand/mailpin-mark.svg` — marque vectorielle source.
- `assets/brand/mailpin-hero.svg` — bannière README/release.
- `assets/brand/mailpin-brand-board.svg` — planche de référence.

Thunderbird supporte les icônes SVG et les met à l’échelle pour les tailles du manifeste ; le manifeste déclare donc le même symbole SVG pour 16 à 128 px.

## Identifiants techniques

- **ID public définitif pour la première publication ATN :** `ussmarines.mailpin@addons.thunderbird.net`.
- Base locale historique : `pin-mails-v2.sqlite`.
- Préfixes DOM/CSS, formats import/export et API Experiment `pinInbox` restent stables pour limiter les migrations inutiles.

Le changement d’ID depuis `pin-mails@MailPerch.local` est volontaire et documenté dans `docs/IDENTITY_MIGRATION_REQUIRED.md`. Les builds GitHub antérieures n’étaient pas publiées sur ATN ; les installations locales existantes doivent sauvegarder/exporter puis réimporter leurs données.

## Métadonnées GitHub recommandées

- **Description :** MailPin — Email Follow-up & Productivity for Thunderbird.
- **Topics :** `thunderbird`, `mail-extension`, `email-productivity`, `email-follow-up`, `pinned-email`, `productivity`.

Une recherche de disponibilité a identifié un produit tiers « Mailpin » dans l’univers e-mail. L’utilisateur a explicitement choisi de conserver le nom MailPin le 13 août 2026 ; cette décision de naming n’est pas une conclusion juridique sur les marques.
