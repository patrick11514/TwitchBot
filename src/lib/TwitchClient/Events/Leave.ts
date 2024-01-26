import { PartMessage } from '@kararty/dank-twitch-irc'
import { TwitchClient } from '../main'
import { BaseEvent } from './baseEvent'

export class Leave extends BaseEvent {
    readonly channel: string

    constructor(message: PartMessage, client: TwitchClient) {
        super(message.partedUsername, client, 'LeageEvent')
        this.channel = message.channelName
    }
}
