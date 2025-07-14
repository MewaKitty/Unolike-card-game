import type { ServerWebSocket } from "bun";
import { Player } from "../src/shared/players.ts";
import { Card } from "../src/shared/cards.ts";
import type { Game } from "../src/shared/game.ts";

export class ServerPlayer extends Player {
    ws: ServerWebSocket<unknown>;

    constructor (ws: ServerWebSocket<unknown>, game: Game) {
        super(game);
        
        this.ws = ws;
    }
    async send (packet: any) {
        await this.ws.send(JSON.stringify(packet));
    }
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