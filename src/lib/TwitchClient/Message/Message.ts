import { PrivmsgMessage, TwitchEmoteList } from '@kararty/dank-twitch-irc';
import { User } from '../User/User';
import { TwitchClient } from '../main';
import { CheerMessage } from './CheerMessage';
import { PartialMessage } from './PartialMessage';
import { ReplyMessage } from './ReplyMessage';

export class Message extends PartialMessage {
    readonly user: User;
    readonly emotes: TwitchEmoteList;
    readonly bits: number | undefined;
    readonly replyMessageId: string | undefined;

    constructor(msg: PrivmsgMessage, client: TwitchClient) {
        super(msg, client);
        this.user = new User(msg, client);
        this.emotes = msg.emotes;
    }

    isBitMessage(): this is CheerMessage {
        return this.bits !== undefined;
    }

    isReplyMessage(): this is ReplyMessage {
        return this.replyMessageId !== undefined;
    }

    reply(message: string) {
        this.client.reply(this.id, message);
    }

    isPartialMessage(): this is PartialMessage {
        return false;
    }
}
