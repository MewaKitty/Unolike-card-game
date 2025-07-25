import { random, weightedRandom } from "../utils.ts";
import type { Game } from "./game.ts";

import colorData from "../data/colors.json";
import numberData from "../data/numbers.json";
import symbolData from "../data/symbols.json";
//import modifierData from "../data/modifiers.json";
import { BaseCard } from "./base_cards.ts";

/**
 * A color that a card can be.
 */
export interface CardColor {
    name: string,
    color: string,
    text?: string,
    wild?: boolean,
    dark?: string,
    description?: string
}

/**
 * A number or symbol that a card can be.
 */
export interface CardNumber {
    name: string,
    value?: number,
    draw?: number,
    actionId?: string,
    color?: string,
    description?: string,
    unlisted?: boolean,
    abilityWild?: string
}

/**
 * A modifier, which is different from a symbol, that a card can be.
 */
export interface CardModifier {
    name: string,
    actionId?: string,
    draw?: number,
    unlisted?: boolean
}

/**
 * @classdesc A server card.
 */
export class Card extends BaseCard {
    color: CardColor;
    number: CardNumber;

    /**
     * Creates a server card.
     * @param game The game that contains this card.
     * @param tags Tags to apply to the card instance.
     */
    constructor(game: Game, tags?: string[]) {
        super(game);

        this.game = game;

        const isWild = Math.random() > 0.93;
        this.color = random(colorData.filter(color => isWild ? color.wild : !color.wild));
        const isSymbol = this.color.wild ? true : Math.random() > 0.9;
        this.number = isSymbol ? weightedRandom(symbolData.filter(symbol => symbol.wild === this.color.wild).filter(symbol => !symbol.unlisted)) : random(numberData.filter(number => !number.unlisted));
        if (this.number.color) this.color = colorData.find(color => color.name === this.number.color)!;
        this.tags = tags ?? [];
        this.modifier = null // ((this.number.description || this.number.abilityWild) && !this.number.draw) ? null : (Math.random() > 0.5 ? weightedRandom(modifierData.filter(modifier => this.number.value !== undefined && this.number.value !== null ? true : !modifier.modifies?.includes("number"))) : null)
        //if (this.number.value === 0 || this.number.value === 7) this.modifier = modifierData.find(modifier => modifier.actionId === "swap") ?? null;
        this.id = Math.random() + "";
    }
}
