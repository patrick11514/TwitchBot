import { env } from '../types/env'
import { broadcasterId, server } from './TwitchClient/main'

const twitchEndpoint = async (
    endpoint: string,
    data: object,
    okCode: number,
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'POST',
): Promise<
    | undefined
    | true
    | {
          status: number
          statusText: string
          message: string
      }
> => {
    const token = server.getToken()

    if (!token) return undefined

    const request = await fetch(endpoint, {
        method,
        headers: {
            'Client-Id': env.APP_ID,
            Authorization: 'Bearer ' + token,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })

    const text = await request.text()

    if (text == '' && request.status == okCode) return true

    try {
        const json = JSON.parse(text)

        if (request.status == okCode) return json

        return {
            status: request.status,
            statusText: request.statusText,
            message: json.message,
        }
    } catch (_) {
        return undefined
    }
}

type EndpointList = { [key: string]: EndpointList } | Record<string, Function>

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
            )
        },
    },
} satisfies EndpointList
