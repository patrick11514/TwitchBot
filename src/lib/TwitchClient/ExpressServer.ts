import express, { type Express } from 'express'
import { writeFileSync } from 'fs'
import { env } from '../../types/env'
import Logger from '../logger'

const scopes = ['channel:manage:vips'] as const

type Token = {
    code: string
    scope: string
}

type GrantToken = {
    access_token: string
    expires_in: number
    refresh_token: string
    scope: string[]
    token_type: string
}

export class ExpressServer {
    private app: Express
    private l = new Logger('Express', 'green')

    constructor() {
        this.l.start('Starting server...')
        this.app = express()

        this.app.get('/', (_, res) => {
            res.redirect(
                `https://id.twitch.tv/oauth2/authorize?client_id=${env.APP_ID}&redirect_uri=${env.SERVER_URL}callback&scope=${scopes.join(',')}&response_type=code`,
            )
        })

        this.app.get('/callback', (req, res) => {
            const query = req.query

            if (!('code' in query) || !('scope' in query)) return res.send('Invalid query parameters')

            this.handleToken(req.query as Token)

            res.send('Ok')
        })

        this.app.listen(env.SERVER_PORT, () => {
            this.l.stop(`Server started on port ${env.SERVER_PORT}`)
        })
    }

    private async handleToken(data: Token) {
        const request = await fetch('https://id.twitch.tv/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `client_id=${env.APP_ID}&client_secret=${env.APP_SECRET}&code=${data.code}&grant_type=authorization_code&redirect_uri=${env.SERVER_URL}callback`,
        })

        const json = await request.json()

        if (!('access_token' in json)) {
            throw new Error('Invalid token')
        }

        const tokenData = {
            access_token: json.access_token,
            expires_in: Date.now() + json.expires_in * 1000,
            refresh_token: json.refresh_token,
            scope: json.scope,
            token_type: json.token_type,
        } satisfies GrantToken

        writeFileSync('token.json', JSON.stringify(tokenData))
    }
}
