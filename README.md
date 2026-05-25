# Atelier Stock Manager

## V1.0 - Bascule officielle Grist sécurisée

Cette version utilise Grist comme base principale.

- URL normale : Grist par défaut
- `?source=sheet` : mode secours Google Sheet

Les paramètres sensibles sont stockés côté Apps Script dans les propriétés du script :

- `WRITE_PIN`
- `ADMIN_PIN`
- `GRIST_BASE_URL`
- `GRIST_DOC_ID`
- `GRIST_API_KEY`

## Pages principales

- `index.html` : gestion atelier
- `fiche.html?id=EQ-001` : fiche équipement
- `qrcodes.html` : génération QR codes
- `diagnostic.html` : diagnostic application
- `grist-test.html` : test Grist
- `migration-test.html` : outils de migration

## Mode secours

Pour forcer l'ancienne base Google Sheet :

```text
?source=sheet
```

Exemple :

```text
https://louistaffini-debug.github.io/atelier-stock-manager/?source=sheet
```
