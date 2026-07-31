# Passage de relais Codex

Lire d’abord [`../PROJECT_MEMORY.md`](../PROJECT_MEMORY.md). Ce fichier est volontairement
court afin d’éviter de dupliquer le contexte.

## État courant

- version de travail : **3.2.6** ;
- base GitHub : `main` au commit `3e8852d4ffcd05c3235000489452ffef6dc752b0` ;
- ID : `pin-mails@MailPerch.local` ;
- schémas : SQLite 5, paramètres 6, données 6 ;
- aucune publication distante automatique.

## Passe 3.2.4

- rail étoile/punaise/menu centré dans les lignes natives ;
- confort des paramètres séparé de la densité des cartes ;
- densités compactes maintenues lisibles ;
- toast fermé depuis son coin supérieur droit ;
- primitives CSS ajoutées pour les classes options auparavant non stylées ;
- toggles, aides de boutons, groupes, comptes, calendriers et centre de santé réorganisés ;
- duplication visible des comptes supprimée ;
- état Agenda reformulé selon les capacités réelles ;
- duplication du bouton Enregistrer supprimée ;
- audit Git Windows rendu robuste aux fins de ligne CRLF ;
- `PROJECT_MEMORY.md` et `docs/PROJECT_STATE.json` ajoutés ;
- validation récursive et bornée de toutes les entrées privilégiées sensibles ;
- imports neutralisés avant persistance et diagnostic anonymisé ;
- chemins de sauvegarde réservés au sélecteur natif ;
- purge complète des données gérées lors de la désinstallation et sentinelle native de réinstallation propre ;
- correction du flux Enregistrer/Annuler et de l’étoile native dupliquée ;
- manifeste/CSP, scan de secrets, frontière de confiance et audit sécurité documentés.

## Validation obligatoire

```bash
npm run ci
```

Puis suivre `docs/MANUAL_TEST_PLAN.md`, particulièrement la section 3.2.4.
## Passe 3.2.5

- étoiles natives laissées intactes en mode indépendant ;
- sauvegarde/annulation des paramètres basées sur les événements natifs du formulaire ;
- audit Git Windows converti aux flux NUL-délimités binaires ;
- registre permanent des bugs ajouté et contrôlé par la CI.


## Passe 3.2.6

Priorité absolue : MP-2026-004 et MP-2026-005. Ne pas les déclarer corrigés sur la seule base des tests statiques. Lire `docs/BUG_TRACKER.md`, conserver l’étoile dans le DOM natif en mode indépendant et maintenir un gestionnaire direct sur les boutons visibles des paramètres.
