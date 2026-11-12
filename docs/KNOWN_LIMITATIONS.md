# Limites connues — MailPin

## Source 1.7.13 / release publique 1.7.13

MailPin 1.7.13 déclare Thunderbird 153.0 à 160.*. Smoke réel Thunderbird 160.0 Linux (binaire officiel SHA-256 contrôlé), QA Linux/Windows et CodeQL **PASS** sur la PR #94 et le target publié `9bc7a0ef2c28fc2547420ea4d1e6172d50e7cf0d` ; publisher `43237379954` PASS. Le smoke a prouvé le démarrage MV3, le panneau unique, le toggle Quick Filter, l'épinglage sans mutation des flags/compteurs, le Dashboard, le nettoyage et la réinstallation.

Fournisseurs réseau, calendriers distants, macOS, accessibilité assistée, persistance par cold start complet et identité binaire inter-OS ne sont pas revalidés spécifiquement pour Thunderbird 160. La revue Add-ons for Thunderbird (ATN) reste distincte. Détails : `../VALIDATION_REPORT_1.7.13.md`.
