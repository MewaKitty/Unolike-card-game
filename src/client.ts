import type { CardNumber, CardColor, CardModifier } from "./shared/cards.ts";
//import { game as game_ } from "./game.ts";
import { SingleplayerGame } from "./singleplayer_game.ts";
import { ClientCard } from "./client_card.ts";
import { BaseGame } from "./shared/base_game.ts";
interface CardData {
    number: CardNumber
    color: CardColor
    hidden: boolean
    tags: string[]
    modifier: CardModifier | null,
    id: string
}

interface PlayerData {
    health: number;
    lives: number;
    recentCards: { card: CardData, pile: number }[];
    cards: CardData[];
    doublesCardAvailable: boolean;
    isChoosingDrawRemoval: boolean;
    drawRemovalCards: CardData[];
    id: string;
}

interface EnemyCard {
    start: string,
    attack: string,
    defeat: string[],
    description: string[]
}

class ClientPlayer {
    health: number;
    lives: number;
    recentCards: ClientCard[];
    cards: ClientCard[];
    doublesCardAvailable: boolean;
    isChoosingDrawRemoval: boolean;
    drawRemovalCards: ClientCard[];
    id: string;

    ability: {
        description: string[],
        passive: string,
        wild1: string,
        wild2: string,
        wild3: string,
        wild4: string,
        wild1Text: string,
        wild2Text: string,
        wild3Text: string,
        wild4Text: string,
        enemy1: EnemyCard,
        enemy2: EnemyCard,
        enemy3: EnemyCard,
        enemy4: EnemyCard,
    } | null;
    constructor(data: PlayerData) {
        this.health = data.health;
        this.lives = data.lives;
        this.recentCards = data.recentCards.map(card => (new ClientCard(card.card)));
        this.cards = data.cards.map(card => new ClientCard(card));
        this.doublesCardAvailable = data.doublesCardAvailable;
        this.isChoosingDrawRemoval = data.isChoosingDrawRemoval;
        this.drawRemovalCards = data.drawRemovalCards.map(card => new ClientCard(card));
        this.id = data.id;
        this.ability = null;
    }
    getCardCount() {
        let count = 0;
        for (const card of this.cards) {
            if (card.number?.actionId !== "tower") count++;
        }
        return count;
    }
}
interface HealthPacket {
    type: "health",
    player: string,
    health: number
}
interface PlayersPacket {
    type: "players",
    players: PlayerData[],
    selfId: string
}
interface DiscardPilesPacket {
    type: "discardPiles",
    discarded: CardData[][],
    pickupCard: CardData,
    pickupQueue: CardData[],
    closedPile: number
}
interface DiscardPacket {
    type: "discard",
    card: CardData,
    pile: number
}
interface PickupPacket {
    type: "pickup",
    card: CardData,
    pickupQueuePush: CardData,
    player: string,
    animate: boolean
}
interface DrawAmountPacket {
    type: "drawAmount",
    value: number
}
type Packet = HealthPacket | PlayersPacket | DiscardPilesPacket | DiscardPacket | PickupPacket | DrawAmountPacket;

/**
 * @clasdesc The client representation of the game instance.
 */
export class Client extends BaseGame {
    players: ClientPlayer[];
    /** The id of the player represented by the client. */
    selfId: string;
    /** Whether or not the player is dragging a card. */
    wasDragging: boolean;
    /** The selected cards to play. */
    selectedCards: ClientCard[];

    discarded: ClientCard[][];
    pickupCard: ClientCard | null;
    pickupQueue: ClientCard[];
    closedPile: number;
    lockedPiles: number[];

    /** Whether this is a singleplayer internal game or a multiplayer external game. */
    isMultiplayer: boolean | null;
    /** The singleplayer game instance. */
    game: SingleplayerGame | null;

    drawAmount: number;

    isMinipileActive: boolean;
    minipile: ClientCard[];

    /** The cards shown in the game. */
    cardData: Record<string, ClientCard>;

    /**
     * Creates the client game instance.
     */
    constructor() {
        super();

        this.players = [];
        this.selfId = "";
        this.wasDragging = false;
        this.selectedCards = [];

        this.isMultiplayer = null;
        this.game = null;

        this.discarded = [];
        this.pickupCard = null;
        this.pickupQueue = [];
        this.closedPile = -1;
        this.lockedPiles = [];

        this.drawAmount = 0;
        this.isMinipileActive = false;
        this.minipile = [];

        this.cardData = {};
    }

    /**
     * Re-renders the discard piles.
     */
    updateDiscardPiles () {
        for (let i = 0; i < 4; i++) {
            const pileContents = this.discarded[i];
            const cardDiscard = document.getElementsByClassName("cardDiscard" + i)[0];
            cardDiscard.textContent = "";
            if (pileContents.length > 0) cardDiscard.appendChild(pileContents.at(-1)!.wrapper)
            if (!pileContents.at(-1)?.tags.includes("discarded")) pileContents.at(-1)?.tags.push("discarded")
            if (i === -1 && !pileContents.at(-1)?.tags.includes("minipile")) pileContents.at(-1)?.tags.push("minipile")
            pileContents.at(-1)?.element.classList.remove("unplayable");
            if (i === this.closedPile) {
                cardDiscard.classList.add("closed");
            } else {
                cardDiscard.classList.remove("closed");
            }
            /*
            if (i === game.drawPile && game.drawAmount > 0) {
                cardDiscard.classList.add("drawPile");
            } else {
                cardDiscard.classList.remove("drawPile");
            }
            if (game.lockedPiles.includes(i)) {
                cardDiscard.classList.add("lockedPile");
            } else {
                cardDiscard.classList.remove("lockedPile");
            }
            if (i >= 0 && game.isMinipileActive) {
                cardDiscard.classList.add("disabledPile");
            } else {
                cardDiscard.classList.remove("disabledPile");
            }*/
        }
    }

    /**
     * Retrieves a player.
     * @param id The id of the player to retrieve.
     * @returns The client player.
     */
    getPlayer (id: string) {
        return this.players.find(player => player.id === id);
    }

    /**
     * Handles a server packet.
     * @param packet The server packet.
     */
    async receivePacket(packet: Packet) {
        console.log("client packet received: ", packet)
        console.log("client: ", client)
        switch (packet.type) {
            case "players":
                this.players = packet.players.map(player => new ClientPlayer(player))
                this.selfId = packet.selfId;
                for (const card of client.getSelfPlayer().cards) document.getElementsByClassName("cardRack")[0]!.appendChild(card.wrapper);
                document.querySelector(".opponentHand")!.textContent = "";
                for (const card of client.getOpponent().cards) {
                    document.querySelector(".opponentHand")!.appendChild(card.wrapper);
                }
                for (const player of this.players) {
                    for (const card of player.cards) {
                        this.cardData[card.id] = card;
                    }
                }
                break;
            case "health":
                if (this.selfId !== packet.player) {
                    document.getElementsByClassName("opponentHealthCount")[0].textContent = "Health: " + packet.health;
                    (document.querySelector(".opponentHealthBar .healthBarContent") as HTMLDivElement).style.width = (packet.health / 48) * 100 + "%";
                } else {
                    document.getElementsByClassName("playerHealthCount")[0].textContent = "Health: " + packet.health;
                    (document.querySelector(".playerHealthBar .healthBarContent") as HTMLDivElement).style.width = (packet.health / 48) * 100 + "%";
                }
                break;
            case "discardPiles":
                this.discarded.length = 0;
                for (const discard of packet.discarded) {
                    this.discarded.push(discard.map(card => new ClientCard(card)))
                    this.cardData[this.discarded.at(-1)![0].id] = this.discarded.at(-1)![0];
                }
                
                this.pickupCard = new ClientCard(packet.pickupCard);
                this.cardData[this.pickupCard.id] = this.pickupCard;
                this.pickupQueue = packet.pickupQueue.map(card => new ClientCard(card));
                this.closedPile = packet.closedPile;

                for (let i = 0; i < 4; i++) {
                    const cardDiscard = document.querySelector<HTMLDivElement>(".cardDiscard" + i)!;
                    if (!cardDiscard) continue;
                    cardDiscard.appendChild(client.discarded[i].at(-1)!.wrapper)
                    if (i === client.closedPile) cardDiscard.classList.add("closed");
                }

                document.querySelector(".pickupPile")?.appendChild((client.pickupCard!).wrapper)
                
                client.pickupCard!.hidden = false;
                client.pickupCard!.updateElement();

                for (let i = 0; i < 4; i++) {
                    client.pickupQueue[i].hidden = false;
                    client.pickupQueue[i].updateElement();
                    document.querySelector(".pickupQueue")?.appendChild(client.pickupQueue[i].wrapper);
                }
                break;
            case "discard":
                console.log("Discard time!")
                this.discarded[packet.pile].push(new ClientCard(packet.card))
                const cardElem = this.discarded[packet.pile].at(-1)!.wrapper;
                await this.animateElementMovement(cardElem, (document.getElementsByClassName("cardDiscard" + packet.pile)[0]?.children[0] ?? document.getElementsByClassName("cardDiscard" + packet.pile)[0]) as HTMLElement, false);
                cardElem.style.position = "";
                document.getElementsByClassName("cardDiscard" + packet.pile)[0].textContent = "";
                document.getElementsByClassName("cardDiscard" + packet.pile)[0].appendChild(cardElem)
                this.discarded[packet.pile].at(-1)!.updateElement();
                const secondCard = this.discarded[packet.pile].at(-1)!;
                secondCard.element.classList.remove("selectedCard");
                const selectedCard = client.selectedCards.find(card => secondCard.id === card.id);
                if (selectedCard) client.selectedCards.splice(client.selectedCards.indexOf(selectedCard), 1);
                for (const player of client.players) {
                    for (const card of player.cards) {
                        console.log("cardId", card.id, "packet", packet.card.id)
                        if (card.id === packet.card.id) {
                            console.log("removing!")
                            secondCard.updateElement();
                            player.cards.splice(player.cards.indexOf(card), 1);
                            client.updateInventoryPlayability();
                        }
                    }
                }
                break;
            case "pickup":
                this.drawAmount -= 1;
                document.querySelector(".drawAmountText")!.textContent = this.drawAmount > 0 ? "+" + this.drawAmount : "";
                const card = new ClientCard(packet.card);
                this.cardData[card.id] = card;
                console.debug("new card picked up", card);
                card.updateAbilityWild(false);
                if (packet.player !== client.selfId) {
                    const placeholderDiv = document.createElement("div");
                    placeholderDiv.classList.add("placeholderGap");
                    document.querySelector(".opponentHand")!.appendChild(placeholderDiv)
                    await client.animateElementMovement(card.element, placeholderDiv, card.wrapper);
                    placeholderDiv.remove();
                    document.querySelector(".opponentHand")!.appendChild(card.wrapper);
                    client.getPlayer(packet.player)!.cards.push(card);
                } else {
                    const cardRack = document.getElementsByClassName("cardRack")[0] as HTMLDivElement;
                    if (packet.animate) {
                        const placeholderDiv = document.createElement("div");
                        placeholderDiv.classList.add("placeholderDiv");
                        placeholderDiv.classList.add("wrapper");
                        cardRack.appendChild(placeholderDiv)
                        await client.animateElementMovement(card.element, placeholderDiv, card.wrapper);
                        placeholderDiv.remove();
                    }
                    cardRack.appendChild(card.wrapper);
                    if (client.getSelfPlayer().cards.includes(card)) client.getSelfPlayer().cards.splice(client.getSelfPlayer().cards.indexOf(card), 1)
                    client.getSelfPlayer().cards.push(card);
                    card.hidden = false;
                    card.updateElement();
                    client.updateInventoryPlayability();
                }
                card.tags.splice(card.tags.indexOf("pickup"), 1);
                //game.pickupCard = new Card(true, ["pickup"])
                if (packet.pickupQueuePush) {
                    client.pickupCard = client.pickupQueue.shift()!;
                    client.pickupCard.tags.push("pickup");
                    client.pickupQueue.push(new ClientCard(packet.pickupQueuePush));
                    document.getElementsByClassName("pickupQueue")[0].appendChild(client.pickupQueue.at(-1)!.wrapper);
                    for (const card of document.querySelectorAll(".pickupPile > .cardWrapper")) card.remove();
                    document.querySelector(".pickupPile")!.appendChild(client.pickupCard.wrapper)
                    client.updateDiscardPiles();
                }
                break;
            case "drawAmount":
                this.drawAmount = packet.value;
                document.querySelector(".drawAmountText")!.textContent = this.drawAmount > 0 ? "+" + this.drawAmount : "";
                this.updateInventoryPlayability();
        }
    }

    /**
     * Sends a packet to the server.
     * @param packet The packet to send.
     */
    async sendPacket(packet: any) {
        if (isMultiplayer) {
            await socket!.send(JSON.stringify(packet));
        } else {
            await game!.receivePacket(this.game?.getPlayer(false), packet);
        }
        //return game_.receivePacket(packet);
    }

    /**
     * Gets the player represented by the client.
     * @returns The current client player.
     */
    getSelfPlayer() {
        return this.players.find(player => player.id === this.selfId)!;
    }

    /**
     * Gets the player that's not the client.
     * @returns The current opponent player.
     */
    getOpponent() {
        return this.players.find(player => player.id !== this.selfId)!;
    }

    /**
     * Re-renders the playability opacities of the cards.
     */
    updateInventoryPlayability() {
        //let hasPlayable = false;
        if (this.getSelfPlayer().isChoosingDrawRemoval) {
            document.getElementsByClassName("cardRack")[0]?.classList.add("isChoosingDrawRemoval");
        } else {
            document.getElementsByClassName("cardRack")[0]?.classList.remove("isChoosingDrawRemoval");
        }
        for (const card of this.getSelfPlayer().cards) {
            card.updateElement(true);
            card.updateAbilityWild(false);
            if (card.isPlayable() || card.number?.actionId === "tower") {
                //hasPlayable = true;
                card.element.classList.remove("unplayable")
                if (!this.getSelfPlayer().isChoosingDrawRemoval || this.getSelfPlayer().drawRemovalCards.includes(card)) card.wrapper.classList.remove("cardWidthOut");
            } else {
                card.element.classList.add("unplayable");
                if (this.getSelfPlayer().isChoosingDrawRemoval && !this.getSelfPlayer().drawRemovalCards.includes(card)) card.wrapper.classList.add("cardWidthOut");
            }
        }
        if (document.getElementsByClassName("playerCardCount")[0]) document.getElementsByClassName("playerCardCount")[0].textContent = client.getSelfPlayer().getCardCount() + " cards";
        if (document.getElementsByClassName("opponentCardCount")[0]) document.getElementsByClassName("opponentCardCount")[0].textContent = client.getOpponent().getCardCount() + " cards";
        /*if (hasPlayable) {
            document.getElementsByClassName("pickupPile")[0]?.classList.add("unplayable")
        } else {
            document.getElementsByClassName("pickupPile")[0]?.classList.remove("unplayable")
        }*/
    }

    /**
     * Animates movement of an element.
     * @param element The child element to move.
     * @param destination The destination to visually go to.
     * @param parent The destination to append the child to; set to false to not add
     */
    animateElementMovement(element: HTMLElement, destination: HTMLElement, parent: Element | false): Promise<null> {
        return new Promise(res => {
            console.debug(element.getBoundingClientRect())
            console.debug(destination)
            element.style.transition = "left .5s, top .5s"
            element.style.position = "fixed";
            setTimeout(() => {
                element.style.left = element.getBoundingClientRect().left + "px";
                element.style.top = element.getBoundingClientRect().top + "px";
                setTimeout(() => {
                    element.style.left = destination.getBoundingClientRect().left + "px";
                    element.style.top = destination.getBoundingClientRect().top + "px";
                    setTimeout(() => {
                        if (parent) element.style.position = "";
                        if (parent) parent.appendChild(element);
                        //this.updateCardDiscard();
                        element.style.transition = "";
                        res(null);
                    }, 500)
                }, 0)
            });
        });
    }
}
export const client = new Client();

let socket: WebSocket | null = null;
let game = null;
const isMultiplayer = false;
client.isMultiplayer = isMultiplayer;
if (isMultiplayer) {
    socket = new WebSocket("http://localhost:3000/ws");
    socket.addEventListener("message", (e) => {
        client.receivePacket(JSON.parse(e.data));
    })
    console.debug("a");
    console.debug(socket);
} else {
    game = new SingleplayerGame();
    client.game = game;
}