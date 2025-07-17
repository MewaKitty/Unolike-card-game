import { Card } from "./cards.ts";
import { Player } from "./players.ts";

import { randomInteger } from "../utils.ts";
import { BaseGame } from "./base_game.ts";

export abstract class Game extends BaseGame {
    players: Player[];
    discarded: Card[][];
    pickupCard: Card;
    pickupQueue: Card[];
    closedPile: number;
    constructor () {
        super();
        
        this.players = [];
        this.discarded = [
            [new Card(this, false, ["discarded"])],
            [new Card(this, false, ["discarded"])],
            [new Card(this, false, ["discarded"])],
            [new Card(this, false, ["discarded"])]
        ];
        this.pickupCard = new Card(this, true, ["pickup"]);
        this.pickupQueue = [];
        for (let i = 0; i < 4; i++) {
            this.pickupQueue.push(new Card(this, true));
        }
        this.closedPile = randomInteger(0, 3);
    }
    abstract broadcast (packet: any): void
    abstract addPlayer (identifier: any): void
    abstract getPlayer (identifier: any): Player | void
    abstract removePlayer (identifier: any): void
    updateDiscarded () {
        this.broadcast({
            type: "discardPiles",
            discarded: this.discarded.map(discard => discard.map(card => card.data(false))),
            pickupCard: this.pickupCard.data(false),
            pickupQueue: this.pickupQueue.map(card => card.data(false)),
            closedPile: this.closedPile
        })
    }
    async receivePacket (player: Player, packet: any) {
        console.log(packet);
        switch (packet.type) {
            case "discard":
                const card = player.cards.find(card => card.id === packet.card);
                console.log("card: " + card)
                if (!card) break;
                if (!card.playablePiles().includes(packet.pile)) return;
                this.discarded[packet.pile]!.push(card);
                for (const secondCard of player.cards) {
                    if (secondCard.id === packet.card) player.cards.splice(player.cards.indexOf(secondCard), 1);
                }
                this.broadcast({
                    type: "discard",
                    card: card.data(false),
                    pile: packet.pile
                })
                break;
            case "pickup":
                if (this.pickupCard.id !== packet.card) return;
                player.addCard(this.pickupCard, packet.animate);
        }
    }
}

export const rooms = [];