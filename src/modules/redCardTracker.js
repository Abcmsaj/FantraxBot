const fs = require('fs').promises; // Use promises
const path = require('path');
const { EmbedBuilder } = require('discord.js'); // Import EmbedBuilder directly if possible, or use Discord.EmbedBuilder

const cardsPath = path.join(__dirname, '../json/cards.json');

async function redCardTrackerFunction(Discord, reaction, redCardChannel, approverId, adminId, user, monthlyCards) {
    if (reaction.emoji.name !== '🟥') return;
    if (reaction.count > 1) return; // Only trigger on first react
    if (reaction.message.author.bot && !user.bot) {
        return reaction.remove().catch(e => console.error('Failed to remove bot reaction:', e));
    }
    if (user.bot) return; // Ignore bots reacting

    // Load Data
    let cards = {};
    try {
        const data = await fs.readFile(cardsPath, 'utf8');
        cards = JSON.parse(data);
    } catch (err) {
        console.error(`<RedCard> DB Read Error: ${err.message}`);
    }

    const date = new Date();
    const month = date.getMonth() + 1;

    // Initialize user if missing
    if (!cards[user.id]) {
        cards[user.id] = {
            username: user.username,
            provisional: 0,
            confirmed: 0,
            cardAllowance: monthlyCards,
            monthReset: month
        };
    }

    const giver = cards[user.id];

    // Reset Monthly Allowance
    if (giver.monthReset !== month) {
        giver.cardAllowance = monthlyCards;
        giver.monthReset = month;
    }

    // Check Allowance
    if (giver.cardAllowance <= 0) {
        console.log(`<RedCard> ${user.username} has no cards left.`);
        reaction.message.channel.send(`${user}, you have no red cards left to give this month.\nYour 🟥 does not count.`);
        await reaction.remove().catch(() => { });

        // Penalty logic from original code (putting them into negative)
        if (giver.cardAllowance === 0) {
            giver.cardAllowance--;
            await fs.writeFile(cardsPath, JSON.stringify(cards, null, 2));
        }
        return;
    }

    // Deduct Card
    giver.cardAllowance--;
    const remaining = giver.cardAllowance;
    const s = remaining === 1 ? '' : 's';
    reaction.message.channel.send(`🟥 ${user}, you have ${remaining} red card${s} left to give this month.`);

    // Save state immediately regarding allowance
    await fs.writeFile(cardsPath, JSON.stringify(cards, null, 2));

    console.log(`<RedCard> Provisional card on "${reaction.message.content}" by ${user.username}`);

    // Create Embed
    const content = reaction.message.content || 'Image (click link to see)';
    const cardEmbed = new Discord.EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('Red Card Infraction')
        .setThumbnail(reaction.message.author.displayAvatarURL({ dynamic: true }))
        .addFields(
            { name: 'Message', value: content.substring(0, 1024) },
            { name: 'Offence by', value: `${reaction.message.author}`, inline: true },
            { name: 'Channel', value: `${reaction.message.channel}`, inline: true },
            { name: 'Reported by', value: `${user}`, inline: true },
            { name: 'Remaining cards', value: `${remaining}`, inline: true },
            { name: 'Link', value: reaction.message.url }
        )
        .setTimestamp()
        .setFooter({ text: 'Mostly-Palatable Premier Division' });

    // Send to Admin Channel
    const adminMsg = await redCardChannel.send({ embeds: [cardEmbed] });
    await adminMsg.react('✅');
    await adminMsg.react('❌');

    // Filter for Approval
    const filter = (r, u) => ['✅', '❌'].includes(r.emoji.name) && (u.id === approverId || u.id === adminId);

    try {
        const collected = await adminMsg.awaitReactions({ filter, max: 1, time: 86400000 }); // 24h timeout
        const approvalReaction = collected.first();

        if (approvalReaction && approvalReaction.emoji.name === '✅') {
            await adminMsg.react('🟥');
            console.log('<RedCard> Approved.');

            // Re-read data to ensure sync (optional but safer)
            const latestData = JSON.parse(await fs.readFile(cardsPath, 'utf8'));

            // Initialize target if missing
            const targetId = reaction.message.author.id;
            if (!latestData[targetId]) {
                latestData[targetId] = {
                    username: reaction.message.author.username,
                    provisional: 0,
                    confirmed: 0,
                    cardAllowance: monthlyCards,
                    monthReset: month
                };
            }

            // Update stats: +1 Confirmed for Target, -1 Provisional? 
            // Original code logic: "Increment confirmed, decrement provisional" (Wait, did we increment provisional earlier? No. The original code added provisional inside the .then chain)

            // Let's match original logic:
            // Original: "Increment the value of provisional cards" was done inside the Embed send block? 
            // Actually, in your original code, you incremented provisional ONLY when the admin message was sent. 
            // So we do that here:

            latestData[targetId].confirmed++;
            // Note: Your original code incremented provisional when the admin message was sent, 
            // then decremented it here. I will just increment confirmed here to keep it simple, 
            // unless you track "pending" cards elsewhere.

            await fs.writeFile(cardsPath, JSON.stringify(latestData, null, 2));

        } else {
            console.log('<RedCard> Rejected.');
            await adminMsg.delete();
            const tempMsg = await redCardChannel.send('Provisional card removed');
            setTimeout(() => tempMsg.delete().catch(() => { }), 3000);
        }
    } catch (e) {
        console.error(`<RedCard> Error awaiting approval: ${e.message}`);
    }
}

module.exports.redCardTrackerFunction = redCardTrackerFunction;