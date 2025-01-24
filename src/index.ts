import { TwitchClient } from './lib/TwitchClient/main';
import './loader';
import { exportedEvents } from './loader';

///http://www.twitchapps.com/tmi/

const twitch = 'patrikmint' as const;

const start = Date.now();
let joined = false;

export const client = new TwitchClient(twitch);

exportedEvents.forEach((events) => {
    events.forEach((event) => {
        const get = event.get();

        client.on(get.name, get.callback);
    });
});

client.on('join', (join) => {
    if (join.channel !== twitch) return;
    if (joined) return;
    joined = true;

    const end = Date.now();
    client.send(`Hello ${twitch}! (${end - start}ms)`);
});
