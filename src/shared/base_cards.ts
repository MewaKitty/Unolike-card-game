import type { BaseGame } from "./base_game.ts";
import type { CardNumber, CardColor, CardModifier } from "./cards.ts";

export abstract class BaseCard {
    game: BaseGame;
    declare number: CardNumber | null
    declare color: CardColor | null
    declare hidden: boolean
    declare tags: string[]
    declare modifier: CardModifier | null
    declare id: string;
    constructor(game: BaseGame) {
        this.game = game;
    }
    data(hideCards: boolean) {
        return {
            number: hideCards ? null : this.number,
            color: hideCards ? null : this.color,
            hidden: hideCards ? true : this.hidden,
            tags: this.tags,
            modifier: this.modifier,
            id: this.id
        }
    }
    playableOn(card: BaseCard) {
        if (card.number === this.number) return true;
        if (card.color === this.color) return true;
        if (this.color?.wild) return true;
        if (card.color?.wild) return true;
        if (card.number?.actionId === "purpleBlank") return true;
        return false;
    }
    playablePiles(): number[] {
        let availablePiles = [];
        for (let i = 0; i < 4; i++) {
            if (i === this.game.closedPile) continue;
            if (this.playableOn(this.game.discarded[i]!.at(-1)!)) availablePiles.push(i);
        }
        return availablePiles;
    }
}
