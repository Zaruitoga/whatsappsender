import { logMessage } from './logs.js';

export function sendMessages(cleanedData, messageTemplate, updateProgressBar) {
    let index = 0;

    function sendMessage(tabId) {
        if (index >= cleanedData.length) {
            logMessage("info", "Tous les messages ont été envoyés !");
            updateProgressBar(cleanedData.length, cleanedData.length);
            return;
        }

        const { name, number } = cleanedData[index];
        if (number) {
            let customMessage = messageTemplate.replace("{nom}", name);
            const url = `https://web.whatsapp.com/send?phone=${number}&text=${encodeURIComponent(customMessage)}`;

            logMessage("info", `Préparation envoi : ${name} (${number})`);
            chrome.tabs.update(tabId, { url: url }, () => {
                setTimeout(() => {
                    index++;
                    updateProgressBar(index, cleanedData.length);
                    sendMessage(tabId);
                }, 1000); // Simule un délai avant le prochain envoi
            });
        } else {
            logMessage("warning", `Numéro manquant pour ${name}, passage à la ligne suivante.`);
            index++;
            updateProgressBar(index, cleanedData.length);
            sendMessage(tabId);
        }
    }

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length === 0) {
            logMessage("error", "Aucun onglet actif trouvé");
            return;
        }
        sendMessage(tabs[0].id);
    });
}
