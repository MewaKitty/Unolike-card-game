import { Card } from "./cards.ts";
import type { Game } from "./game.ts";
import type { BasePlayer } from "./base_game.ts";

export abstract class Player implements BasePlayer {
    id: string;
    game: Game;

    recentCards: Card[];
    cards: Card[];
    constructor (game: Game) {
        this.id = Math.random() + "";
        this.game = game;

        this.recentCards = [];
        this.cards = [];

        for (let i = 0; i < 7; i++) this.cards.push(new Card(this.game));
    }
    data (hideCards: boolean) {
        return {
            ability: null,
            health: 48,
            lives: 2,
            recentCards: this.recentCards.map(card => card.data(hideCards)),
            cards: this.cards.map(card => card.data(hideCards)),
            doublesCardAvailable: true,
            isChoosingDrawRemoval: false,
            drawRemovalCards: [],
            id: this.id
        }
    }
    abstract send (packet: any): void
    async addCard (card: Card, animate: boolean) {
        if (this.cards.includes(card)) this.cards.splice(this.cards.indexOf(card), 1)
        this.cards.push(card);
        if (card.tags.includes("pickup")) {
            card.tags.splice(card.tags.indexOf("pickup"), 1);
            this.game.pickupCard = this.game.pickupQueue.shift()!;
            this.game.pickupCard.tags.push("pickup");
            this.game.pickupQueue.push(new Card(this.game, true));
            for (const player of this.game.players) {
                await player.send({
                    type: "pickup",
                    card: card.data(player === this),
                    pickupQueuePush: this.game.pickupQueue.at(-1)!.data(player !== this),
                    player: this.id,
                    animate
                })
            }
            return;
        }
        for (const player of this.game.players) {
            await player.send({
                type: "pickup",
                card: card.data(player !== this),
                pickupQueuePush: null,
                player: this.id,
                animate
            })
        }
    }
}