> Source 2.2.0 — candidate native uniquement. Version source : **2.2.0**. Dernière release publique : **1.7.10** ; release publique 1.7.10 inchangée.
> Contrat courant et différences : docs/NATIVE_2.2.0_HANDOFF.md. Les sections 1.7.x ci-dessous restent historiques et ne prouvent pas le natif.

# Limites connues — MailPin

## Source 1.7.10 / release publique 1.7.10

La source **1.7.10** et la release publique **1.7.10** sont alignées. La compatibilité publiée couvre Thunderbird 153.0 à 157.* après validation réelle sur Thunderbird 157.0.1.

- candidate exacte `565f565710da6262d7a91bfbe280a943047cdc6c` : QA `37213680870` et smoke réel Thunderbird 157.0.1 `37213680824` — PASS ;
- `main` publié `704b3d5c2b35a2eceb4fbe1136b50a86dfadd6f0` : QA `37213779632`, smoke réel Thunderbird 157.0.1 `37213779633` et CodeQL `37213779727` — PASS ;
- Agenda reste facultatif et dépend des capacités réelles du calendrier ;
- fournisseurs réseau et calendriers distants restent des validations distinctes ;
- le smoke Linux réel ne remplace pas une matrice complète Windows/macOS ;
- aucune nouvelle permission, migration, dépendance runtime ou connexion réseau n’est introduite ;
- les trois assets publics de `v1.7.10` exposent des SHA-256 dans les métadonnées GitHub.
