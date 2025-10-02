import { Card } from "./cards.ts";
import { Player } from "./players.ts";

import { randomInteger } from "../utils.ts";
import { BaseGame } from "./base_game.ts";

import { wait } from "../utils.ts";

/**
 * @classdesc An internal singleplayer or an external multiplayer game instance.
 */
export abstract class Game extends BaseGame {
    players: Player[];
    discarded: Card[][];
    pickupCard: Card;
    pickupQueue: Card[];
    closedPile: number;
    drawAmount: number;
    lockedPiles: number[];

    currentTurn: number;

    /**
     * Creates a server game instance.
     */
    constructor () {
        super();
        
        this.players = [];
        this.discarded = [
            [new Card(this, ["discarded"])],
            [new Card(this, ["discarded"])],
            [new Card(this, ["discarded"])],
            [new Card(this, ["discarded"])]
        ];
        this.pickupCard = new Card(this, ["pickup"]);
        this.pickupQueue = [];
        for (let i = 0; i < 4; i++) {
            this.pickupQueue.push(new Card(this));
        }
        this.closedPile = randomInteger(0, 3);
        this.drawAmount = 0;
        this.lockedPiles = [];

        this.currentTurn = 0;
    }

    /**
     * Broadcasts a packet to all players.
     * @param packet The packet to broadcast.
     */
    abstract broadcast (packet: any): void

    /**
     * Adds a player to the game.
     * @param identifier Differs depending on the kind of server.
     * @returns The added player.
     */
    abstract addPlayer (identifier: any): Promise<Player>

    /**
     * Retrieves a player from the game.
     * @param identifier Differs depending on the kind of server.
     */
    abstract getPlayer (identifier: any): Player | void

    /**
     * Removes a player from the game.
     * @param identifier Differs depending on the kind of server.
     */
    abstract removePlayer (identifier: any): void

    /**
     * Broadcasts an update of the discard piles to the clients.
     */
    updateDiscarded () {
        this.broadcast({
            type: "discardPiles",
            discarded: this.discarded.map(discard => discard.map(card => card.data(false))),
            pickupCard: this.pickupCard.data(false),
            pickupQueue: this.pickupQueue.map(card => card.data(false)),
            closedPile: this.closedPile
        })
    }

    /**
     * Handles a packet from a client.
     * @param player The player who created the packet.
     * @param packet The contents of the packet itself.
     */
    async receivePacket (player: Player, packet: any) {
        console.log(packet);
        switch (packet.type) {
            case "discard":
                const card = player.cards.find(card => card.id === packet.card);
                console.log("card: ", card)
                if (!card) break;
                const selectedCards = packet.cards.length === 0 ? [card] : (packet.cards as string[]).map((card: string) => player.cards.find(secondCard => card === secondCard.id)).filter(card => card) as Card[];
                if (!this.playableTwins(selectedCards, player, card)?.includes(packet.pile)) return;
                console.log("packet", packet)
                for (const card of selectedCards) {
                    if (!card) continue;
                    this.discarded[packet.pile]!.push(card);
                    for (const secondCard of player.cards) {
                        if (secondCard.id === packet.card) player.cards.splice(player.cards.indexOf(secondCard), 1);
                    }
                    this.broadcast({
                        type: "discard",
                        card: card.data(false),
                        pile: packet.pile,
                        player: player.id
                    })
                    if (card.number.draw) this.drawAmount += card.number.draw;
                    this.broadcast({
                        type: "drawAmount",
                        value: this.drawAmount
                    })
                    await wait(550);
                }
                this.currentTurn++;
                if (this.currentTurn >= this.players.length) this.currentTurn = 0;
                this.broadcast({
                    type: "turn",
                    value: this.currentTurn
                })
                break;
            case "pickup":
                if (this.pickupCard.id !== packet.card) return;
                console.log(this.pickupCard)
                player.addCard(this.pickupCard, packet.animate);
                let animateTime = 550;
                for (let i = 0; i < this.drawAmount - 1; i++) {
                    if (packet.animate) await wait(animateTime);
                    player.addCard(this.pickupCard, true, animateTime / 1.1);
                    if (!packet.animate) await wait(animateTime);
                    animateTime /= 1.1;
                }
                this.drawAmount = 0;
                this.broadcast({
                    type: "drawAmount",
                    value: this.drawAmount
                })
                this.currentTurn++;
                if (this.currentTurn >= this.players.length) this.currentTurn = 0;
                await wait(500);
                this.broadcast({
                    type: "turn",
                    value: this.currentTurn
                })
        }
    }
}

export const rooms = [];