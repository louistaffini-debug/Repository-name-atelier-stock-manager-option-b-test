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
