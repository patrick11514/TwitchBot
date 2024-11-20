import { PartialUser } from '../User/PartialUser';
import { TwitchClient } from '../main';

export class PartialMessage {
    readonly id: string;
    readonly user: PartialUser;
    readonly message: string;
    readonly client: TwitchClient;

    constructor(
        msg: {
            messageID: string;
            messageText: string;
        },
        client: TwitchClient,
        user?: PartialUser,
    ) {
        this.id = msg.messageID;
        /*
         * We are creating PartialUser only inside PartialMessage, so zser is always
         * defined and we can safely use it, but when inherit from PartialMessage
         * we don't have Partialuser, so we put undefined into super, but we define
         * a regilar User instead
         */
        this.user = user as PartialUser;
        this.message = msg.messageText;
        this.client = client;
    }

    isPartialMessage(): this is PartialMessage {
        return true;
    }
}
