import { Game } from "../src/shared/game.ts";
import { client } from "./client.ts";
import { SingleplayerPlayer } from "./singleplayer_players.ts";

export class SingleplayerGame extends Game {
    declare players: SingleplayerPlayer[];
    constructor () {
        super();
    }
    async broadcast (packet: any) {
        client.receivePacket(packet);
    }
    async addPlayer (isOpponent: boolean) {
        const player = new SingleplayerPlayer(isOpponent, this);
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
    getPlayer (isOpponent: boolean) {
        return this.players.find(player => player.isOpponent === isOpponent);
    }
    removePlayer (isOpponent: boolean) {
        if (this.getPlayer(isOpponent)) {
            this.players.splice(this.players.findIndex(player => player.isOpponent === isOpponent), 1);
            return true;
        };
        return false;
    }
}

export const rooms = [];