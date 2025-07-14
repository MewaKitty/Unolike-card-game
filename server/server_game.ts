import type { ServerWebSocket } from "bun";
import { Player } from "../src/shared/players.ts";
import { Game } from "../src/shared/game.ts";
import { ServerPlayer } from "./server_players.ts";

export class ServerGame extends Game {
    declare players: ServerPlayer[];
    constructor () {
        super();
    }
    async broadcast (packet: any) {
        for (const player of this.players) {
            await player.ws.send(packet);
        }
    }
    async addPlayer (ws: ServerWebSocket<unknown>) {
        const player = new ServerPlayer(ws, this);
        this.players.push(player);
        this.updateDiscarded();
        for (const player of this.players) {
            await player.send({
                type: "players",
                players: this.players.map(secondPlayer => secondPlayer.data(player !== secondPlayer)),
                selfId: player.id
            })
        };
    }
    getPlayer (ws: ServerWebSocket<unknown>) {
        return this.players.find(player => player.ws === ws);
    }
    removePlayer (ws: ServerWebSocket<unknown>) {
        if (this.getPlayer(ws)) {
            this.players.splice(this.players.findIndex(player => player.ws === ws), 1);
            return true;
        };
        return false;
    }
}

export const rooms = [];