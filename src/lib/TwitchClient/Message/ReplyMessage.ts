import { PrivmsgMessage } from '@kararty/dank-twitch-irc';
import { PartialUser } from '../User/PartialUser';
import { TwitchClient } from '../main';
import { Message } from './Message';
import { PartialMessage } from './PartialMessage';

export class ReplyMessage extends Message {
    readonly replyMessageId: string;
    readonly replyMessage: PartialMessage;

    constructor(msg: PrivmsgMessage, client: TwitchClient) {
        super(msg, client);

        const properties = [
            'replyParentUserID',
            'replyParentMessageBody',
            'replyParentDisplayName',
            'replyParentUserLogin',
        ];

        for (const property of properties) {
            if (!msg.hasOwnProperty(property)) throw new Error('Message is not a reply message');
        }

        if (!msg.replyParentUserID) throw new Error('Message is not a reply message');

        this.replyMessageId = msg.replyParentUserID;

        const partialUser = new PartialUser(
            {
                displayName: msg.replyParentDisplayName as string,
                senderUserID: msg.replyParentUserID as string,
                senderUsername: msg.replyParentUserLogin as string,
            },
            client,
        );

        this.replyMessage = new PartialMessage(
            {
                messageID: msg.replyParentUserID as string,
                messageText: msg.replyParentMessageBody as string,
            },
            client,
            partialUser,
        );
    }
}
