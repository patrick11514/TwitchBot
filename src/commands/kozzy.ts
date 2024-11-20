import { Event } from '../loader';

const messages = [
    '„Iniciace protokolu: Kozzy.exe spuštěn! Připravte se na božský debugging reality!“ 💻⚡',
    '„Skript spuštěn: Kozzy vstoupil do systému! Klaňte se jeho nekonečné proměnné majestátnosti!“ 🖥️🔥',
    '„404: Váš bůh nenalezen? Omyl! Kozzy je tady, aby přepsal pravidla existence!“ 📟⚔️',
    '„Kompilace vesmíru dokončena: Kozzy vládne nad všemi smrtelnými procesy streamu!“ 🖲️👑',
    '„Heslo přijato. Kozzy se přihlásil do vašeho světa! Připravte se na kód božství!“ 🔐🌌',
];

const NAME = 'kozzyczech';

let lastSeenKozzy: number | undefined = undefined;

export const events: Event<any>[] = [
    new Event('join', async (user) => {
        if (user.channel !== NAME) return;
        user.client.send(messages[Math.floor(Math.random() * messages.length)]);
        lastSeenKozzy = Date.now();
    }),
    new Event('message', async (msg) => {
        if (msg.user.username != NAME) return;
        if (lastSeenKozzy !== undefined) return;

        msg.reply(messages[Math.floor(Math.random() * messages.length)]);
        lastSeenKozzy = Date.now();
    }),
    new Event('leave', async (user) => {
        if (user.channel !== NAME) return;

        lastSeenKozzy = undefined;
    }),
];
