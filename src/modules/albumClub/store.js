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
        users: [],
    });

    if (!Array.isArray(data.queue)) data.queue = [];
    if (!Array.isArray(data.users)) data.users = [];

    return data;
}

function saveRecentUser(filePath, userId, limit = 7) {
    const data = getRecentState(filePath);

    // Keep the old recent-user history for status/debugging.
    const unique = [userId, ...data.users.filter(id => id !== userId)];
    data.users = unique.slice(0, limit);

    // Remove the selected user from the shuffle bag.
    data.queue = data.queue.filter(id => id !== userId);

    writeJson(filePath, data);
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
    saveRecentUser,
    saveShuffleQueue,
    getPendingState,
    upsertPendingItem,
    removePendingItem,
    getHistoryState,
    appendHistoryEntry,
};
