import fs from 'node:fs'
import path from 'node:path'
import { Events } from './lib/TwitchClient/main'

export class Event<T extends keyof Events> {
    constructor(
        private eventName: T,
        private callback: Events[T],
    ) {}

    get() {
        return {
            name: this.eventName,
            callback: this.callback,
        }
    }
}

export const exportedEvents = fs
    .readdirSync(path.join(__dirname, 'commands'))
    .filter((file) => file.endsWith('.ts') || file.endsWith('.js'))
    .map((file) => {
        const exp = require(path.join(__dirname, 'commands', file)) as unknown

        if (!exp) {
            throw new Error(`File ${file} does not export anything`)
        }

        if (typeof exp !== 'object') {
            throw new Error(`File ${file} does not export object`)
        }

        if (!('events' in exp)) {
            throw new Error(`File ${file} does not export events`)
        }

        if (!Array.isArray(exp.events)) {
            throw new Error(`File ${file} does not export events as array`)
        }

        if (!exp.events.every((event) => event instanceof Event)) {
            throw new Error(`File ${file} does not export events as array of Event`)
        }

        return exp.events as Event<any>[]
    })
