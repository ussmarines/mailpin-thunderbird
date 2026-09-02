# Rapport de validation — MailPin 1.7.8

## Objectif

Publier l’état Git final synchronisé après 1.7.7 sous une version de maintenance distincte sans modifier le runtime Thunderbird 155 validé.

## Candidate exacte

- head : `e48a12239c674e1f8a909b22a04c0c3266eca70e` ;
- QA : `33691697322` — PASS ;
- smoke réel Thunderbird 155.0 : `33691697345` — PASS.

## Main / publication

- squash/tag target : `800c07315ee7f8611f2d2fc6e12a4f2c2d74b849` ;
- QA post-merge : `33691785442` — PASS ;
- smoke réel Thunderbird 155.0 post-merge : `33691785284` — PASS ;
- workflow canonique Release : `33691919194` — PASS ;
- release publique : `v1.7.8` sur le même commit.

## Artefacts publics

- XPI : `b007f9ad0213bb5672e5273c27b4f0d3935897fc2696922acd2e2dd673b5048e` ;
- archive source : `509076b18aef693c060983037c4277a97c65d98e13738ead351da7ef13537b9d` ;
- `SHA256SUMS.txt` asset : `c20e8f706bad9d688486d8143a375a5377289ccf40c3aeeb023491ed7cccc1b7`.

**PASS** — les gates applicables à la maintenance 1.7.8 sont démontrés. La soumission ATN reste un cycle distinct.
