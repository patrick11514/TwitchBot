import express, { type Express } from 'express';
import { env } from '../../types/env';
import { TokenManager } from '../TokenManager';
import Logger from '../logger';

const scopes = ['channel:manage:vips', 'moderator:manage:banned_users'] as const;

type Token = {
    code: string;
    scope: string;
};

export class ExpressServer {
    private app: Express;
    private l = new Logger('Express', 'green');
    private tokenManager = new TokenManager();

    constructor() {
        this.l.start('Starting server...');
        this.app = express();

        this.app.get('/', (_, res) => {
            if (this.tokenManager.status == 'valid') {
                res.send('Token is valid');
                return;
            }
            res.redirect(
                `https://id.twitch.tv/oauth2/authorize?client_id=${env.APP_ID}&redirect_uri=${env.SERVER_URL}callback&scope=${encodeURIComponent(scopes.join(' '))}&response_type=code`,
            );
        });

        this.app.get('/callback', (req, res) => {
            const query = req.query;

            if (!('code' in query) || !('scope' in query)) return res.send('Invalid query parameters');

            this.tokenManager.fetchToken(query as Token);

            res.send('Ok');
        });

        this.app.listen(env.SERVER_PORT, () => {
            this.l.stop(`Server started on port ${env.SERVER_PORT}`);
        });
    }

    getToken() {
        return this.tokenManager.getToken();
    }

    getUserId() {
        return this.tokenManager.user_id;
    }
}
