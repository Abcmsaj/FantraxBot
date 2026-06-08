const { parseLinks } = require('./formatter');

const QUESTION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours

async function collectSingleAnswer(
dmChannel,
userId,
prompt,
{ maxLength = 500, time = QUESTION_TIMEOUT } = {},
) {
await dmChannel.send(prompt);

let collected;

try {
    collected = await dmChannel.awaitMessages({
        filter: message =>
            message.author.id === userId &&
            message.channel.id === dmChannel.id,
        max: 1,
        time,
    });
} catch (error) {
    collected = null;
}

const answer = collected?.first()?.content?.trim();

if (!answer) {
    await dmChannel.send([
        '⏰ Album Club interview timed out.',
        '',
        'No answer was received within 60 minutes.',
        'This album selection has been cancelled.',
    ].join('\n'));

    throw new Error(`No answer received for prompt: ${prompt}`);
}

return answer.slice(0, maxLength);

}

async function interviewAlbumOwner(user, client, questions) {
try {
const dmChannel = await user.createDM();

    await dmChannel.send([
        `Hi ${user}.`,
        `You have been picked for this week's album club round.`,
        `Reply to each message with your answer.`,
        `You cannot change an answer after submitting it.`,
        `The bot will wait up to 60 minutes for each answer.`,
    ].join('\n'));

    console.log('asking artist');
    const artist = await collectSingleAnswer(
        dmChannel,
        user.id,
        `1) ${questions[0]}`,
        { maxLength: 100 },
    );

    console.log('got artist, asking album');
    const album = await collectSingleAnswer(
        dmChannel,
        user.id,
        `2) ${questions[1]}`,
        { maxLength: 100 },
    );

    console.log('got album, asking year');
    const year = await collectSingleAnswer(
        dmChannel,
        user.id,
        `3) ${questions[2]}`,
        { maxLength: 4 },
    );

    console.log('got year, asking genre');
    const genre = await collectSingleAnswer(
        dmChannel,
        user.id,
        `4) ${questions[3]}`,
        { maxLength: 100 },
    );

    console.log('got genre, asking why');
    const whyListen = await collectSingleAnswer(
        dmChannel,
        user.id,
        `5) ${questions[4]}`,
        { maxLength: 1800 },
    );

    console.log('got why, asking fave');
    const favouriteTrack = await collectSingleAnswer(
        dmChannel,
        user.id,
        `6) ${questions[5]}`,
        { maxLength: 200 },
    );

    console.log('got fave, asking links');
    const linksRaw = await collectSingleAnswer(
        dmChannel,
        user.id,
        `7) ${questions[6]}`,
        { maxLength: 2000 },
    );

    console.log('got links, finalising');

    return {
        artist,
        album,
        year,
        genre,
        whyListen,
        favouriteTrack,
        links: parseLinks(linksRaw),
    };
} catch (error) {
    console.error('Album interview failed:', error);
    throw error;
}

}

module.exports = {
    interviewAlbumOwner,
};
