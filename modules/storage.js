export function saveData(key, value) {
    chrome.storage.local.set({ [key]: value });
}

export function loadData(key, callback) {
    chrome.storage.local.get([key], function(result) {
        let value = result[key];
        callback(value);
    });
}
