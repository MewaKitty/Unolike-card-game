import type { BaseCard } from "./base_cards.ts";

export abstract class BaseGame {
    declare players: BasePlayer[];
    declare discarded: BaseCard[][];
    declare pickupCard: BaseCard | null;
    declare pickupQueue: BaseCard[];
    declare closedPile: number;
    declare lockedPiles: number[];
    checkLockApplication() {
        let misses = false;
        for (let i = 0; i < 4; i++) {
            if (!this.lockedPiles.includes(i) && this.closedPile !== i) misses = true;
        }
        return misses;
    }
}

export interface BasePlayer {
    recentCards: BaseCard[];
    cards: BaseCard[];
}