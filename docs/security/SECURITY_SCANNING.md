# Procédure d’audit de sécurité

Les audits de sécurité sont indépendants de Codex et ne consomment aucun token ChatGPT. Les workflows `Manual secret and identity guard` et `Manual repository security audit` sont déclenchés uniquement à la demande depuis l’onglet **Actions**.

## Politique d’identité

L’identité publique autorisée est `ussmarines` avec le profil `https://github.com/ussmarines`. Le garde recherche dans l’arbre courant, les métadonnées de commits et les blobs historiques des empreintes SHA-256 correspondant aux identifiants civils interdits. Les valeurs recherchées et détectées ne sont jamais affichées dans les rapports. Toute nécessité légale ou opérationnelle d’utiliser une identité civile doit être soumise au propriétaire avant modification.

## GitHub

1. Ouvrir **Actions**.
2. Sélectionner `Manual secret and identity guard` ou `Manual repository security audit`.
3. Choisir `full` et `report` pour une première analyse.
4. Télécharger l’artefact JSON conservé 30 jours.
5. Après triage des faux positifs, utiliser `block` pour une validation stricte.

## Windows local

Exécuter une seule fois `tools/security/install-security-tools.ps1`. Les outils sont partagés dans `%LOCALAPPDATA%\ussmarines-security-tools`. Lancer ensuite `tools/security/security-scan.ps1 -Profile Full` dans chaque dépôt. Les rapports restent sous `tools/security/.reports/` et ne sont pas suivis par Git.

## Réponse à incident

Ne jamais copier une valeur détectée dans un ticket, un prompt ou un log. Révoquer ou faire tourner immédiatement tout secret exposé, examiner les accès, puis documenter uniquement la catégorie, le chemin, la ligne et la correction. Une réécriture destructive de l’historique exige une autorisation séparée.
