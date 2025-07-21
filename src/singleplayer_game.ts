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
        if (packet.type === "turn" && packet.value === 1) {
            console.log("opponentTurn")
            let moves = [];
            for (const card of this.getPlayer(true)!.cards) {
                moves.push(this.getPlayer(true)!.cards.filter(secondCard => secondCard.number.name === card.number.name));
                if (card.number.value === null || card.number.value === undefined) {
                    moves.push([card]);
                    continue;
                } else {
                    const moveCombo = [card];
                    let lastNumber = card.number.value;
                    while (1) {
                        const secondCard = this.getPlayer(true)!.cards.find(secondCard => secondCard.number.value === lastNumber + 1);
                        if (secondCard) {
                            moveCombo.push(secondCard);
                            lastNumber = secondCard.number.value!;
                            continue;
                        }
                        break;
                    }
                    moves.push(moveCombo)
                }
            }
            const chosenMove = moves.filter(move => move[0].playablePiles().length > 0).sort((a, b) => b.length - a.length)[0];
            if (!chosenMove) {
                this.receivePacket(this.getPlayer(true)!, {
                    type: "pickup",
                    card: this.pickupCard.id,
                    animate: true
                })
                return;
            }
            console.log("chosenMove", chosenMove)
            this.receivePacket(this.getPlayer(true)!, {
                type: "discard",
                card: chosenMove[0].id,
                cards: chosenMove.map(card => card.id),
                pile: chosenMove[0].playablePiles()[0]
            })
        }
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