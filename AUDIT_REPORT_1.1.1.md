# Audit global MailPerch 1.1.1

Date : 5 août 2026
Statut : audit terminé et release GitHub `v1.1.1` publiée. La seule opération
externe restante est la purge des références internes de PR et des vues en cache
par GitHub Support.

## Périmètre

L’audit couvre le manifeste MV3, le background, l’API Experiment `pinInbox`, son
schéma, l’intégration `about:3pane`, les modules métier, SQLite, sauvegardes,
imports, Agenda, règles, rappels, vues, Options, dashboard, localisations, styles,
tests, build, CI, workflows de sécurité classiques et métadonnées de publication.

La carte détaillée reste dans `PROJECT_MEMORY.md`; les limites de confiance sont
décrites dans `docs/SECURITY_BOUNDARY.md`.

## Problèmes confirmés et corrigés

| Référence | Problème | Cause | Correction et preuve |
|---|---|---|---|
| MP-2026-012 | Conversations distinctes rapprochées sur un objet identique. | Clé de repli trop faible. | Identité forte obligatoire ; tests de modèle et gardes statiques. |
| MP-2026-013 | Diagnostics et erreurs susceptibles de conserver des détails privés. | Expurgation incomplète et journalisation d’objets d’erreur. | Normalisation des erreurs et retrait des chemins, credentials, adresses et identifiants sensibles. |
| MP-2026-014 | Anglais incomplet et noms accessibles non localisés. | Libellés dynamiques/ARIA codés en dur. | Catalogues FR/EN complets et scénarios navigateur sur les actifs de production. |
| MP-2026-015 | Publication possible avant le tag final et nettoyage distant de branches. | Déclencheur de release sur `main` et étape de maintenance hors périmètre. | Release limitée aux tags cohérents ou au lancement manuel ; suppression de l’étape distante. |
| MP-2026-016 | Possibilité d’ajouter localement des sources non suivies au build reviewer. | Allowlist additionnelle acceptée par le packaging. | Archive source limitée à l’inventaire Git et test de reproductibilité renforcé. |
| MP-2026-017 | Panneau privilégié anglais mêlé de libellés français. | Chaînes directes et catalogue Experiment incomplet. | Table FR/EN de 237 clés, garde d’égalité et validation du menu natif dans Thunderbird 153.0.1 anglais. |

Le registre canonique et les validations associées sont dans
`docs/BUG_TRACKER.md`.

Une limite de reproductibilité inter-plateforme découverte lors du contrôle final
est suivie sous `MP-2026-018` : Windows et Linux produisent des conteneurs ZIP aux
empreintes différentes, mais avec exactement les mêmes entrées, le même ordre et
le même contenu décompressé. Les sommes publiées par le workflow Linux restent
autoritatives pour la release 1.1.1.

## Confidentialité

La branche de départ contenait 7 occurrences d’identifiants personnels interdits
dans 6 fichiers courants. Elles ont été remplacées par l’identité publique
`ussmarines` ou par l’identifiant produit canonique `pin-mails@MailPerch.local`.
Le garde de dépôt détecte désormais ces chaînes par empreinte et peut assainir un
arbre sans afficher les valeurs supprimées.

L’inspection de toutes les références Git avait aussi identifié 189 occurrences
historiques réparties sur 19 chemins. Une sauvegarde Git locale isolée a été créée
et vérifiée, puis la réécriture ciblée autorisée a assaini les branches et tags :
le contrôle postérieur retrouve zéro occurrence active et zéro approbation
historique nécessaire. Les archives source et XPI GitHub 1.0.0 et 1.1.0 ont été
reconstruites depuis les tags assainis, remplacées, retéléchargées puis rescannées
sans occurrence résiduelle ; leurs tailles et empreintes distantes correspondent
aux fichiers locaux reconstruits.

## Nettoyage

- les sorties Playwright et les rapports locaux de scanners sont ignorés sans
  masquer de source ;
- aucun audit historique utile, licence ou changelog n’a été supprimé ;
- aucune dépendance de production ou de build n’est requise ; l’absence de
  `package-lock.json` est cohérente avec un `package.json` sans dépendance ;
- le script de release ne supprime plus de branche distante.

## Interface

Les tests Chromium réels chargent les HTML, CSS et JavaScript du dépôt avec une
API locale synthétique. Ils couvrent 98 contrôles Options, les états de démarrage,
Enregistrer/Annuler, les erreurs, les catalogues FR/EN, les 7 vues dashboard,
les actions groupées, le responsive à 720 px, le thème sombre et la réduction de
mouvement. La géométrie du rail de cartes est mesurée en modes normal, compact,
tactile, zoom 125 % et étoile native.

Le XPI candidat a aussi été installé dans Thunderbird 153.0.1 avec un profil,
un compte local et quatre messages entièrement synthétiques. Le panneau séparé,
les cartes normales/sélectionnées/épinglées/avec pièce jointe, le clic de carte,
le maintien du compteur non lu et les 17 actions du menu natif anglais ont été
observés. Les résultats et limites exacts sont consignés dans
`VALIDATION_REPORT_1.1.1.md`; les autres scénarios restent dans
`docs/MANUAL_TEST_PLAN.md`.

## Résultat provisoire

Les défauts confirmés et raisonnablement corrigeables sont traités. La release
reste bloquée tant que la CI finale, les scans classiques, les builds binaires,
le contrôle Thunderbird et les opérations Git/GitHub autorisées ne sont pas
terminés et relus.
