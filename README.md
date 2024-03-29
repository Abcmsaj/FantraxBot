# FantraxBot

## About

This is a project that I have wanted to do for a very long time. We have a Discord group with over 10 of my friends in, who all play fantasy football on Fantrax. I have wanted to add some tracking features to the group for a while, but no third-party bots that I could find will allow me to do it.

Then I found my Raspberry Pi and decided to re-purpose it as an always-on Discord bot!

## Features

The bot can do the following:

- Create and store reactions which can be called upon by any user, and the bot will respond
    - Creation of the reactions can be done by any admin with the `/react` command
    - Reactions can have other arguments passed in, such as:
        - "used anywhere" if the reaction can be triggered anywhere in a message
        - "case sensitive" if the reaction only triggers with correct casing
- Tracking of the 🟥 emoji reaction on anybody's posts, which then posts a citation to a #red-card channel, for approval by an admin
    - Nominated red cards and confirmed red cards are both tracked, with punishments at the end of the season for the person with the most red cards for foul play
    - A red card can be given a mean comment or unsavoury response
    - Only myself and a red card approver can mark the red card as "official" using the reaction emotes at the bottom of the post
    - Declining a red card will still leave it on a person's record but as a "nominated" red card instead of an official one. Only "official" red cards count
    - Accepting a red card will put a 🟥 emoji at the bottom of the post in the #red-card channel to show it's confirmed to users
    - Each user gets 5 cards to give out a month - a check is done whenever a red card is given to see if the allocation needs to be updated

![https://imgur.com/wAEht5h.jpg](https://imgur.com/wAEht5h.jpg)

- Tracking of a "Slow Sports News" emoji reaction, which can be placed on any post which might be deemed repeat information or slow news
- `/cards` can be called by individual users to see how many cards they have

![https://imgur.com/B7WUllS.jpg](https://imgur.com/B7WUllS.jpg)

- `/totalcards` can be called to see a table of all cards given

![https://imgur.com/jehVDHe.jpg](https://imgur.com/jehVDHe.jpg)

- `/ssn` can be called to see a table of all SSN reactions given

![https://imgur.com/HnEPfZZ.jpg](https://imgur.com/HnEPfZZ.jpg)

- `/ssnGiver` can be called to see a table of the people who give the SSN reactions

![https://imgur.com/D2ilMvR.jpg](https://imgur.com/D2ilMvR.jpg)

- `/mute` can be used with a user, duration in seconds, and a reason (optional) to timeout a user
    - Syntax is `/mute @user <duration> <reason>`
- `/8ball` can be sent and a random reply generated for the user (yes/no/maybe)
- `/scores` will take a screenshot from the Fantrax standings page for our league, after scrolling to the bottom for this gameweek, and post it in the channel the command was requested from
- `/meme` will pick a random image from a JSON file of images added with `/addmeme`, and post it to the chat
- `/prune` will allow the user to prune the last 1-99 messages
    - Syntax is `/prune <number from 1-99>`
- `/poll` will produce an embedded poll post that allows users to choose a reaction. These could be yes/no Qs or multiple choice.
    - Syntax is `/poll <Poll question>`
    - or  `/poll <Poll question> <option 1 + option 2 + option 3 + etc> (up to 26)` for multi-choice
    
![https://imgur.com/EVoSkJa.jpg](https://imgur.com/EVoSkJa.jpg)

- `/send` allows administrators to send messages as the Bot. Bot reads whatever the content of the message is, and redistributes it to the specified channel
    - Syntax is `/send <channel name> <message - can include links, @mentions, Discord formatting>`
- `/skim` allows users to take screenshots of various webpages and pass in arguments. These website include Google, Google Images, Google "I'm Feeling Lucky", Wikipedia, or the user can pass "screenshot" an a URL argument to just take a screenshot of a webpage.
    - Syntax is `/skim <website (google, google-images, wikipedia, screenshot)> <search term/URL>`
- `/reload` can be used while the bot is running to reload any command file that might have been altered
    - Run `/reload <command name>` to trigger without needing to restart the bot
- Commands can be dynamically added - just add JavaScript files to the commands folder and module.exports them to index.js - no extra code required!
