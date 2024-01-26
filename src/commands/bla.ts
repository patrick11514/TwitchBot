import { Event } from '../loader'

export const events: Event<any>[] = [
    new Event('message', async (msg) => {
        if (msg.message.toLocaleLowerCase().includes('bla') && !msg.user.isBot) {
            msg.reply('bla')
        }
    }),
]
