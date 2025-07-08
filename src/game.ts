import { Card } from "./cards.ts";
import type { CardColor } from "./cards.ts";
import { random, randomInteger } from "./utils.ts";
import { getDraggedCard } from "./dragging.ts";
import numberData from "./data/numbers.json";
import colorData from "./data/colors.json";
import cardActions from "./cardActions.ts";

export const discardedCards: Card[] = []

interface EnemyCard {
    start: string,
    attack: string,
    defeat: string[],
    description: string[]
}
class Player {
    isOpponent: boolean;
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
    health: number;
    lives: number;
    recentCards: {card: Card, pile: number}[];
    cards: Card[];
    constructor (isOpponent: boolean) {
        this.isOpponent = isOpponent;
        this.ability = null;
        this.health = 48;
        this.lives = 2;
        this.recentCards = [];
        this.cards = [];
    }
    /*
    get cards () {
        return this.isOpponent ? game.dealer.cards : game.player.cards;
    }*/
    async pickup () {
        return this.isOpponent ? await game.opponentPickup() : await game.playerForcePickup();
    }
    discardToBottom (card: Card) {
        game.pileContents.unshift(card);
        card.wrapper.remove();
        this.cards.splice(this.cards.indexOf(card), 1)
        if (!this.isOpponent) game.updateInventoryPlayability();
    }
    swapCardsWith (target: Player) {
        const thisHand = Array.from(this.cards);
        const targetHand = Array.from(target.cards);
        this.cards.length = 0;
        for (const card of targetHand) this.cards.push(card);
        target.cards.length = 0;
        for (const card of thisHand) target.cards.push(card);
        game.updateHands();
    }
    async checkForReflectStatus (pile: number) {
        if (!this.isOpponent) return await game.checkForReflectStatus(pile);
    }
    promptColorChooser (): Promise<CardColor> | CardColor {
        if (this.isOpponent) return random(colorData.filter(color => !color.wild));
        (document.getElementsByClassName("colorChooser")[0] as HTMLDivElement).hidden = false;
        document.getElementsByClassName("colorChooser")[0].classList.remove("colorChooserExit");
        game.colorChooserActive = true;
        return new Promise(res => {
            game.colorChooserPromise = res;
            game.colorChooserAction = "promise";
            updateInventoryPlayability();
        });
    }
    updateHealthCount () {
        if (this.isOpponent) {
            document.getElementsByClassName("opponentHealthCount")[0].textContent = "Health: " + this.health;
            (document.querySelector(".opponentHealthBar .healthBarContent") as HTMLDivElement).style.width = (this.health / 48) * 100 + "%";
        } else {
            document.getElementsByClassName("playerHealthCount")[0].textContent = "Health: " + this.health;
            (document.querySelector(".playerHealthBar .healthBarContent") as HTMLDivElement).style.width = (this.health / 48) * 100 + "%";
        }
    }
}

const PlayerIndex = {
    Player: 0,
    Opponent: 1
} as const;

export class Game {
    //inventory: Card[];
    discarded: Card[][];
    //opponentHand: Card[];
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
    reobtainChooserActive: boolean;
    actor: Player;
    target: Player;
    player: Player;
    dealer: Player;
    currentPile: number;
    currentCard: Card | null;
    pileContents: Card[];
    colorChooserPromise: Function | null;
    dangerCard: {
        start: string,
        attack: string,
        defeat: string[],
        description: string[]
    } | null
    minipileAction: string;
    onePileLockType: string;
    onePileLockNumber: number;
    giveCardAction: string;
    hasEnded: boolean;
    forcedColor: string;
    pickupQueue: Card[];
    constructor() {
        /*
        this.player.cards = [];
        this.dealer.cards = [];*/
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
        this.reobtainChooserActive = false;
        this.actor = this.getPlayer(PlayerIndex.Player)!;
        this.target = this.getPlayer(PlayerIndex.Opponent)!;
        this.currentPile = 0;
        this.player = new Player(false);
        this.dealer = new Player(true);
        this.currentCard = null;
        this.pileContents = [];
        this.colorChooserPromise = null;
        this.dangerCard = null;
        for (let i = 0; i < 25; i++) {
            this.player.cards.push(new Card())
            this.dealer.cards.push(new Card(true))
        }
        this.minipileAction = "";
        this.onePileLockType = "";
        this.onePileLockNumber = 0;
        this.giveCardAction = "";
        this.hasEnded = false;
        this.forcedColor = "";
        this.pickupQueue = [];
        for (let i = 0; i < 4; i++) {
            this.pickupQueue.push(new Card(true));
        }
    }
    getPlayer (index: number) {
        if (index === 0) return this.player;
        if (index === 1) return this.dealer;
    }
    addDrawAmount (amount: number, pile: number) {
        game.drawAmount += amount;
        game.drawPile = pile;
        document.getElementsByClassName("drawAmountText")[0].textContent = "+" + game.drawAmount;
    }
    updateInventoryPlayability () {
        updateInventoryPlayability();
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
                        this.updateCardDiscard();
                        element.style.transition = "";
                        res(null);
                    }, 500)
                }, 0)
            });
        });
    }
    async opponentTurn() {
        if (game.dangerCard?.attack === "+1AtTurnStart") {
            await game.dealer.pickup();
        }
        if (game.dangerCard?.attack === "-1hpAtTurnStart") {
            game.dealer.health--;
            game.dealer.updateHealthCount();
        }
        if (game.dangerCard?.attack === "dangerCardAtTurnStart") {
            cardActions.danger(game);
        }
        game.checkForWinCondition(false);
        this.playersTurn = false;
        this.closedPile = randomInteger(0, 3);
        updateInventoryPlayability();
        this.updateCardDiscard();
        for (const card of game.selectedCards) card.element.classList.remove("selectedCard");
        game.selectedCards.length = 0;
        if (game.drawAmount > 0) {
            for (const card of this.dealer.cards) {
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
            for (let i = 0; i < game.drawAmount + (game.dangerCard?.attack === "plusOneExtra" ? 1 : 0); i++) this.opponentPickup(true);
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
        for (const card of this.dealer.cards.filter(card => game.dealer.cards.length <= game.player.cards.length ? card.number.actionId !== "swap" && card.modifier?.actionId !== "swap" : true)) {
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
        console.log("Cannot play, picking up.")
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
            for (let i = 0; i < game.drawAmount - 1 + (game.dangerCard?.attack === "plusOneExtra" ? 1 : 0); i++) {
                game.addToRack(new Card())
            }
            game.drawAmount = 0;
            game.drawPile = -1;
            document.getElementsByClassName("drawAmountText")[0].textContent = "";
            game.opponentTurn();
        }
        if (document.getElementsByClassName("cardRack")[0]) {
            for (const child of document.getElementsByClassName("cardRack")[0].children) {
                let hasCard = false;
                for (const card of game.player.cards) {
                    if (card.wrapper === child) {
                        hasCard = true;
                        break;
                    };
                }
                if (!hasCard && !child.classList.contains("placeholderDiv")) child.remove();
            }
            for (const child of document.getElementsByClassName("opponentHand")[0].children) {
                let hasCard = false;
                for (const card of game.dealer.cards) {
                    if (card.wrapper === child) {
                        hasCard = true;
                        break;
                    };
                }
                if (!hasCard) child.remove();
            }
        }
        if (game.dangerCard?.attack === "+1AtTurnStart") {
            await game.player.pickup();
        }
        if (game.dangerCard?.attack === "-1hpAtTurnStart") {
            game.player.health--;
            game.player.updateHealthCount();
        }
        if (game.dangerCard?.attack === "dangerCardAtTurnStart") {
            cardActions.danger(game);
        }
        this.checkForWinCondition(true);
    }
    opponentDiscard(card: Card) {
        const notOverloaded = card.playablePiles(true).filter(pile => (pile === -1 ? game.minipile : game.discarded[pile]).at(-2)?.modifier?.actionId !== "overload")
        const pile: number = notOverloaded.length > 0 ? random(notOverloaded) : random(card.playablePiles(true));
        (pile === -1 ? game.minipile : this.discarded[pile]).push(card);
        this.dealer.cards.splice(this.dealer.cards.indexOf(card), 1)
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
                    try {
                        cardDiscard.appendChild(card.wrapper);
                    } catch (e) {
                        console.warn(e);
                    }
                    this.updateCardDiscard();
                    game.dealer.recentCards.push({ card, pile });
                    if (game.dealer.recentCards.length > 11) game.dealer.recentCards.shift();
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
            for (const secondCard of document.querySelectorAll(".pickupPile > .cardWrapper")) {
                if (secondCard === card.wrapper) continue;
                secondCard.remove();
            }
            //game.pickupCard = new Card(true, ["pickup"])
            game.pickupCard = game.pickupQueue.shift()!;
            game.pickupCard.tags.push("pickup");
            game.pickupQueue.push(new Card(true));
            document.getElementsByClassName("pickupQueue")[0].appendChild(game.pickupQueue.at(-1)!.wrapper);
            document.getElementsByClassName("pickupPile")[0].appendChild(game.pickupCard.wrapper)
        }
        game.dealer.health--;
        game.dealer.updateHealthCount();
        updateInventoryPlayability();
        return new Promise(res => {
            setTimeout(() => {
                const opponentHand = document.getElementsByClassName("opponentHand")[0];
                card.wrapper.style.left = opponentHand.getBoundingClientRect().left + "px";
                card.wrapper.style.top = opponentHand.getBoundingClientRect().top + "px";
                setTimeout(async () => {
                    card.wrapper.style.position = "";
                    opponentHand.appendChild(card.wrapper);
                    game.dealer.cards.push(card);
                    if (game.isMinipileActive && involveMinipile) {
                        for (const secondCard of game.minipile) {
                            if (card === secondCard) continue;
                            if (secondCard.number.actionId === "warStartCard") continue;
                            secondCard.tags.splice(card.tags.indexOf("minipile"), 1);
                            secondCard.tags.splice(card.tags.indexOf("discarded"), 1);
                            game.dealer.cards.push(secondCard);
                            opponentHand.appendChild(secondCard.wrapper);
                        }
                        if (game.forcedColor === "greenWild") {
                            for (let i = 0; i < 3; i++) {
                                const secondCard = new Card(true);
                                game.dealer.cards.push(secondCard);
                                document.getElementsByClassName("cardRack")[0].appendChild(secondCard.wrapper);
                            }
                        }
                        game.forcedColor = "";
                        game.minipile.length = 0;
                        game.isMinipileActive = false;
                        if (game.minipileAction === "war+2") {
                            for (let i = 0; i < 2; i++) {
                                const secondCard = new Card(true);
                                game.dealer.cards.push(secondCard);
                                opponentHand.appendChild(secondCard.wrapper);
                            }
                        }
                        game.minipileAction = "";
                        document.getElementsByClassName("minipileOuter")[0].classList.add("minipileExit");
                        updateInventoryPlayability();
                        this.updateCardDiscard();
                    }
                    if (!this.isMinipileActive || !involveMinipile) {
                        if (card.number.actionId === "draw3More") {
                            card.hidden = false;
                            card.updateElement();
                            for (let i = 0; i < 3; i++) {
                                if (game.dealer.cards.length > 30) break;
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
        card.updateAbilityWild(false);
        const cardRack = document.getElementsByClassName("cardRack")[0] as HTMLDivElement;
        const pickupPile = document.getElementsByClassName("pickupPile")[0] as HTMLDivElement;
        cardRack.appendChild(card.wrapper);
        if (game.player.cards.includes(card)) game.player.cards.splice(game.player.cards.indexOf(card), 1)
        game.player.cards.push(card);
        card.hidden = false;
        card.updateElement();
        updateInventoryPlayability();
        if (card.tags.includes("pickup")) {
            card.tags.splice(card.tags.indexOf("pickup"), 1);
            //game.pickupCard = new Card(true, ["pickup"])
            game.pickupCard = game.pickupQueue.shift()!;
            game.pickupCard.tags.push("pickup");
            game.pickupQueue.push(new Card(true));
            document.getElementsByClassName("pickupQueue")[0].appendChild(game.pickupQueue.at(-1)!.wrapper);
            for (const card of document.querySelectorAll(".pickupPile > .cardWrapper")) card.remove();
            pickupPile.appendChild(game.pickupCard.wrapper)
        }
    }
    async discardCard(card: Card, pile: number) {
        const cardDiscard = document.getElementsByClassName("cardDiscard" + pile)[0];
        cardDiscard.textContent = "";
        cardDiscard.appendChild(card.wrapper)
        console.log(pile)
        card.element.classList.remove("unplayable");
        game.forcedColor = "";
        if (pile === -1) {
            game.minipile.push(card);
        } else game.discarded[pile].push(card);
        game.player.cards.splice(game.player.cards.indexOf(card), 1)

        if (game.lockedPiles.includes(pile) && card.modifier?.actionId !== "lock") game.lockedPiles.splice(game.lockedPiles.indexOf(pile), 1);
        updateInventoryPlayability();
        game.updateCardDiscard();
        if (game.player.cards.length === 0 || game.dealer.cards.length === 0) return;
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
        game.player.recentCards.push({ card, pile });
        if (game.player.recentCards.length > 11) game.player.recentCards.shift();
        return await this.applyPlayerDiscardEffects(card, pile);
    }
    async applyPlayerDiscardEffects(card: Card, pile: number) {
        console.log("playerDiscard", card);
        if (pile === -1 && game.minipileAction === "war") return;
        if (pile === -1 && game.minipileAction === "war+2") return;
        game.forcedColor = "";
        this.actor = this.getPlayer(PlayerIndex.Player)!;
        this.target = this.getPlayer(PlayerIndex.Opponent)!;
        this.currentPile = pile;
        this.currentCard = card;
        this.pileContents = pile === -1 ? game.minipile : game.discarded[pile];
        const pileContents = this.pileContents;
        if (game.onePileLockType === "+2IfColorMatch") {
            if (game.dealer.cards.find(secondCard => card.color === secondCard.color)) {
                for (let i = 0; i < 2; i++) {
                    await game.dealer.pickup();
                }
            }
            game.onePileLockType = "";
        }
        if (game.dangerCard?.defeat.includes("number") && card.number.value !== undefined && card.number.value !== null) {
            document.getElementsByClassName("dangerCardArea")[0].textContent = "";
            game.dangerCard = null;
            if (game.player.ability?.passive === "defeatEnemy+2hp") {
                game.player.health += 2;
                game.player.updateHealthCount();
            }
        }
        if (game.dangerCard?.defeat.includes(card.color.name) || game.dangerCard?.defeat.includes(card.number.actionId!)) {
            document.getElementsByClassName("dangerCardArea")[0].textContent = "";
            game.dangerCard = null;
            if (game.player.ability?.passive === "defeatEnemy+2hp") {
                game.player.health += 2;
                game.player.updateHealthCount();
            }
        }
        if (game.dangerCard?.attack === "wild-1hp" && card.color.wild) {
            game.player.health -= 1;
            game.player.updateHealthCount();
        }
        if (game.dangerCard?.attack === "wildAdd1Card" && card.color.wild) {
            await game.player.pickup();
        }
        for (let i = -1; i < 4; i++) {
            document.getElementsByClassName("randomOccuranceLabel" + i)[0].textContent = ""
        }
        if (card.number.actionId! in cardActions) {
            if (await cardActions[card.number.actionId!](game)) {
                game.playersTurn = true;
                return true;
            }
        }
        if (card.modifier?.actionId! in cardActions) {
            if (await cardActions[card.modifier?.actionId!](game)) {
                game.playersTurn = true;
                return true;
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
                const oldCard = game.dealer.cards.shift()!;
                oldCard?.wrapper.remove();
                pileContents.unshift(oldCard);
                game.opponentPickup();
            }
        }
        if (card.number.actionId === "reobtain") {
            const reobtainRack = document.getElementsByClassName("reobtainRack")[0] as HTMLDivElement;
            let count = 0;
            recentPlayerCards:
            for (const { card } of game.player.recentCards) {
                //if (card === game.recentPlayerCards.at(-1)?.card) continue;
                for (const discard of game.discarded) {
                    if (discard.at(-1) === card) continue recentPlayerCards;
                }
                if (game.minipile.at(-1) === card) continue recentPlayerCards;
                if (game.dealer.cards.includes(card)) continue recentPlayerCards;
                if (game.player.cards.includes(card)) continue recentPlayerCards;
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
                    game.player.cards.push(card);
                    document.getElementsByClassName("cardRack")[0].appendChild(card.wrapper);
                    this.updateCardDiscard();
                    updateInventoryPlayability();
                    this.reobtainChooserActive = false;
                    await game.opponentTurn();
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
        console.log("opponentDiscard", card);
        if (pile === -1 && game.minipileAction === "war") return;
        if (pile === -1 && game.minipileAction === "war+2") return;
        if (game.player.cards.length === 0 || game.dealer.cards.length === 0) return;
        this.actor = this.getPlayer(PlayerIndex.Opponent)!;
        this.target = this.getPlayer(PlayerIndex.Player)!;
        this.currentPile = pile;
        this.currentCard = card;
        this.pileContents = pile === -1 ? game.minipile : game.discarded[pile];
        if (game.onePileLockType === "+2IfColorMatch") {
            if (game.dealer.cards.find(secondCard => card.color === secondCard.color)) {
                for (let i = 0; i < 2; i++) {
                    await game.dealer.pickup();
                }
            }
            game.onePileLockType = "";
        }
        if (game.dangerCard?.defeat.includes("number") && card.number.value !== undefined && card.number.value !== null) {
            document.getElementsByClassName("dangerCardArea")[0].textContent = "";
            game.dangerCard = null;
            if (game.dealer.ability?.passive === "defeatEnemy+2hp") {
                game.dealer.health += 2;
                game.dealer.updateHealthCount();
            }
        }
        if (game.dangerCard?.defeat.includes(card.color.name) || game.dangerCard?.defeat.includes(card.number.actionId!)) {
            document.getElementsByClassName("dangerCardArea")[0].textContent = "";
            game.dangerCard = null;
            if (game.dealer.ability?.passive === "defeatEnemy+2hp") {
                game.dealer.health += 2;
                game.dealer.updateHealthCount();
            }
        }
        if (game.dangerCard?.attack === "wild-1hp" && card.color.wild) {
            game.dealer.health -= 1;
            game.dealer.updateHealthCount();
        }
        if (game.dangerCard?.attack === "wildAdd1Card" && card.color.wild) {
            await game.dealer.pickup();
        }
        const pileContents = this.pileContents;
        for (let i = -1; i < 4; i++) {
            document.getElementsByClassName("randomOccuranceLabel" + i)[0].textContent = ""
        }
        if (card.number.actionId! in cardActions) {
            if (await cardActions[card.number.actionId!](game)) {
                game.checkForWinCondition(true);
                game.playersTurn = true;
                return true;
            }
            game.checkForWinCondition(true);
        }
        if (card.modifier?.actionId! in cardActions) {
            if (await cardActions[card.modifier?.actionId!](game)) {
                game.checkForWinCondition(true);
                game.playersTurn = true;
                return true;
            }
            game.checkForWinCondition(true);
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
        if (card.number.actionId === "reobtain") {
            let count = 0;
            let cards = [];
            recentOpponentCards:
            for (const { card } of game.dealer.recentCards) {
                //if (card === game.recentPlayerCards.at(-1)?.card) continue;
                for (const discard of game.discarded) {
                    if (discard.at(-1) === card) continue recentOpponentCards;
                }
                if (game.minipile.at(-1) === card) continue recentOpponentCards;
                if (game.dealer.cards.includes(card)) continue recentOpponentCards;
                if (game.player.cards.includes(card)) continue recentOpponentCards;
                cards.push(card);
                count++;
                if (count >= 5) break;
            }
            if (count === 0) return;
            const chosen = random(cards);
            (pile === -1 ? game.minipile : game.discarded[pile]).push(chosen);
            document.getElementsByClassName("cardDiscard" + pile)[0].textContent = "";
            document.getElementsByClassName("cardDiscard" + pile)[0].appendChild(chosen.wrapper);
        }
    }
    updateHands() {
        const cardRack = document.getElementsByClassName("cardRack")[0];
        cardRack.textContent = "";
        console.log("inventory");
        console.log(game.player.cards)
        console.log(game.dealer.cards)
        for (const card of game.player.cards) {
            card.hidden = false;
            if (card.tags.includes("pickup")) card.tags.splice(card.tags.indexOf("pickup"), 1);
            card.updateElement();
            cardRack.appendChild(card.wrapper)
        }
        updateInventoryPlayability();
        const opponentHand = document.getElementsByClassName("opponentHand")[0];
        opponentHand.textContent = "";
        for (const card of game.dealer.cards) {
            card.element.classList.remove("unplayable");
            opponentHand.appendChild(card.wrapper)
        }
    }
    async playerForcePickup() {
        const placeholderDiv = document.createElement("div");
        placeholderDiv.classList.add("wrapper");
        document.getElementsByClassName("cardRack")[0].appendChild(placeholderDiv)
        setTimeout(() => placeholderDiv.remove(), 200)
        await game.animateElementMovement(game.pickupCard.element, placeholderDiv, game.pickupCard.wrapper)
        const pickupCard = game.pickupCard;
        game.addToRack(game.pickupCard)
        document.getElementsByClassName("cardRack")[0].scrollTo({
            left: document.getElementsByClassName("cardRack")[0].scrollWidth,
            behavior: "smooth"
        });
        game.player.health--;
        game.player.updateHealthCount();
        return pickupCard;
    }
    playableTwins() {
        if (game.selectedCards.length === 1) return game.selectedCards[0].playablePiles();
        if (game.minipile.length > 0 && game.minipileAction === "war") return [];
        if (game.minipile.length > 0 && game.minipileAction === "war+2") return [];
        const piles = [];
        if (game.selectedCards.length === 2 && !isNaN(+game.selectedCards[0].number.value!) && !isNaN(+game.selectedCards[1].number.value!)) {
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
        if (game.selectedCards.length === 2 && game.player.cards.length >= 3) {
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
        // Handle discard 2 of color
        if (game.selectedCards[0]?.number.actionId === "discard2Color") {
            if (game.selectedCards[1]?.color === game.selectedCards[0].color) {
                return game.selectedCards[0].playablePiles();
            }
        }

        return piles;
    }
    checkForWinCondition(isOpponentTurn: boolean) {
        if (game.hasEnded) return;
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
            game.hasEnded = true;
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
        if (game.dealer.cards.length > 25 || game.dealer.health <= 0) {
            game.dealer.lives -= 1;
            game.dealer.cards.length = 0;
            game.dealer.health = 48;
            game.dealer.updateHealthCount();
            for (let i = 0; i < 7; i++) {
                game.dealer.cards.push(new Card(true));
            }
            game.updateHands();
            document.getElementsByClassName("opponentLiveCounter")[0].textContent = "Lives: " + this.dealer.lives;
        }
        if (game.player.cards.length > 25 || game.player.health <= 0) {
            game.player.lives -= 1;
            game.player.cards.length = 0;
            game.player.health = 48;
            game.player.updateHealthCount();
            for (let i = 0; i < 7; i++) {
                game.player.cards.push(new Card());
            }
            game.updateHands();
            document.getElementsByClassName("playerLiveCounter")[0].textContent = "Lives: " + this.player.lives;
        }
        if (game.player.cards.length === 0 || game.dealer.lives === 0) {
            game.hasEnded = true;
            const resultScreen = document.getElementsByClassName("resultScreen")[0] as HTMLElement;
            resultScreen.textContent = "You won!"
            resultScreen.hidden = false;
        }
        if (game.dealer.cards.length === 0 || game.player.lives === 0) {
            game.hasEnded = true;
            const resultScreen = document.getElementsByClassName("resultScreen")[0] as HTMLElement;
            resultScreen.textContent = "You lost!"
            resultScreen.hidden = false;
        }
    }
    calculateScore() {
        let score = 0;
        for (const card of game.player.cards) {
            if (card.color.name === "Yellow" && card.number.value === 13) {
                score -= 13;
            } else if (card.number.value) {
                score += card.number.value;
            }
            if (card.color.name === "Red") {
                score -= 1;
            }
        }
        return score;
    }
    checkLockApplication() {
        let misses = false;
        for (let i = 0; i < 4; i++) {
            if (!game.lockedPiles.includes(i) && game.closedPile !== i) misses = true;
        }
        return misses;
    }
    checkForReflectStatus(pile: number): Promise<boolean> {
        return new Promise(async res => {
            for (const card of game.player.cards) {
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
    //let hasPlayable = false;
    for (const card of game.player.cards) {
        card.updateAbilityWild(false);
        if (card.isPlayable()) {
            //hasPlayable = true;
            card.element.classList.remove("unplayable")
        } else {
            card.element.classList.add("unplayable")
        }
    }
    if (document.getElementsByClassName("playerCardCount")[0]) document.getElementsByClassName("playerCardCount")[0].textContent = game.player.cards.length + "";
    if (document.getElementsByClassName("opponentCardCount")[0]) document.getElementsByClassName("opponentCardCount")[0].textContent = game.dealer.cards.length + "";
    /*if (hasPlayable) {
        document.getElementsByClassName("pickupPile")[0]?.classList.add("unplayable")
    } else {
        document.getElementsByClassName("pickupPile")[0]?.classList.remove("unplayable")
    }*/
   console.log(game);
}