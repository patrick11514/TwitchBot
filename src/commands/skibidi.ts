import { server } from '../lib/TwitchClient/main';
import { endpoints } from '../lib/TwitchEndpoint';
import { Event } from '../loader';

const isSkibidi = (text: string) => {
    //match skibidi with any number of i or y on any position
    const regex = /sk(i*|y*)b(i*|y*)d(i*|y*)/i;
    return regex.test(text);
};

export const events: Event<any>[] = [
    new Event('message', async (msg) => {
        if (isSkibidi(msg.message)) {
            const num = Math.floor(Math.random() * 100);

            if (num % 3 == 0) {
                await msg.remove();
                return;
            }
            if (num < 50 && num % 2 == 0) {
                await endpoints.chat.ban(server.getUserId(), msg.user.id, 5, 'Skibidi TOALETA');
                return;
            }
        }
    }),
];
