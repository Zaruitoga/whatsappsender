# WhatsApp Sender (En Développement)

## Description

WhatsApp Sender est une extension Chrome en cours de développement. Elle vise à permettre l'envoi de messages WhatsApp en masse à partir d'un fichier CSV, avec des fonctionnalités de personnalisation et d'automatisation.

## Objectifs du Projet

- Détection automatique des colonnes pertinentes dans un fichier CSV.
- Personnalisation des messages avec des variables dynamiques (ex. `{nom}`).
- Conversion des numéros de téléphone au format international.
- Automatisation de l'envoi des messages via WhatsApp Web.

## Installation (Pour Développeurs)

1. Clonez ce dépôt GitHub.
2. Ouvrez Google Chrome et accédez à `chrome://extensions/`.
3. Activez le mode développeur.
4. Cliquez sur "Charger l'extension non empaquetée".
5. Sélectionnez le dossier du projet.

## Format CSV Prévu

Le fichier CSV doit inclure une ligne d'en-tête avec des colonnes comme `Nom` et `Numéro de téléphone`.

### Exemple :

```
Nom,Numéro de téléphone
Ethan,0612345678
Alice,0712345678
```

## Statut Actuel

Ce projet est en phase de développement. Certaines fonctionnalités peuvent être incomplètes ou non fonctionnelles.

## Auteur

Développé par **Ethan Lepareur** et **Félix Le Saulnier**.

Pour toute question ou suggestion, contactez : lef3459@gmail.com

