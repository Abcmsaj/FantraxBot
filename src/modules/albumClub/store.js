const fs = require('fs');

function ensureJsonFile(filePath, fallbackValue) {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify(fallbackValue, null, 2));
    }
}

function readJson(filePath, fallbackValue) {
    ensureJsonFile(filePath, fallbackValue);
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (err) {
        console.error(`<AlbumClubStore> Failed to read ${filePath}:`, err.message);
        return fallbackValue;
    }
}

function writeJson(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function getRecentState(filePath) {
    const data = readJson(filePath, {
        queue: [],
    });

    if (!Array.isArray(data.queue)) data.queue = [];

    return data;
}

function saveShuffleQueue(filePath, queue) {
    const data = getRecentState(filePath);
    data.queue = queue;
    writeJson(filePath, data);
    return data;
}

function getPendingState(filePath) {
    const data = readJson(filePath, { items: [] });
    if (!Array.isArray(data.items)) data.items = [];
    return data;
}

function upsertPendingItem(filePath, item) {
    const data = getPendingState(filePath);
    const index = data.items.findIndex(existing => existing.id === item.id);

    if (index === -1) {
        data.items.push(item);
    } else {
        data.items[index] = { ...data.items[index], ...item };
    }

    writeJson(filePath, data);
    return data;
}

function removeFromShuffleQueue(filePath, userId) {
    const recentState = getRecentState(filePath);
    const originalLength = recentState.queue.length;
    
    recentState.queue = recentState.queue.filter(
        id => id !== userId
    );

    console.log(`<AlbumClubStore> Removed user ${userId}. Queue went from ${originalLength} to ${recentState.queue.length} users.`);
    saveShuffleQueue(filePath, recentState.queue);
}

function removePendingItem(filePath, id) {
    const data = getPendingState(filePath);
    data.items = data.items.filter(item => item.id !== id);
    writeJson(filePath, data);
    return data;
}

function getHistoryState(filePath) {
    const data = readJson(filePath, { entries: [] });
    if (!Array.isArray(data.entries)) data.entries = [];
    return data;
}

function appendHistoryEntry(filePath, entry) {
    const data = getHistoryState(filePath);
    data.entries.unshift(entry);
    writeJson(filePath, data);
    return data;
}

module.exports = {
    ensureJsonFile,
    readJson,
    writeJson,
    getRecentState,
    saveShuffleQueue,
    getPendingState,
    upsertPendingItem,
    removeFromShuffleQueue,
    removePendingItem,
    getHistoryState,
    appendHistoryEntry,
};
