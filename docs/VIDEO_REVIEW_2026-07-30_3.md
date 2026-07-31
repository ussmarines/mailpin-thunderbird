# Revue vidéo 3 — reconstruction 3.1.3

## Contexte

La vidéo montre la build 3.1.2. Le dépôt distant `main` est resté au commit `cc6ded0f2df62f0cac22612c6969dc1237ca0fd3`. Cette passe 3.1.3 est reconstruite localement depuis cette base, sans publication distante.

## Symptômes reproduits

- clic droit inactif sur les cartes épinglées ;
- bouton « Plus », actions rapides et punaise de désépinglage inactifs ;
- création Agenda terminant sur `MODIFICATION_FAILED` ;
- absence de choix du calendrier cible ;
- paramètres difficiles à parcourir et insuffisamment expliqués ;
- feedback d’action hors écran et état de sauvegarde ambigu.

## Causes techniques

1. Les gestionnaires d’actions des cartes n’étaient pas tous accessibles depuis les écouteurs globaux.
2. La recherche des cartes dépendait de `CSS.escape`, non garanti dans le contexte privilégié.
3. L’écriture Agenda choisissait trop tôt un calendrier et ne contrôlait pas systématiquement lecture seule, désactivation, ACL et capacités.
4. Les paramètres reposaient principalement sur un feedback global, sans ancrage auprès du contrôle actif.

## Correction appliquée

- un seul répartiteur partagé reçoit toutes les actions de carte ;
- comparaison directe des `dataset.stableKey`, sans sélecteur construit dynamiquement ;
- inventaire complet des calendriers avec raisons d’incompatibilité ;
- choix explicite du calendrier sur toutes les surfaces de création ;
- validation et erreur contextualisée avant/après l’appel fournisseur ;
- navigation, recherche, descriptions, feedback local, toast fixe et barre de sauvegarde dans les paramètres.

## Limite de cette passe

Les contrôles automatisés valident la structure, les contrats et la reproductibilité du build. Ils ne remplacent pas la validation graphique et fonctionnelle dans une installation réelle de Thunderbird décrite dans `docs/MANUAL_TEST_PLAN.md`.
