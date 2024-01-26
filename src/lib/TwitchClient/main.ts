import { ChatClient } from '@kararty/dank-twitch-irc'
import { env } from '../../types/env'
import { BotManager } from '../BotManager'
import { EventEmitter } from '../EventEmitter'
import Logger from '../logger'
import { Join } from './Events/Join'
import { Leave } from './Events/Leave'
import { ExpressServer } from './ExpressServer'
import { CheerMessage } from './Message/CheerMessage'
import { Message } from './Message/Message'
import { ReplyMessage } from './Message/ReplyMessage'

export type Events = {
    message: (message: Message) => void
    join: (join: Join) => void
    leave: (leave: Leave) => void
}

export const broadcasterId = '167983954'

export const server = new ExpressServer()

export const debugLogger = new Logger('Debug', 'magenta', true)

export class TwitchClient extends EventEmitter<Events> {
    client: ChatClient
    l = new Logger('TwitchClient', 'blue')
    private channel: string
    botManager: BotManager

    activeUsers: string[] = []

    constructor(channel: string) {
        super()

        this.botManager = new BotManager(this)

        this.client = new ChatClient({
            username: env.TWITCH_USERNAME,
            password: env.TWITCH_PASSWORD,
            connectionRateLimits: {
                parallelConnections: 10,
                releaseTime: 3000,
            },
            ignoreUnhandledPromiseRejections: true,
            requestMembershipCapability: true,
        })

        this.l.start('Connecting to Twitch IRC')

        this.client.on('connect', () => {
            this.l.stop('Connected to Twitch IRC')
        })

        this.initializeEvents()

        this.client.connect()
        this.client.join(channel)
        this.channel = channel
    }

    private initializeEvents() {
        this.messageEvent()
        this.joinEvent()
        this.leaveEvent()
    }

    private messageEvent() {
        this.client.on('PRIVMSG', (msg) => {
            let message: Message

            if (msg.isCheer()) {
                message = new CheerMessage(msg, this)
            } else if (msg.isReply()) {
                message = new ReplyMessage(msg, this)
            } else {
                message = new Message(msg, this)
            }

            if (env.TWITCH_DEBUG) {
                debugLogger.log(message)
            }

            this.emit('message', message)
        })
    }

    private joinEvent() {
        this.client.on('JOIN', (data) => {
            const join = new Join(data, this)

            if (env.TWITCH_DEBUG) {
                this.l
            }

            if (env.TWITCH_DEBUG) {
                debugLogger.log(join)
            }

            this.activeUsers.push(data.joinedUsername)

            this.emit('join', join)
        })
    }

    private leaveEvent() {
        this.client.on('PART', (data) => {
            const leave = new Leave(data, this)

            if (env.TWITCH_DEBUG) {
                debugLogger.log(leave)
            }

            this.activeUsers = this.activeUsers.filter((user) => user !== data.partedUsername)

            this.emit('leave', leave)
        })
    }

    reply(messageId: string, message: string) {
        this.client.reply(this.channel, messageId, message)
    }

    send(message: string) {
        this.client.say(this.channel, message)
    }
}
