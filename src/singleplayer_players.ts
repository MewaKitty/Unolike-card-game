import { Player } from "../src/shared/players.ts";
import type { Game } from "../src/shared/game.ts";
import { client } from "./client.ts";

export class SingleplayerPlayer extends Player {
    isOpponent: boolean;
    constructor (isOpponent: boolean, game: Game) {
        super(game);
        this.isOpponent = isOpponent;
    }
    async send (packet: any) {
        if (!this.isOpponent) client.receivePacket(packet);
    }
}