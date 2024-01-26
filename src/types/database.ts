import type { ColumnType } from "kysely";

export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;

export interface Bots {
  id: number;
  username: string;
}

export interface Vips {
  activeVip: Generated<number>;
  id: string;
  lastActivity: Generated<Date>;
  username: string;
}

export interface DB {
  bots: Bots;
  vips: Vips;
}
