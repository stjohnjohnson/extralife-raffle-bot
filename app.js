import dotenv, { config } from 'dotenv';
import tmi from 'tmi.js';
import Raffle from './raffle.js';
import Entries from './entries.js';

// Load config from disk
dotenv.config();

// Validate we have all the required variables
const configErrors = [
    'TWITCH_CHANNEL',           // Channel to listen to
    'TWITCH_USERNAME',          // Username of the bot
    'TWITCH_OAUTH',             // Auth token for the bot - Use https://twitchapps.com/tmi/
    'EXTRALIFE_PARTICIPANT_ID', // ExtraLife Participant ID
    'RAFFLE_COST',              // $ Cost per entry
    'RAFFLE_STARTDATE',         // Date the raffle starts
    'RAFFLE_ENDDATE',           // Date the raffle ends
    'ADMIN_USERNAME',           // Username who can activate the draw
    'HISTORY_FILE_PATH',        // Path to the history file to store manually added donations
].map(key => {
    if (!process.env[key]) {
        return `${key} is a required environment variable`;
    }
}).join("\n").trim();
if (configErrors != '') {
    console.error(configErrors);
    process.exit(1);
}

const raffle = new Raffle(
    process.env.RAFFLE_STARTDATE,
    process.env.RAFFLE_ENDDATE,
);
const entries = new Entries(
    process.env.EXTRALIFE_PARTICIPANT_ID,
    process.env.RAFFLE_COST,
);

function getDrawingMessage() {
    let message = '';

    if (!raffle.hasStarted()) {
        message = `The NFT raffle drawings don't start until ${raffle.getStartDate()}.  You can still get entries in early by donating.  More info with !raffle.`;
    } else if (raffle.hasEnded()) {
        // TODO add fancy hearts
        message = `The NFT raffle is complete!  Thank you to everyone who donated.`;
    } else {
        let timeLeft = raffle.getTimeUntil();
        message = `The next NFT raffle is ${timeLeft} and there are ${entries.count} entries in the pool!  The NFT up is raffle.stj.watch/${raffle.active}.  More info with !raffle.`;
    }

    return message;
}

function getRaffleMessage() {
    let message = '';
    if (!raffle.hasStarted()) {
        message = `We're going to be raffling off NFTs every hour during the event!  Every $10 donation earns you one entry into the pool.  Add your ETH address to the donation message to enter.  Learn more at stj.watch/raffle.  Check status with !drawing.`
    } else if (raffle.hasEnded()) {
        message = `The NFT raffle is complete!  Thank you to everyone who donated.`;
    } else {
        message = `We're raffling off NFTs every hour!  Every $10 donation earns you one entry into the pool.  Add your ETH address to the donation message to enter.  Learn more at stj.watch/raffle.  Check status with !drawing.`;
    }
    return message;
}

function getDrawReminderMessage() {
    return `PopCorn PopCorn PopCorn 5 minutes left before we raffle off raffle.stj.watch/${raffle.active}.  Get your entries in now!  More info with !raffle.`
}

function getDrawTimeMessage() {
    return `PopCorn PopCorn PopCorn It's Raffle time!  Time to determine a winner of raffle.stj.watch/${raffle.active}, @${process.env.ADMIN_USERNAME}...`
}

function getDrawMessage() {
    if (raffle.getMinutesUntil() > 15) {
        return `Next drawing is ${raffle.getTimeUntil()}.`;
    }
    let winner = entries.pick();
    // Record internally
    console.log(`The winner for ${raffle.active} is ${winner.name} at address ${winner.address}`);

    // Increment to the next drawing
    raffle.active += 1;

    // Make short address '0x8f29...a031'
    let shortAddress = winner.address.substr(0, 6) + "..." + winner.address.substr(-4);
    return `And the winner is... MercyWing1 "${winner.name}" (${shortAddress}) MercyWing2!!!  Congratulations!!! OhMyDog OhMyDog OhMyDog`;
}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

(async () => {
    console.log('server starting');
    await entries.refreshDonations();
    const channels = [`${process.env.TWITCH_CHANNEL}`];

    // Load manually added entries
    entries.parseHistory(process.env.HISTORY_FILE_PATH);

    // Create the client
    const client = new tmi.Client({
        options: { debug: true, messagesLogLevel: 'info' },
        connection: {
            reconnect: true,
            secure: true
        },
        identity: {
            username: `${process.env.TWITCH_USERNAME}`,
            password: `${process.env.TWITCH_OAUTH}`
        },
        channels,
    });

    // Connect!
    client.connect().catch(console.error);

    // When the reminder happens, alert the channels
    raffle.on('reminder', () => {
        channels.forEach(channel => client.say(channel, getDrawReminderMessage()));
    });

    // When the raffle happens, alert the channels
    raffle.on('raffle', () => {
        channels.forEach(channel => client.say(channel, getDrawTimeMessage()));
    });

    // Listen for messages
    client.on('message', (channel, tags, message, self) => {
        // Ignore self
        if (self) return;

        switch (message.toLowerCase()) {
            case '!raffle':
            case '!enter':
                client.say(channel, getRaffleMessage());
                break;

            case '!draw':
                // Check is admin
                if (tags.username === process.env.ADMIN_USERNAME) {
                    client.say(channel, getDrawMessage());
                }
                break;

            case '!drawing':
                client.say(channel, getDrawingMessage());
                break;
        }
    });
})();
