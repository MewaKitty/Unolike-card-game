import { Card } from "./cards.ts";

export const discardedCards: Card[] = []

export class Game {
    inventory: Card[];
    discarded: Card[];
    opponentHand: Card[];
    pickupCard: Card;
    constructor () {
        this.inventory = [];
        this.opponentHand = [];
        for (let i = 0; i < 7; i++) {
            this.inventory.push(new Card())
            this.opponentHand.push(new Card(true))
        }
        this.discarded = [new Card(false, ["discarded"])];
        this.pickupCard = new Card(true, ["pickup"]);
    }
    updateCardDiscard () {
        const cardDiscard = document.getElementsByClassName("cardDiscard")[0];
        cardDiscard.textContent = "";
        cardDiscard.appendChild(this.discarded.at(-1)!.wrapper)
        if (!this.discarded.at(-1)?.tags.includes("discarded")) this.discarded.at(-1)?.tags.push("discarded")
    }
    opponentTurn () {
        for (const card of this.opponentHand) {
            if (card.playableOn(this.discarded.at(-1)!)) {
                this.discarded.push(card);
                this.opponentHand.splice(this.opponentHand.indexOf(card), 1)
                card.hidden = false;
                card.tags.push("discarded")
                card.wrapper.style.position = "fixed";
                card.wrapper.style.left = card.wrapper.getBoundingClientRect().left + "px";
                card.wrapper.style.top = card.wrapper.getBoundingClientRect().top + "px";
                card.wrapper.style.transition = "left 1s, top 1s"
                const placeholderDiv = document.createElement("div");
                placeholderDiv.style.width = "5rem";
                placeholderDiv.style.transition = "width 1s";
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
                    }, 1000)
                }, 100)
                updateInventoryPlayability();
                return
            }
        }
        const card = game.pickupCard;
        card.wrapper.style.position = "fixed";
        card.wrapper.style.left = card.wrapper.getBoundingClientRect().left + "px";
        card.wrapper.style.top = card.wrapper.getBoundingClientRect().top + "px";
        card.wrapper.style.transition = "left 1s, top 1s"
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
            }, 1000)
        }, 100)
    }
}
export const game = new Game();

export const updateInventoryPlayability = () => {
    for (const card of game.inventory) {
        if (card.playableOn(game.discarded.at(-1)!)) {
            card.element.classList.remove("unplayable")
        } else {
            card.element.classList.add("unplayable")
        }
    }
}