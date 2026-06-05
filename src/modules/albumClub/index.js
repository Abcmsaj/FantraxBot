const cron = require('node-cron');
const { ChannelType, ChannelFlagsBitField, PermissionsBitField, ThreadAutoArchiveDuration } = require('discord.js');
const { DateTime } = require('luxon');
const {
    GUILD_ID,
    FORUM_CHANNEL_ID,
    RECENT_FILE,
    PENDING_FILE,
    HISTORY_FILE,
    RECENT_LIMIT,
    ROUND_DAYS,
    SELECTION_CRON,
    FINALIZE_CRON,
    QUESTIONS,
} = require('./constants');
const {
    ensureJsonFile,
    getRecentState,
    saveRecentUser,
    getPendingState,
    upsertPendingItem,
    removePendingItem,
    appendHistoryEntry,
} = require('./store');
const { buildAlbumPost, buildThreadName } = require('./formatter');
const { interviewAlbumOwner } = require('./interview');

function getForumChannel(client) {
    const channel = client.channels.cache.get(FORUM_CHANNEL_ID) || client.channels.cache.find(ch => ch.id === FORUM_CHANNEL_ID);
    if (!channel) throw new Error(`Album club forum channel not found: ${FORUM_CHANNEL_ID}`);
    if (channel.type !== ChannelType.GuildForum) throw new Error(`Channel ${FORUM_CHANNEL_ID} is not a forum channel.`);
    return channel;
}

function getTagIdByName(forumChannel, tagName) {
    const tag = forumChannel.availableTags?.find(t => t.name?.toLowerCase() === tagName.toLowerCase());
    return tag?.id ?? null;
}

function getGenreTagIds(forumChannel, genreString) {
    if (!genreString || !forumChannel.availableTags?.length) return [];

    const genres = genreString
        .split(',')
        .map(g => g.trim().toLowerCase())
        .filter(Boolean);

    const matchedIds = [];

    for (const genre of genres) {
        const exactMatch = forumChannel.availableTags.find(
            tag => tag.name.trim().toLowerCase() === genre
        );

        if (exactMatch) {
            matchedIds.push(exactMatch.id);
            continue;
        }

        const partialMatch = forumChannel.availableTags.find(tag => {
            const tagName = tag.name.trim().toLowerCase();
            return tagName.includes(genre) || genre.includes(tagName);
        });

        if (partialMatch) {
            matchedIds.push(partialMatch.id);
        }
    }

    return [...new Set(matchedIds)];
}

function pickInitialTags(forumChannel, genre) {
    const genreTags = getGenreTagIds(forumChannel, genre);

    if (Array.isArray(genreTags) && genreTags.length) {
        return genreTags;
    }

    if (forumChannel.availableTags?.length) {
        const likelyTags = ['music', 'album club', 'album'];

        for (const name of likelyTags) {
            const id = getTagIdByName(forumChannel, name);
            if (id) return [id];
        }
    }

    return [];
}

function pickFinalTags(forumChannel, rating) {
    if (rating >= 4.5) {
        const id = getTagIdByName(forumChannel, 'Hall of Fame');
        return id ? [id] : [];
    }

    if (rating > 3) {
        const id = getTagIdByName(forumChannel, 'Recommended');
        return id ? [id] : [];
    }

    const id = getTagIdByName(forumChannel, 'Not for us');
    return id ? [id] : [];
}

async function getEligibleMembers(forumChannel) {
    const recentState = getRecentState(RECENT_FILE);
    const recentUsers = new Set(recentState.users || []);

    const fetched = await forumChannel.guild.members.fetch();

    return [...fetched.values()].filter(member => {
        return (
            !member.user.bot &&
            member.permissionsIn(forumChannel).has(PermissionsBitField.Flags.ViewChannel) &&
            !recentUsers.has(member.id)
        );
    });
}

async function pickMember(forumChannel) {
    const eligibleMembers = await getEligibleMembers(forumChannel);
    if (!eligibleMembers.length) return null;
    return eligibleMembers[Math.floor(Math.random() * eligibleMembers.length)];
}

async function createAlbumClubRound(client) {
    const forumChannel = getForumChannel(client);
    const eligibleMembers = await getEligibleMembers(forumChannel);
    console.log('Eligible members:', eligibleMembers.map(m => `${m.user.tag} (${m.id})`));
    if (!eligibleMembers.length) {
        console.log('<AlbumClub> No eligible members found for a new round.');
        return null;
    }

    const remaining = [...eligibleMembers];
    let selectedMember = null;
    let answers = null;

    while (remaining.length) {
        const index = Math.floor(Math.random() * remaining.length);
        const candidate = remaining.splice(index, 1)[0];

        try {
            answers = await interviewAlbumOwner(candidate.user, client, QUESTIONS);
            selectedMember = candidate;
            break;
        } catch (err) {
            console.warn(`<AlbumClub> Skipping ${candidate.user.tag}: ${err.message}`);
        }
    }

    if (!selectedMember || !answers) {
        console.log('<AlbumClub> No eligible members could be interviewed.');
        return null;
    }

    const postBody = buildAlbumPost({
        requestedBy: selectedMember.user,
        answers,
    });

    const threadName = buildThreadName(answers.artist, answers.album);
    const initialTags = pickInitialTags(forumChannel, answers.genre);

    const createOptions = {
        name: threadName,
        message: {
            content: postBody,
        },
    };

    if (initialTags) createOptions.appliedTags = initialTags;

    const thread = await forumChannel.threads.create(createOptions);

    const safeArtist = answers.artist.slice(0, 80);
    const safeAlbum = answers.album.slice(0, 80);

    const pollQuestion = `How would you rate "${safeAlbum}" by ${safeArtist}?`;

    const pollMessage = await thread.send({
        poll: {
            question: { text: pollQuestion },
            allowMultiselect: false,
            duration: ROUND_DAYS * 24,
            answers: [
                { text: '0.5 stars', emoji: '⭐' },
                { text: '1 star', emoji: '⭐' },
                { text: '1.5 stars', emoji: '⭐' },
                { text: '2 stars', emoji: '⭐' },
                { text: '2.5 stars', emoji: '⭐' },
                { text: '3 stars', emoji: '⭐' },
                { text: '3.5 stars', emoji: '⭐' },
                { text: '4 stars', emoji: '⭐' },
                { text: '4.5 stars', emoji: '⭐' },
                { text: '5 stars', emoji: '⭐' },
            ],
        },
    });

    saveRecentUser(RECENT_FILE, selectedMember.id, RECENT_LIMIT);

    const dueAt = DateTime.now().plus({ days: ROUND_DAYS }).toISO();
    upsertPendingItem(PENDING_FILE, {
        id: thread.id,
        guildId: thread.guildId,
        forumChannelId: forumChannel.id,
        threadId: thread.id,
        pollMessageId: pollMessage.id,
        starterMessageId: thread.id,
        pickedUserId: selectedMember.id,
        pickedUserTag: selectedMember.user.tag,
        artist: answers.artist,
        album: answers.album,
        createdAt: new Date().toISOString(),
        dueAt,
        finalised: false,
    });

    console.log(`<AlbumClub> New round created for ${selectedMember.user.tag} in #${forumChannel.name}.`);
    return {
        thread,
        pollMessage,
        selectedMember,
        answers,
    };
}

function calculateAverageRating(poll) {
    const answers = [...poll.answers.values()];
    const mapping = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

    let totalVotes = 0;
    let totalScore = 0;

    for (let i = 0; i < answers.length; i += 1) {
        const answer = answers[i];
        const rating = mapping[i] ?? 0;
        const votes = Number(answer.voteCount ?? answer.count ?? 0);
        totalVotes += votes;
        totalScore += votes * rating;
    }

    if (!totalVotes) return 0;
    return totalScore / totalVotes;
}

function resolveFinalTagName(rating) {
    if (rating >= 4.5) return 'Hall of Fame';
    if (rating > 3) return 'Recommended';
    return 'Not for us';
}

async function finalizeDueRounds(client) {
    const forumChannel = getForumChannel(client);
    const pendingState = getPendingState(PENDING_FILE);
    const now = DateTime.now();

    for (const item of pendingState.items) {
        if (item.finalised) continue;
        if (item.dueAt && DateTime.fromISO(item.dueAt) > now) continue;

        try {
            const thread = await forumChannel.threads.fetch(item.threadId);
            if (!thread) {
                console.warn(`<AlbumClub> Could not fetch thread ${item.threadId}.`);
                continue;
            }

            const pollMessage = await thread.messages.fetch(item.pollMessageId);
            let poll = pollMessage.poll;
            if (!poll) {
                console.warn(`<AlbumClub> No poll found in thread ${thread.id}.`);
                continue;
            }

            if (!poll.resultsFinalized && typeof poll.end === 'function') {
                await poll.end();
            }

            await new Promise(resolve => setTimeout(resolve, 5000));

            const refreshed = await thread.messages.fetch(item.pollMessageId);
            poll = refreshed.poll;

            const averageRating = calculateAverageRating(poll);

            if (averageRating === 0) {
                console.log(`<AlbumClub> Could not calculate rating yet.`);
                continue;
            }

            const finalTagName = resolveFinalTagName(averageRating);
            const finalTagIds = pickFinalTags(forumChannel, averageRating);

            if (finalTagIds.length && thread.setAppliedTags) {
                await thread.setAppliedTags(finalTagIds, 'Album club final rating');
            }

            appendHistoryEntry(HISTORY_FILE, {
                userId: item.pickedUserId,
                userTag: item.pickedUserTag,
                artist: item.artist,
                album: item.album,
                date: new Date().toISOString(),
                rating: Number(averageRating.toFixed(2)),
                tag: finalTagName,
                threadId: thread.id,
                pollMessageId: pollMessage.id,
            });

            item.finalised = true;
            item.finalisedAt = new Date().toISOString();
            item.rating = Number(averageRating.toFixed(2));
            item.tag = finalTagName;

            await thread.send(`Final rating: **${averageRating.toFixed(2)} / 5** - tagged **${finalTagName}**.`);
            console.log(`<AlbumClub> Finalised ${item.artist} - ${item.album} at ${averageRating.toFixed(2)} stars.`);
        } catch (err) {
            console.error(`<AlbumClub> Failed to finalise thread ${item.threadId}:`, err.message);
        }
    }

    require('./store').writeJson(PENDING_FILE, pendingState);
    return pendingState.items;
}

function ensureAlbumClubFiles() {
    ensureJsonFile(RECENT_FILE, { users: [] });
    ensureJsonFile(PENDING_FILE, { items: [] });
    ensureJsonFile(HISTORY_FILE, { entries: [] });
}

function createAlbumClubScheduler(client) {
    ensureAlbumClubFiles();

    if (client.__albumClubSchedulerStarted) return;
    client.__albumClubSchedulerStarted = true;

    cron.schedule(SELECTION_CRON, async () => {
        try {
            await createAlbumClubRound(client);
        } catch (err) {
            console.error('<AlbumClub> Selection job failed:', err);
        }
    });

    cron.schedule(FINALIZE_CRON, async () => {
        try {
            await finalizeDueRounds(client);
        } catch (err) {
            console.error('<AlbumClub> Finalize job failed:', err);
        }
    });

    console.log(`<AlbumClub> Scheduler started. Selection: ${SELECTION_CRON} Finalize: ${FINALIZE_CRON}`);
}

async function forceStartAlbumClubRound(client) {
    ensureAlbumClubFiles();
    return createAlbumClubRound(client);
}

async function forceFinalizeAlbumClubRounds(client) {
    ensureAlbumClubFiles();
    return finalizeDueRounds(client);
}

function getAlbumClubStatus() {
    return {
        recent: getRecentState(RECENT_FILE),
        pending: getPendingState(PENDING_FILE),
    };
}

module.exports = {
    createAlbumClubScheduler,
    forceStartAlbumClubRound,
    forceFinalizeAlbumClubRounds,
    getAlbumClubStatus,
};
