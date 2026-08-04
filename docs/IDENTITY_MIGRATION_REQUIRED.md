# Validation d’identité requise avant release

L’identifiant source de MailPerch est désormais `pin-mails@ussmarines.local` afin que les métadonnées publiques utilisent exclusivement le pseudonyme du mainteneur.

Thunderbird peut traiter un changement d’identifiant comme une nouvelle extension. Avec le cycle de vie actuel, cela peut modifier l’emplacement du stockage natif associé à l’extension et déclencher le parcours d’installation neuve. **Aucune release ne doit être créée ou publiée à partir de ce changement avant validation manuelle de la continuité des données.**

## Matrice minimale obligatoire

1. Depuis une installation 1.1.0 existante, exporter une sauvegarde MailPerch vérifiée.
2. Utiliser un profil Thunderbird jetable contenant des épingles, groupes, règles, affaires, rappels et liens Agenda de test.
3. Installer une build portant le nouvel identifiant et vérifier si Thunderbird la traite comme mise à jour ou comme nouvelle extension.
4. Vérifier la persistance ou, si nécessaire, l’import contrôlé de la sauvegarde sans activation automatique des règles importées.
5. Redémarrer Thunderbird et contrôler les données, les paramètres, SQLite et les calendriers.
6. Tester désinstallation, réinstallation et absence de purge de données inattendue avant confirmation utilisateur.
7. Exécuter `npm run ci`, puis reconstruire et vérifier le XPI et le ZIP source reproductibles.
8. Documenter le résultat réel dans `docs/BUG_TRACKER.md` et `docs/CODEX_HANDOFF.md`.

Tant que cette matrice n’est pas validée, conserver la version `1.1.0`, ne pas taguer, ne pas créer de release et ne pas présenter le changement comme compatible avec les installations existantes.
