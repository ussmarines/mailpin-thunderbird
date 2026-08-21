# Audit sécurité différentiel — candidat MailPerch 1.5.4

Date : 2026-08-12
Portée : delta local depuis `038a8df5a9930894e9e6487cf9630c9d13fd399f`

## Portée

Le delta étend minimalement `createCalendarItem` avec des horodatages de planning et modifie la résolution message/conversation. Il corrige aussi des surfaces HTML/CSS/JavaScript locales, dont le défaut Événement et l’état sans destination tâche. Aucune permission, dépendance runtime, connexion réseau, télémétrie, publicité, CDN, code distant, migration de stockage ou modification d’identité n’est introduite.

## Frontière privilégiée

- l’objet d’options Agenda est soumis au schéma puis à `assertStructuredInput` ;
- les dates sont converties en nombres finis et bornées entre 2000 et 2100 ;
- la fin d’un événement doit être strictement postérieure au début ;
- le calendrier doit toujours provenir de la liste compatible et inscriptible de `PinCompatibility` ;
- aucun chemin de fichier, rôle, secret ou sink HTML n’est ajouté ;
- les dates de relance explicites doivent être futures et sont plafonnées à 365 jours.

La conversion de représentation d’une épingle conserve les métadonnées locales et le lien Agenda sans supprimer l’élément calendrier ; aucune migration ou déduplication globale des anciennes données n’est effectuée.

## Contrôles

Les contrats API/compatibilité, gardes de bornage, modèles cross-entry, localisation et `git diff --check` sont réussis. Le scan standard local complet a réussi pour l’identité, Gitleaks, Opengrep, Trivy, SBOM et zizmor, sans valeur sensible affichée. Codex Security n’est pas utilisé.

## Limites et conclusion

La revue est différentielle. Les interactions réelles avec calendriers ACL/fournisseurs externes et l’observation graphique Thunderbird restent au plan manuel. Sous réserve du scan standard final, le delta n’élargit pas les privilèges ou la surface réseau ; la readiness de publication reste **NO-GO** jusqu’à la recette utilisateur.
