# Audit de sécurité — MailPerch 1.5.1

> Statut : **AUDIT STANDARD FINAL OK** pour le périmètre 1.5.1 préparé sur la branche dédiée.
> Base initiale : `main` 1.5.0 au commit `c87a46de4141e09f2e0b29c0ec6996b2693fc2b1`.

## Périmètre

La passe couvre l’intégralité des fichiers suivis, l’historique Git disponible dans GitHub Actions, le runtime WebExtension/Experiment, les adaptateurs Thunderbird, le stockage, les imports/restaurations, la désinstallation, les workflows, les scripts de build, les tests, les documents et les fichiers de publication.

Codex Security n’a pas été utilisé. Les contrôles ont été réalisés avec les outils standards du dépôt et des scanners de sécurité vérifiés.

## Contrôles réellement exécutés

- inventaires exhaustifs de tous les fichiers suivis, avec seconde passe indépendante ;
- validation syntaxique/structurelle des formats actifs ;
- contrôle des liens Markdown locaux, ressources HTML/CSS/manifeste, modules Experiment et locales FR/EN ;
- recherche de primitives dangereuses, réseau runtime, secrets/fichiers sensibles et artefacts générés suivis ;
- garde d’identité et de fichiers suivis sur tout l’historique Git ;
- Gitleaks **8.30.1** sur tout l’historique ;
- Opengrep **1.22.0** avec les règles projet ;
- Trivy **0.70.0** vulnérabilités/mauvaises configurations ;
- SBOM CycloneDX généré par Trivy ;
- zizmor **1.26.1** hors ligne sur les workflows GitHub Actions ;
- tests de régression de la garde sécurité dans la QA permanente.

La passe standard finale GitHub Actions, run **31427419713**, commit `51a82d3dbe74a53dd873493c74735a1eae78f448`, a obtenu :

- garde historique : **succès** ;
- Gitleaks : **0 fuite détectée / succès** ;
- Opengrep : **0 finding bloquant / succès** ;
- Trivy vulnérabilités et mauvaises configurations : **0 finding bloquant / succès** ;
- SBOM CycloneDX : **généré avec succès** ;
- zizmor : **0 finding bloquant / succès**.

Le workflow temporaire utilisé uniquement pour déclencher cette passe a ensuite été supprimé. Cette suppression réduit la surface inspectée et ne modifie ni code produit, ni dépendances, ni permissions, ni workflows permanents. La QA permanente sur l’arbre nettoyé a ensuite repassé la garde historique, `npm run ci` sous Linux et `npm run check && npm test` sous Windows avec succès.

## Défauts détectés et corrigés pendant l’audit

1. **Éditeur de carte** : état `checklistItems` et fonction `renderChecklist` hors portée de `openEditor()`, provoquant un `ReferenceError` strict-mode.
2. **Frontière Messages** : plusieurs énumérations, accès `msgDatabase` et mutations de messages restaient dans `implementation.js` malgré le contrat `PinCompatibility`.
3. **Diagnostic fournisseur** : l’état TLS réel du serveur n’était pas transmis à la matrice expurgée, ce qui pouvait produire `secure: false` par défaut.
4. **Migration Settings** : une affectation legacy restait figée à 7 alors que le schéma Settings courant est 8.
5. **Workflow runtime** : le déclenchement push du smoke ciblait encore une ancienne branche fusionnée.
6. **Documentation/release** : plusieurs sources actives décrivaient encore des versions, branches, schémas ou rapports obsolètes.
7. **Banc de test** : une assertion mélangeait total de portée et résultats de recherche ; le harness a été corrigé puis revalidé sur Thunderbird réel jusqu’à 2000 épingles. Ce point n’était pas une vulnérabilité produit.

## Invariants préservés

- identifiant `pin-mails@MailPerch.local` inchangé ;
- permission WebExtension `menus` uniquement ;
- CSP avec `connect-src 'none'` ;
- aucune dépendance runtime ajoutée ;
- aucun code distant, télémétrie, publicité ou CDN ;
- aucun stockage de corps complet de message ou contenu de pièce jointe ;
- SQLite physique 5, Settings 8, Data 7 ;
- mutations Messages ramenées derrière l’adaptateur privilégié ;
- balayages nouvellement extraits bornés à 100 000 en-têtes maximum par appel d’adaptateur ;
- téléchargements Thunderbird/geckodriver/scanners limités aux environnements CI de validation et vérifiés par empreinte ;
- workflows permanents sensibles conservés en déclenchement manuel conformément à `SECURITY_PRODUCTION_RULES.md`.

## Portée de la conclusion

Cet audit confirme l’absence de finding avec les scanners et règles réellement exécutés ; il ne constitue pas une preuve mathématique d’absence de toute vulnérabilité future. Les intégrations à de vrais fournisseurs mail/calendrier et les comportements propres à des environnements utilisateurs restent couverts par la validation manuelle et les futures régressions.

Après cette synchronisation documentaire, les scanners lourds ne sont pas relancés uniquement pour le changement de ce rapport : leur surface code/runtime/dépendances/workflows permanents reste inchangée. La QA permanente et le scan de secrets du dépôt restent en revanche exigés avant fusion.
