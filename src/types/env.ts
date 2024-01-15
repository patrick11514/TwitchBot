import { config } from 'dotenv'
import { z } from 'zod'
config()

const schema = z.object({
    MYSQL_HOST: z.string(),
    MYSQL_USERNAME: z.string(),
    MYSQL_PASSWORD: z.string(),
    MYSQL_DATABASE: z.string(),
    TWITCH_USERNAME: z.string(),
    TWITCH_PASSWORD: z.string(),
    APP_ID: z.string(),
    APP_SECRET: z.string(),
    SERVER_PORT: z.coerce.number(),
    SERVER_URL: z.string(),
})

export const env = schema.parse(process.env)
