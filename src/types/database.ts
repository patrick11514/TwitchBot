import type { ColumnType } from 'kysely';

export type Generated<T> =
    T extends ColumnType<infer S, infer I, infer U> ? ColumnType<S, I | undefined, U> : ColumnType<T, T | undefined, T>;

export interface BannedPromotions {
    id: Generated<number>;
    text: string;
}

export interface Bots {
    id: string;
    username: string;
}

export interface Lectures {
    id: Generated<number>;
    link: string;
    name: string;
}

export interface Vips {
    activeVip: Generated<number>;
    id: string;
    lastActivity: Generated<Date>;
    username: string;
}

export interface DB {
    banned_promotions: BannedPromotions;
    bots: Bots;
    lectures: Lectures;
    vips: Vips;
}
