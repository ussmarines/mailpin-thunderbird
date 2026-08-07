# Registre des bugs MailPerch

Version publique : **1.2.0**

Les entrées corrigées des versions antérieures restent disponibles dans l’historique Git et les rapports d’audit archivés. Ce registre courant conserve les validations encore utiles à la prochaine passe.

## Bugs ouverts

| ID | Introduit | Symptôme | Cause | Fichiers | Test | Statut | Correction | Validation |
|---|---|---|---|---|---|---|---|---|
| MP-2026-018 | 1.1.1 | L’empreinte binaire du ZIP peut différer entre Windows et Linux malgré des contenus extraits identiques. | Différences de conteneur ZIP entre plateformes. | `scripts/build.py`, tests de reproductibilité | `tests/test_build_reproducible.py` | À VALIDER | — | Comparer les artefacts Linux de release aux builds Windows en contrôlant aussi les entrées décompressées. |
| MP-2026-019 | 1.1.1 | Redimensionner le volet crée un grand bloc vide et une fine bande orange sans rappel. | La base flexible de recherche devient une hauteur en colonne; le `display:grid` du centre de rappels neutralise visuellement `hidden`. | `extension/styles/pin.css` | `tests/test_ui_regressions.py` | À VALIDER | 1.1.2 | Vidéo utilisateur reproduite; garde automatisée et CI vertes; revalidation Thunderbird réelle requise. |

## Bugs corrigés ou en validation

| ID | Introduit | Symptôme | Cause | Fichiers | Test | Statut | Correction | Validation |
|---|---|---|---|---|---|---|---|---|
| MP-2026-017 | 1.1.0 | Le panneau anglais conservait des libellés français. | Catalogue privilégié incomplet. | `extension/api/pinInbox/modules/localization.js` | tests de localisation | CORRIGÉ | 1.1.1 | Validé dans Thunderbird 153.0.1 anglais avec messages synthétiques. |
| MP-2026-004 | 3.1.x | Les actions des cartes et le menu natif étaient instables. | Gestionnaires et structure ThreadCard incompatibles. | `extension/api/pinInbox/implementation.js`, `extension/styles/pin.css` | tests UI et menu natif | CORRIGÉ | 3.2.8 | Validé dans une vraie liste de messages synthétiques Thunderbird 153.0.1. |
| MP-2026-005 | 3.2.4 | Enregistrer et Annuler pouvaient devenir inactifs dans l’onglet Options. | Cycle de formulaire et état de configuration incomplets. | `extension/options/options.js` | tests Options | CORRIGÉ | 3.2.10 | Validé dans Thunderbird 153.0.1 avec réouverture et redémarrage. |
| MP-2026-006 | 3.2.4 | La CI Windows interprétait parfois un retour chariot comme partie d’un chemin Git. | Flux texte CRLF utilisé pour les chemins. | `scripts/deep_audit.py` | tests CI multiplateforme | CORRIGÉ | 1.1.1 | Flux NUL-délimité binaire validé sous Linux et Windows CI. |
| MP-2026-007 | 3.2.7 | L’étoile native pouvait être dupliquée ou déplacée. | Manipulation trop large des contrôles natifs. | `extension/api/pinInbox/implementation.js`, `extension/styles/pin.css` | tests de géométrie et étoiles | CORRIGÉ | 3.2.10 | Une étoile native et une punaise MailPerch observées dans Thunderbird 153.0.1. |
| MP-2026-008 | 3.2.9 | La page Options pouvait rester bloquée sur son chargeur. | Initialisation non bornée et localisation supprimant un contrôle. | `extension/options/options-bootstrap.js`, `extension/options/options.js` | tests bootstrap Playwright | CORRIGÉ | 3.2.10 | Chargement, erreur terminale et Réessayer validés dans Thunderbird 153.0.1. |

## Procédure

1. Reproduire et documenter le symptôme sans spéculer.
2. Corriger la cause, ajouter une garde et lancer les tests ciblés.
3. Exécuter `npm run ci`.
4. Conserver `À VALIDER` tant que le comportement n’a pas été observé dans Thunderbird réel.
5. Déplacer les détails historiques dans un audit ou l’historique Git lorsqu’ils ne servent plus au suivi courant.
