# Rapport de validation — MailPin 1.7.8

## Objectif

Publier l’état Git final synchronisé après 1.7.7 sous une version de maintenance distincte sans modifier le runtime Thunderbird 155 validé.

## Baseline réutilisée

- release publique 1.7.7 : runtime Thunderbird 155.0 validé ;
- candidate 1.7.7 `94ce4d2656df8eb9694ce794743b82c00d83e8a9` : QA `33688297275` PASS, smoke `33688296968` PASS ;
- main 1.7.7 `f5d5c07a0f8d375ed7347b3a42fbc57f4bafb7fb` : QA `33689155033` PASS, smoke `33689155048` PASS.

## Gate candidate 1.7.8

**CANDIDATE — gates exacts à exécuter.** Le runtime ne change pas, mais le numéro de version modifie le manifeste. Le head exact 1.7.8 doit passer QA Linux/Windows, garde sécurité/identité, build/reproductibilité et smoke réel Thunderbird 155.0 avant merge/publication.
