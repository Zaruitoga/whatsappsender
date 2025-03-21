# Documentation de l'Extension WhatsApp Sender

## Introduction

WhatsApp Sender est une extension Chrome permettant d'envoyer des messages WhatsApp en masse à partir d'un fichier CSV. Elle est idéale pour les campagnes de communication et les rappels automatisés !

## Installation

1. Téléchargez ou clonez le projet depuis GitHub.
2. Ouvrez Google Chrome et accédez à `chrome://extensions/`.
3. Activez le mode développeur (en haut à droite).
4. Cliquez sur "Charger l'extension non empaquetée".
5. Sélectionnez le dossier du projet et validez !

## Format du fichier CSV

Le fichier CSV doit contenir une ligne d'en-tête avec les colonnes `Nom` et `Numéro de téléphone`.
L'extension détectera automatiquement ces colonnes, même si elles ne sont pas dans le même ordre.

### Exemple de fichier CSV valide :

```
Nom,Email,Numéro de téléphone,Adresse
Ethan,ethan@email.com,0612345678,Paris
Alice,alice@email.com,0712345678,Lyon
```

Les numéros doivent être en format français (06 ou 07), ils seront automatiquement convertis en +33.

## Utilisation

1. Ouvrez l'extension en cliquant sur son icône.
2. Chargez votre fichier CSV.
3. Saisissez le message à envoyer (vous pouvez inclure `{nom}` pour personnaliser chaque message avec le prénom du destinataire).
4. Cliquez sur "Envoyer" et laissez l'extension faire le travail !

## Fonctionnalités

✅ Détection automatique des colonnes `Nom` et `Numéro de téléphone`.
✅ Remplacement dynamique de `{nom}` par le prénom de chaque contact.
✅ Conversion automatique des numéros français en format international.
✅ Automatisation de l'envoi des messages WhatsApp.
✅ Délai de 5 secondes entre chaque envoi pour éviter le spam.
✅ Gestion des erreurs et vérifications avant l'envoi.

## Remarques Importantes

- L'extension ouvre les conversations WhatsApp dans le même onglet.
- Un délai de 5 secondes est ajouté entre chaque envoi pour éviter les blocages.
- L'envoi se fait automatiquement après ouverture du chat.
- Vérifiez bien que WhatsApp Web est connecté avant de lancer l'envoi.

## Auteur

Développé par **Ethan Lepareur**.

Contact : ethan.lepareur\@gmail.com

Améliorations & Contributions : N'hésitez pas à proposer des améliorations sur GitHub !

