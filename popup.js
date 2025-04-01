import { saveData, loadData } from './modules/storage.js';
import { logMessage, loadLogs } from './modules/logs.js';
import { parseCSV, exportToCSV } from './modules/csv.js';
import { sendMessages } from './modules/messaging.js';

let cleanedData = [];

document.getElementById("clearLogsBtn").addEventListener("click", () => {
    chrome.storage.local.remove("logs", () => {
        if (chrome.runtime.lastError) {
            logMessage("error", `Erreur lors du vidage des logs : ${chrome.runtime.lastError}`);
        } else {
            document.getElementById("logContainer").innerHTML = "";
        }
    });
});

// Sauvegarde automatique des champs de texte et inputs
document.querySelectorAll("input[type='text'], textarea").forEach(input => {
    input.addEventListener("input", (event) => {
        saveData(event.target.id, event.target.value);
    });
});

// Sauvegarde automatique des checkboxes
document.querySelectorAll("input[type='checkbox']").forEach(checkbox => {
    checkbox.addEventListener("change", (event) => {
        saveData(event.target.id, event.target.checked);
    });
});

// Récupération des données au chargement
document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("input[type='checkbox']").forEach(checkbox => {
        loadData(checkbox.id, (value) => {
            checkbox.checked = value;
        });
    });

    document.querySelectorAll("input[type='text'], textarea").forEach(input => {
        loadData(input.id, (value) => {
            if (value !== undefined) input.value = value;
        });
    });

    loadLogs();
});

document.getElementById('fileInput').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        const parsedResult = parseCSV(e.target.result);
        cleanedData = parsedResult.data;

        if (cleanedData.length > 0) {
            document.getElementById("validationIcon").style.display = "inline";
        }

        document.getElementById("exportBtn").addEventListener("click", () => {
            exportToCSV(cleanedData);
        });
    };

    reader.readAsText(file);
});

document.getElementById('sendBtn').addEventListener('click', () => {
    const message = document.getElementById('message').value;
    if (!cleanedData || cleanedData.length === 0) {
        logMessage("error", "Aucun fichier valide. Veuillez importer un CSV.");
        return;
    }
    if (!message) {
        logMessage("error", "Message manquant");
        return;
    }

    sendMessages(cleanedData, message, updateProgressBar);
});

function updateProgressBar(current, total) {
    const progressBar = document.getElementById("progressBar");
    const percentage = Math.round((current / total) * 100);
    progressBar.style.width = `${percentage}%`;
}
