import { type CardNumber, type CardColor, type CardModifier } from "./shared/cards.ts";
import { BaseCard } from "./shared/base_cards.ts";
import { client, type Client } from "./client.ts";
import { dragGap, dragGaps, getDraggedCard, setDraggedCard } from "./dragging.ts";

import numberData from "./data/numbers.json";

interface CardData {
    number: CardNumber | null
    color: CardColor | null
    hidden: boolean
    tags: string[]
    modifier: CardModifier | null,
    id: string
}

export class ClientCard extends BaseCard {
    number: CardNumber | null
    color: CardColor | null
    hidden: boolean
    tags: string[]
    modifier: CardModifier | null
    id: string;

    element: HTMLDivElement
    wrapper: HTMLButtonElement
    innerElement: HTMLDivElement

    declare game: Client
    constructor(data: CardData) {
        super(client)
        this.number = data.number;
        this.color = data.color;
        this.hidden = data.hidden;
        this.tags = data.tags;
        this.modifier = data.modifier;
        this.id = data.id;

        if (document.getElementById("card-" + data.id)) {
            this.wrapper = document.getElementById("card-" + data.id) as HTMLButtonElement;
            this.element = document.getElementById("card-" + data.id)!.children[0] as HTMLDivElement;
            this.innerElement = document.getElementById("card-" + data.id)!.children[0].children[0] as HTMLDivElement;
            return;
        }

        const wrapper = document.createElement("button");
        wrapper.classList.add("cardWrapper");
        wrapper.id = "card-" + data.id;
        const div = document.createElement("div");
        this.element = div;
        const innerElement = document.createElement("div");
        this.innerElement = innerElement;
        div.appendChild(innerElement);
        wrapper.appendChild(this.element);
        this.wrapper = wrapper;
        this.updateElement(false);
        let pointerDownTime = 0;
        div.addEventListener("pointerdown", e => {
            const card = this.game.cardData[this.id] ?? this;
            client.updateInventoryPlayability();
            console.log("client", client)
            console.log("this", this)
            console.log("playability", this.isPlayable())
            //if (this.tags.includes("pickup") && game.colorChooserActive) return;
            if (!card.tags.includes("pickup") && !wrapper.parentElement?.classList.contains("minipileInner") && !card.isPlayable()) return;
            if (card.tags.includes("discarded") && !wrapper.parentElement?.classList.contains("minipileInner")) return;
            if (!card.tags.includes("pickup") && !wrapper.parentElement?.classList.contains("minipileInner") && wrapper.parentElement !== document.getElementsByClassName("cardRack")[0]) return;
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

            if (card.tags.includes("pickup")) return;
            const piles = client.selectedCards.length > 0 && client.selectedCards.includes(this) ? client.playableTwins(client.selectedCards, client.getSelfPlayer(), getDraggedCard()) : this.playablePiles();

            for (let i = -1; i < 4; i++) {
                const cardDiscard = document.getElementsByClassName("cardDiscard" + i)[0];
                if (piles?.includes(i)) {
                    cardDiscard.classList.remove("unplayable")
                } else {
                    cardDiscard.classList.add("unplayable")
                }
                //if (i === game.closedPile) cardDiscard.classList.add("unplayable");
            }
        })
        wrapper.addEventListener("pointerup", async () => {
            if (Date.now() - pointerDownTime > 350) return;
            console.log("select?")
            const card = this.game.cardData[this.id] ?? this;
            if (!this.tags.includes("pickup") && !card.isPlayable()) return;
            console.log("is playable")
            if (!client.getSelfPlayer().cards.find(card => card.id === this.id)) return;
            console.log("has the card")
            if (this.tags.includes("discarded")) return;
            console.log("is not discarded")
            if (div.classList.contains("selectedCard")) {
                div.classList.remove("selectedCard")
                client.selectedCards.splice(client.selectedCards.indexOf(this), 1)
            } else {
                div.classList.add("selectedCard")
                client.selectedCards.push(this);
            }
            if (client.selectedCards.length > 0) {
                const piles = client.playableTwins(client.selectedCards, client.getSelfPlayer(), getDraggedCard());
                for (let i = 0; i < 4; i++) {
                    const cardDiscard = document.getElementsByClassName("cardDiscard" + i)[0];
                    if (piles?.includes(i)) {
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
    updateElement(inventory: boolean) {
        const element = this.element;
        const innerElement = this.innerElement;
        element.classList.add("card");
        innerElement.classList.add("cardInner");
        if (!this.hidden && this.color && this.number) {
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
            if (this.number.actionId === "tower") return;
            this.element.ariaLabel = `${this.color.name} ${this.number.name}${this.number.description ? " " + this.number.description : ""}${this.modifier?.name ? " " + this.modifier?.name : ""}`;
        }
        if (!inventory) this.wrapper.disabled = true;
        if (!this.hidden) innerElement.style = "";
        if (this.hidden) element.style = `--color: #fff; --dark: #fff; color: black;`;
        if (this.hidden) innerElement.style = "color: black;";
        if (this.hidden) innerElement.textContent = `Card`;
    }
    updateAbilityWild(isOpponent: boolean) {
        return;
        if (this.number!.abilityWild) {
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
        if (this.game.selectedCards.find(card => card.id === this.id)) return true;

        if (this.game.drawAmount > 0 && !this.number?.draw) return false;

        if (this.game.selectedCards.length === 0) {
            if (this.playablePiles().length > 0) return true;
        }
        // Handle the same symbol rule
        if (this.game.selectedCards[0]?.number === this.number) return true;

        // Handle the exact match rule
        if (this.game.selectedCards.length === 1) {
            for (let index = 0; index < this.game.discarded.length; index++) {
                const discard = this.game.discarded[index];
                if (discard.at(-1)?.color === this.game.selectedCards[0].color && discard.at(-1)?.number === this.game.selectedCards[0].number) return true;
            }
        }

        // Handle discard 2 of color
        if (this.game.selectedCards[0]?.number?.actionId === "discard2Color") {
            if (this.color !== this.game.selectedCards[0].color || (this.game.selectedCards.includes(this) ? false : this.game.selectedCards.length >= 2)) {
                return false;
            } else {
                if (this !== this.game.selectedCards[0]) return true;
            }
        }

        // Handle the twin rule
        if (this.number?.value === null || this.number?.value === undefined) return false;
        // Handle the succession rule
        if (this.game.selectedCards.length > 0) {
            const sorted = [...this.game.selectedCards, this].sort((a, b) => a.number?.value! - b.number?.value!);
            console.log(sorted);
            let last = null;
            let isValid = true;
            for (const card of sorted) {
                if (last === null) {
                    last = card;
                    continue;
                }
                if (card.number?.value !== last.number?.value! + 1 && last.number?.actionId !== "#") isValid = false;
                last = card;
            }
            console.log("isValid: " + isValid)
            if (isValid) return true;
        }
        if (this.game.selectedCards.length >= 2) return this.game.selectedCards.includes(this);
        if (this.game.selectedCards.length === 1) {
            if (this.game.selectedCards[0].number?.value === null || this.game.selectedCards[0].number?.value === undefined) return false;
            for (let index = 0; index < this.game.discarded.length; index++) {
                const discard = this.game.discarded[index];
                if (this.game.closedPile === index) continue;
                if (this.game.lockedPiles.includes(index) && this.game.checkLockApplication() && ((this.modifier?.actionId !== "lock" && this.number?.actionId !== "disarm") || (this.game.selectedCards[0].modifier?.actionId !== "lock" && this.game.selectedCards[0].number?.actionId !== "disarm"))) continue;
                if (this.game.selectedCards[0].number.value! + this.number.value === discard.at(-1)!.number?.value) return true;
                if (this.game.selectedCards[0].number.actionId === "#" && numberData.map(number => number.value).includes(discard.at(-1)?.number?.value! - this.number.value)) return true;
                if (this.number.actionId === "#" && numberData.map(number => number.value).includes(discard.at(-1)?.number?.value! - this.game.selectedCards[0].number.value)) return true;
            }
            if (this.number.value === this.game.selectedCards[0].number.value + 1 || this.number.actionId === "#") {
                return true;
            }
            return false;
        };
        if (this.game.selectedCards.length === 0) {
            for (const secondCard of this.game.getSelfPlayer()!.cards) {
                if (secondCard.number?.value === null || secondCard.number?.value === undefined) continue;
                if (this === secondCard) continue;
                for (let index = 0; index < this.game.discarded.length; index++) {
                    const discard = this.game.discarded[index];
                    if (this.game.closedPile === index) continue;
                    if (this.game.lockedPiles.includes(index) && ((this.modifier?.actionId !== "lock" && this.number?.actionId !== "disarm") || (secondCard.modifier?.actionId !== "lock" && secondCard.number?.actionId !== "disarm"))) continue;
                    if (discard.at(-1)?.number?.value === this.number.value + secondCard.number?.value!) return true;
                    if (this.number.actionId === "#") {
                        if (numberData.map(number => number.value).includes(discard.at(-1)?.number?.value! - secondCard.number?.value!)) return true;
                    }
                    if (secondCard.number.actionId === "#") {
                        if (numberData.map(number => number.value).includes(discard.at(-1)?.number?.value! - this.number.value)) return true;
                    }
                }
            }
        }
        return false;
    }
}