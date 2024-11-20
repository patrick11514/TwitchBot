import { TwitchClient } from './lib/TwitchClient/main';
import './loader';
import { exportedEvents } from './loader';

///http://www.twitchapps.com/tmi/

const twitch = 'patrikmint' as const;

export const client = new TwitchClient(twitch);

exportedEvents.forEach((events) => {
    events.forEach((event) => {
        const get = event.get();

        client.on(get.name, get.callback);
    });
});
