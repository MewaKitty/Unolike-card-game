import type { ServerWebSocket } from "bun";
import { Player } from "../src/shared/players.ts";
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
}