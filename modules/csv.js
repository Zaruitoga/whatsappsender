import { logMessage } from './logs.js';

export function parseCSV(csvContent) {
    let lines = csvContent.split(/\r?\n/).map(line => line.trim()).filter(line => line);

    if (lines.length < 2) {
        logMessage("error", "Le fichier CSV semble vide ou mal formaté !");
        return { data: [] };
    }

    let separator = lines[0].includes(";") ? ";" : lines[0].includes(",") ? "," : "\t";
    const headers = lines[0].split(separator).map(h => h.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
    const nameIndex = headers.findIndex(h => /nom|prénom/i.test(h));
    const phoneIndex = headers.findIndex(h => /telephone|numero|tel/i.test(h));

    if (nameIndex === -1 || phoneIndex === -1) {
        logMessage("error", `Colonnes "nom" ou "numéro" introuvables : ${headers.join(", ")}`);
        return { data: [] };
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
        return { data: [] };
    }

    return { data: parsedData };
}

export function exportToCSV(data, filename = "cleaned_data.csv") {
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
