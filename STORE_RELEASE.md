# Préparation de publication MailPin 1.7.11

- **Version source :** 1.7.11 — candidate locale, non publiée
- **Dernière release publique :** 1.7.10
- **Dernière publication :** `v1.7.10`, cible `704b3d5c2b35a2eceb4fbe1136b50a86dfadd6f0`
- **ID :** `ussmarines.mailpin@addons.thunderbird.net`
- **Plage candidate :** Thunderbird 153.0 à 158.*
- **XPI candidat :** `MailPin_v1.7.11.xpi`

La maintenance relève le plafond et le binaire du smoke sans modifier le runtime métier. Preuves et gates : `VALIDATION_REPORT_1.7.11.md` ; empreintes locales finales : `dist/SHA256SUMS.txt`.

## Gate de publication

NO-GO tant qu’un critère runtime requis manque ou échoue. Les opérations commit hors main, push, PR, merge, nouveau tag et release ont été explicitement autorisées le 15 octobre 2026, sous condition de validation de la cible exacte. Étapes restantes : contrôles requis sur la cible exacte, workflow `.github/workflows/release.yml` existant, puis téléchargement et vérification SHA-256 des assets publiés. Aucun artefact ancien ne remplace la candidate. Aucune soumission ATN incluse.
