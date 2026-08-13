# AGENTS.md — Options MailPin

> Lire d’abord `PROJECT_MEMORY.md`, puis `docs/CODEX_HANDOFF.md` pour la branche de consolidation.

La page Options contient beaucoup de réglages historiques. Organic Workspace la traite comme un éditeur : réduire la charge cognitive, révéler progressivement le contexte et conserver tous les contrôles/persistences utiles sans reproduire un dashboard administratif.

## Taxonomie UX

La navigation publique reste limitée à quatre familles :

- **Essentiel** : épingles, rappels, états de réponse, Agenda et usages quotidiens ;
- **Organisation** : groupes, affaires, checklists et vues enregistrées ;
- **Automatisation** : règles, workflows et tags Thunderbird ;
- **Avancé** : sauvegardes, diagnostics, maintenance et comportements techniques.

Les quatre familles restent une taxonomie fonctionnelle, pas une contrainte de composition visuelle. Le rail, la scène, la recherche et les transitions peuvent être refondus librement tant que chaque contrôle reste atteignable. Les réglages techniques peuvent rester dans le DOM pour le mode Avancé, mais doivent être retirés de la navigation/recherche et masqués lorsqu’ils sont marqués avancés en mode Recommandé.

## Mode Recommandé

La valeur persistée reste `settingsExperience = "guided"` pour compatibilité. L’interface l’affiche comme **Recommandé**. Ne pas renommer la clé ou l’enum sans migration formelle.

L’action « Appliquer les réglages recommandés » :

1. travaille sur le brouillon du formulaire uniquement ;
2. n’appelle jamais l’API de sauvegarde ;
3. conserve au minimum le calendrier préféré, le groupe d’attente, le dossier de sauvegarde, les couleurs de comptes et les boîtes activées ;
4. laisse **Enregistrer** confirmer et **Annuler** restaurer l’état persisté ;
5. ne doit pas prétendre que les valeurs recommandées sont déjà actives sur un profil existant.

Le mode Recommandé masque l’avancé ; le bouton de recommandations prépare des valeurs. Ce sont deux comportements distincts.

## Invariants de formulaire

- Une modification doit alimenter l’état `dirty` de manière déterministe.
- Enregistrer/Annuler et `Ctrl/Cmd+S` ne doivent pas devenir inactifs à cause d’un état d’initialisation partiel.
- Les notifications liées à une action doivent rester visibles près de l’utilisateur, pas dépendre du haut de page.
- La recherche ne doit pas révéler des sections masquées par le niveau d’expérience.
- Les textes FR/EN doivent rester synchronisés et les libellés techniques doivent expliquer leur effet avant sauvegarde.
- Aucun contrôle existant ne doit disparaître silencieusement du registre `SETTINGS_CONTROL_DEFINITIONS`.

## Tests ciblés

Avant une modification limitée des Options, privilégier :

```bash
python tests/test_recommended_options_ux.py
python tests/test_options_controls.py
python tests/test_dynamic_options_localization.py
node tests/options_browser_test_contract.mjs
```

Après une modification qui touche le cycle de sauvegarde, l’initialisation ou plusieurs sections, exécuter ensuite `npm run ci` une fois la correction stabilisée.
