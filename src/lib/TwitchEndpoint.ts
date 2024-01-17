import { env } from '../types/env'
import { broadcasterId, server } from './TwitchClient/main'

const twitchEndpoint = async <T extends true | false>(
    endpoint: string,
    data: object,
    okCode: number,
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'POST',
    returnData: T,
): Promise<
    T extends false
        ?
              | undefined
              | true
              | {
                    status: number
                    statusText: string
                    message: string
                }
        :
              | undefined
              | true
              | {
                    data: unknown
                }
              | {
                    status: number
                    statusText: string
                    message: string
                }
> => {
    const token = server.getToken()

    if (!token) return undefined

    const options: RequestInit = {
        method,
        headers: {
            'Client-Id': env.APP_ID,
            Authorization: 'Bearer ' + token,
            'Content-Type': 'application/json',
        },
    }

    if (method != 'GET') {
        options.body = JSON.stringify(data)
    }

    const request = await fetch(endpoint, options)

    const text = await request.text()

    if (text == '' && request.status == okCode) return true

    try {
        const json = JSON.parse(text)

        if (request.status == okCode && returnData === true) return json

        return {
            status: request.status,
            statusText: request.statusText,
            message: json.message,
        }
    } catch (_) {
        return undefined
    }
}

type EndpointList = { [key: string]: EndpointList | Function }

export const endpoints = {
    vip: {
        add: async (userId: string) => {
            return twitchEndpoint(
                'https://api.twitch.tv/helix/channels/vips',
                {
                    broadcaster_id: broadcasterId,
                    user_id: userId,
                },
                204,
                'POST',
                false,
            )
        },
        remove: async (userId: string) => {
            return twitchEndpoint(
                'https://api.twitch.tv/helix/channels/vips',
                {
                    broadcaster_id: broadcasterId,
                    user_id: userId,
                },
                204,
                'DELETE',
                false,
            )
        },
    },
    getChannelInfo: async (userName: string) => {
        return twitchEndpoint(`https://api.twitch.tv/helix/users?login=${userName}`, {}, 200, 'GET', true)
    },
} satisfies EndpointList
