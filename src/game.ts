import { Card } from "./cards.ts";
import type { CardColor } from "./cards.ts";
import { random, shuffleArray, randomInteger, wait } from "./utils.ts";
import { getDraggedCard } from "./dragging.ts";
import numberData from "./data/numbers.json";
import colorData from "./data/colors.json";

export const discardedCards: Card[] = []

export class Game {
    inventory: Card[];
    discarded: Card[][];
    opponentHand: Card[];
    pickupCard: Card;
    selectedCards: Card[];
    drawAmount: number;
    drawPile: number;
    playersTurn: boolean;
    pressureAmount: number;
    closedPile: number;
    lockedPiles: number[];
    isMinipileActive: boolean;
    minipile: Card[];
    colorChooserActive: boolean;
    colorChooserPile: number;
    colorChooserAction: string;
    reflectCard: Card | null;
    reflectRes: Function | null;
    reflectPile: number;
    wasDragging: boolean;
    recentPlayerCards: {card: Card, pile: number}[];
    recentOpponentCards: {card: Card, pile: number}[];
    reobtainChooserActive: boolean;
    constructor() {
        this.inventory = [];
        this.opponentHand = [];
        for (let i = 0; i < 7; i++) {
            this.inventory.push(new Card())
            this.opponentHand.push(new Card(true))
        }
        this.discarded = [
            [new Card(false, ["discarded"])],
            [new Card(false, ["discarded"])],
            [new Card(false, ["discarded"])],
            [new Card(false, ["discarded"])]
        ];
        this.pickupCard = new Card(true, ["pickup"]);
        this.selectedCards = [];
        this.drawAmount = 0;
        this.drawPile = -1;
        this.playersTurn = true;
        this.pressureAmount = 1;
        this.closedPile = randomInteger(0, 3);
        this.lockedPiles = [];
        this.isMinipileActive = false;
        this.minipile = [];
        this.colorChooserActive = false;
        this.colorChooserPile = -1;
        this.colorChooserAction = "";
        this.reflectCard = null;
        this.reflectRes = null;
        this.reflectPile = -1;
        this.wasDragging = false;
        this.recentPlayerCards = [];
        this.recentOpponentCards = [];
        this.reobtainChooserActive = false;
    }
    updateCardDiscard() {
        for (let i = -1; i < 4; i++) {
            const pileContents = i === -1 ? this.minipile : this.discarded[i];
            const cardDiscard = document.getElementsByClassName("cardDiscard" + i)[0];
            cardDiscard.textContent = "";
            if (pileContents.length > 0) cardDiscard.appendChild(pileContents.at(-1)!.wrapper)
            if (!pileContents.at(-1)?.tags.includes("discarded")) pileContents.at(-1)?.tags.push("discarded")
            if (i === -1 && !pileContents.at(-1)?.tags.includes("minipile")) pileContents.at(-1)?.tags.push("minipile")
            pileContents.at(-1)?.element.classList.remove("unplayable");
            if (i === game.closedPile) {
                cardDiscard.classList.add("closed");
            } else {
                cardDiscard.classList.remove("closed");
            }
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
            }
        }
    }
    animateElementMovement(element: HTMLElement, destination: HTMLElement, parent: Element | false) {
        return new Promise(res => {
            element.style.position = "fixed";
            element.style.left = element.getBoundingClientRect().left + "px";
            element.style.top = element.getBoundingClientRect().top + "px";
            element.style.transition = "left .5s, top .5s"
            setTimeout(() => {
                element.style.left = destination.getBoundingClientRect().left + "px";
                element.style.top = destination.getBoundingClientRect().top + "px";
                setTimeout(() => {
                    if (parent) element.style.position = "";
                    if (parent) parent.appendChild(element);
                    this.updateCardDiscard();
                    element.style.transition = "";
                    res(null);
                }, 500)
            }, 100)
        });
    }
    async opponentTurn() {
        game.checkForWinCondition(false);
        this.playersTurn = false;
        this.closedPile = randomInteger(0, 3);
        updateInventoryPlayability();
        this.updateCardDiscard();
        for (const card of game.selectedCards) card.element.classList.remove("selectedCard");
        game.selectedCards.length = 0;
        if (game.drawAmount > 0) {
            for (const card of this.opponentHand) {
                if (card.playablePiles(true).length === 0) continue;
                if (!card.number.draw) continue;
                await this.opponentDiscard(card);
                this.playersTurn = true;
                this.closedPile = randomInteger(0, 3);
                updateInventoryPlayability();
                this.updateCardDiscard();
                this.endOpponentTurn();
                return;
            }
            for (let i = 0; i < game.drawAmount; i++) this.opponentPickup(true);
            game.drawAmount = 0;
            game.drawPile = -1;
            document.getElementsByClassName("drawAmountText")[0].textContent = "";
            this.playersTurn = true;
            this.closedPile = randomInteger(0, 3);
            updateInventoryPlayability();
            this.updateCardDiscard();
            await game.opponentTurn();
            //this.endOpponentTurn();
            return;
        }
        for (const card of this.opponentHand.filter(card => game.opponentHand.length <= game.inventory.length ? card.number.actionId !== "swap" && card.modifier?.actionId !== "swap" : true)) {
            console.log("playable", card.playablePiles())
            if (card.playablePiles(true).length > 0) {
                await this.opponentDiscard(card);
                if (card.number.actionId === "skip") await this.opponentTurn();
                this.playersTurn = true;
                this.closedPile = randomInteger(0, 3);
                updateInventoryPlayability();
                this.updateCardDiscard();
                this.endOpponentTurn();
                return
            }
        }
        await this.opponentPickup(true);
        this.playersTurn = true;
        this.closedPile = randomInteger(0, 3);
        updateInventoryPlayability();
        this.updateCardDiscard();
        await game.opponentTurn();
        //this.endOpponentTurn();
    }
    async endOpponentTurn() {
        if (this.closedPile === this.drawPile) {
            game.playersTurn = false;
            const placeholderDiv = document.createElement("div");
            placeholderDiv.classList.add("wrapper");
            document.getElementsByClassName("cardRack")[0].appendChild(placeholderDiv)
            setTimeout(() => placeholderDiv.remove(), 200)
            await game.animateElementMovement(game.pickupCard.element, placeholderDiv, game.pickupCard.wrapper)
            game.addToRack(game.pickupCard)
            for (let i = 0; i < game.drawAmount - 1; i++) {
                game.addToRack(new Card())
            }
            game.drawAmount = 0;
            game.drawPile = -1;
            document.getElementsByClassName("drawAmountText")[0].textContent = "";
            game.opponentTurn();
        }
        this.checkForWinCondition(true);
    }
    opponentDiscard(card: Card) {
        const notOverloaded = card.playablePiles(true).filter(pile => (pile === -1 ? game.minipile : game.discarded[pile]).at(-2)?.modifier?.actionId !== "overload")
        const pile: number = notOverloaded.length > 0 ? random(notOverloaded) : random(card.playablePiles(true));
        (pile === -1 ? game.minipile : this.discarded[pile]).push(card);
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
        card.wrapper.parentElement?.insertBefore(placeholderDiv, card.wrapper);
        card.updateElement();
        if (card.number.draw) {
            game.drawAmount += card.number.draw;
            game.drawPile = pile;
            document.getElementsByClassName("drawAmountText")[0].textContent = "+" + game.drawAmount;
        }
        if (card.modifier?.draw) {
            game.drawAmount += card.modifier?.draw;
            game.drawPile = pile;
            document.getElementsByClassName("drawAmountText")[0].textContent = "+" + game.drawAmount;
        }
        if (game.lockedPiles.includes(pile) && card.modifier?.actionId !== "lock") game.lockedPiles.splice(game.lockedPiles.indexOf(pile), 1);
        updateInventoryPlayability();
        return new Promise(res => {
            setTimeout(() => {
                const cardDiscard = document.getElementsByClassName("cardDiscard" + pile)[0].children[0];
                card.wrapper.style.left = cardDiscard.getBoundingClientRect().left + "px";
                card.wrapper.style.top = cardDiscard.getBoundingClientRect().top + "px";
                placeholderDiv.style.width = "0";
                setTimeout(() => {
                    card.wrapper.style.position = "";
                    placeholderDiv.remove();
                    cardDiscard.appendChild(card.wrapper);
                    this.updateCardDiscard();
                    game.recentOpponentCards.push({card, pile});
                    if (game.recentOpponentCards.length > 11) game.recentOpponentCards.shift();
                    this.applyOpponentDiscardEffects(card, pile);
                    res(null);
                }, 500)
            }, 100)
        })
    }
    opponentPickup(involveMinipile?: boolean): Promise<Card> {
        const card = game.isMinipileActive && involveMinipile ? game.minipile.at(-1)! : game.pickupCard;
        card.wrapper.style.position = "fixed";
        card.wrapper.style.left = card.wrapper.getBoundingClientRect().left + "px";
        card.wrapper.style.top = card.wrapper.getBoundingClientRect().top + "px";
        card.wrapper.style.transition = "left .5s, top .5s"
        card.tags.splice(card.tags.indexOf("pickup"), 1)
        if (!game.isMinipileActive || !involveMinipile) {
            for (const secondCard of document.querySelectorAll(".pickupPile .cardWrapper")) {
                if (secondCard === card.wrapper) continue;
                secondCard.remove();
            }
            game.pickupCard = new Card(true, ["pickup"])
            document.getElementsByClassName("pickupPile")[0].appendChild(game.pickupCard.wrapper)
        }
        updateInventoryPlayability();
        return new Promise(res => {
            setTimeout(() => {
                const opponentHand = document.getElementsByClassName("opponentHand")[0];
                card.wrapper.style.left = opponentHand.getBoundingClientRect().left + "px";
                card.wrapper.style.top = opponentHand.getBoundingClientRect().top + "px";
                setTimeout(async () => {
                    card.wrapper.style.position = "";
                    opponentHand.appendChild(card.wrapper);
                    game.opponentHand.push(card);
                    if (game.isMinipileActive && involveMinipile) {
                        for (const secondCard of game.minipile) {
                            if (card === secondCard) continue;
                            secondCard.tags.splice(card.tags.indexOf("minipile"), 1);
                            secondCard.tags.splice(card.tags.indexOf("discarded"), 1);
                            game.opponentHand.push(secondCard);
                        }
                        game.minipile.length = 0;
                        game.isMinipileActive = false;
                        document.getElementsByClassName("minipileOuter")[0].classList.add("minipileExit");
                        updateInventoryPlayability();
                        this.updateCardDiscard();
                    }
                    if (!this.isMinipileActive || !involveMinipile) {
                        if (card.number.actionId === "draw3More") {
                            card.hidden = false;
                            card.updateElement();
                            for (let i = 0; i < 3; i++) {
                                if (game.opponentHand.length > 30) break;
                                await this.opponentPickup();
                            }
                        }
                    }
                    res(card);
                }, 500)
            }, 100)
        })
    }
    addToRack(card: Card) {
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
    async discardCard(card: Card, pile: number) {
        const cardDiscard = document.getElementsByClassName("cardDiscard" + pile)[0];
        cardDiscard.textContent = "";
        cardDiscard.appendChild(card.wrapper)
        console.log(pile)
        card.element.classList.remove("unplayable");
        if (pile === -1) {
            game.minipile.push(card);
        } else game.discarded[pile].push(card);
        game.inventory.splice(game.inventory.indexOf(card), 1)

        if (game.lockedPiles.includes(pile) && card.modifier?.actionId !== "lock") game.lockedPiles.splice(game.lockedPiles.indexOf(pile), 1);
        updateInventoryPlayability();
        game.updateCardDiscard();
        if (game.inventory.length === 0 || game.opponentHand.length === 0) return;
        if (card.number.draw) {
            game.drawAmount += card.number.draw;
            game.drawPile = pile;
            document.getElementsByClassName("drawAmountText")[0].textContent = "+" + game.drawAmount;
        }
        if (card.modifier?.draw) {
            game.drawAmount += card.modifier?.draw;
            game.drawPile = pile;
            document.getElementsByClassName("drawAmountText")[0].textContent = "+" + game.drawAmount;
        }
        game.recentPlayerCards.push({card, pile});
        if (game.recentPlayerCards.length > 11) game.recentPlayerCards.shift();
        return await this.applyPlayerDiscardEffects(card, pile);
    }
    async applyPlayerDiscardEffects (card: Card, pile: number) {
        const pileContents = pile === -1 ? game.minipile : game.discarded[pile];
        for (let i = -1; i < 4; i++) {
            document.getElementsByClassName("randomOccuranceLabel" + i)[0].textContent = ""
        }
        if (card.number.actionId === "swap" || card.modifier?.actionId === "swap") {
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
        if (card.number.actionId === "50") {
            if (Math.random() > 0.5) {
                game.drawAmount += 4;
                game.drawPile = pile;
                document.getElementsByClassName("drawAmountText")[0].textContent = "+" + game.drawAmount;
                return true;
            } else {
                game.drawAmount += 4;
                game.drawPile = pile;
                document.getElementsByClassName("drawAmountText")[0].textContent = "+" + game.drawAmount;
            }
        }
        if (card.modifier?.actionId === "x2") {
            game.pressureAmount += 2;
            if (game.pressureAmount >= 10) {
                game.drawAmount += randomInteger(1, 10);
                game.pressureAmount = 1;
                game.drawPile = pile;
                document.getElementsByClassName("drawAmountText")[0].textContent = "+" + game.drawAmount;
            }
            document.getElementsByClassName("pressureCount")[0].textContent = "Pressure: " + game.pressureAmount + "/10";
        }
        if (card.number.actionId === "discardAll") {
            console.log("inventory", game.inventory)
            for (const secondCard of game.inventory) {
                if (secondCard.color !== card.color) continue;
                pileContents.unshift(secondCard);
                secondCard.wrapper.remove();
                game.inventory.splice(game.inventory.indexOf(secondCard), 1)
                updateInventoryPlayability();
                console.log("discard");
                console.log(secondCard);
            }
        }
        if (card.number?.actionId === "x10") {
            game.drawAmount += randomInteger(1, 10);
            game.pressureAmount = 1;
            game.drawPile = pile;
            document.getElementsByClassName("drawAmountText")[0].textContent = "+" + game.drawAmount;
            document.getElementsByClassName("pressureCount")[0].textContent = "Pressure: " + game.pressureAmount + "/10";
        }
        if (card.number?.actionId === "drawColor") {
            game.playersTurn = false;
            for (let i = 0; i < 25; i++) {
                const newCard = await this.opponentPickup();
                if (newCard.color === card.color) break;
            }
        }
        if (card.modifier?.actionId === "randomOccurance") {
            switch (randomInteger(1, 8)) {
                case 1:
                    while (game.inventory.length > 2) {
                        pileContents.unshift(game.inventory[0]);
                        game.inventory[0].wrapper.remove();
                        game.inventory.splice(game.inventory.indexOf(game.inventory[0]), 1)
                        updateInventoryPlayability();
                    }
                    document.getElementsByClassName("randomOccuranceLabel" + pile)[0].textContent = "Discard all but 2"
                    break;
                case 2:
                    const number = game.inventory[0].number;
                    for (const secondCard of game.inventory) {
                        if (secondCard.number === number) {
                            pileContents.unshift(game.inventory[0]);
                            game.inventory[0].wrapper.remove();
                            game.inventory.splice(game.inventory.indexOf(game.inventory[0]), 1)
                            updateInventoryPlayability();
                        }
                    }
                    document.getElementsByClassName("randomOccuranceLabel" + pile)[0].textContent = "Discard number"
                    break;
                case 3:
                    const color = game.inventory[0].color;
                    for (const secondCard of game.inventory) {
                        if (secondCard.color === color) {
                            pileContents.unshift(game.inventory[0]);
                            game.inventory[0].wrapper.remove();
                            game.inventory.splice(game.inventory.indexOf(game.inventory[0]), 1)
                            updateInventoryPlayability();
                        }
                    }
                    document.getElementsByClassName("randomOccuranceLabel" + pile)[0].textContent = "Discard color"
                    break;
                case 4:
                    game.playersTurn = false;
                    for (let i = 0; i < 25; i++) {
                        const newCard = await this.opponentPickup();
                        if (newCard.color === card.color) break;
                    }
                    document.getElementsByClassName("randomOccuranceLabel" + pile)[0].textContent = "Draw until color"
                    break;
                case 5:
                    const playersHand = Array.from(game.inventory);
                    const opponentHand = Array.from(game.opponentHand);
                    game.inventory.length = 0;
                    for (const card of opponentHand) game.inventory.push(card);
                    game.opponentHand.length = 0;
                    for (const card of playersHand) game.opponentHand.push(card);
                    this.updateHands();
                    document.getElementsByClassName("randomOccuranceLabel" + pile)[0].textContent = "Swap hands"
                    break;
                case 6:
                    document.getElementsByClassName("randomOccuranceLabel" + pile)[0].textContent = "Nothing"
                    break;
                case 7:
                    const highestPlayer = Array.from(game.inventory).sort((a, b) => b.number?.value ?? -1 - (a.number?.value ?? -1))[0]
                    const highestOpponent = Array.from(game.opponentHand).sort((a, b) => b.number?.value ?? -1 - (a.number?.value ?? -1))[0]
                    if ((highestPlayer.number?.value ?? -1) > (highestOpponent.number?.value ?? -1)) {
                        pileContents.unshift(highestPlayer);
                        game.inventory.splice(game.inventory.indexOf(highestPlayer), 1)
                        updateInventoryPlayability();
                        highestPlayer.wrapper.remove();
                    } else {
                        pileContents.unshift(highestOpponent);
                        game.opponentHand.splice(game.opponentHand.indexOf(highestOpponent), 1)
                        updateInventoryPlayability();
                        highestOpponent.wrapper.remove();
                    }
                    document.getElementsByClassName("randomOccuranceLabel" + pile)[0].textContent = "Discard highest card"
                    break;
                case 8:
                    if (Math.random() > 0.5) {
                        pileContents.unshift(game.inventory[0]);
                        game.inventory[0].wrapper.remove();
                        game.inventory.splice(game.inventory.indexOf(game.inventory[0]), 1)
                        updateInventoryPlayability();
                    } else {
                        pileContents.unshift(game.opponentHand[0]);
                        game.opponentHand[0].wrapper.remove();
                        game.opponentHand.splice(game.opponentHand.indexOf(game.opponentHand[0]), 1)
                        updateInventoryPlayability();
                    }
                    document.getElementsByClassName("randomOccuranceLabel" + pile)[0].textContent = "Discard random card"
            }
        }
        if (card.number.actionId !== "disarm" && card.number.actionId !== "giveaway" && pileContents.at(-2)?.modifier?.actionId === "overload") {
            game.drawAmount += randomInteger(1, 4);
            game.drawPile = pile;
            document.getElementsByClassName("drawAmountText")[0].textContent = "+" + game.drawAmount;
            this.updateCardDiscard();
            return true;
        }
        if (card.number.actionId === "giveaway" && pileContents.at(-2)?.modifier?.actionId === "overload") {
            game.drawAmount += randomInteger(1, 4);
            game.drawPile = pile;
            document.getElementsByClassName("drawAmountText")[0].textContent = "+" + game.drawAmount;
            this.updateCardDiscard();
        }
        if (card.modifier?.actionId === "-2") {
            for (let i = 0; i < 2; i++) {
                const oldCard = game.opponentHand.shift()!;
                oldCard?.wrapper.remove();
                pileContents.unshift(oldCard);
                game.opponentPickup();
            }
        }
        if (card.number?.actionId === "randomOccurance") {
            switch (randomInteger(1, 8)) {
                case 1:
                    document.getElementsByClassName("randomOccuranceLabel" + pile)[0].textContent = "Occurance disappeared?"
                    break;
                case 2:
                    document.getElementsByClassName("randomOccuranceLabel" + pile)[0].textContent = "Ye skip a turn"
                    return true;
                case 3:
                    game.drawAmount = 2;
                    game.drawPile = pile;
                    document.getElementsByClassName("randomOccuranceLabel" + pile)[0].textContent = "DRAW 2!!!"
                    break;
                case 4:
                    game.drawAmount = 1;
                    game.drawPile = pile;
                    document.getElementsByClassName("randomOccuranceLabel" + pile)[0].textContent = "Draw 1"
                    break;
                case 5:
                    game.opponentPickup();
                    document.getElementsByClassName("randomOccuranceLabel" + pile)[0].textContent = "Pickup time"
                    return true;
                case 6:
                    game.drawAmount = 2;
                    game.drawPile = pile;
                    document.getElementsByClassName("randomOccuranceLabel" + pile)[0].textContent = "Draw 2 but for YOU"
                    return true;
            }
        }
        if (card.modifier?.actionId === "lock") {
            if (!game.lockedPiles.includes(pile)) game.lockedPiles.push(pile);
        }
        if (card.number?.actionId === "minipile") {
            game.isMinipileActive = true;
            const minipileCard = new Card(false, ["minipile"]);
            document.getElementsByClassName("minipileInner")[0].textContent = "";
            document.getElementsByClassName("minipileInner")[0].appendChild(minipileCard.wrapper)
            game.minipile.push(minipileCard);
            (document.getElementsByClassName("minipileOuter")[0] as HTMLElement).hidden = false;
            document.getElementsByClassName("minipileOuter")[0].classList.remove("minipileExit");
            minipileCard.element.classList.remove("unplayable")
            this.updateCardDiscard();
            updateInventoryPlayability();
        }
        if (card.number.actionId === "draw3DiscardColor" || card.number.actionId === "draw1To2Color") {
            (document.getElementsByClassName("colorChooser")[0] as HTMLDivElement).hidden = false;
            document.getElementsByClassName("colorChooser")[0].classList.remove("colorChooserExit");
            this.colorChooserActive = true;
            this.colorChooserPile = pile;
            this.colorChooserAction = card.number.actionId;
            updateInventoryPlayability();
            return true;
        }
        if (card.number?.actionId === "giveAwayColor") {
            const color = game.inventory[0].color;
            for (const secondCard of game.inventory) {
                if (secondCard.color === color) {
                    pileContents.unshift(game.inventory[0]);
                    //game.inventory[0].wrapper.remove();
                    game.inventory.splice(game.inventory.indexOf(game.inventory[0]), 1)
                    game.opponentHand.push(secondCard);
                    //document.getElementsByClassName("opponentHand")[0].appendChild(secondCard.wrapper)
                    await this.animateElementMovement(secondCard.wrapper, document.getElementsByClassName("opponentHand")[0] as HTMLElement, document.getElementsByClassName("opponentHand")[0])
                    updateInventoryPlayability();
                }
            }
        }
        if (card.number?.actionId === "lottery") {
            const lotteryDarken = document.getElementsByClassName("lotteryDarken")[0] as HTMLDivElement;
            lotteryDarken.hidden = false;
            lotteryDarken.style.animation = "1s lotteryOpacityIn";

            (document.getElementsByClassName("lotteryRow")[0] as HTMLElement).hidden = false;
            
            const targetNumber = randomInteger(1, 5);
            const lotteryDice = document.createElement("div");
            lotteryDice.classList.add("lotteryDice");
            lotteryDice.textContent = targetNumber + "";
            lotteryDice.style.animation = "1s lotteryDice"
            lotteryDice.style.background = colorData[targetNumber].color;
            document.getElementsByClassName("lotteryRow")[0].appendChild(lotteryDice);

            let isWinning = true;
            for (let i = 0; i < 5; i++) {   
                await wait(1000);
                const number = randomInteger(1, 6);
                const lotteryDice = document.createElement("div");
                lotteryDice.classList.add("lotteryDice");
                lotteryDice.textContent = number + "";
                lotteryDice.style.animation = "1s lotteryDice"
                if (number === 6) {
                    lotteryDice.style.background = colorData.find(color => color.wild)!.color;
                    lotteryDice.style.color = colorData.find(color => color.wild)!.text ?? "";
                } else lotteryDice.style.background = colorData[number].color;
                lotteryDice.style.left = `calc(50vw - 17.5rem + ${(i + 1) * 6}rem)`
                document.getElementsByClassName("lotteryRow")[0].appendChild(lotteryDice)
                if (number !== targetNumber && number !== 6) isWinning = false;
            }
            await wait(1000);
            const resultDiv = document.getElementsByClassName("lotteryResult")[0] as HTMLDivElement;
            resultDiv.hidden = false;
            resultDiv.style.animation = ".5s lotteryOpacityIn";
            if (isWinning) {
                resultDiv.textContent = "You won!"
            } else {
                resultDiv.textContent = "Better luck next time!"
            }
            await wait(1500);
            lotteryDarken.style.animation = ".5s lotteryOpacityOut";
            resultDiv.style.animation = ".5s lotteryOpacityOut";
            (document.getElementsByClassName("lotteryRow")[0] as HTMLElement).style.animation = ".5s lotteryOpacityOut";
        }
        if (card.number?.actionId === "colorDraw") {
            const color = random(colorData.filter((color: CardColor) => !color.wild));
            game.playersTurn = false;
            for (let i = 0; i < 25; i++) {
                const newCard = await this.opponentPickup();
                newCard.hidden = false;
                newCard.updateElement();
                if (newCard.color === color) break;
            }
            game.playersTurn = true;
            return true;
        }
        if (card.number.actionId === "blueRandom") {
            switch (randomInteger(1, 6)) {
                case 1:
                    game.playersTurn = false;
                    for (let i = 0; i < 25; i++) {
                        const newCard = await this.opponentPickup();
                        if (newCard.color.name === "Blue" || newCard.number.value === 2 || newCard.number.value === 0 || newCard.color.wild) break;
                    }
                    break;
                case 2:
                    await this.applyOpponentDiscardEffects(card, pile);
                    break;
                case 3:
                    for (let i = 0; i < 3; i++) {
                        await this.opponentPickup();
                    }
                    break;
                case 4:
                    for (let i = 0; i < 2; i++) {
                        await this.opponentPickup();
                    }
                    break;
                case 5:
                    const secondCard = game.inventory[0];
                    game.inventory.splice(game.inventory.indexOf(secondCard, 1));
                    game.opponentHand.push(secondCard);
                    document.getElementsByClassName("opponentHand")[0].appendChild(secondCard.wrapper);
                    updateInventoryPlayability();
                    break;
                case 6:
                    for (let i = 0; i < 2; i++) {
                        const thirdCard = game.inventory[0];
                        game.inventory.splice(game.inventory.indexOf(thirdCard, 1));
                        (pile === -1 ? game.minipile : game.discarded[pile]).push(thirdCard);
                        document.getElementsByClassName("cardDiscard" + pile)[0].textContent = "";
                        document.getElementsByClassName("cardDiscard" + pile)[0].appendChild(thirdCard.wrapper);
                        this.updateCardDiscard();
                        break;
                    }
            }
        }
        if (card.number.actionId === "reobtain") {
            const reobtainRack = document.getElementsByClassName("reobtainRack")[0] as HTMLDivElement;
            let count = 0;
            recentPlayerCards:
            for (const {card} of game.recentPlayerCards) {
                //if (card === game.recentPlayerCards.at(-1)?.card) continue;
                for (const discard of game.discarded) {
                    if (discard.at(-1) === card) break recentPlayerCards;
                }
                if (game.minipile.at(-1) === card) break recentPlayerCards;
                if (game.opponentHand.includes(card)) break recentPlayerCards;
                if (game.inventory.includes(card)) break recentPlayerCards;
                const cardEntry = document.createElement("div");
                cardEntry.classList.add("cardEntry");
                cardEntry.appendChild(card.wrapper);
                const cardDiscardButton = document.createElement("button");
                cardDiscardButton.textContent = "Discard";
                cardEntry.appendChild(cardDiscardButton);
                const cardAddButton = document.createElement("button");
                cardAddButton.textContent = "Add to inventory";
                cardEntry.appendChild(cardAddButton);
                card.element.classList.remove("selectedCard");
                cardDiscardButton.addEventListener("click", async () => {
                    reobtainRack.style.animation = "1s moveRightOut";
                    await game.animateElementMovement(card.wrapper, document.getElementsByClassName("cardDiscard" + pile)[0].children[0] as HTMLElement, document.getElementsByClassName("cardDiscard" + pile)[0]);
                    game.discarded[pile].push(card);
                    document.getElementsByClassName("cardDiscard" + pile)[0].textContent = "";
                    document.getElementsByClassName("cardDiscard" + pile)[0].appendChild(card.wrapper);
                    this.updateCardDiscard();
                    this.reobtainChooserActive = false;
                    if (!(await game.applyPlayerDiscardEffects(card, pile))) await game.opponentTurn();
                })
                cardAddButton.addEventListener("click", async () => {
                    reobtainRack.style.animation = "1s moveRightOut";
                    await game.animateElementMovement(card.wrapper, document.getElementsByClassName("cardRack")[0].children[0] as HTMLElement, document.getElementsByClassName("cardRack")[0]);
                    game.inventory.push(card);
                    document.getElementsByClassName("cardRack")[0].appendChild(card.wrapper);
                    this.updateCardDiscard();
                    updateInventoryPlayability();
                    this.reobtainChooserActive = false;
                    if (!(await game.applyPlayerDiscardEffects(card, pile))) await game.opponentTurn();
                })
                reobtainRack.appendChild(cardEntry);
                count++;
                if (count >= 5) break;
            }
            if (count > 0) {
                reobtainRack.hidden = false;
                reobtainRack.style.animation = "1s moveLeftIn";
                this.reobtainChooserActive = true;
                return true;
            }
        }
    }
    async applyOpponentDiscardEffects(card: Card, pile: number) {
        if (game.inventory.length === 0 || game.opponentHand.length === 0) return;
        for (let i = -1; i < 4; i++) {
            document.getElementsByClassName("randomOccuranceLabel" + i)[0].textContent = ""
        }
        const pileContents = pile === -1 ? game.minipile : game.discarded[pile];
        if (card.number.actionId === "swap" || card.modifier?.actionId === "swap") {
            if (await this.checkForReflectStatus(pile)) return;
            const playersHand = Array.from(game.inventory);
            const opponentHand = Array.from(game.opponentHand);
            game.inventory.length = 0;
            for (const card of opponentHand) game.inventory.push(card);
            game.opponentHand.length = 0;
            for (const card of playersHand) game.opponentHand.push(card);
            this.updateHands();
        }
        if (card.number.actionId === "shuffle") {
            if (await this.checkForReflectStatus(pile)) return;
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
        if (card.number.actionId === "50") {
            if (Math.random() > 0.5) {
                game.drawAmount += 4;
                game.drawPile = pile;
                document.getElementsByClassName("drawAmountText")[0].textContent = "+" + game.drawAmount;
                await game.opponentTurn();
            } else {
                game.drawAmount += 4;
                game.drawPile = pile;
                document.getElementsByClassName("drawAmountText")[0].textContent = "+" + game.drawAmount;
            }
        }
        if (card.modifier?.actionId === "x2") {
            game.pressureAmount += 2;
            if (game.pressureAmount >= 10) {
                game.drawAmount += randomInteger(1, 10);
                game.pressureAmount = 1;
                game.drawPile = pile;
                document.getElementsByClassName("drawAmountText")[0].textContent = "+" + game.drawAmount;
            }
            document.getElementsByClassName("pressureCount")[0].textContent = "Pressure: " + game.pressureAmount + "/10";
        }
        if (card.number.actionId === "discardAll") {
            for (const secondCard of game.opponentHand) {
                if (secondCard.color !== card.color) continue;
                pileContents.unshift(secondCard);
                secondCard.wrapper.remove();
                game.opponentHand.splice(game.opponentHand.indexOf(secondCard), 1)
                updateInventoryPlayability();
            }
        }
        if (card.number?.actionId === "x10") {
            game.drawAmount += randomInteger(1, 10);
            game.pressureAmount = 1;
            game.drawPile = pile;
            document.getElementsByClassName("drawAmountText")[0].textContent = "+" + game.drawAmount;
            document.getElementsByClassName("pressureCount")[0].textContent = "Pressure: " + game.pressureAmount + "/10";
        }
        if (card.number?.actionId === "drawColor") {
            if (await this.checkForReflectStatus(pile)) return;
            const placeholderDiv = document.createElement("div");
            placeholderDiv.classList.add("wrapper");
            document.getElementsByClassName("cardRack")[0].appendChild(placeholderDiv)
            setTimeout(() => placeholderDiv.remove(), 200)
            await game.animateElementMovement(game.pickupCard.element, placeholderDiv, game.pickupCard.wrapper)
            const pickupCard = game.pickupCard
            game.addToRack(game.pickupCard)
            if (pickupCard.color === card.color) return;
            for (let i = 0; i < 25; i++) {
                const newCard = new Card();
                this.addToRack(newCard);
                if (newCard.color === card.color) return;
            }
        }
        if (card.modifier?.actionId === "randomOccurance") {
            if (await this.checkForReflectStatus(pile)) return;
            switch (randomInteger(1, 8)) {
                case 1:
                    while (game.opponentHand.length > 2) {
                        pileContents.unshift(game.opponentHand[0]);
                        game.opponentHand[0].wrapper.remove();
                        game.opponentHand.splice(game.opponentHand.indexOf(game.opponentHand[0]), 1)
                        updateInventoryPlayability();
                    }
                    document.getElementsByClassName("randomOccuranceLabel" + pile)[0].textContent = "Discard all but 2"
                    break;
                case 2:
                    const number = game.opponentHand[0].number;
                    for (const secondCard of game.opponentHand) {
                        if (secondCard.number === number) {
                            pileContents.unshift(game.opponentHand[0]);
                            game.opponentHand[0].wrapper.remove();
                            game.opponentHand.splice(game.opponentHand.indexOf(game.opponentHand[0]), 1)
                            updateInventoryPlayability();
                        }
                    }
                    document.getElementsByClassName("randomOccuranceLabel" + pile)[0].textContent = "Discard number"
                    break;
                case 3:
                    const color = game.opponentHand[0].color;
                    for (const secondCard of game.opponentHand) {
                        if (secondCard.color === color) {
                            pileContents.unshift(game.opponentHand[0]);
                            game.opponentHand[0].wrapper.remove();
                            game.opponentHand.splice(game.opponentHand.indexOf(game.opponentHand[0]), 1)
                            updateInventoryPlayability();
                        }
                    }
                    document.getElementsByClassName("randomOccuranceLabel" + pile)[0].textContent = "Discard color"
                    break;
                case 4:
                    (async () => {
                        const placeholderDiv = document.createElement("div");
                        placeholderDiv.classList.add("wrapper");
                        document.getElementsByClassName("cardRack")[0].appendChild(placeholderDiv)
                        setTimeout(() => placeholderDiv.remove(), 200)
                        await game.animateElementMovement(game.pickupCard.element, placeholderDiv, game.pickupCard.wrapper)
                        const pickupCard = game.pickupCard
                        game.addToRack(game.pickupCard)
                        if (pickupCard.color === card.color) return;
                        for (let i = 0; i < 25; i++) {
                            const newCard = new Card();
                            this.addToRack(newCard);
                            if (newCard.color === card.color) return;
                        }
                    })();
                    document.getElementsByClassName("randomOccuranceLabel" + pile)[0].textContent = "Keep drawing until color"
                    break;
                case 5:
                    const playersHand = Array.from(game.inventory);
                    const opponentHand = Array.from(game.opponentHand);
                    game.inventory.length = 0;
                    for (const card of opponentHand) game.inventory.push(card);
                    game.opponentHand.length = 0;
                    for (const card of playersHand) game.opponentHand.push(card);
                    this.updateHands();
                    document.getElementsByClassName("randomOccuranceLabel" + pile)[0].textContent = "Swap?"
                    break;
                case 6:
                    document.getElementsByClassName("randomOccuranceLabel" + pile)[0].textContent = "No occurance for you"
                    break;
                case 7:
                    const highestPlayer = Array.from(game.inventory).sort((a, b) => b.number?.value ?? -1 - (a.number?.value ?? -1))[0]
                    const highestOpponent = Array.from(game.opponentHand).sort((a, b) => b.number?.value ?? -1 - (a.number?.value ?? -1))[0]
                    if ((highestPlayer.number?.value ?? -1) >= (highestOpponent.number?.value ?? -1)) {
                        pileContents.unshift(highestPlayer);
                        game.inventory.splice(game.inventory.indexOf(highestPlayer), 1)
                        updateInventoryPlayability();
                        highestPlayer.wrapper.remove();
                    } else {
                        pileContents.unshift(highestOpponent);
                        game.opponentHand.splice(game.opponentHand.indexOf(highestOpponent), 1)
                        updateInventoryPlayability();
                        highestOpponent.wrapper.remove();
                    }
                    document.getElementsByClassName("randomOccuranceLabel" + pile)[0].textContent = "Bye that high card"
                    break;
                case 8:
                    if (Math.random() > 0.5) {
                        pileContents.unshift(game.inventory[0]);
                        game.inventory[0].wrapper.remove();
                        game.inventory.splice(game.inventory.indexOf(game.inventory[0]), 1)
                        updateInventoryPlayability();
                    } else {
                        pileContents.unshift(game.opponentHand[0]);
                        game.opponentHand[0].wrapper.remove();
                        game.opponentHand.splice(game.opponentHand.indexOf(game.opponentHand[0]), 1)
                        updateInventoryPlayability();
                    }
                    document.getElementsByClassName("randomOccuranceLabel" + pile)[0].textContent = "Oooo I stole that card"
            }
        }
        if (card.number.actionId !== "disarm" && card.number.actionId !== "giveaway" && pileContents.at(-2)?.modifier?.actionId === "overload") {
            game.drawAmount += randomInteger(1, 4);
            game.drawPile = pile;
            document.getElementsByClassName("drawAmountText")[0].textContent = "+" + game.drawAmount;
            await game.opponentTurn();
        }
        if (card.number.actionId === "giveaway" && pileContents.at(-2)?.modifier?.actionId === "overload") {
            game.drawAmount += randomInteger(1, 4);
            game.drawPile = pile;
            document.getElementsByClassName("drawAmountText")[0].textContent = "+" + game.drawAmount;
        }
        if (card.modifier?.actionId === "-2") {
            if (await this.checkForReflectStatus(pile)) return;
            for (let i = 0; i < 2; i++) {
                const oldCard = game.inventory.shift()!;
                oldCard?.wrapper.remove();
                pileContents.unshift(oldCard);
                await this.playerForcePickup();
            }
        }
        if (card.number?.actionId === "randomOccurance") {
            if (await this.checkForReflectStatus(pile)) return;
            switch (randomInteger(1, 8)) {
                case 1:
                    break;
                case 2:
                    await game.opponentTurn();
                    break;
                case 3:
                    game.drawAmount = 2;
                    game.drawPile = pile;
                    break;
                case 4:
                    game.drawAmount = 1;
                    game.drawPile = pile;
                    break;
                case 5:
                    await this.playerForcePickup();
                    return true;
                case 6:
                    for (let i = 0; i < 2; i++) await game.opponentPickup();
            }
        }
        if (card.modifier?.actionId === "lock") {
            if (!game.lockedPiles.includes(pile)) game.lockedPiles.push(pile);
        }
        if (card.number?.actionId === "minipile") {
            game.isMinipileActive = true;
            const minipileCard = new Card(false, ["minipile"]);
            document.getElementsByClassName("minipileInner")[0].textContent = "";
            document.getElementsByClassName("minipileInner")[0].appendChild(minipileCard.wrapper)
            game.minipile.push(minipileCard);
            (document.getElementsByClassName("minipileOuter")[0] as HTMLElement).hidden = false;
            document.getElementsByClassName("minipileOuter")[0].classList.remove("minipileExit");
            minipileCard.element.classList.remove("unplayable")
            this.updateCardDiscard();
            updateInventoryPlayability();
        }
        if (card.number.actionId === "draw3DiscardColor") {
            if (await this.checkForReflectStatus(pile)) return;
            for (let i = 0; i < 3; i++) {
                await this.playerForcePickup();
            }
            const color: CardColor = random(colorData);
            for (const card of game.inventory) {
                if (card.color.name === color.name) {
                    game.inventory.splice(game.inventory.indexOf(card), 1);
                    card.wrapper.remove();
                    if (game.colorChooserPile === -1) {
                        game.minipile.unshift(card);
                    } else {
                        game.discarded[game.colorChooserPile].unshift(card);
                    }
                }
            }
        }
        if (card.number.actionId === "draw1To2Color") {
            if (await this.checkForReflectStatus(pile)) return;
            const card = await game.playerForcePickup();
            const color: CardColor = random(colorData);
            if (card.color.name !== color.name) {
                await game.playerForcePickup();
            };
        }
        if (card.number.actionId === "colorDraw") {
            if (await this.checkForReflectStatus(pile)) return;
            (document.getElementsByClassName("colorChooser")[0] as HTMLDivElement).hidden = false;
            document.getElementsByClassName("colorChooser")[0].classList.remove("colorChooserExit");
            this.colorChooserActive = true;
            this.colorChooserPile = pile;
            this.colorChooserAction = card.number.actionId;
            updateInventoryPlayability();
        }
        if (card.number.actionId === "blueRandom") {
            switch (randomInteger(1, 6)) {
                case 1:
                    const placeholderDiv = document.createElement("div");
                    placeholderDiv.classList.add("wrapper");
                    document.getElementsByClassName("cardRack")[0].appendChild(placeholderDiv)
                    setTimeout(() => placeholderDiv.remove(), 200)
                    await game.animateElementMovement(game.pickupCard.element, placeholderDiv, game.pickupCard.wrapper)
                    const pickupCard = game.pickupCard
                    game.addToRack(game.pickupCard)
                    if (pickupCard.color === card.color) return;
                    for (let i = 0; i < 25; i++) {
                        const newCard = new Card();
                        this.addToRack(newCard);
                        if (newCard.color.name === "Blue" || newCard.number.value === 2 || newCard.number.value === 0 || newCard.color.wild) return;
                    }
                    break;
                case 2:
                    await this.applyPlayerDiscardEffects(card, pile);
                    break;
                case 3:
                    for (let i = 0; i < 3; i++) {
                        await this.playerForcePickup();
                    }
                    break;
                case 4:
                    for (let i = 0; i < 2; i++) {
                        await this.playerForcePickup();
                    }
                    break;
                case 5:
                    const secondCard = game.opponentHand[0];
                    game.opponentHand.splice(game.opponentHand.indexOf(secondCard, 1));
                    game.inventory.push(secondCard);
                    document.getElementsByClassName("cardRack")[0].appendChild(secondCard.wrapper);
                    updateInventoryPlayability();
                    break;
                case 6:
                    for (let i = 0; i < 2; i++) {
                        const thirdCard = game.opponentHand[0];
                        game.opponentHand.splice(game.opponentHand.indexOf(thirdCard, 1));
                        (pile === -1 ? game.minipile : game.discarded[pile]).push(thirdCard);
                        document.getElementsByClassName("cardDiscard" + pile)[0].textContent = "";
                        document.getElementsByClassName("cardDiscard" + pile)[0].appendChild(thirdCard.wrapper);
                        this.updateCardDiscard();
                        break;
                    }
            }
        }
    }
    updateHands() {
        const cardRack = document.getElementsByClassName("cardRack")[0];
        cardRack.textContent = "";
        console.log("inventory");
        console.log(game.inventory)
        console.log(game.opponentHand)
        for (const card of game.inventory) {
            card.hidden = false;
            if (card.tags.includes("pickup")) card.tags.splice(card.tags.indexOf("pickup"), 1);
            card.updateElement();
            cardRack.appendChild(card.wrapper)
        }
        updateInventoryPlayability();
        const opponentHand = document.getElementsByClassName("opponentHand")[0];
        opponentHand.textContent = "";
        for (const card of game.opponentHand) {
            card.element.classList.remove("unplayable");
            opponentHand.appendChild(card.wrapper)
        }
    }
    async playerForcePickup () {
        const placeholderDiv = document.createElement("div");
        placeholderDiv.classList.add("wrapper");
        document.getElementsByClassName("cardRack")[0].appendChild(placeholderDiv)
        setTimeout(() => placeholderDiv.remove(), 200)
        await game.animateElementMovement(game.pickupCard.element, placeholderDiv, game.pickupCard.wrapper)
        const pickupCard = game.pickupCard;
        game.addToRack(game.pickupCard)
        return pickupCard;
    }
    playableTwins() {
        if (game.selectedCards.length === 1) return game.selectedCards[0].playablePiles();
        const piles = [];
        if (game.selectedCards.length === 2 && !isNaN(+game.selectedCards[0].number.value!) && !isNaN(+game.selectedCards[1].number.value!)) {
            for (let index = -1; index < game.discarded.length; index++) {
                if (game.isMinipileActive && index >= 0) continue;
                if (!game.isMinipileActive && index === -1) continue;
                const discard = index === -1 ? game.minipile : game.discarded[index];
                if (game.closedPile === index) continue;
                if (discard.at(-1)?.number.value === game.selectedCards[0].number.value! + game.selectedCards[1].number.value!) piles.push(index)
                if (game.selectedCards[0].number.actionId === "#" && numberData.map(number => number.value).includes(discard.at(-1)?.number.value! - game.selectedCards[1].number.value!)) piles.push(index);
                if (game.selectedCards[1].number.actionId === "#" && numberData.map(number => number.value).includes(discard.at(-1)?.number.value! - game.selectedCards[0].number.value!)) piles.push(index);
            }
        }
        if (game.selectedCards.length === 2 && game.inventory.length >= 3) {
          let match = [];
        for (let index = -1; index < game.discarded.length; index++) {
            if (game.isMinipileActive && index >= 0) continue;
            if (!game.isMinipileActive && index === -1) continue;
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
        return piles;
    }
    checkForWinCondition (isOpponentTurn: boolean) {
        let lastColor = null;
        let lastNumber = null;
        let isWinning = true;
        for (const pile of game.discarded) {
            if (!lastColor) lastColor = pile.at(-1)?.color;
            if (!lastNumber) lastNumber = pile.at(-1)?.number;
            if (pile.at(-1)?.color !== lastColor) {
                isWinning = false;
                break;
            }
            if (pile.at(-1)?.number !== lastNumber) {
                isWinning = false;
                break;
            }
        }
        if (isWinning) {
            if (isOpponentTurn) {
                const resultScreen = document.getElementsByClassName("resultScreen")[0] as HTMLElement;
                resultScreen.textContent = "You lost!"
                resultScreen.hidden = false;
            } else {
                const resultScreen = document.getElementsByClassName("resultScreen")[0] as HTMLElement;
                resultScreen.textContent = "You won!"
                resultScreen.hidden = false;
            }
        }
        if (game.opponentHand.length > 25 || game.inventory.length === 0) {
            const resultScreen = document.getElementsByClassName("resultScreen")[0] as HTMLElement;
            resultScreen.textContent = "You won!"
            resultScreen.hidden = false;
        }
        if (game.inventory.length > 25 || game.opponentHand.length === 0) {
            const resultScreen = document.getElementsByClassName("resultScreen")[0] as HTMLElement;
            resultScreen.textContent = "You lost!"
            resultScreen.hidden = false;
        }
    }
    checkLockApplication () {
        let misses = false;
        for (let i = 0; i < 4; i++) {
            if (!game.lockedPiles.includes(i) && game.closedPile !== i) misses = true;
        }
        return misses;
    }
    checkForReflectStatus (pile: number) {
        return new Promise(async res => {
            for (const card of game.inventory) {
                if (card.number.actionId === "reflect") {
                    card.element.style.zIndex = "1";
                    (document.getElementsByClassName("useReflectBox")[0] as HTMLDivElement).hidden = false;
                    document.getElementsByClassName("useReflectBox")[0].classList.remove("reflectBoxExit")
                    const placeholderDiv = document.createElement("div");
                    placeholderDiv.classList.add("reflectPlaceholder")
                    placeholderDiv.style.minWidth = "7rem";
                    placeholderDiv.style.transition = "min-width 160ms"
                    card.wrapper.parentElement?.insertBefore(placeholderDiv, card.wrapper)
                    game.reflectCard = card;
                    game.reflectPile = pile;
                    game.reflectRes = res;
                    updateInventoryPlayability();
                    await this.animateElementMovement(card.wrapper, document.getElementsByClassName("reflectDisplay")[0] as HTMLElement, document.getElementsByClassName("reflectDisplay")[0] as HTMLElement)
                    return;
                }
            }
            res(false);
        })
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
    if (document.getElementsByClassName("playerCardCount")[0]) document.getElementsByClassName("playerCardCount")[0].textContent = game.inventory.length + "";
    if (document.getElementsByClassName("opponentCardCount")[0]) document.getElementsByClassName("opponentCardCount")[0].textContent = game.opponentHand.length + "";
}