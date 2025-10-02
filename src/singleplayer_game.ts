import { Game } from "../src/shared/game.ts";
import { client } from "./client.ts";
import { SingleplayerPlayer } from "./singleplayer_players.ts";

const app = document.querySelector<HTMLDivElement>('#app')!;

const renderOpponentHand = (index: number, id: string) => {
    const opponentSeat = document.createElement("div");
    opponentSeat.classList.add("opponentSeat");
    opponentSeat.id = "opponentSeat" + index;
    app.appendChild(opponentSeat);

    const opponentHand = document.createElement("div");
    opponentHand.classList.add("opponentHand")
    opponentHand.id = "opponentHand" + id;
    opponentHand.setAttribute("aria-describedby", "opponentHandLabel")
    opponentSeat.appendChild(opponentHand);

    const opponentHandLabel = document.createElement("span");
    opponentHandLabel.classList.add("opponentHandLabel");
    opponentHandLabel.id = "opponentHandLabel" + id;
    opponentHandLabel.textContent = "Dealer's cards";
    opponentSeat.appendChild(opponentHandLabel);

    const opponentCardCount = document.createElement("div");
    opponentCardCount.classList.add("opponentCardCount");
    opponentCardCount.id = "opponentCardCount" + id;
    opponentCardCount.textContent = "7 cards";
    opponentSeat.appendChild(opponentCardCount)
}

export class SingleplayerGame extends Game {
    declare players: SingleplayerPlayer[];
    constructor () {
        super();
    }
    async broadcast (packet: any) {
        client.receivePacket(packet);
        if (packet.type === "turn" && packet.value > 0) {
            console.log("opponentTurn")
            let moves = [];
            const player = this.players[this.currentTurn]
            for (const card of player.cards) {
                moves.push(player.cards.filter(secondCard => secondCard.number.name === card.number.name));
                if (card.number.value === null || card.number.value === undefined) {
                    moves.push([card]);
                    continue;
                } else {
                    const moveCombo = [card];
                    let lastNumber = card.number.value;
                    while (1) {
                        const secondCard = player.cards.find(secondCard => secondCard.number.value === lastNumber + 1);
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
                this.receivePacket(player, {
                    type: "pickup",
                    card: this.pickupCard.id,
                    animate: true
                })
                return;
            }
            console.log("chosenMove", chosenMove)
            this.receivePacket(player, {
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
        if (isOpponent) await renderOpponentHand(this.players.length - 1, player.id);
        for (const player of this.players) {
            await player.send({
                type: "players",
                players: this.players.map(secondPlayer => secondPlayer.data(player !== secondPlayer)),
                selfId: player.id
            })
        };
        return player;
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