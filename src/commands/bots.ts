import { parseCommand } from '../lib/utils';
import { Event } from '../loader';

export const events: Event<any>[] = [
    new Event('message', async (msg) => {
        if (!msg.user.isVip && !msg.user.isMod && !msg.user.isBroadcaster) return;

        const parsed = parseCommand(msg.message);

        if (!parsed) return;

        const { command, args } = parsed;

        const manager = msg.client.botManager;

        switch (command.toLowerCase()) {
            case 'addbot': {
                if (args.length == 0) {
                    return msg.reply(`@${msg.user.username} Musíš zadat jméno bota!`);
                }

                let botName = args[0];

                if (botName.startsWith('@')) {
                    botName = botName.slice(1);
                }

                if (manager.includes(botName)) {
                    return msg.reply(`@${msg.user.username} Bot s tímto jménem již existuje!`);
                }

                const result = await manager.add(botName);

                if (!result) {
                    return msg.reply(`@${msg.user.username} Bot s tímto jménem neexistuje!`);
                }

                return msg.reply(`@${msg.user.username} Bot byl úspěšně přidán!`);
            }

            case 'removebot': {
                if (args.length == 0) {
                    return msg.reply(`@${msg.user.username} Musíš zadat jméno bota!`);
                }

                let botName = args[0];

                if (botName.startsWith('@')) {
                    botName = botName.slice(1);
                }

                if (!manager.includes(botName)) {
                    return msg.reply(`@${msg.user.username} Bot s tímto jménem neexistuje!`);
                }

                const result = await manager.remove(botName);

                if (!result) {
                    return msg.reply(`@${msg.user.username} Bot s tímto jménem neexistuje!`);
                }

                return msg.reply(`@${msg.user.username} Bot byl úspěšně odebrán!`);
            }
        }
    }),
];
