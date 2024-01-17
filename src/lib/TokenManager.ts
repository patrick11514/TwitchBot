//Bude spravovat token v token.json + memory a bude se starat o refresh, get (přesun z ExpressServer.ts) atd..

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { z } from 'zod'
import { env } from '../types/env'
import Logger from './logger'

type Token = {
    code: string
    scope: string
}

const grantToken = z.object({
    access_token: z.string(),
    expires_in: z.number(),
    refresh_token: z.string(),
    scope: z.array(z.string()),
    token_type: z.string(),
})

type GrantToken = z.infer<typeof grantToken>

const tokenValidation = z.object({
    client_id: z.string(),
    login: z.string(),
    scopes: z.array(z.string()),
    user_id: z.string(),
    expires_in: z.number(),
})

const errorResponse = z.object({
    status: z.number(),
    message: z.string(),
})

export class TokenManager {
    public status: 'expired' | 'valid' | 'not set' = 'not set'
    private token: GrantToken | null = null
    private l = new Logger('TokenManager', 'yellow')

    constructor() {
        if (existsSync('token.json')) {
            this.l.start('Loading token...')
            const data = readFileSync('token.json', 'utf-8')
            try {
                const json = JSON.parse(data)

                const properties = ['access_token', 'expires_in', 'refresh_token', 'scope', 'token_type'] as const

                for (const property of properties) {
                    if (!(property in json)) {
                        this.status = 'not set'
                        return
                    }
                }

                this.token = json as GrantToken

                //check if token is valid
                this.validateToken(json.access_token).then((valid) => {
                    if (!valid) {
                        this.token = null
                        this.l.stopError('Token is invalid')
                    } else {
                        this.l.stop('Token loaded')
                        this.checkToken()
                    }
                })
            } catch (_) {}
        }
        setInterval(
            () => {
                this.checkToken()
            },
            10 * 60 * 1000,
        )
    }

    async fetchToken(data: Token) {
        const request = await fetch('https://id.twitch.tv/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `client_id=${env.APP_ID}&client_secret=${env.APP_SECRET}&code=${data.code}&grant_type=authorization_code&redirect_uri=${env.SERVER_URL}callback`,
        })

        try {
            const json = await request.json()

            const tokenData = grantToken.safeParse(json)

            if (!tokenData.success) {
                const error = errorResponse.safeParse(json)

                if (!error.success) {
                    this.l.error(`Unable to parse token response: ${JSON.stringify(json)}`)
                    return
                }

                this.l.error(`Error while fetching token: ${error.data.message}`)
                return
            }

            this.status = 'valid'
            this.token = tokenData.data

            writeFileSync('token.json', JSON.stringify(tokenData.data))
        } catch (e) {
            this.l.error(`Unable to parse token response: ${e}`)
        }
    }

    private async checkToken() {
        if (this.token === null) return
        this.l.start("Checking token's validity...")

        if (this.token.expires_in < Date.now() + 30 * 60 * 1000) {
            this.l.start('Refreshing token...')
            if (await this.refreshToken()) {
                this.l.stop('Token refreshed')
            } else {
                this.l.stopError('Token refresh failed')
            }

            return
        }

        this.l.stop('Token is valid')
        this.status = 'valid'
    }

    private async refreshToken() {
        const request = await fetch('https://id.twitch.tv/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `client_id=${env.APP_ID}&client_secret=${env.APP_SECRET}&grant_type=refresh_token&refresh_token=${this.token?.refresh_token}`,
        })

        try {
            const json = await request.json()

            const tokenData = grantToken.safeParse(json)

            if (!tokenData.success) {
                const error = errorResponse.safeParse(json)

                if (!error.success) {
                    this.l.error(`Unable to parse token response: ${JSON.stringify(json)}`)
                    return false
                }

                this.l.error(`Error while fetching token: ${error.data.message}`)
                return false
            }

            this.token = tokenData.data
            writeFileSync('token.json', JSON.stringify(tokenData.data))
        } catch (e) {
            this.l.error(`Unable to parse token response: ${e}`)
            return false
        }
    }

    private async validateToken(token: string) {
        if (this.token) {
            const request = await fetch('https://id.twitch.tv/oauth2/validate', {
                headers: {
                    Authorization: `OAuth ${token}`,
                },
            })
            try {
                const json = await request.json()

                const tokenData = tokenValidation.safeParse(json)

                if (!tokenData.success) {
                    const error = errorResponse.safeParse(json)

                    if (!error.success) {
                        this.l.error(`Unable to parse token validation response: ${JSON.stringify(json)}`)
                        return false
                    }

                    this.l.error(`Error while validating token: ${error.data.message}`)
                    return false
                }

                const { client_id, scopes, expires_in } = tokenData.data

                if (client_id !== env.APP_ID) {
                    this.l.error(`Invalid client id: ${client_id}`)
                    return
                }

                this.token.scope = scopes
                this.token.expires_in = Date.now() + expires_in * 1000
                return true
            } catch (e) {
                this.l.error(`Unable to parse token validation response: ${e}`)
                return false
            }
        }

        return false
    }

    getToken() {
        if (this.token === null) return null
        return this.token.access_token
    }
}
