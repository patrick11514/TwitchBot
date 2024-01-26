import { db } from '../types/connection'
import { Bots } from '../types/database'
import { TwitchClient } from './TwitchClient/main'
import Logger from './logger'

export class BotManager {
    bots: Bots[] = []
    private client: TwitchClient
    private l = new Logger('BotManager', 'magenta')

    constructor(client: TwitchClient) {
        this.client = client

        this.l.start('Initializing BotManager..')

        this.init()
    }

    private async init() {
        const data = await db.selectFrom('bots').selectAll().execute()

        this.bots = data
    }

    isBot(idOrUsername: string | number) {
        if (typeof idOrUsername === 'number') {
            if (this.bots.find((bot) => bot.id === idOrUsername)) return true
        } else {
            if (this.bots.find((bot) => bot.username === idOrUsername)) return true
        }
        return false
    }
}
