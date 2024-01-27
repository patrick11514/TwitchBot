import { DeleteResult } from 'kysely'
import { client } from '..'
import { endpoints } from '../lib/TwitchEndpoint'
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
const toLoseVip = 7 * 24 * 60 * 60 * 1000

const checkVips = async () => {
    l.start('Updating VIPs')

    const allWritten = vipStorage.getAll()

    //check all vips, that don't have activity in the last 5 minutes
    let removed: string[] = []

    const allCurrentVips = await db.selectFrom('vips').selectAll().execute()

    if (allCurrentVips.length == 0) {
        l.stop('No VIPs to update')
        return
    }

    for (const vip of allCurrentVips.filter((vip) => !Object.keys(allWritten).includes(vip.id) && vip.activeVip == 1)) {
        if (Date.now() - vip.lastActivity.getTime() > toLoseVip) {
            const remove = await endpoints.vip.remove(vip.id)

            if (remove === true) {
                removed.push(vip.id)
                await db.updateTable('vips').set('activeVip', 0).where('id', '=', vip.id).execute()
                client.send(`@${vip.username} bylo ti odebráno VIP.`)
                continue
            }

            if (remove === undefined) {
                throw 'Unable to remove VIP, because of invalid token'
            }

            l.error('Unable to remove VIP: ' + JSON.stringify(remove))
        }
    }

    cachedVips = {}

    allCurrentVips.forEach((vip) => {
        cachedVips[vip.id] = vip
    })

    if (removed.length > 0) {
        l.log(`Removed vip of: ${removed.join(', ')}`)
    } else if (Object.keys(allWritten).length == 0) {
        l.stop('No VIPs to update')
        return
    }

    //check all vips, that have activity in the last 5 minutes
    for (const vip of allCurrentVips.filter((vip) => Object.keys(allWritten).includes(vip.id))) {
        const lastActivity = allWritten[vip.id]

        if (Date.now() - lastActivity > updateEvery) {
            await db.updateTable('vips').set('lastActivity', new Date(lastActivity)).where('id', '=', vip.id).execute()
            vipStorage.delete(vip.id)
        }
    }

    l.stop('VIPs updated')
}

checkVips()
setInterval(checkVips, updateEvery)

let addingVip: string[] = []

export const events: Event<any>[] = [
    new Event('message', async (msg) => {
        if (!msg.user.isBroadcaster && !msg.user.isMod) {
            return
        }

        //remove @username from the start of the message
        let parsed: ReturnType<typeof parseCommand>

        if (msg.isReplyMessage()) {
            const [_, ...messageParts] = msg.message.split(' ')
            parsed = parseCommand(messageParts.join(' '))
        } else {
            parsed = parseCommand(msg.message)
        }

        if (!parsed) return

        const { command, args } = parsed

        switch (command.toLowerCase()) {
            case 'vip': {
                if (!msg.isReplyMessage()) return

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
                        username: vipUser.username,
                        activeVip: 1,
                        lastActivity: new Date(),
                    })
                    .executeTakeFirst()

                if (insert.numInsertedOrUpdatedRows != 1n) {
                    msg.reply(`@${msg.user.username} nepodařilo se přidat VIP.`)
                    return
                }

                const response = await endpoints.vip.add(vipUser.id)

                if (response === true) {
                    msg.reply(`@${vipUser.username} je nyní VIP.`)
                    return
                }

                if (response === undefined) {
                    msg.client.send(`@PatrikMint nemáš platný token (:`)
                    return
                }

                msg.reply(`@${msg.user.username} nepodařilo se přidat VIP.`)
                l.log('Unable to add VIP: ' + JSON.stringify(response))
                break
            }
            case 'unvip': {
                if (args.length == 0) return

                const idOrUsername = args[0]

                const data = await db
                    .selectFrom('vips')
                    .select('username')
                    .where((eb) => eb.or([eb('username', '=', idOrUsername), eb('id', '=', idOrUsername)]))
                    .executeTakeFirst()

                if (!data) {
                    msg.reply(`@${msg.user.username} není VIP.`)
                    return
                }

                let del: DeleteResult

                if (idOrUsername == data.username) {
                    del = await db.deleteFrom('vips').where('username', '=', idOrUsername).executeTakeFirst()
                } else {
                    del = await db.deleteFrom('vips').where('id', '=', idOrUsername).executeTakeFirst()
                }

                if (del.numDeletedRows != 1n) {
                    msg.reply(`@${msg.user.username} nepodařilo se odebrat VIP.`)
                    return
                }

                const response = await endpoints.vip.remove(idOrUsername)

                if (response === true) {
                    msg.reply(`@${data.username} bylo odebráno VIP.`)
                    return
                }

                if (response === undefined) {
                    msg.client.send(`@PatrikMint nemáš platný token (:`)
                    return
                }

                msg.reply(`@${msg.user.username} nepodařilo se odebrat VIP.`)
                l.log('Unable to remove VIP: ' + JSON.stringify(response))

                break
            }
            case 'getid': {
                if (args.length == 0) return

                let username = args[0]
                if (username.startsWith('@')) username = username.slice(1)

                const data = await db
                    .selectFrom('vips')
                    .select('id')
                    .where('username', '=', username)
                    .executeTakeFirst()

                if (!data) {
                    msg.reply(`@${msg.user.username} není VIP.`)
                    return
                }

                msg.reply(`@${username} má id: ${data.id}`)

                break
            }

            case 'vips': {
                const users = await db.selectFrom('vips').selectAll().execute()

                if (users.length == 0) {
                    return msg.reply(`@${msg.user.username} nejsou žádná VIP.`)
                }

                const vipUsers = users.map((user) => user.username).join(', ')

                msg.reply(`@${msg.user.username}, zde jsou VIP: ${vipUsers}`)
            }
        }
    }),

    new Event('leave', async (data) => {
        if (!data.isUserFetched()) {
            await data.fetchUser()
        }

        if (!data.user) return

        vipStorage.add(data.user.id, Date.now())
    }),

    new Event('join', async (data) => {
        if (!data.isUserFetched()) {
            await data.fetchUser()
        }

        if (!data.user) return

        const userId = data.user.id

        if (userId in cachedVips && cachedVips[userId].activeVip == 0) {
            if (addingVip.includes(userId)) return

            //give vip
            try {
                addingVip.push(data.user.id)
                const response = await endpoints.vip.add(userId)

                if (response === true) {
                    data.client.send(`@${data.user.username} bylo ti navráceno VIP.`)
                    db.updateTable('vips').set('activeVip', 1).where('id', '=', userId).execute()
                    addingVip = addingVip.filter((id) => id != userId)
                    cachedVips[userId].activeVip = 1
                    return
                }

                if (response === undefined) {
                    data.client.send(`@PatrikMint nemáš platný token (:`)
                    addingVip = addingVip.filter((id) => id != userId)
                    return
                }

                data.client.send(`@${data.user.username} nepodařilo se ti vrátit VIP.`)
                data.client.l.error('Unable to add VIP: ' + JSON.stringify(response))
            } catch (e) {
                data.client.l.error('Unable to send message to chat: ' + e)
            }
            addingVip = addingVip.filter((id) => id != userId)
        }
    }),
]
