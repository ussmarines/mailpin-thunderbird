# Passage de relais Codex

Lire d’abord [`../PROJECT_MEMORY.md`](../PROJECT_MEMORY.md). Ce fichier est volontairement
court afin d’éviter de dupliquer le contexte.

## État courant

- version de travail : **3.2.3** ;
- base GitHub : `main` au commit `8b3495baca5d89358d703c42add9d773c09517af` ;
- ID : `pin-mails@MailPerch.local` ;
- schémas : SQLite 5, paramètres 5, données 6 ;
- aucune publication distante automatique.

## Passe 3.2.3

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
- `PROJECT_MEMORY.md` et `docs/PROJECT_STATE.json` ajoutés.

## Validation obligatoire

```bash
npm run ci
```

Puis suivre `docs/MANUAL_TEST_PLAN.md`, particulièrement la section 3.2.3.
