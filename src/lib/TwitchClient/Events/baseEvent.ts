import { TwitchUserDetailSchema, endpoints } from '../../TwitchEndpoint';
import Logger from '../../logger';
import { PartialUser } from '../User/PartialUser';
import { TwitchClient } from '../main';

export class BaseEvent {
    user: PartialUser | undefined;
    private username: string;
    private l: Logger;
    readonly client: TwitchClient;

    constructor(username: string, client: TwitchClient, eventName: string) {
        this.username = username;
        this.client = client;
        this.l = new Logger(eventName, 'cyan');
    }

    public isUserFetched() {
        return this.user !== undefined;
    }

    async fetchUser() {
        if (this.isUserFetched()) return true;

        const endpoint = await endpoints.getChannelInfo(this.username);

        if (endpoint === undefined) {
            this.l.error(`Failed to fetch username: ${this.username}, because of invalid token`);
            return false;
        }

        if (endpoint === true) {
            return false;
        }

        if (!('data' in endpoint)) {
            this.l.error(`Failed to fetch username: ${this.username}, ${JSON.stringify(endpoint)}`);
            return false;
        }

        const parsed = TwitchUserDetailSchema.safeParse(endpoint.data);

        if (!parsed.success) {
            this.l.error(parsed.error);
            return false;
        }

        const [user] = parsed.data;

        this.user = new PartialUser(
            {
                displayName: user.display_name,
                senderUserID: user.id,
                senderUsername: user.login,
            },
            this.client,
        );

        return true;
    }
}
