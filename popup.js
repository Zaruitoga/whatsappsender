// Script d'envoi de messages WhatsApp à partir d'un fichier CSV
// Auteur : Ethan Lepareur

document.getElementById('sendBtn').addEventListener('click', () => {
    console.log("Bouton Envoyer cliqué");
    const fileInput = document.getElementById('fileInput');
    const message = encodeURIComponent(document.getElementById('message').value);
    
    // Vérifier si un fichier CSV est chargé et si un message est saisi
    if (!fileInput.files.length || !message) {
        alert("Veuillez charger un fichier CSV et saisir un message");
        console.error("Fichier CSV ou message manquant");
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function (event) {
        console.log("Fichier CSV chargé");
        const lines = event.target.result.split('\n');
        let index = 0;

        // Fonction récursive pour envoyer un message à chaque contact du fichier CSV
        function sendMessage(tabId) {
            if (index >= lines.length) {
                console.log("Tous les messages ont été envoyés");
                return;
            }
        
            let [name, number] = lines[index].split(/[,;]/);
            if (number) {
                number = number.trim();
                if (number.startsWith("0")) {
                    number = "33" + number.substring(1);
                }
        
                // Récupérer le message et remplacer {nom} par le vrai nom
                let customMessage = decodeURIComponent(message).replace("{nom}", name.trim()); 
                const url = `https://web.whatsapp.com/send?phone=${number}&text=${encodeURIComponent(customMessage)}`;

                console.log(`Envoi du message à ${name} (${number}) : ${customMessage}`);
        
                chrome.tabs.update(tabId, { url: url }, () => {
                    setTimeout(() => {
                        chrome.scripting.executeScript({
                            target: { tabId: tabId },
                            function: () => {
                                const sendButton = document.querySelector('[data-icon="send"]');
                                if (sendButton) {
                                    console.log("Bouton d'envoi trouvé, envoi du message...");
                                    sendButton.click();
                                } else {
                                    console.error("Bouton d'envoi introuvable");
                                }
                            }
                        }, () => {
                            setTimeout(() => {
                                console.log("Passage au contact suivant");
                                index++;
                                sendMessage(tabId);
                            }, 5000); // Attendre avant d'envoyer le message suivant
                        });
                    }, 5000); // Attendre que la page se charge
                });
            } else {
                console.warn("Numéro manquant pour une ligne, passage à la suivante");
                index++;
                sendMessage(tabId);
            }
        }
        

        // Récupérer l'onglet actif pour y ouvrir les liens WhatsApp
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length === 0) {
                console.error("Aucun onglet actif trouvé");
                return;
            }
            sendMessage(tabs[0].id);
        });
    };
    
    // Lire le fichier CSV
    reader.readAsText(fileInput.files[0]);
});