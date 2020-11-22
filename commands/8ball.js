module.exports = {
    name: '8ball',
    description: 'Randomly responds with a reply',
    execute(message, args) {

        var replies = [
            `yes`,
            `it is certain`,
            `it is decidedly so`,
            `without a doubt`,
            `yes definitely`,
            `you may rely on it`,
            `as I see it, yes`,
            `most likely`,
            `outlook good`,
            `signs point to yes`,
            `reply hazy, try again`,
            `ask again later`,
            `better not tell you now`,
            `cannot predict now`,
            `concentrate and ask again`,
            `don't count on it`,
            `my reply is no`,
            `probably`,
            `probs mate`,
            `my sources say no`,
            `outlook not so good`,
            `very doubtful`,
            `without a doubt. Nah, I'm just messing with you, go fuck yourself.`,
            `my sources say no. They also tell me they hate you.`,
            `all signs point to yes. But on second thought, go fuck yourself.`,
            `as if`,
            `idk`,
            `flip a coin`,
            `TOGGA!!!`,
            `dumb question, ask another`,
            `forget about it`,
            `in your dreams`,
            `no, you silly cunt`,
            `conguito`,
            `not a chance`,
            `obviously`,
            `oh, please`,
            `sure`,
            `that's ridiculous`,
            `well, maybe`,
            `what do you think?`,
            `yes... you prick`,
            `who cares?`,
            `yeah and I'm the fucking Pope`,
            `yeah, right`,
            `you wish`,
            `you've got to be kidding me...`,
            `that's about as likely as Alex finding true happiness`,
            `that's about as likely as Freeman getting his trophy`
        ]

        var randomNumber = Math.floor(Math.random() * replies.length)
        var randomReply = replies[randomNumber]

        console.log(`8ball triggered. ` + randomNumber + ` chosen. '` + randomReply + `' sent.`)
        message.reply(randomReply)
    }
}
