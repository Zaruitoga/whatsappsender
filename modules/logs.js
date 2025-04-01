import { saveData, loadData } from './storage.js';

export function logMessage(type, message) {
    const logContainer = document.getElementById("logContainer");
    const logEntry = document.createElement("div");

    const now = new Date();
    const timeString = now.toLocaleTimeString();

    logEntry.classList.add("log-entry", `log-${type}`);
    if (type === "debug") {
        logEntry.style.display = document.getElementById("debugToggle").checked ? "block" : "none";
    }

    logEntry.innerHTML = `<span class='log-time'>[${timeString}]</span> ${message}`;
    logContainer.appendChild(logEntry);
    logContainer.scrollTop = logContainer.scrollHeight;

    saveLogEntry({ type, message, timeString });
}

function saveLogEntry(logEntry) {
    loadData("logs", (logs) => {
        if (!logs || !Array.isArray(logs)) logs = [];
        logs.push(logEntry);
        saveData("logs", logs);
    });
}

export function loadLogs() {
    loadData("logs", (logs) => {
        if (!logs || !Array.isArray(logs)) logs = [];
        const logContainer = document.getElementById("logContainer");
        const debugToggle = document.getElementById("debugToggle");

        logs.forEach(log => {
            const logEntry = document.createElement("div");
            logEntry.classList.add("log-entry", `log-${log.type}`);
            if (log.type === "debug") {
                logEntry.style.display = debugToggle && debugToggle.checked ? "block" : "none";
            }
            logEntry.innerHTML = `<span class='log-time'>[${log.timeString}]</span> ${log.message}`;
            logContainer.appendChild(logEntry);
        });

        logContainer.scrollTop = logContainer.scrollHeight;
    });
}
