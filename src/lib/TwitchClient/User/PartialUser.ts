import { TwitchClient } from '../main';

export class PartialUser {
    readonly id: string;
    readonly username: string;
    readonly displayName: string;
    readonly client: TwitchClient;
    readonly isBot: boolean;

    constructor(
        msg: {
            senderUserID: string;
            senderUsername: string;
            displayName: string;
        },
        client: TwitchClient,
    ) {
        this.id = msg.senderUserID;
        this.username = msg.senderUsername;
        this.displayName = msg.displayName;
        this.client = client;

        client.botManager.isBot(this.id) ? (this.isBot = true) : (this.isBot = false);
    }

    isPartialUser(): this is PartialUser {
        return true;
    }
}
