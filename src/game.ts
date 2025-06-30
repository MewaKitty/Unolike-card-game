import { Card } from "./cards.ts";
import { shuffleArray } from "./utils.ts";

export const discardedCards: Card[] = []

export class Game {
    inventory: Card[];
    discarded: Card[];
    opponentHand: Card[];
    pickupCard: Card;
    selectedCards: Card[];
    drawAmount: number;
    playersTurn: boolean;
    constructor () {
        this.inventory = [];
        this.opponentHand = [];
        for (let i = 0; i < 7; i++) {
            this.inventory.push(new Card())
            this.opponentHand.push(new Card(true))
        }
        this.discarded = [new Card(false, ["discarded"])];
        this.pickupCard = new Card(true, ["pickup"]);
        this.selectedCards = [];
        this.drawAmount = 0;
        this.playersTurn = true;
    }
    updateCardDiscard () {
        const cardDiscard = document.getElementsByClassName("cardDiscard")[0];
        cardDiscard.textContent = "";
        cardDiscard.appendChild(this.discarded.at(-1)!.wrapper)
        if (!this.discarded.at(-1)?.tags.includes("discarded")) this.discarded.at(-1)?.tags.push("discarded")
    }
    animateElementMovement (element: HTMLElement, destination: HTMLElement, parent: Element) {
        return new Promise(res => {
            element.style.position = "fixed";
            element.style.left = element.getBoundingClientRect().left + "px";
            element.style.top = element.getBoundingClientRect().top + "px";
            element.style.transition = "left .5s, top .5s"
            setTimeout(() => {
                element.style.left = destination.getBoundingClientRect().left + "px";
                element.style.top = destination.getBoundingClientRect().top + "px";
                setTimeout(() => {
                    element.style.position = "";
                    parent.appendChild(element);
                    this.updateCardDiscard();
                    res(null);
                }, 500)
            }, 100)
        });
    }
    async opponentTurn () {
        this.playersTurn = false;
        updateInventoryPlayability();
        for (const card of game.selectedCards) card.element.classList.remove("selectedCard");
        game.selectedCards.length = 0;
        if (game.drawAmount > 0) {
            for (const card of this.opponentHand) {
                if (!card.playableOn(this.discarded.at(-1)!)) continue;
                if (!card.number.draw) continue;
                await this.opponentDiscard(card);
                this.playersTurn = true;
                return;
            }
            for (let i = 0; i < game.drawAmount; i++) this.opponentPickup();
            game.drawAmount = 0;
            document.getElementsByClassName("drawAmountText")[0].textContent = "";
            this.playersTurn = true;
            updateInventoryPlayability();
            return;
        }
        for (const card of this.opponentHand) {
            if (card.playableOn(this.discarded.at(-1)!)) {
                await this.opponentDiscard(card);
                if (card.number.actionId === "skip") await this.opponentTurn();
                this.playersTurn = true;
                updateInventoryPlayability();
                return
            }
        }
        await this.opponentPickup();
        this.playersTurn = true;
        updateInventoryPlayability();
    }
    opponentDiscard (card: Card) {
        this.discarded.push(card);
        this.opponentHand.splice(this.opponentHand.indexOf(card), 1)
        card.hidden = false;
        card.tags.push("discarded")
        card.wrapper.style.position = "fixed";
        card.wrapper.style.left = card.wrapper.getBoundingClientRect().left + "px";
        card.wrapper.style.top = card.wrapper.getBoundingClientRect().top + "px";
        card.wrapper.style.transition = "left .5s, top .5s"
        const placeholderDiv = document.createElement("div");
        placeholderDiv.style.width = "5rem";
        placeholderDiv.style.transition = "width .5s";
        card.wrapper.parentElement!.insertBefore(placeholderDiv, card.wrapper);
        card.updateElement();
        if (card.number.draw) {
            game.drawAmount += card.number.draw;
            document.getElementsByClassName("drawAmountText")[0].textContent = "+" + game.drawAmount;
        }
        updateInventoryPlayability();
        return new Promise(res => {
            setTimeout(() => {
                const cardDiscard = document.getElementsByClassName("cardDiscard")[0].children[0];
                card.wrapper.style.left = cardDiscard.getBoundingClientRect().left + "px";
                card.wrapper.style.top = cardDiscard.getBoundingClientRect().top + "px";
                placeholderDiv.style.width = "0";
                setTimeout(() => {
                    card.wrapper.style.position = "";
                    placeholderDiv.remove();
                    cardDiscard.appendChild(card.wrapper);
                    this.updateCardDiscard();
                    this.applyOpponentDiscardEffects(card);
                    res(null);
                }, 500)
            }, 100)
        })
    }
    opponentPickup () {
        const card = game.pickupCard;
        card.wrapper.style.position = "fixed";
        card.wrapper.style.left = card.wrapper.getBoundingClientRect().left + "px";
        card.wrapper.style.top = card.wrapper.getBoundingClientRect().top + "px";
        card.wrapper.style.transition = "left .5s, top .5s"
        card.tags.splice(card.tags.indexOf("pickup"), 1)
        game.pickupCard = new Card(true, ["pickup"])
        document.getElementsByClassName("pickupPile")[0].appendChild(game.pickupCard.wrapper)
        updateInventoryPlayability();
        return new Promise(res => {
        setTimeout(() => {
            //for (const card of document.querySelectorAll(".pickupPile .cardWrapper")) card.remove();
            const opponentHand = document.getElementsByClassName("opponentHand")[0];
            card.wrapper.style.left = opponentHand.getBoundingClientRect().left + "px";
            card.wrapper.style.top = opponentHand.getBoundingClientRect().top + "px";
            setTimeout(() => {
                card.wrapper.style.position = "";
                opponentHand.appendChild(card.wrapper);
                game.opponentHand.push(card);
                res(null);
            }, 500)
        }, 100)
        })
    }
    addToRack (card: Card) {
        const cardRack = document.getElementsByClassName("cardRack")[0] as HTMLDivElement;
        const pickupPile = document.getElementsByClassName("pickupPile")[0] as HTMLDivElement;
        cardRack.appendChild(card.wrapper);
        if (game.inventory.includes(card)) game.inventory.splice(game.inventory.indexOf(card), 1)
        game.inventory.push(card);
        card.hidden = false;
        card.updateElement();
        updateInventoryPlayability();
        if (card.tags.includes("pickup")) {
            card.tags.splice(card.tags.indexOf("pickup"), 1);
            game.pickupCard = new Card(true, ["pickup"])
            for (const card of document.querySelectorAll(".pickupPile .cardWrapper")) card.remove();
            pickupPile.appendChild(game.pickupCard.wrapper)
        }
    }
    discardCard (card: Card) {
        const cardDiscard = document.getElementsByClassName("cardDiscard")[0];
        cardDiscard.textContent = "";
        cardDiscard.appendChild(card.wrapper)
        game.discarded.push(card);
        game.inventory.splice(game.inventory.indexOf(card), 1)
        updateInventoryPlayability();
        game.updateCardDiscard();
        if (card.number.draw) {
            game.drawAmount += card.number.draw;
            document.getElementsByClassName("drawAmountText")[0].textContent = "+" + game.drawAmount;
        }
        if (card.number.actionId === "swap") {
            const playersHand = Array.from(game.inventory);
            const opponentHand = Array.from(game.opponentHand);
            game.inventory.length = 0;
            for (const card of opponentHand) game.inventory.push(card);
            game.opponentHand.length = 0;
            for (const card of playersHand) game.opponentHand.push(card);
            this.updateHands();
        }
        if (card.number.actionId === "shuffle") {
            const playersHandCount = game.inventory.length;
            const opponentHandCount = game.opponentHand.length;
            const allCards = [...game.inventory, ...game.opponentHand];
            game.inventory.length = 0;
            game.opponentHand.length = 0;
            shuffleArray(allCards)
            for (let i = 0; i < playersHandCount; i++) game.inventory.push(allCards.shift()!);
            for (let i = 0; i < opponentHandCount; i++) game.opponentHand.push(allCards.shift()!);
            this.updateHands();
        }
    }
    applyOpponentDiscardEffects (card: Card) {
        if (card.number.actionId === "swap") {
            const playersHand = Array.from(game.inventory);
            const opponentHand = Array.from(game.opponentHand);
            game.inventory.length = 0;
            for (const card of opponentHand) game.inventory.push(card);
            game.opponentHand.length = 0;
            for (const card of playersHand) game.opponentHand.push(card);
            this.updateHands();
        }
        if (card.number.actionId === "shuffle") {
            const playersHandCount = game.inventory.length;
            const opponentHandCount = game.opponentHand.length;
            const allCards = [...game.inventory, ...game.opponentHand];
            game.inventory.length = 0;
            game.opponentHand.length = 0;
            shuffleArray(allCards)
            for (let i = 0; i < playersHandCount; i++) game.inventory.push(allCards.shift()!);
            for (let i = 0; i < opponentHandCount; i++) game.opponentHand.push(allCards.shift()!);
            this.updateHands();
        }
    }
    updateHands () {
        const cardRack = document.getElementsByClassName("cardRack")[0];
        cardRack.textContent = "";
        console.log("inventory");
        console.log(game.inventory)
        console.log(game.opponentHand)
        for (const card of game.inventory) {
            card.hidden = false;
            card.updateElement();
            cardRack.appendChild(card.wrapper)
        }
        updateInventoryPlayability();
        const opponentHand = document.getElementsByClassName("opponentHand")[0];
        opponentHand.textContent = "";
        for (const card of game.opponentHand) {
            opponentHand.appendChild(card.wrapper)
        }
    }
}
export const game = new Game();

export const updateInventoryPlayability = () => {
    for (const card of game.inventory) {
        if (card.isPlayable()) {
            card.element.classList.remove("unplayable")
        } else {
            card.element.classList.add("unplayable")
        }
    }
}