import { ChatClient } from '@kararty/dank-twitch-irc'
import { env } from '../../types/env'
import { EventEmitter } from '../EventEmitter'
import Logger from '../logger'
import { ExpressServer } from './ExpressServer'
import { CheerMessage } from './Message/CheerMessage'
import { Message } from './Message/Message'
import { ReplyMessage } from './Message/ReplyMessage'

export type Events = {
    message: (message: Message) => void
}

export const userId = '1018399577'
export const broadcasterId = '167983954'

export const server = new ExpressServer()

export class TwitchClient extends EventEmitter<Events> {
    client: ChatClient
    l = new Logger('TwitchClient', 'blue')
    private channel: string

    constructor(channel: string) {
        super()

        this.client = new ChatClient({
            username: env.TWITCH_USERNAME,
            password: env.TWITCH_PASSWORD,
            connectionRateLimits: {
                parallelConnections: 10,
                releaseTime: 3000,
            },
            ignoreUnhandledPromiseRejections: true,
        })

        this.l.start('Connecting to Twitch IRC')

        this.client.on('connect', () => {
            this.l.stop('Connected to Twitch IRC')
        })

        this.client.on('PRIVMSG', (msg) => {
            let message: Message

            if (msg.isCheer()) {
                message = new CheerMessage(msg, this)
            } else if (msg.isReply()) {
                message = new ReplyMessage(msg, this)
            } else {
                message = new Message(msg, this)
            }

            this.emit('message', message)
        })

        this.client.connect()
        this.client.join(channel)
        this.channel = channel
    }

    reply(messageId: string, message: string) {
        this.client.reply(this.channel, messageId, message)
    }

    send(message: string) {
        this.client.say(this.channel, message)
    }
}
