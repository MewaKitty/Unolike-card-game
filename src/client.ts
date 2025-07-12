import type { CardNumber, CardColor, CardModifier } from "./cards.ts";
import { game as game_ } from "./game.ts";
import { dragGap, dragGaps, setDraggedCard } from "./dragging.ts";

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
export class ClientCard {
    number: CardNumber
    color: CardColor
    hidden: boolean
    tags: string[]
    modifier: CardModifier | null
    id: string;

    element: HTMLDivElement
    wrapper: HTMLDivElement
    innerElement: HTMLDivElement
    constructor(data: CardData) {
        this.number = data.number;
        this.color = data.color;
        this.hidden = data.hidden;
        this.tags = data.tags;
        this.modifier = data.modifier;
        this.id = data.id;

        if (document.getElementById("card-" + data.id)) {
            this.wrapper = document.getElementById("card-" + data.id) as HTMLDivElement;
            this.element = document.getElementById("card-" + data.id)!.children[0] as HTMLDivElement;
            this.innerElement = document.getElementById("card-" + data.id)!.children[0].children[0] as HTMLDivElement;
            return;
        }

        const wrapper = document.createElement("div");
        wrapper.classList.add("cardWrapper");
        wrapper.id = "card-" + data.id;
        const div = document.createElement("div");
        this.element = div;
        const innerElement = document.createElement("div");
        this.innerElement = innerElement;
        div.appendChild(innerElement);
        this.updateElement();
        wrapper.appendChild(this.element);
        this.wrapper = wrapper;
        let pointerDownTime = 0;
        div.addEventListener("pointerdown", e => {
            client.updateInventoryPlayability();
            //if (this.tags.includes("pickup") && game.colorChooserActive) return;
            if (!this.tags.includes("pickup") && !wrapper.parentElement?.classList.contains("minipileInner") && !this.isPlayable()) return;
            if (this.tags.includes("discarded") && !wrapper.parentElement?.classList.contains("minipileInner")) return;
            if (!this.tags.includes("pickup") && !wrapper.parentElement?.classList.contains("minipileInner") && wrapper.parentElement !== document.getElementsByClassName("cardRack")[0]) return;
            //if (!game.playersTurn) return;
            pointerDownTime = Date.now();
            dragGap.x = e.pageX - div.getBoundingClientRect().left;
            dragGap.y = e.pageY - div.getBoundingClientRect().top;
            div.style.left = div.getBoundingClientRect().left + "px";
            div.style.top = div.getBoundingClientRect().top + "px";
            div.classList.add("dragging")
            setDraggedCard(this);
            for (const card of client.selectedCards) {
                dragGaps.push({
                    x: e.pageX - card.element.getBoundingClientRect().left,
                    y: e.pageY - card.element.getBoundingClientRect().top
                });
            }

            if (this.tags.includes("pickup")) return;
            const piles = client.selectedCards.length > 0 && client.selectedCards.includes(this) ? client.playableTwins() : this.playablePiles();

            for (let i = -1; i < 4; i++) {
                const cardDiscard = document.getElementsByClassName("cardDiscard" + i)[0];
                if (piles.includes(i)) {
                    cardDiscard.classList.remove("unplayable")
                } else {
                    cardDiscard.classList.add("unplayable")
                }
                //if (i === game.closedPile) cardDiscard.classList.add("unplayable");
            }
        })
        wrapper.addEventListener("pointerup", async () => {
            if (Date.now() - pointerDownTime > 350) return;
            if (!this.tags.includes("pickup") && !this.isPlayable()) return;
            if (!client.getSelfPlayer().cards.includes(this)) return;
            if (this.tags.includes("discarded")) return;
            if (div.classList.contains("selectedCard")) {
                div.classList.remove("selectedCard")
                client.selectedCards.splice(client.selectedCards.indexOf(this), 1)
            } else {
                div.classList.add("selectedCard")
                client.selectedCards.push(this);
            }
            if (client.selectedCards.length > 0) {
                const piles = client.playableTwins();
                for (let i = 0; i < 4; i++) {
                    const cardDiscard = document.getElementsByClassName("cardDiscard" + i)[0];
                    if (piles.includes(i)) {
                        cardDiscard.classList.remove("unplayable")
                    } else {
                        cardDiscard.classList.add("unplayable")
                    }
                    //if (i === game.closedPile) cardDiscard.classList.add("unplayable");
                }
            }
            client.updateInventoryPlayability();
        })
    }
    updateElement() {
        const element = this.element;
        const innerElement = this.innerElement;
        element.classList.add("card");
        innerElement.classList.add("cardInner");
        element.style = `--color: ${this.color.color}; --dark: ${this.color.dark}; --text: ${this.color.text ?? "#333"}`;
        if (this.number.actionId === "tower") element.classList.add("towerCard");
        innerElement.textContent = "";
        const cardNameSpan = document.createElement("span");
        cardNameSpan.textContent = this.number.name;
        innerElement.appendChild(cardNameSpan);
        if (this.number.description || this.color.description) {
            const cardDescriptionSpan = document.createElement("span");
            cardDescriptionSpan.classList.add("cardDescriptionSpan");
            cardDescriptionSpan.textContent = this.number.actionId === "tower" && this.color.description ? this.color.description : this.number.description!;
            innerElement.appendChild(cardDescriptionSpan);
        }
        if (this.modifier) {
            const cardModifierSpan = document.createElement("span");
            cardModifierSpan.classList.add("cardModifierSpan");
            cardModifierSpan.textContent = "+ " + this.modifier.name;
            innerElement.appendChild(cardModifierSpan);
        }
        if (!this.hidden) innerElement.style = "";
        if (this.number.actionId === "tower") return;
        if (this.hidden) element.style = `--color: #fff; --dark: #fff; color: black;`;
        if (this.hidden) innerElement.style = "color: black;";
        if (this.hidden) innerElement.textContent = `Card`;
    }
    updateAbilityWild(isOpponent: boolean) {
        if (this.number.abilityWild) {
            if (isOpponent) {

            } else {
                this.innerElement.querySelector(".cardDescriptionSpan")?.remove();
                return;
                /*if (!game.player.ability) return;
                const cardDescriptionSpan = document.createElement("span");
                cardDescriptionSpan.classList.add("cardDescriptionSpan");
                cardDescriptionSpan.textContent = game.player.ability![this.number.abilityWild + "Text" as "wild1Text"];
                this.innerElement.appendChild(cardDescriptionSpan);*/
            }
        }
    }
    isPlayable() {
        return true;
    }
    playablePiles(forOpponent?: boolean): number[] {
        let availablePiles = [];
        for (let i = 0; i < 4; i++) {
            if (this.playableOn(client.discarded[i].at(-1)!)) availablePiles.push(i);
        }
        return availablePiles;
    }
    playableOn (card: ClientCard) {
        if (card.number === this.number) return true;
        if (card.color === this.color) return true;
        if (this.color.wild) return true;
        if (card.color.wild) return true;
        if (card.number.actionId === "purpleBlank") return true;
        return false;
    }
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
    recentCards: { card: ClientCard, pile: number }[];
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
        this.recentCards = data.recentCards.map(card => ({
            card: new ClientCard(card.card),
            pile: card.pile
        }));
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
            if (card.number.actionId !== "tower") count++;
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
    animate: boolean
}
type Packet = HealthPacket | PlayersPacket | DiscardPilesPacket | DiscardPacket | PickupPacket;

class Client {
    players: ClientPlayer[];
    selfId: string;
    wasDragging: boolean;
    selectedCards: ClientCard[];

    discarded: ClientCard[][];
    pickupCard: ClientCard | null;
    pickupQueue: ClientCard[];
    closedPile: number;

    constructor() {
        this.players = [];
        this.selfId = "";
        this.wasDragging = false;
        this.selectedCards = [];

        this.discarded = [];
        this.pickupCard = null;
        this.pickupQueue = [];
        this.closedPile = -1;
    }
    async receivePacket(packet: Packet) {
        console.log("client packet received: ", packet)
        switch (packet.type) {
            case "players":
                this.players = packet.players.map(player => new ClientPlayer(player))
                this.selfId = packet.selfId;
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
                }
                this.pickupCard = new ClientCard(packet.pickupCard);
                this.pickupQueue = packet.pickupQueue.map(card => new ClientCard(card));
                this.closedPile = packet.closedPile;
                break;
            case "discard":
                console.log("Discard time!")
                this.discarded[packet.pile].push(new ClientCard(packet.card))
                document.getElementsByClassName("cardDiscard" + packet.pile)[0].textContent = "";
                document.getElementsByClassName("cardDiscard" + packet.pile)[0].appendChild(this.discarded[packet.pile].at(-1)!.wrapper)
                console.log(client.getSelfPlayer());
                const secondCard = this.discarded[packet.pile].at(-1)!;
                secondCard.element.classList.remove("selectedCard");
                if (client.selectedCards.includes(secondCard)) client.selectedCards.splice(client.selectedCards.indexOf(secondCard), 1);
                for (const player of client.players) {
                    for (const card of player.cards) {
                        console.log("cardId", card.id, "packet", packet.card.id)
                        if (card.id === packet.card.id) {
                            console.log("removing!")
                            card.wrapper.remove();
                            console.log(card.wrapper)
                            player.cards.splice(player.cards.indexOf(card), 1);
                            client.updateInventoryPlayability();
                        }
                    }
                }
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
                break;
            case "pickup":
                const card = new ClientCard(packet.card);
                card.updateAbilityWild(false);
                const cardRack = document.getElementsByClassName("cardRack")[0] as HTMLDivElement;
                const pickupPile = document.getElementsByClassName("pickupPile")[0] as HTMLDivElement;
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
                card.tags.splice(card.tags.indexOf("pickup"), 1);
                //game.pickupCard = new Card(true, ["pickup"])
                client.pickupCard = client.pickupQueue.shift()!;
                client.pickupCard.tags.push("pickup");
                client.pickupQueue.push(new ClientCard(packet.pickupQueuePush));
                document.getElementsByClassName("pickupQueue")[0].appendChild(client.pickupQueue.at(-1)!.wrapper);
                for (const card of document.querySelectorAll(".pickupPile > .cardWrapper")) card.remove();
                pickupPile.appendChild(client.pickupCard.wrapper)
        }
    }
    sendPacket(packet: any) {
        return game_.receivePacket(packet);
    }
    getSelfPlayer() {
        return this.players.find(player => player.id === this.selfId)!;
    }
    getOpponent() {
        return this.players.find(player => player.id !== this.selfId)!;
    }
    updateInventoryPlayability() {
        //let hasPlayable = false;
        if (this.getSelfPlayer().isChoosingDrawRemoval) {
            document.getElementsByClassName("cardRack")[0]?.classList.add("isChoosingDrawRemoval");
        } else {
            document.getElementsByClassName("cardRack")[0]?.classList.remove("isChoosingDrawRemoval");
        }
        for (const card of this.getSelfPlayer().cards) {
            card.updateAbilityWild(false);
            if (card.isPlayable() || card.number.actionId === "tower") {
                //hasPlayable = true;
                card.element.classList.remove("unplayable")
                if (!this.getSelfPlayer().isChoosingDrawRemoval || this.getSelfPlayer().drawRemovalCards.includes(card)) card.wrapper.classList.remove("cardWidthOut");
            } else {
                card.element.classList.add("unplayable");
                if (this.getSelfPlayer().isChoosingDrawRemoval && !this.getSelfPlayer().drawRemovalCards.includes(card)) card.wrapper.classList.add("cardWidthOut");
            }
        }
        if (document.getElementsByClassName("playerCardCount")[0]) document.getElementsByClassName("playerCardCount")[0].textContent = client.getSelfPlayer().getCardCount() + "";
        if (document.getElementsByClassName("opponentCardCount")[0]) document.getElementsByClassName("opponentCardCount")[0].textContent = client.getOpponent().getCardCount() + "";
        /*if (hasPlayable) {
            document.getElementsByClassName("pickupPile")[0]?.classList.add("unplayable")
        } else {
            document.getElementsByClassName("pickupPile")[0]?.classList.remove("unplayable")
        }*/
        console.log(client);
    }
    animateElementMovement(element: HTMLElement, destination: HTMLElement, parent: Element | false) {
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
    playableTwins() {
        if (client.selectedCards.length === 1) return client.selectedCards[0].playablePiles();
        /*if (game.minipile.length > 0 && game.minipileAction === "war") return [];
        if (game.minipile.length > 0 && game.minipileAction === "war+2") return [];*/
        const piles = [];
        if (client.selectedCards.length === 2 && !isNaN(+client.selectedCards[0].number.value!) && !isNaN(+client.selectedCards[1].number.value!)) {
            for (let index = -1; index < game.discarded.length; index++) {
                if (game.isMinipileActive && index >= 0) continue;
                if (!game.isMinipileActive && index === -1) continue;
                const discard = index === -1 ? game.minipile : game.discarded[index];
                if (game.closedPile === index) continue;
                if (game.lockedPiles.includes(index)) {
                    if ((game.selectedCards[0].modifier?.actionId !== "lock" && game.selectedCards[0].modifier?.actionId !== "disarm") || (game.selectedCards[1].modifier?.actionId !== "lock" && game.selectedCards[0].modifier?.actionId !== "disarm")) continue;
                }
                if (discard.at(-1)?.number.value === game.selectedCards[0].number.value! + game.selectedCards[1].number.value!) piles.push(index)
                if (game.selectedCards[0].number.actionId === "#" && numberData.map(number => number.value).includes(discard.at(-1)?.number.value! - game.selectedCards[1].number.value!)) piles.push(index);
                if (game.selectedCards[1].number.actionId === "#" && numberData.map(number => number.value).includes(discard.at(-1)?.number.value! - game.selectedCards[0].number.value!)) piles.push(index);
            }
        }
        if (game.selectedCards.length === 2 && game.player.getCardCount() >= 3) {
            let match = [];
            for (let index = -1; index < game.discarded.length; index++) {
                if (game.isMinipileActive && index >= 0) continue;
                if (!game.isMinipileActive && index === -1) continue;
                if (game.lockedPiles.includes(index)) {
                    if (game.selectedCards[0].modifier?.actionId !== "lock" && game.selectedCards[0].modifier?.actionId !== "disarm") continue;
                }
                const discard = index === -1 ? game.minipile : game.discarded[index];
                if (discard.at(-1)?.number === game.selectedCards[0].number && discard.at(-1)?.color === game.selectedCards[0].color) match.push(index);
            }
            if (match.length > 0) piles.push(...match);
        }
        if (game.selectedCards[0].number === game.selectedCards[1].number) {
            if (game.selectedCards.length === 2) {
                piles.push(...game.selectedCards.map(card => card.playablePiles()).flat());
            } else {
                piles.push(...game.selectedCards.filter(card => card !== getDraggedCard()).map(card => card.playablePiles()).flat())
            }
        }
        if (game.selectedCards.length > 0) {
            const sorted = game.selectedCards.sort((a, b) => a.number.value! - b.number.value!);
            console.log(sorted);
            let last = null;
            let isValid = true;
            for (const card of sorted) {
                if (last === null) {
                    last = card;
                    continue;
                }
                if (card.number.value !== last.number.value! + 1 && last.number.actionId !== "#") isValid = false;
                last = card;
            }
            console.log("isValid: " + isValid)
            if (isValid) piles.push(...sorted[0].playablePiles())
        }
        // Handle discard 2 of color
        if (game.selectedCards[0]?.number.actionId === "discard2Color") {
            if (game.selectedCards[1]?.color === game.selectedCards[0].color) {
                return game.selectedCards[0].playablePiles();
            }
        }

        return piles;
    }
}
export const client = new Client();