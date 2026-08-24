# extension/AGENTS.md

Cette arborescence doit rester 100 % WebExtension/MailExtension publique.

- Interdit : `experiment_apis`, `pinInbox`, modules privilégiés, DOM `about:3pane`, réseau runtime.
- Préserver les métadonnées mail comme données non fiables ; utiliser `textContent`, jamais du HTML construit depuis un message.
- Ne pas persister corps ou pièces jointes.
- Les actions destructives (corbeille) restent déclenchées explicitement par l’utilisateur.
- Les fonctionnalités qui n’existent pas en API publique doivent être repensées dans le Dashboard plutôt que contournées.
