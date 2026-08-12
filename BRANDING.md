# Identité de marque MailPin

## Identité canonique

- **Nom du produit :** MailPin
- **Nom complet pour le store :** MailPin — Email Follow-up & Productivity for Thunderbird
- **Baseline canonique :** Email Follow-up & Productivity for Thunderbird
- **Signature secondaire EN :** Stay on top. Follow through. Get results.
- **Signature secondaire FR :** Gardez le cap. Assurez le suivi. Avancez.
- **Dépôt :** `ussmarines/mailperch-thunderbird` (slug GitHub historique conservé tant qu’il n’est pas renommé dans les paramètres du dépôt)
- **Nom du paquet npm privé :** `mailpin-thunderbird`
- **Nom des builds :** `MailPin_v<VERSION>.xpi`
- **Nom des archives source :** `MailPin_GitHub_Repository_v<VERSION>.zip`

## Concept visuel

Le symbole combine une enveloppe et un repère/pin. Il représente le geste central du produit : sélectionner un e-mail, le garder à portée et le faire progresser dans un workflow de suivi.

La direction artistique est volontairement éditoriale et sobre : pas de dégradés, pas d’effets de verre, pas de glow, pas de texture générative. L’interface conserve la géométrie Thunderbird et utilise la marque comme système de hiérarchie, pas comme décoration.

## Palette

- **Ink Charcoal** `#1A1D21` — texte et structure.
- **Slate Blue** `#3D536B` — information secondaire et intégration Thunderbird.
- **Sage Teal** `#4F7F75` — action principale ; contraste AA avec texte blanc.
- **Sage Teal Dark** `#426F67` — hover/pressed et surfaces sombres.
- **Brass** `#C79A3A` — accent ponctuel pour rappel/attention, jamais texte blanc.
- **Warm Off-White** `#F7F5F0` — canvas clair.

Les valeurs runtime vivent dans `extension/styles/tokens.css`. Les thèmes clair, sombre, contraste forcé et réduction du mouvement restent pris en charge.

## Typographie

Pile locale uniquement : `system-ui`, `Segoe UI Variable`, `Aptos`, `Segoe UI`, sans-serif. Aucune police distante, CDN ou dépendance ajoutée.

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
