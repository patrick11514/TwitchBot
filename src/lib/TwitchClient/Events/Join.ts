import { JoinMessage } from '@kararty/dank-twitch-irc';
import { z } from 'zod';
import { TwitchClient } from '../main';
import { BaseEvent } from './baseEvent';

const schema = z.array(
    z.object({
        id: z.string(),
        login: z.string(),
        display_name: z.string(),
        type: z.string(),
        broadcaster_type: z.string(),
        description: z.string(),
        profile_image_url: z.string(),
        offline_image_url: z.string(),
        view_count: z.number(),
        email: z.string().optional(),
        created_at: z.string(),
    }),
);

export class Join extends BaseEvent {
    readonly channel: string;

    constructor(message: JoinMessage, client: TwitchClient) {
        super(message.joinedUsername, client, 'JoinEvent');

        this.channel = message.channelName;
    }
}
