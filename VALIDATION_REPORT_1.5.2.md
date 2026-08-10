# Rapport de validation — MailPerch 1.5.2

Date : 2026-08-11
Workflow GitHub Actions : `31440019097`
Arbre de départ testé : `2c542b2b39f09b95155302da1d789ea1b3c6f9f2` + métadonnées 1.5.2 reproduites par le workflow
Thunderbird : 153.0.1 ESR · geckodriver 0.37.1 · Ubuntu 24.04

## Résultats réellement obtenus

- `npm run ci` : réussi sur l’arbre 1.5.2 ;
- smoke Thunderbird réel : réussi ;
- banc fonctionnel/charge : 50, 100, 500, 1 000 et 2 000 épingles réussis ;
- Dashboard : 7 vues, recherche, smart view, vue enregistrée, multi-sélection, action groupée, palette et actualisation dans le vrai onglet Thunderbird ;
- Options : Recommandé/Avancé, comptes sélectionnés, Enregistrer/Annuler, recherche, Tags, Agenda et santé dans le vrai onglet Thunderbird ;
- éditeur : commande XUL native `doCommand()`, notes, checklist, priorité, groupe, échéances, statut et relance validés ;
- thèmes : clipping, débordement horizontal, alignement et contraste texte de base vérifiés en clair/sombre ; ratios observés >= 12 en clair et >= 14 en sombre sur les contrôles mesurés ;
- persistance : cas aucun/A/B/A+C/A+B+C réussis sur deux processus Thunderbird distincts, même profil exact, SQLite 50 références et réglages conservés, réveil MV3 naturel ; A+C = 34 épingles avec B absent ;
- exceptions JavaScript MailPerch : aucune dans les scénarios verts ;
- artefact GitHub Actions : `9082531880`, SHA-256 `d007ed1287bc563021566ab1231c343b8cc37d0aff1458fc6ccd7773f4cb97e0` ;
- XPI construit : SHA-256 `e09adf1e3fa00809e5d92b56f20e596615e6ebb230cb7cdf46694587788901ea` ;
- archive source construite : SHA-256 `7a17379258be137cef60dc26cb5d58e4db7eeaf46ecf243347312659fb96d8dd`.

## Limites restantes

- fournisseurs réseau externes réels (Gmail, Microsoft, IMAP/CalDAV tiers) non simulés avec credentials ;
- inspection esthétique pixel par pixel, zoom 200 %, contraste OS élevé et parcours complet lecteur d’écran restent des validations humaines ;
- reproductibilité binaire ZIP Windows ↔ Linux reste suivie par `MP-2026-018`.
