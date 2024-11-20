import { PrivmsgMessage } from '@kararty/dank-twitch-irc';
import { TwitchClient } from '../main';
import { Message } from './Message';

export class CheerMessage extends Message {
    readonly bits: number;

    constructor(msg: PrivmsgMessage, client: TwitchClient) {
        super(msg, client);

        if (!msg.bits) throw new Error('Message is not a cheer message');

        this.bits = msg.bits;
    }
}
