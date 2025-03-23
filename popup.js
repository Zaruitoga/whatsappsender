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

document.getElementById("debugToggle").addEventListener("change", (event) => 
{
	const showDebug = event.target.checked;
	document.querySelectorAll(".log-debug").forEach(log => 
	{
		log.style.display = showDebug ? "block" : "none";
	});
});

document.getElementById('sendBtn').addEventListener('click', () => 
{
	logMessage("debug", "Bouton Envoyer cliqué");
	const fileInput = document.getElementById('fileInput');
	const message = document.getElementById('message').value;

	// Vérifie si un fichier CSV a été chargé et si un message a été saisi
	if (!fileInput.files.length || !message) 
	{
		alert("Veuillez charger un fichier CSV et saisir un message");
		logMessage("error", "Fichier CSV ou message manquant");
		return;
	}

	const reader = new FileReader();
	reader.onload = function (event) 
	{
		logMessage("debug", "Fichier CSV chargé");

		// Lecture du fichier et suppression des lignes vides
		const lines = event.target.result.split('\n').map(line => line.trim()).filter(line => line); 

		if (lines.length < 2) 
		{ // Vérifie qu'il y a au moins un en-tête et une ligne de données
			alert("Le fichier CSV semble vide ou mal formaté !");
			logMessage("error", "Le fichier CSV est vide ou mal formaté.");
			return;
		}

		// Détection automatique des colonnes "nom" et "numéro" dans l'en-tête
		const headers = lines[0].split(/[,;]/).map(h => h.trim().toLowerCase());
		const nameIndex = headers.findIndex(h => h.includes("nom")); // Trouve l'index de la colonne "nom"
		const phoneIndex = headers.findIndex(h => h.includes("téléphone") || h.includes("numéro")); // Trouve l'index de la colonne "numéro"

		// Si une des colonnes est introuvable, on affiche une erreur
		if (nameIndex === -1 || phoneIndex === -1) 
		{
			alert("Impossible de trouver les colonnes 'nom' et 'numéro' dans le fichier csv !");
			logMessage("error", "Colonnes 'nom' ou 'numéro' introuvables dans l'en-tête : " + headers.join(", "));
			return;
		}

		let index = 1; // Débute à la première ligne après l'en-tête

		function sendMessage(tabId) 
		{
			if (index >= lines.length) 
			{
				logMessage("info", "Tous les messages ont été envoyés !");
				return;
			}

			const data = lines[index].split(/[,;]/).map(d => d.trim());
			const name = data[nameIndex];
			let number = data[phoneIndex];

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
	};

	// Lit le fichier CSV
	reader.readAsText(fileInput.files[0]);
});

