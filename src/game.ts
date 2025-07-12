import { Card } from "./cards.ts";
//import type { CardColor } from "./cards.ts";
import { randomInteger } from "./utils.ts";
import numberData from "./data/numbers.json";
/*
import colorData from "./data/colors.json";
import symbolData from "./data/symbols.json";*/
//import cardActions from "./cardActions.ts";
import { client } from "./client.ts";

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
    doublesCardAvailable: boolean;
    isChoosingDrawRemoval: boolean;
    drawRemovalCards: Card[];
    id: string;
    constructor (isOpponent: boolean) {
        this.isOpponent = isOpponent;
        this.ability = null;
        this.health = 48;
        this.lives = 2;
        this.recentCards = [];
        this.cards = [];
        this.doublesCardAvailable = randomInteger(1, 36) === 1;
        this.isChoosingDrawRemoval = false;
        this.drawRemovalCards = [];
        this.id = Math.random() + "";
    }
    data () {
        return {
            isOpponent: this.isOpponent,
            ability: this.ability,
            health: this.health,
            lives: this.lives,
            recentCards: this.recentCards.map(card => ({
                card: card.card.data(),
                pile: card.pile
            })),
            cards: this.cards.map(card => card.data()),
            doublesCardAvailable: this.doublesCardAvailable,
            isChoosingDrawRemoval: this.isChoosingDrawRemoval,
            drawRemovalCards: this.drawRemovalCards.map(card => card.data()),
            id: this.id
        }
    }
    /*
    get cards () {
        return this.isOpponent ? game.dealer.cards : game.player.cards;
    }*/
    /*async pickup () {
        return this.isOpponent ? await game.opponentPickup() : await game.playerForcePickup();
    }*/
    discardToBottom (card: Card) {
        game.pileContents.unshift(card);
        //card.wrapper.remove();
        this.cards.splice(this.cards.indexOf(card), 1)
        //if (!this.isOpponent) game.updateInventoryPlayability();
    }
    /*
    swapCardsWith (target: Player) {
        const thisHand = Array.from(this.cards);
        const targetHand = Array.from(target.cards);
        this.cards.length = 0;
        for (const card of targetHand) this.cards.push(card);
        target.cards.length = 0;
        for (const card of thisHand) target.cards.push(card);
        game.updateHands();
    }*/
    async updateHealthCount () {
        await client.receivePacket({
            type: "health",
            player: this.id,
            health: this.health
        })
    }
    getCardCount () {
        let count = 0;
        for (const card of this.cards) {
            if (card.number.actionId !== "tower") count++;
        }
        return count;
    }
    addCard (card: Card, animate: boolean) {
        if (this.cards.includes(card)) this.cards.splice(this.cards.indexOf(card), 1)
        this.cards.push(card);
        if (card.tags.includes("pickup")) {
            card.tags.splice(card.tags.indexOf("pickup"), 1);
            game.pickupCard = game.pickupQueue.shift()!;
            game.pickupCard.tags.push("pickup");
            game.pickupQueue.push(new Card(true));
            game.sendPacket({
                type: "pickup",
                card: card.data(),
                pickupQueuePush: game.pickupQueue.at(-1)!.data(),
                animate
            })
            return;
        }
        game.sendPacket({
            type: "pickup",
            card: card.data(),
            pickupQueuePush: null,
            animate
        })
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
    cardLoanRemaining: number;
    towerChooserAction: string;
    constructor() {
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
        for (let i = 0; i < 7; i++) {
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
        this.cardLoanRemaining = 0;
        this.towerChooserAction = "";
        client.receivePacket({
            type: "players",
            players: [
                this.player.data(),
                this.dealer.data()
            ],
            selfId: this.player.id
        })
        this.updateDiscarded();
    }
    sendPacket (packet: any) {
        return client.receivePacket(structuredClone(packet));
    }
    receivePacket (packet: any) {
        console.log("game packet received: ", packet)
        switch (packet.type) {
            case "ability":
                this.player.ability = packet.ability;
                break;
            case "discard":
                const card = this.player.cards.find(card => card.id === packet.card);
                if (!card) break;
                if (game.selectedCards.length > 1 && game.selectedCards.includes(card)) {
                    const piles = game.playableTwins();
                    if (!piles.includes(packet.pile)) return;
                } else {
                    console.log("playable: ", card.playablePiles())
                    if (!card.playablePiles().includes(packet.pile)) return;
                };
                this.discarded[packet.pile].push(card);
                for (const secondCard of game.player.cards) {
                    if (secondCard.id === packet.card) game.player.cards.splice(game.player.cards.indexOf(secondCard), 1);
                }
                this.sendPacket({
                    type: "discard",
                    card: card.data(),
                    pile: packet.pile
                })
                break;
            case "pickup":
                game.player.addCard(game.pickupCard, packet.animate);
                /*
                const pickupCard = game.pickupCard;
                if (game.player.cards.includes(pickupCard)) game.player.cards.splice(game.player.cards.indexOf(card), 1)
                game.player.cards.push(pickupCard);
                pickupCard.tags.splice(pickupCard.tags.indexOf("pickup"), 1);
                game.pickupCard = game.pickupQueue.shift()!;
                game.pickupCard.tags.push("pickup");
                game.pickupQueue.push(new Card(true));
                this.sendPacket({
                    type: "pickup",
                    card: pickupCard.data(),
                    pickupQueuePush: game.pickupQueue.at(-1)!.data()
                })*/
        }
    }
    updateDiscarded () {
        this.sendPacket({
            type: "discardPiles",
            discarded: this.discarded.map(discard => discard.map(card => card.data())),
            pickupCard: this.pickupCard.data(),
            pickupQueue: this.pickupQueue.map(card => card.data()),
            closedPile: this.closedPile
        })
    }
    getPlayer (index: number) {
        if (index === 0) return this.player;
        if (index === 1) return this.dealer;
    }
    async addDrawAmount (amount: number, pile: number) {
        await this.sendPacket({
            type: "drawAmount",
            amount: amount,
            pile: pile
        })
        game.drawAmount += amount;
        game.drawPile = pile;
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
                piles.push(...game.selectedCards/*.filter(card => card !== getDraggedCard())*/.map(card => card.playablePiles()).flat())
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
export const game = new Game();