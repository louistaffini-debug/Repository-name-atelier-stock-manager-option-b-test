# Atelier Stock Manager - GitHub Pages

Version V0.16 - optimisation smartphone / terrain.

## Fichiers

- `index.html` : interface principale.
- `app.js` : logique frontend principale.
- `style.css` : mise en forme commune.
- `fiche.html` / `fiche.js` : fiche individuelle équipement.
- `qrcodes.html` / `qrcodes.js` : génération des QR codes.
- `diagnostic.html` / `diagnostic.js` : diagnostic lecture seule V0.16.

## Test conseillé

1. Ouvrir `index.html`.
2. Charger les équipements.
3. Ouvrir une fiche.
4. Ouvrir la page QR codes.
5. Ouvrir `diagnostic.html` et lancer le diagnostic.
6. Tester sur smartphone.
7. Faire une copie de sauvegarde du Google Sheet.
8. Créer une release GitHub V0.16.


## V0.16 - Optimisation smartphone / usage terrain

Cette version améliore l’usage après scan d’un QR code :

- fiche équipement plus lisible sur smartphone ;
- gros boutons de statut : Disponible, Utilisé, Maintenance, Hors service ;
- modification du statut directement depuis `fiche.html` ;
- champ commentaire rapide ;
- rechargement automatique de la fiche et de l’historique après modification ;
- conservation du code atelier pour les actions d’écriture.

Le backend Apps Script reste compatible avec les actions existantes. La version API attendue est `0.16.0`.


## V0.17 - Test Grist lecture seule

Cette version ajoute une page `grist-test.html` pour vérifier la lecture Grist depuis Apps Script sans modifier les données.

Actions testées :

- `gristHealth`
- `gristListEquipements`
- `gristListFamilles`
- `gristListEmplacements`
- `gristListHistorique`

La page permet aussi une comparaison indicative des volumes Google Sheet / Grist.


## V0.18 - Prévisualisation migration Google Sheet vers Grist

Ajout d'une page `migration-test.html` permettant de générer un aperçu de migration contrôlée sans modifier Grist.

- Comparaison des volumes Google Sheet / Grist.
- Mapping enrichi des colonnes `Equipements` et `Historique`.
- Génération des champs `ficheUrl`, `qrUrl`, `action`, `utilisateur` en aperçu.
- Aucune écriture dans Grist à cette étape.


## V0.18c - Migration contrôlée de l’historique vers Grist

Ajout d’un bouton dans `migration-test.html` pour migrer uniquement la table `Historique` depuis Google Sheet vers Grist. Les doublons sont évités via une clé technique basée sur le timestamp, l’ID équipement, le nouveau statut, le nouveau commentaire et la source.


## V0.19 - Lecture Grist en mode test

La version V0.19 ajoute un mode de lecture depuis Grist sans remplacer le mode terrain Google Sheet.

- Mode stable : `index.html`
- Mode test Grist : `index.html?source=grist`
- Fiche Grist : `fiche.html?id=EQ-001&source=grist`
- QR Grist : `qrcodes.html?source=grist`

En mode Grist V0.19, l'application est volontairement en lecture seule : les ajouts et modifications restent désactivés.
