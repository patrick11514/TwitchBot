import { client } from '..'
import Logger from '../lib/logger'
import { Event } from '../loader'

const l = new Logger('Welcommer', 'yellow')

const words = ['Vítej', 'Zdravím tě']

export const events: Event<any>[] = [
    new Event('join', async (data) => {
        if (!data.isUserFetched()) {
            await data.fetchUser()
        }

        if (!data.user) return
        if (data.user.isBot) return

        l.log('Welcomming: ' + data.user.displayName)

        const word = words[Math.floor(Math.random() * words.length)]

        client.send(word + ' na streamu: ' + data.user.displayName)
    }),
]
