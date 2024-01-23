import { parseCommand } from '../lib/utils'
import { Event } from '../loader'

export const events: Event<any>[] = [
    new Event('message', async (msg) => {
        if (!msg.user.isVip && !msg.user.isMod && !msg.user.isBroadcaster) return

        const parsed = parseCommand(msg.message)

        if (!parsed) return

        let count = 1

        const { command, args } = parsed

        if (command.toLocaleLowerCase() != 'randomuser') return

        if (args.length > 0) {
            const first = args[0]
            const parsed = parseInt(first)

            if (parsed && parsed > 0) {
                count = parsed
            }
        }

        if (count > msg.client.activeUsers.length) {
            count = msg.client.activeUsers.length
        }

        const selectedUsers: string[] = []

        for (let i = 0; i < count; i++) {
            const random = Math.floor(Math.random() * msg.client.activeUsers.length)

            const user = msg.client.activeUsers[random]

            if (selectedUsers.includes(user)) {
                i--
                continue
            }

            selectedUsers.push(user)
        }

        msg.reply(`@${msg.user.username} Vylosoval jsem tyto lidi: ${selectedUsers.join(', ')}`)
    }),
]
