# Rapport de validation — MailPin 1.7.3

## Objet

La release 1.7.3 durcit la composition Organic Workspace en intégrant en dur les corrections UI dans le stylesheet canonique et en supprimant la feuille corrective runtime `interaction-stability.css`.

## Critères PASS

- `interaction-stability.css` absent du tree et non chargé par `theme.js` ;
- espacement structurel explicite entre les groupes de paramètres, y compris Agenda, Règles et Centre de santé ;
- bouton Annuler utilisant des tokens sémantiques lisibles en clair/sombre ;
- corrections 1.7.2 sur statistiques, navigation, save dock, notifications, Agenda et raccourcis préservées ;
- aucune permission, migration, schéma, logique métier ou réseau modifié ;
- QA Linux/Windows, garde sécurité, build reproductible et smoke Thunderbird réel PASS sur le candidat exact ;
- release GitHub et artefacts correspondant au commit validé.

## Preuves finales

Candidate exacte `a247dc53e3b707335b04ae00b227acad52ddb8b5` :

- QA Linux/Windows + garde sécurité/identité `32028928653` — PASS ;
- smoke Thunderbird réel `32028928636` — PASS ;
- merge release `814e07adc82f0a1b19051c83fbb0fec6a22836b0` ;
- workflow Release `32031451673` — PASS ;
- release `v1.7.3` publique, non draft et non prerelease, ciblant exactement `814e07adc82f0a1b19051c83fbb0fec6a22836b0`.

Artefacts publiés :

- `MailPin_v1.7.3.xpi` — 254 564 octets — SHA-256 `66a10432457a509b9c9959e3df7bcdd2415d14668284b6104803dfa1d9362bc4` ;
- `MailPin_GitHub_Repository_v1.7.3.zip` — 683 629 octets — SHA-256 `ff5999a8b73392b0ad7e6778c69602ddddeeb687a3263d2162b2f93afddaf767` ;
- `SHA256SUMS.txt` — 188 octets — SHA-256 `af405970d942b42cbb1d224538795811ddc00ba3cadba3ab9de6e53eea1194e9`.

Les digests des assets GitHub correspondent aux empreintes produites pendant le workflow Release.

## Verdict

**PASS pour la publication GitHub 1.7.3.**

La recette visuelle humaine pixel par pixel et la validation `npm run ci` depuis une extraction neuve de l’archive source publiée sans `.git` restent des étapes séparées avant ATN et ne sont pas présentées comme exécutées.
