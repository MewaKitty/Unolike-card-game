import type { BaseCard } from "./base_cards.ts";
import numberData from "../data/numbers.json";

/**
 * @classdesc The client game or an internal or external server.
 */
export abstract class BaseGame {
    /** The players in the game. */
    declare players: BasePlayer[];
    /** The discard piles. */
    declare discarded: BaseCard[][];
    /** The top pickup card. */
    declare pickupCard: BaseCard | null;
    /** The cards below the top pickup card. */
    declare pickupQueue: BaseCard[];
    /** The discard pile that is marked as closed via the closed discard pile mechanic. */
    declare closedPile: number;
    /** The discard piles marked as locked via the locking mechanic. */
    declare lockedPiles: number[];
    /** The current draw amount gathered from draw cards. */
    declare drawAmount: number;
    /** Whether the minipile mechanic is active. */
    declare isMinipileActive: boolean;
    /** The discard pile of the minipile mechanic. */
    declare minipile: BaseCard[];

    /**
     * Checks if the locking mechanic of the game is active.
     * @returns Whether or not the locking mechanic is applied.
     */
    checkLockApplication() {
        let misses = false;
        for (let i = 0; i < 4; i++) {
            if (!this.lockedPiles.includes(i) && this.closedPile !== i) misses = true;
        }
        return misses;
    }

    /**
     * Checks which piles the specified cards can be played on.
     * @param selectedCards The cards to check.
     * @param player The player who is placing the cards.
     * @param draggedCard The card that was last dragged, which will be considered as the top card.
     * @returns The discard pile indexes.
     */
    playableTwins(selectedCards: BaseCard[], player: BasePlayer, draggedCard?: BaseCard | null) {
        if (selectedCards.length === 1) return selectedCards[0].playablePiles();
        if (selectedCards.length === 0) return draggedCard?.playablePiles();
        /*if (game.minipile.length > 0 && game.minipileAction === "war") return [];
        if (game.minipile.length > 0 && game.minipileAction === "war+2") return [];*/
        
        const piles = [];
        if (selectedCards.length === 2 && !isNaN(+selectedCards[0].number?.value!) && !isNaN(+selectedCards[1].number?.value!)) {
            for (let index = -1; index < this.discarded.length; index++) {
                if (this.isMinipileActive && index >= 0) continue;
                if (!this.isMinipileActive && index === -1) continue;
                const discard = index === -1 ? this.minipile : this.discarded[index];
                if (this.closedPile === index) continue;
                if (this.lockedPiles.includes(index)) {
                    if ((selectedCards[0].modifier?.actionId !== "lock" && selectedCards[0].modifier?.actionId !== "disarm") || (selectedCards[1].modifier?.actionId !== "lock" && selectedCards[0].modifier?.actionId !== "disarm")) continue;
                }
                if (discard.at(-1)?.number?.value === selectedCards[0].number?.value! + selectedCards[1].number?.value!) piles.push(index)
                if (selectedCards[0].number?.actionId === "#" && numberData.map(number => number.value).includes(discard.at(-1)?.number?.value! - selectedCards[1].number?.value!)) piles.push(index);
                if (selectedCards[1].number?.actionId === "#" && numberData.map(number => number.value).includes(discard.at(-1)?.number?.value! - selectedCards[0].number?.value!)) piles.push(index);
            }
        }
        if (selectedCards.length === 2 && player.getCardCount() >= 3) {
            let match = [];
            for (let index = -1; index < this.discarded.length; index++) {
                if (this.isMinipileActive && index >= 0) continue;
                if (!this.isMinipileActive && index === -1) continue;
                if (this.lockedPiles.includes(index)) {
                    if (selectedCards[0].modifier?.actionId !== "lock" && selectedCards[0].modifier?.actionId !== "disarm") continue;
                }
                const discard = index === -1 ? this.minipile : this.discarded[index];
                if (discard.at(-1)?.number === selectedCards[0].number && discard.at(-1)?.color === selectedCards[0].color) match.push(index);
            }
            if (match.length > 0) piles.push(...match);
        }
        if (selectedCards[0].number === selectedCards[1].number) {
            if (selectedCards.length === 2) {
                piles.push(...selectedCards.map(card => card.playablePiles()).flat());
            } else {
                piles.push(...selectedCards.filter(card => card !== draggedCard).map(card => card.playablePiles()).flat())
            }
        }
        if (selectedCards.length > 0) {
            const sorted = selectedCards.sort((a, b) => a.number?.value! - b.number?.value!);
            console.log(sorted);
            let last = null;
            let isValid = true;
            for (const card of sorted) {
                if (last === null) {
                    last = card;
                    continue;
                }
                if (card.number?.value !== last.number?.value! + 1 && last.number?.actionId !== "#") isValid = false;
                last = card;
            }
            console.log("isValid: " + isValid)
            if (isValid) piles.push(...sorted[0].playablePiles())
        }
        // Handle discard 2 of color
        if (selectedCards[0]?.number?.actionId === "discard2Color") {
            if (selectedCards[1]?.color === selectedCards[0].color) {
                return selectedCards[0].playablePiles();
            }
        }

        return piles;
    }
}

export interface BasePlayer {
    recentCards: BaseCard[];
    cards: BaseCard[];
    getCardCount: () => number
}