import clean from 'js-string-cleaner'
import { server } from '../lib/TwitchClient/main'
import { endpoints } from '../lib/TwitchEndpoint'
import { parseCommand } from '../lib/utils'
import { Event } from '../loader'
import { db } from '../types/connection'

const checkMessage = async (msg: string) => {
    const cleaned = clean(msg)
    const lower = cleaned.toLocaleLowerCase()

    const blocked = (await db.selectFrom('banned_promotions').select('text').execute()).map((x) => x.text)

    for (const text of blocked) {
        if (lower.includes(text.toLocaleLowerCase())) {
            return true
        }
    }
    return false
}

export const events: Event<any>[] = [
    new Event('message', async (msg) => {
        if (msg.user.isBot) return

        if (!(msg.user.isMod || msg.user.isBroadcaster)) {
            if (msg.user.isVip) return

            if (await checkMessage(msg.message)) {
                await endpoints.chat.ban(server.getUserId(), msg.user.id, undefined, 'Promotion detected')
                console.log(`Banned ${msg.user.username} for promotion`)
            }

            return
        }

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
            case 'addterm': {
                if (!args) return

                const text = args.join(' ')

                const data = await db
                    .selectFrom('banned_promotions')
                    .select('text')
                    .where('text', '=', text)
                    .executeTakeFirst()

                if (data) {
                    msg.reply('Term already exists.')
                    return
                }

                await db.insertInto('banned_promotions').values({ text }).execute()

                msg.reply('Term was added.')

                break
            }

            case 'removeterm': {
                if (!args) return

                const text = args.join(' ')

                const data = await db
                    .selectFrom('banned_promotions')
                    .select('text')
                    .where('text', '=', text)
                    .executeTakeFirst()

                if (!data) {
                    msg.reply('Term does not exist.')
                    return
                }

                await db.deleteFrom('banned_promotions').where('text', '=', text).execute()

                msg.reply('Term was removed.')

                break
            }
            case 'clean':
                if (!msg.isReplyMessage()) return

                msg.reply(`Here is cleaned message: ${clean(msg.replyMessage.message)}`)
                break
            case 'bannable':
                if (!msg.isReplyMessage()) return

                if (await checkMessage(msg.replyMessage.message)) {
                    msg.reply('Ye it will be banned')
                    return
                }

                msg.reply('No it will not be banned')

                break
        }
    }),
]
