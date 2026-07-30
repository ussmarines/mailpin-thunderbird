# Décisions techniques

## D001 — ID de développement conservé

`pin-mails@MailPerch.local` reste utilisé afin que les builds de test mettent à niveau la même installation et conservent les données. L’ID public sera choisi une seule fois avant la première publication.

## D002 — Dashboard ouvert par le background

L’Experiment émet un événement ; le background utilise `tabs.create`. Cela évite de charger une page d’extension avec un principal privilégié incorrect.

## D003 — Menu contextuel HTML fixé au viewport

Le menu est placé dans `document.body` avec `position: fixed`. Il échappe ainsi au défilement interne et aux conteneurs `overflow` du panneau.

## D004 — Aucun badge dans l’arbre des dossiers

Les nombres de l’arbre Thunderbird sont réservés aux états natifs. Les compteurs d’épingles restent dans le panneau et le dashboard.

## D005 — Build sans dépendance

Le build repose uniquement sur Python et Node pour faciliter la revue, réduire la chaîne d’approvisionnement et produire des archives déterministes.

## D006 — Licence source-disponible restrictive

Le propriétaire ne souhaite ni vente ni redistribution publique du code. Le projet n’est donc pas présenté comme open source. Une revue juridique est requise avant publication publique.

## D007 — MailPerch comme identité publique

Le nom public canonique est **MailPerch** et le nom complet du store est **MailPerch — Email Pins & Follow-up**. Les anciens noms faisant référence à Outlook sont retirés des surfaces publiques. Les identifiants techniques `pin-mails-*` restent conservés jusqu’à une migration dédiée afin de préserver les données et les mises à niveau.
