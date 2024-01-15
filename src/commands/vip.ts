import Logger from '../lib/logger'
import { MemoryStorage } from '../lib/memStorage'
import { parseCommand } from '../lib/utils'
import { Event } from '../loader'
import { db } from '../types/connection'

const vipStorage = new MemoryStorage<string, number>()

const l = new Logger('VIP', 'yellow')

let cachedVips: Record<
    string,
    {
        lastActivity: Date
        activeVip: number
    }
> = {}

const updateEvery = 5 * 60 * 1000
const toLoseVip = 5 * 60 * 1000

const checkVips = async () => {
    l.start('Updating VIPs')

    const allWritten = vipStorage.getAll()

    if (Object.keys(allWritten).length == 0) {
        l.stop('No VIPs to update')
        return
    }

    const allCurrentVips = await db.selectFrom('vips').selectAll().execute()

    if (allCurrentVips.length == 0) {
        l.stop('No VIPs to update')
        return
    }

    cachedVips = {}

    allCurrentVips.forEach((vip) => {
        cachedVips[vip.id] = vip
    })

    //check all vips, that don't have activity in the last 5 minutes
    for (const vip of allCurrentVips.filter((vip) => !Object.keys(allWritten).includes(vip.id) && vip.activeVip == 1)) {
        if (Date.now() - vip.lastActivity.getTime() < toLoseVip) {
            await db.updateTable('vips').set('activeVip', 0).where('id', '=', vip.id).execute()
            //remove vip command
        }
    }

    //check all vips, that have activity in the last 5 minutes
    for (const vip of allCurrentVips.filter((vip) => Object.keys(allWritten).includes(vip.id))) {
        const lastActivity = allWritten[vip.id]

        if (Date.now() - lastActivity > updateEvery) {
            await db.updateTable('vips').set('lastActivity', new Date(lastActivity)).where('id', '=', vip.id).execute()
        }
    }
}

setInterval(checkVips, updateEvery)

export const events: Event<any>[] = [
    new Event('message', async (msg) => {
        if (!msg.user.isBroadcaster) {
            return
        }

        if (!msg.isReplyMessage()) return

        //remove @username from the start of the message
        const [_, ...messageParts] = msg.message.split(' ')

        const parsed = parseCommand(messageParts.join(' '))

        if (!parsed) return

        const { command } = parsed

        if (command !== 'vip') return

        const vipUser = msg.replyMessage.user

        const data = await db.selectFrom('vips').select('id').where('id', '=', vipUser.id).executeTakeFirst()

        if (data) {
            msg.reply(`@${msg.user.username} je již VIP.`)
            return
        }

        const insert = await db
            .insertInto('vips')
            .values({
                id: vipUser.id,
                activeVip: 1,
                lastActivity: new Date(),
            })
            .executeTakeFirst()

        if (insert.numInsertedOrUpdatedRows != 1n) {
            msg.reply(`@${msg.user.username} nepodařilo se přidat VIP.`)
            return
        }

        msg.reply(`@${vipUser.username} je nyní VIP.`)
    }),

    new Event('message', (msg) => {
        const userId = msg.user.id

        console.log(userId)

        vipStorage.add(userId, Date.now())

        if (userId in cachedVips && cachedVips[userId].activeVip == 0) {
            db.updateTable('vips').set('activeVip', 1).where('id', '=', userId).execute()
            //give vip
        }
    }),
]
