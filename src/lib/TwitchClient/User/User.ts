import { Color, PrivmsgMessage } from '@kararty/dank-twitch-irc'
import { TwitchClient } from '../main'
import { PartialUser } from './PartialUser'

class Tags {
    tags: Record<string, string | null>

    constructor(tags: Record<string, string | null>) {
        this.tags = tags
    }

    get(key: string): string | null {
        return this.tags[key]
    }

    includes(key: string): boolean {
        return this.tags.hasOwnProperty(key)
    }
}

type Badge = {
    name: string
    version: string
}

export class User extends PartialUser {
    readonly isMod: boolean
    readonly isBroadcaster: boolean
    readonly isSubscriber: boolean
    readonly isTurbo: boolean
    readonly isVip: boolean
    readonly color: Color | undefined
    readonly colorRaw: string
    readonly badges: Badge[]
    readonly badgeList: string[]

    constructor(msg: PrivmsgMessage, client: TwitchClient) {
        super(msg, client)

        const tags = new Tags(msg.ircTags)
        this.badges = msg.badgesRaw.split(',').map((rawBadge) => {
            const [name, version] = rawBadge.split('/')
            return { name, version }
        })
        this.badgeList = this.badges.map((badge) => badge.name)
        this.isMod = msg.isMod
        this.color = msg.color
        this.colorRaw = msg.colorRaw
        this.isBroadcaster = this.badgeList.includes('broadcaster')
        this.isSubscriber = tags.includes('subscriber') && tags.get('subscriber') == '1'
        this.isVip = tags.includes('vip') && tags.get('vip') == '1'
        this.isTurbo = tags.includes('turbo') && tags.get('turbo') == '1'
    }

    isPartialUser(): this is PartialUser {
        return false
    }
}
