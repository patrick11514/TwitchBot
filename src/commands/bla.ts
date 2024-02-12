import { Event } from '../loader'

export const events: Event<any>[] = [
    new Event('message', async (msg) => {
        const message = msg.message.toLocaleLowerCase()

        let includes = false

        if (message == 'bla') {
            includes = true
        }

        if (message.includes('bla')) {
            if (message.endsWith(' bla') || message.startsWith('bla ') || message.includes(' bla ')) {
                includes = true
            }
        }

        if (includes && !msg.user.isBot) {
            msg.reply('bla')
        }
    }),
]
