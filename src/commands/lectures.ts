import { parseCommand } from '../lib/utils';
import { Event } from '../loader';
import { db } from '../types/connection';

export const events: Event<any>[] = [
    new Event('message', async (msg) => {
        const cmd = parseCommand(msg.message);

        if (!cmd) return;

        const { command, args } = cmd;

        switch (command.toLowerCase()) {
            case 'lectures': {
                const lectures = await db.selectFrom('lectures').selectAll().execute();
                let message = 'Zde jsou všechny lekce: ';
                let i = 1;
                for (const lecture of lectures) {
                    const line = `${lecture.id}. ${lecture.name} - ${lecture.link} , `;

                    if (message.length + line.length >= 500 - 100) {
                        msg.reply(message);
                        message = '';
                    }

                    message += line;
                    ++i;
                }

                msg.reply(message);

                break;
            }
            case 'addlecture': {
                if (!msg.user.isMod && !msg.user.isBroadcaster) return;

                if (args.length < 2) return msg.reply('Usage: !addLecture name string');

                const name = args.slice(0, args.length - 1).join(' ');
                const link = args[args.length - 1];

                const lastId = await db
                    .selectFrom('lectures')
                    .select('id')
                    .limit(1)
                    .orderBy('id', 'desc')
                    .executeTakeFirst();

                await db
                    .insertInto('lectures')
                    .values({
                        id: lastId ? lastId.id + 1 : 1,
                        name,
                        link,
                    })
                    .execute();

                msg.reply('Added new lecture');
                break;
            }
            case 'getlecture': {
                if (args.length < 1) return msg.reply('Usage: !getLecture id');

                const lecture = await db
                    .selectFrom('lectures')
                    .selectAll()
                    .where('id', '=', Number(args[0]))
                    .executeTakeFirst();

                if (!lecture) return msg.reply(`No lecture with id: ${args[0]} found`);

                msg.reply(`${lecture.id}. ${lecture.name} - ${lecture.link}`);
                break;
            }
        }
    }),
];
