import type { BaseGame } from "./base_game.ts";
import type { CardNumber, CardColor, CardModifier } from "./cards.ts";

/**
 * @classdesc A client or server card.
 */
export abstract class BaseCard {
    game: BaseGame;
    declare number: CardNumber | null
    declare color: CardColor | null
    declare hidden: boolean
    declare tags: string[]
    declare modifier: CardModifier | null
    declare id: string;

    /**
     * Creates a generic client or server card.
     * @param game The client or server that holds this card.
     */
    constructor(game: BaseGame) {
        this.game = game;
    }

    /**
     * Converts the card to a serializable object.
     * @param hideCards Include the contents of the card visibly
     * @returns A serializable object representing the card.
     */
    data(hideCards: boolean) {
        return {
            number: hideCards ? null : this.number,
            color: hideCards ? null : this.color,
            hidden: hideCards ? true : false,
            tags: this.tags,
            modifier: this.modifier,
            id: this.id
        }
    }

    /**
     * Checks if the card can be placed on a specified card.
     * @param card The card to try placing on.
     * @returns Whether or not the card can be placed.
     */
    playableOn(card: BaseCard) {
        if (card.number === this.number) return true;
        if (card.color === this.color) return true;
        if (this.color?.wild) return true;
        if (card.color?.wild) return true;
        if (card.number?.actionId === "purpleBlank") return true;
        return false;
    }

    /**
     * Checks which discard piles can the card be placed on.
     * @returns The discard pile indexes.
     */
    playablePiles(): number[] {
        if (this.game.drawAmount > 0 && !this.number?.draw) return [];
        let availablePiles = [];
        for (let i = 0; i < 4; i++) {
            if (i === this.game.closedPile) continue;
            if (this.playableOn(this.game.discarded[i]!.at(-1)!)) availablePiles.push(i);
        }
        return availablePiles;
    }
}
