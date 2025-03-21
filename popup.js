function logMessage(type, message) {
    const logContainer = document.getElementById("logContainer");
    const logEntry = document.createElement("div");

    const now = new Date();
    const timeString = now.toLocaleTimeString();

    logEntry.classList.add("log-entry");
    if (type === "info") logEntry.classList.add("log-info");
    if (type === "warning") logEntry.classList.add("log-warning");
    if (type === "error") logEntry.classList.add("log-error");
    if (type === "debug") {
        logEntry.classList.add("log-debug");
        logEntry.style.display = document.getElementById("debugToggle").checked ? "block" : "none";
    }
    
    logEntry.innerHTML = `<span class='log-time'>[${timeString}]</span> ${message}`;
    
    logContainer.appendChild(logEntry);
    logContainer.scrollTop = logContainer.scrollHeight;
}

document.getElementById("debugToggle").addEventListener("change", (event) => {
    const showDebug = event.target.checked;
    document.querySelectorAll(".log-debug").forEach(log => {
        log.style.display = showDebug ? "block" : "none";
    });
});

document.getElementById('sendBtn').addEventListener('click', () => {
    logMessage("debug", "Bouton Envoyer cliqué");
    const fileInput = document.getElementById('fileInput');
    const message = document.getElementById('message').value;

    // Vérifie si un fichier CSV a été chargé et si un message a été saisi
    if (!fileInput.files.length || !message) {
        alert("Veuillez charger un fichier CSV et saisir un message");
        logMessage("error", "Fichier CSV ou message manquant");
        return;
    }

    const reader = new FileReader();
    reader.onload = function (event) {
        logMessage("debug", "Fichier CSV chargé");

        // Lecture du fichier et suppression des lignes vides
        const lines = event.target.result.split('\n').map(line => line.trim()).filter(line => line); 

        if (lines.length < 2) { // Vérifie qu'il y a au moins un en-tête et une ligne de données
            alert("Le fichier CSV semble vide ou mal formaté !");
            logMessage("error", "Le fichier CSV est vide ou mal formaté.");
            return;
        }

        // Détection automatique des colonnes "nom" et "numéro" dans l'en-tête
        const headers = lines[0].split(/[,;]/).map(h => h.trim().toLowerCase());
        const nameIndex = headers.findIndex(h => h.includes("nom")); // Trouve l'index de la colonne "nom"
        const phoneIndex = headers.findIndex(h => h.includes("téléphone") || h.includes("numéro")); // Trouve l'index de la colonne "numéro"

        // Si une des colonnes est introuvable, on affiche une erreur
        if (nameIndex === -1 || phoneIndex === -1) {
            alert("Impossible de trouver les colonnes 'nom' et 'numéro' dans le fichier csv !");
            logMessage("error", "Colonnes 'nom' ou 'numéro' introuvables dans l'en-tête : " + headers.join(", "));
            return;
        }

        let index = 1; // Débute à la première ligne après l'en-tête

        function sendMessage(tabId) {
            // Vérifie si toutes les lignes ont été traitées
            if (index >= lines.length) {
                logMessage("info", "Tous les messages ont été envoyés !");
                return;
            }

            // Sépare les données de la ligne courante
            const data = lines[index].split(/[,;]/).map(d => d.trim());
            const name = data[nameIndex]; // Récupère le nom de la personne
            let number = data[phoneIndex]; // Récupère son numéro

            if (number) {
                // Si le numéro commence par 0, on remplace par +33 (France)
                if (number.startsWith("0")) {
                    number = "33" + number.substring(1);
                }

                // Remplace {nom} dans le message par le vrai nom
                let customMessage = message.replace("{nom}", name);

                // Création du lien pour ouvrir la conversation WhatsApp
                const url = `https://web.whatsapp.com/send?phone=${number}&text=${encodeURIComponent(customMessage)}`;
                
                logMessage("debug", `Préparation envoi : ${name} (${number}) - Message : ${customMessage}`);
                logMessage("info", `Envoi du message à ${name} (${number})`);

                // Ouvre l'URL de WhatsApp avec le numéro et le message pré-rempli
                chrome.tabs.update(tabId, { url: url }, () => {
                    setTimeout(() => {
                        // Exécute un script pour cliquer automatiquement sur le bouton d'envoi
                        chrome.scripting.executeScript({
                            target: { tabId: tabId },
                            function: () => {
                                const sendButton = document.querySelector('[data-icon="send"]');
                                if (sendButton) {
                                    logMessage("info", "Bouton d'envoi trouvé, envoi du message...");
                                    sendButton.click();
                                } else {
                                    logMessage("error", "Bouton d'envoi introuvable");
                                }
                            }
                        }, () => {
                            setTimeout(() => {
                                console.log("Passage au contact suivant");
                                index++; // Passe à la ligne suivante du CSV
                                sendMessage(tabId);
                            }, 5000); // Attente de 5 secondes avant d'envoyer le message suivant
                        });
                    }, 5000); // Attente de 5 secondes pour le chargement de la page
                });
            } else {
                logMessage("warning", `Numéro manquant pour ${name}, passage à la ligne suivante.`);
                index++;
                sendMessage(tabId);
            }
        }

        // Récupère l'onglet actif dans Chrome
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length === 0) {
                logMessage("error", "Aucun onglet actif trouvé");
                return;
            }
            sendMessage(tabs[0].id); // Démarre l'envoi des messages
        });
    };

    // Lit le fichier CSV
    reader.readAsText(fileInput.files[0]);
});

