import { Card } from "./cards.ts";

export const discardedCards: Card[] = []

export class Game {
    inventory: Card[];
    discarded: Card[];
    opponentHand: Card[];
    pickupCard: Card;
    selectedCards: Card[];
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
    opponentTurn () {
        for (const card of game.selectedCards) card.element.classList.remove("selectedCard");
        game.selectedCards.length = 0;
        for (const card of this.opponentHand) {
            if (card.playableOn(this.discarded.at(-1)!)) {
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
                    }, 500)
                }, 100)
                updateInventoryPlayability();
                return
            }
        }
        const card = game.pickupCard;
        card.wrapper.style.position = "fixed";
        card.wrapper.style.left = card.wrapper.getBoundingClientRect().left + "px";
        card.wrapper.style.top = card.wrapper.getBoundingClientRect().top + "px";
        card.wrapper.style.transition = "left .5s, top .5s"
        card.tags.splice(card.tags.indexOf("pickup"), 1)
        setTimeout(() => {
            game.pickupCard = new Card(true, ["pickup"])
            document.getElementsByClassName("pickupPile")[0].appendChild(game.pickupCard.wrapper)
            const opponentHand = document.getElementsByClassName("opponentHand")[0];
            card.wrapper.style.left = opponentHand.getBoundingClientRect().left + "px";
            card.wrapper.style.top = opponentHand.getBoundingClientRect().top + "px";
            setTimeout(() => {
                card.wrapper.style.position = "";
                opponentHand.appendChild(card.wrapper);
                game.opponentHand.push(card);
            }, 500)
        }, 100)
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
            game.opponentTurn();
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