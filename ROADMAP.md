# Feuille de route

## 3.2.9 — validation Thunderbird de l’initialisation récupérable

- ouvrir Options dans un profil vierge sans compte ni calendrier et confirmer que le chargeur disparaît ;
- vérifier le formulaire, les recommandations, Enregistrer, Annuler et la persistance après redémarrage ;
- provoquer une indisponibilité de l’Experiment et confirmer le panneau d’erreur, le diagnostic expurgé et Réessayer ;
- conserver MP-2026-008 en `À VALIDER` jusqu’à cette observation réelle.

## 3.2.8 — validation Thunderbird des corrections structurelles

- confirmer dans un profil Thunderbird 153 jetable que les recommandations sont visibles dès la première ouverture des paramètres ;
- confirmer les 98 contrôles, Enregistrer, Annuler, réouverture et redémarrage avec l'API Experiment réelle ;
- mesurer le rail sur une liste de messages synthétiques virtualisée et comparer aux seuils automatisés ;
- conserver MP-2026-004, MP-2026-005 et MP-2026-007 en `À VALIDER` jusqu'à ces observations ;
- intégrer à terme le scénario Playwright à un harnais Thunderbird qui expose ses contextes d'onglets.

## 3.2.7 — seconde correction des interactions réelles

- confirmer dans Thunderbird 153 qu’une seule étoile native, une seule punaise MailPerch et un seul bouton Plus sont visibles par ligne ;
- confirmer les clics directs Enregistrer et Annuler, puis la persistance après fermeture/réouverture ;
- maintenir MP-2026-004 et MP-2026-005 en `À VALIDER` jusqu’à confirmation utilisateur ;
- ne plus déplacer `.button-star` en mode indépendant et ne jamais appliquer les classes génériques Thunderbird à la punaise MailPerch.

## 3.2.5 — validation des régressions réelles

- confirmer dans Thunderbird 153 qu’une seule étoile native est visible en mode indépendant et en mode `nativeStar` ;
- modifier un champ texte, une case, un nombre et une liste, puis valider Enregistrer, Annuler et `Ctrl/Cmd+S` ;
- confirmer le passage du job Windows après le flux NUL-délimité de `deep_audit.py` ;
- maintenir `docs/BUG_TRACKER.md` à chaque bug reproduit, même lorsqu’une correction est différée ;
- intégrer progressivement les validations graphiques au harnais Thunderbird réel.

## 3.2.4 — porte de sécurité et cycle de vie

- valider dans Thunderbird réel la fermeture/purge à la désinstallation et la sentinelle de réinstallation à zéro, y compris après désactivation/réactivation ;
- confirmer les valeurs recommandées sur un profil neuf : mode guidé, densité normale, automatisations destructives désactivées ;
- tester les imports malformés, volumineux et contenant des clés dangereuses ;
- vérifier les sauvegardes dans le dossier interne puis dans un dossier choisi par le sélecteur natif ;
- maintenir `SECURITY_AUDIT_3.2.4.md`, `docs/SECURITY_BOUNDARY.md` et le test de durcissement dans chaque future version ;
- exécuter une revue de sécurité indépendante avant toute publication publique.

## 3.2.x — consolidation en cours

- exécuter les tests browser/XPCShell dans un checkout Thunderbird réel ;
- compléter la matrice manuelle Windows/Linux pour IMAP, POP, Gmail, Microsoft, boîte unifiée, dossiers virtuels et calendriers ;
- mesurer le panneau avec 100, 500 et 2 000 épingles réelles ;
- corriger les résultats de l’audit lecteur d’écran NVDA/Orca ;
- finir la traduction des messages techniques rares et des journaux de maintenance.

## 3.3.x — préparation publique

- stabiliser l’identifiant public, le nom et la licence ;
- figer une plage Thunderbird réellement testée ;
- ajouter un harnais Thunderbird téléchargeable pour la CI graphique ;
- préparer captures, notes reviewers, politique de support et procédure de retour arrière.

## Publication ATN

- fournir le code source lisible et les instructions de build reproductible ;
- joindre la matrice de compatibilité réelle et les hashes SHA-256 ;
- confirmer la conformité des marques, de la licence et des données personnelles ;
- publier d’abord une Release Candidate, puis une version stable après validation manuelle.
