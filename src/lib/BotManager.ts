import { db } from '../types/connection'
import { Bots } from '../types/database'
import { TwitchClient } from './TwitchClient/main'
import { TwitchUserDetailSchema, endpoints } from './TwitchEndpoint'
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

    isBot(idOrUsername: string) {
        if (this.bots.find((bot) => bot.username === idOrUsername.toLocaleLowerCase() || bot.id === idOrUsername))
            return true

        return false
    }

    includes(username: string) {
        return Boolean(this.bots.find((bot) => bot.username === username.toLowerCase()))
    }

    async add(username: string) {
        const data = await endpoints.getChannelInfo(username)

        if (data === undefined) {
            this.l.error(`Failed to fetch username: ${username}, because of invalid token`)
            return false
        }

        if (data === true) {
            return false
        }

        if (!('data' in data)) {
            this.l.error(`Failed to fetch username: ${username}, ${JSON.stringify(data)}`)
            return false
        }

        const parsed = TwitchUserDetailSchema.safeParse(data.data)

        if (!parsed.success) {
            this.l.error(parsed.error)
            return false
        }

        if (parsed.data.length === 0) {
            this.l.error(`Failed to fetch username: ${username}, because of invalid username`)
            return false
        }

        const inserted = await db
            .insertInto('bots')
            .values({
                id: parsed.data[0].id,
                username: parsed.data[0].login,
            })
            .executeTakeFirst()

        if (inserted.numInsertedOrUpdatedRows == 0n) {
            this.l.error(`Failed to add bot ${username} to database`)
            return false
        }

        this.bots.push({
            id: parsed.data[0].id,
            username: parsed.data[0].login,
        })

        return true
    }

    async remove(username: string) {
        const removed = await db.deleteFrom('bots').where('username', '=', username).executeTakeFirst()

        if (removed.numDeletedRows == 0n) {
            this.l.error(`Failed to remove bot ${username} from database`)
            return false
        }

        this.bots = this.bots.filter((bot) => bot.username !== username)

        return true
    }
}
