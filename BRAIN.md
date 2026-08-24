# BRAIN — MailPin 2.0

MailPin 2.0 est une reconstruction WebExtension-native de l’extension Thunderbird.

Source de vérité opérationnelle :
- `AGENTS.md`
- `PROJECT_MEMORY.md`
- `docs/ARCHITECTURE.md`
- `docs/ATN_COMPLIANCE.md`
- `docs/PROJECT_STATE.json`

La branche `archive/mailpin-1.7.6-experiment` conserve l’ancienne architecture `pinInbox`/SQLite. Elle est historique et ne doit pas être réintroduite dans la ligne 2.x.

Règle structurante : **zéro Experiment API**. Toute fonctionnalité doit être construite avec une API MailExtension/WebExtension publique ou repensée dans l’UI MailPin.
