import { parseCommand } from '../lib/utils';
import { Event } from '../loader';

export const events: Event<any>[] = [
    new Event('message', async (msg) => {
        if (!msg.user.isVip && !msg.user.isMod && !msg.user.isBroadcaster) return;

        const parsed = parseCommand(msg.message);

        if (!parsed) return;

        let count = 1;

        const { command, args } = parsed;

        if (command.toLocaleLowerCase() != 'randomuser') return;

        if (args.length > 0) {
            const first = args[0];
            const parsed = parseInt(first);

            if (parsed && parsed > 0) {
                count = parsed;
            }
        }

        console.log(msg.client.activeUsers);

        const nonBotUsers = msg.client.activeUsers.filter((user) => !user.isBot);

        console.log(nonBotUsers);

        if (nonBotUsers.length == 0) {
            msg.reply(`@${msg.user.username} Nemám žádné aktivní uživatele`);
            return;
        }

        if (count > nonBotUsers.length) {
            count = nonBotUsers.length;
        }

        const selectedUsers: string[] = [];

        for (let i = 0; i < count; i++) {
            const random = Math.floor(Math.random() * nonBotUsers.length);

            const user = nonBotUsers[random];

            if (selectedUsers.includes(user.username)) {
                i--;
                continue;
            }

            selectedUsers.push(user.username);
        }

        msg.reply(`@${msg.user.username} Vylosoval jsem tyto lidi: ${selectedUsers.join(', ')}`);
    }),
];
