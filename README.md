# extralife-raffle-bot
Simple Twitch Bot to raffle off things for Extra Life stream

## Configuration

Set the following environment variables:

- `EXTRALIFE_PARTICIPANT_ID`: Your ExtraLife/DonorDrive ID
- `RAFFLE_COST`: Raffle Cost per Entry
- `RAFFLE_STARTDATE`: When the raffle starts
- `RAFFLE_ENDDATE`: When the raffle ends
- `ADMIN_USERNAME`: Username who can activate the drawing
- `TWITCH_USERNAME`: Your Bot's Username
- `TWITCH_OAUTH`: The code from https://twitchapps.com/tmi/
- `TWITCH_CHANNEL`: The Twitch channel to sit in

## Features

- 5 minute warning
- Alert on raffle time
- Admins can make the draw (`!draw`)
- Learn More (`!raffle`)
- Check when the drawing is (`!drawing`)