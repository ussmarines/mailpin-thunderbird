# Passage de relais — MailPin 1.7.3 candidate

## Référence

- dépôt : `ussmarines/mailpin-thunderbird` ;
- baseline : `main` à `ed54686f64626c37d5d38236ebcda8ec8e94a094` ;
- branche release : `release/1.7.3-ui-layout` ;
- version source : **1.7.3** ;
- dernière release publique : **1.7.2** ;
- `releaseStatus` : **candidate** ;
- ID : `ussmarines.mailpin@addons.thunderbird.net`.

## Résultat visé

Publier 1.7.3 avec les corrections UI intégrées en dur : suppression de `interaction-stability.css`, consolidation dans `workspace.css`, espacement renforcé entre groupes de paramètres et contraste lisible du bouton Annuler en thème sombre et clair.

## Preuves acquises avant versionnement

- PR #49 head `caee1248495f8ba88e5f398b0dc9ff8db6711b8e` ;
- QA Linux/Windows + garde sécurité `32027919000` — PASS ;
- smoke Thunderbird 153 réel `32027918991` — PASS ;
- squash runtime : `ed54686f64626c37d5d38236ebcda8ec8e94a094`.

## Gates candidate 1.7.3

- QA Linux/Windows et garde sécurité sur le head exact de la PR release ;
- build reproductible ;
- smoke Thunderbird réel sur le head exact ;
- merge release sur `main` ;
- workflow Release ;
- vérification de `v1.7.3` et des empreintes.

Aucun contrôle visuel humain post-correction n’est revendiqué comme exécuté. Codex Security n’est pas utilisé.
