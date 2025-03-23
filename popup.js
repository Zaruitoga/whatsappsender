function logMessage(type, message) 
{
	const logContainer = document.getElementById("logContainer");
	const logEntry = document.createElement("div");

	const now = new Date();
	const timeString = now.toLocaleTimeString();

	logEntry.classList.add("log-entry");
	if (type === "info") logEntry.classList.add("log-info");
	if (type === "warning") logEntry.classList.add("log-warning");
	if (type === "error") logEntry.classList.add("log-error");
	if (type === "debug") 
	{
		logEntry.classList.add("log-debug");
		logEntry.style.display = document.getElementById("debugToggle").checked ? "block" : "none";
	}
	
	logEntry.innerHTML = `<span class='log-time'>[${timeString}]</span> ${message}`;
	
	logContainer.appendChild(logEntry);
	logContainer.scrollTop = logContainer.scrollHeight;
}

function exportToCSV(data, filename = "cleaned_data.csv") {
    if (data.length === 0) {
        logMessage("error", "Aucune donnée à exporter.");
        return;
    }

    const csvContent = ["Nom,Numéro", ...data.map(entry => `${entry.name},${entry.number}`)].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");

    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    logMessage("info", `Fichier CSV exporté : ${filename}`);
}

function parseCSV(csvContent) {
    let lines = csvContent.split(/\r?\n/).map(line => line.trim()).filter(line => line);

    if (lines.length < 2) {
        logMessage("error", "Le fichier CSV semble vide ou mal formaté !");
        return { data: []};
    }

    let separator = lines[0].includes(";") ? ";" : lines[0].includes(",") ? "," : "\t";
    const headers = lines[0].split(separator).map(h => h.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
    const nameIndex = headers.findIndex(h => /nom|prénom/i.test(h));
    const phoneIndex = headers.findIndex(h => /telephone|numero|tel/i.test(h));

    if (nameIndex === -1 || phoneIndex === -1) {
        logMessage("error", `Colonnes "nom" ou "numéro" introuvables : ${headers.join(", ")}`);
        return { data: []};
    }

    const uniqueNumbers = new Set();
    let parsedData = [];

    for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(separator).map(cell => cell.trim());
        const name = row[nameIndex];
        let number = row[phoneIndex].replace(/\s+/g, "");

        if (!name) {
            logMessage("warning", `Nom manquant à la ligne ${i + 1}, ligne ignorée.`);
            continue;
        }

        if (!/^\+?\d+$/.test(number)) {
            logMessage("warning", `Numéro invalide ignoré : "${number}" (ligne ${i + 1})`);
            continue;
        }

        if (number.startsWith("0")) {
            number = "33" + number.substring(1);
        }

        if (uniqueNumbers.has(number)) {
            logMessage("warning", `Doublon détecté et ignoré : ${number} (ligne ${i + 1})`);
            continue;
        }

        uniqueNumbers.add(number);
        parsedData.push({ name, number });
    }

    if (parsedData.length === 0) {
        logMessage("error", "Aucune donnée valide trouvée après nettoyage.");
		return { data: []};
    }

    return { data: parsedData };
}

document.getElementById("debugToggle").addEventListener("change", (event) => 
{
	const showDebug = event.target.checked;
	document.querySelectorAll(".log-debug").forEach(log => 
	{
		log.style.display = showDebug ? "block" : "none";
	});
});

document.getElementById('fileInput').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        const { data: cleanedData } = parseCSV(e.target.result);
        
        if (cleanedData.length > 0) {
            document.getElementById("validationIcon").style.display = "inline"; // ✅ Afficher l'icône de validation
        }

        document.getElementById("exportBtn").addEventListener("click", () => {
            exportToCSV(cleanedData);
        });
    };

    reader.readAsText(file);
});	

document.getElementById('sendBtn').addEventListener('click', () => 
{
	logMessage("debug", "Bouton Envoyer cliqué");
	if (!cleanedData || cleanedData.length === 0) {
        logMessage("error", "Aucun fichier valide. Veuillez importer un CSV.");
        return;
    }
	const message = document.getElementById('message').value;

	// Vérifie si un fichier CSV a été chargé et si un message a été saisi
	if (!message) 
	{
		logMessage("error", "Message manquant");
		return;
	}
	let index = 1; // Débute à la première ligne après l'en-tête

	function sendMessage(tabId) 
	{
		if (index >= cleanedData.length) 
		{
			logMessage("info", "Tous les messages ont été envoyés !");
			return;
		}

		const { name, number } = cleanedData[index];

		if (number) 
		{
			if (number.startsWith("0")) number = "33" + number.substring(1);
			let customMessage = message.replace("{nom}", name);
			const url = `https://web.whatsapp.com/send?phone=${number}&text=${encodeURIComponent(customMessage)}`;

			logMessage("info", `Préparation envoi : ${name} (${number})`);

			chrome.tabs.update(tabId, { url: url }, () => 
			{
				logMessage("debug", "Attente du bouton d'envoi...");
				setTimeout(() => {
					chrome.scripting.executeScript({
						target: { tabId: tabId },
						function: () => {
							return new Promise((resolve, reject) => {
								const startTime = Date.now();
								const timeout = 15000;

								function check() {
									const sendButton = document.querySelector('[data-icon="send"]');
									if (sendButton) {
										// ✅ Récupération du nombre de messages juste avant l'envoi
										const previousMessageCount = document.querySelectorAll('.message-out').length;

										sendButton.click();

										function waitForMessageSent() {
											const messages = document.querySelectorAll('.message-out');
											if (messages.length > previousMessageCount) {
												const lastMessage = messages[messages.length - 1];
												const statusIcon = lastMessage.querySelector('[data-icon="msg-check"], [data-icon="msg-dblcheck"], [data-icon="msg-dblcheck-ack"]');

												if (statusIcon) {
													resolve("Message confirmé envoyé !");
												} else {
													setTimeout(waitForMessageSent, 500);
												}
											} else if (Date.now() - startTime < timeout) {
												setTimeout(waitForMessageSent, 500);
											} else {
												reject("Le message n'est pas apparu après 15s.");
											}
										}

										waitForMessageSent();

									} else if (Date.now() - startTime < timeout) {
										setTimeout(check, 500);
									} else {
										reject("Bouton d'envoi introuvable après 15s.");
									}
								}
								check();
							});
						}
					}, (result) => {
						if (chrome.runtime.lastError) {
							logMessage("error", "Erreur d'exécution du script : " + chrome.runtime.lastError.message);
						} else if (result && result[0]?.result === "Message confirmé envoyé !") {
							logMessage("info", `Message envoyé et confirmé pour ${name} (${number})`);
							index++; 
							sendMessage(tabId); 
						} else {
							logMessage("error", "Impossible de confirmer l'envoi du message");
						}
					});
				}, 1000);
			});
		} 
		else 
		{
			logMessage("warning", `Numéro manquant pour ${name}, passage à la ligne suivante.`);
			index++;
			sendMessage(tabId);
		}
	}

	// Récupère l'onglet actif dans Chrome
	chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => 
	{
		if (tabs.length === 0) 
		{
			logMessage("error", "Aucun onglet actif trouvé");
			return;
		}
		sendMessage(tabs[0].id); // Démarre l'envoi des messages
	});
});
