import { Card } from "./cards.ts";
import { game, updateInventoryPlayability } from "./game.ts";

let draggedCard: Card | null = null;
export let dragGap: { x: number, y: number } = { x: -1, y: -1 };
export const dragGaps: {x: number, y: number}[] = [];
export const setDraggedCard = (card: Card) => draggedCard = card;
export const getDraggedCard = () => draggedCard;

export const setupDragging = () => {
    const cardRack = document.getElementsByClassName("cardRack")[0];
    document.getElementsByClassName("cardRack")[0].addEventListener("touchstart", e => {
        if (draggedCard) {
            e.preventDefault();
            e.stopPropagation();
        }
    }, false)
    document.getElementsByClassName("cardRack")[0].addEventListener("touchmove", e => {
        if (draggedCard) {
            e.preventDefault();
            e.stopPropagation();
        }
    }, false)
    addEventListener("pointerdown", () => {
        game.wasDragging = false
    })
    addEventListener("pointermove", e => {
        if (!draggedCard) return;
        if (!draggedCard.element.classList.contains("dragging")) {
            draggedCard = null;
            for (const card of game.selectedCards) {
                card.element.classList.remove("dragging");
                card.element.style.left = "";
                card.element.style.top = "";
            }
            return;
        }
        draggedCard.element.style.left = e.pageX - dragGap.x + "px";
        draggedCard.element.style.top = e.pageY - dragGap.y + "px";
        if (game.selectedCards.includes(draggedCard)) {
            for (const [index, card] of game.selectedCards.entries()) {
                card.element.classList.add("dragging");
                card.element.style.left = e.pageX - dragGap.x - 20 * index + "px";
                card.element.style.top = e.pageY - dragGap.y - 20 * index + "px";
                card.element.style.zIndex = "2";
            }
            draggedCard.element.style.zIndex = "3";
        }
        for (const destination of document.getElementsByClassName("dragDestination")) {
            if (e.pageX > destination.getBoundingClientRect().x
                && e.pageY > destination.getBoundingClientRect().y
                && e.pageX < destination.getBoundingClientRect().x + destination.getBoundingClientRect().width
                && e.pageY < destination.getBoundingClientRect().y + destination.getBoundingClientRect().height) {
                const pile = +(destination as HTMLDivElement).dataset.index!;
                if ((destination.classList.contains("cardDiscard") || destination.classList.contains("minipileInner")) && !(game.selectedCards.includes(draggedCard) ? game.playableTwins() : draggedCard.playablePiles()).includes(pile)) return;
                destination.classList.add("dragTarget")
                game.wasDragging = true;
            } else {
                destination.classList.remove("dragTarget")
            }
        }
    })

    addEventListener("pointerup", async e => {
        if (game.selectedCards.length === 0) {
            for (let i = 0; i < 4; i++) {
                const cardDiscard = document.getElementsByClassName("cardDiscard" + i)[0];
                cardDiscard.classList.remove("unplayable")
            }
        }
        if (!draggedCard) return;
        draggedCard.element.classList.remove("dragging");
        draggedCard.element.style.left = "";
        draggedCard.element.style.top = "";
        const selectedCards = Array.from(game.selectedCards);
        for (const destination of document.getElementsByClassName("dragDestination")) {
            if (e.pageX > destination.getBoundingClientRect().x
                && e.pageY > destination.getBoundingClientRect().y
                && e.pageX < destination.getBoundingClientRect().x + destination.getBoundingClientRect().width
                && e.pageY < destination.getBoundingClientRect().y + destination.getBoundingClientRect().height) {
                if (!draggedCard.tags.includes("pickup") && !draggedCard.tags.includes("minipile") && (destination.classList.contains("cardDiscard") || destination.classList.contains("minipileInner"))) {
                    if (destination.classList.contains("minipileInner")) draggedCard.tags.push("minipile");
                    const pile = +(destination as HTMLDivElement).dataset.index!;
                    if (game.selectedCards.length > 1 && game.selectedCards.includes(draggedCard)) {
                        const piles = game.playableTwins();
                        if (!piles.includes(pile)) return;
                    } else {
                        if ((destination.classList.contains("cardDiscard") || destination.classList.contains("minipileInner")) && !draggedCard.playablePiles().includes(pile)) return;
                    };
                    let skip = false;
                    if (game.selectedCards.includes(draggedCard)) {
                        for (const card of game.selectedCards) card.element.classList.remove("selectedCard");
                        if (game.selectedCards.length === 2 && game.selectedCards[0]?.number.value === game.selectedCards[1]?.number.value && (game.selectedCards[0]?.color !== game.discarded[pile].at(-1)?.color || game.selectedCards[0]?.number !== game.discarded[pile].at(-1)?.number)) {
                            const sameColor = game.selectedCards.filter(card => card.color === game.discarded[pile].at(-1)?.color);
                            const differentColor = game.selectedCards.filter(card => card.color !== game.discarded[pile].at(-1)?.color);
                            console.info("the a")
                            for (const card of sameColor) {
                                if (await game.discardCard(card, pile)) skip = true;
                            }
                            for (const card of differentColor) {
                                if (await game.discardCard(card, pile)) skip = true;
                            }
                        } else {
                            for (const card of game.selectedCards.filter(card => card !== draggedCard)) {
                                if (await game.discardCard(card, pile)) skip = true;
                            }
                            if (await game.discardCard(draggedCard, pile)) skip = true;
                        }
                    } else {
                        if (await game.discardCard(draggedCard, pile)) skip = true;
                    };
                    game.selectedCards.length = 0;
                    game.checkForWinCondition(false);
                    if (draggedCard?.number.actionId !== "skip" && !skip) {
                        if (game.cardLoanRemaining === 0) await game.opponentTurn();
                        if (game.cardLoanRemaining > 0) {
                            game.cardLoanRemaining--;
                            document.getElementsByClassName("cardLoanRemaining")[0].textContent = "Remaining card payments: " + game.cardLoanRemaining;
                        }
                    }
                    updateInventoryPlayability();
                }
                if (destination === cardRack) {
                    if (!game.player.cards.includes(draggedCard)) {
                        if (draggedCard.number.actionId === "draw3More") game.drawAmount += 3;
                        if (!game.player.hasTower("Green")) game.player.health--;
                        game.player.updateHealthCount();
                        document.getElementsByClassName("pickupPile")[0].classList.add("animate");
                        game.addToRack(draggedCard);
                        if (draggedCard.modifier?.actionId === "transfer") {
                            for (const card of game.player.cards) {
                                if (card.number === draggedCard.number) {
                                    game.dealer.cards.push(card);
                                    game.player.cards.splice(game.player.cards.indexOf(card));
                                    document.getElementsByClassName("opponentHand")[0].appendChild(card.wrapper);
                                    console.info("trasfer")
                                    game.updateHands();
                                }
                            }
                        }
                        if (game.drawAmount > 1) {
                            game.player.isChoosingDrawRemoval = true;
                            game.player.drawRemovalCards.length = 0;
                            game.player.drawRemovalCards.push(draggedCard);
                        }
                        for (let i = 0; i < Math.min(game.drawAmount - 1, 30) + (game.dangerCard?.attack === "plusOneExtra" ? 1 : 0); i++) {
                            const newCard = new Card();
                            game.player.drawRemovalCards.push(newCard);
                            if (newCard.number.actionId === "draw3More") game.drawAmount += 3;
                            game.player.health--;
                            document.getElementsByClassName("pickupPile")[0].classList.add("animate");
                            game.addToRack(newCard)
                            if (newCard.modifier?.actionId === "transfer") {
                                for (const card of game.player.cards) {
                                    if (card.number === newCard.number) {
                                        game.dealer.cards.push(card);
                                        game.player.cards.splice(game.player.cards.indexOf(card));
                                        document.getElementsByClassName("opponentHand")[0].appendChild(card.wrapper);
                                        console.info("trasfer")
                                        game.updateHands();
                                    }
                                }
                            }
                        }
                        cardRack.scrollTo({
                            left: cardRack.scrollWidth,
                            behavior: "smooth"
                        });
                        game.checkForWinCondition(false);
                        game.drawAmount = 0;
                        document.getElementsByClassName("drawAmountText")[0].textContent = "";
                        game.player.updateHealthCount();
                        if (draggedCard.tags.includes("minipile")) {
                            for (const card of game.minipile) {
                                if (card.number.actionId === "warStartCard") continue;
                                game.addToRack(card);
                                card.tags.splice(card.tags.indexOf("minipile"), 1);
                                card.tags.splice(card.tags.indexOf("discarded"), 1);
                            }
                            game.minipile.length = 0;
                            game.isMinipileActive = false;
                            if (game.minipileAction === "war+2") {
                                for (let i = 0; i < 2; i++) {
                                    const secondCard = new Card(true);
                                    game.dealer.cards.push(secondCard);
                                    document.getElementsByClassName("cardRack")[0].appendChild(secondCard.wrapper);
                                }
                            }
                            if (game.forcedColor === "greenWild") {
                                for (let i = 0; i < 3; i++) {
                                    const secondCard = new Card(true);
                                    game.dealer.cards.push(secondCard);
                                    document.getElementsByClassName("cardRack")[0].appendChild(secondCard.wrapper);
                                }
                            }
                            game.forcedColor = "";
                            game.minipileAction = "";
                            document.getElementsByClassName("minipileOuter")[0].classList.add("minipileExit");
                            updateInventoryPlayability();
                            game.updateCardDiscard();
                            if (game.cardLoanRemaining === 0) await game.opponentTurn();
                            if (game.cardLoanRemaining > 0) {
                                game.cardLoanRemaining--;
                                document.getElementsByClassName("cardLoanRemaining")[0].textContent = "Remaining card payments: " + game.cardLoanRemaining;
                            }
                        }
                        updateInventoryPlayability();
                        game.updateCardDiscard();
                    };
                }
                if (destination.classList.contains("giveCardAwayInner")) {
                    game.dealer.cards.push(draggedCard);
                    game.player.cards.splice(game.player.cards.indexOf(draggedCard, 1));
                    document.getElementsByClassName("opponentHand")[0].appendChild(draggedCard.wrapper);
                    if (game.giveCardAction === "allGiveCardAway") {
                        game.giveCardAction = "";
                        const card = game.dealer.cards[0];
                        game.player.cards.push(card);
                        game.dealer.cards.splice(game.dealer.cards.indexOf(card), 1);
                        card.hidden = false;
                        card.updateElement();
                        document.getElementsByClassName("cardRack")[0].appendChild(card.wrapper);
                    }
                    if (game.giveCardAction === "give2CardsAway") {
                        game.giveCardAction = "";
                        document.getElementsByClassName("giveCardAwayLabel")[0].textContent = "Choose another card";
                        game.giveCardAction = "giveCardAway";
                        game.checkForWinCondition(false);
                    } else if (game.giveCardAction === "allGive2CardsAway") {
                        game.giveCardAction = "";
                        document.getElementsByClassName("giveCardAwayLabel")[0].textContent = "Choose another card";
                        game.giveCardAction = "allGiveCardAway";
                        game.checkForWinCondition(false);
                    } else {
                        game.giveCardAction = "";
                        (document.getElementsByClassName("giveCardAwayOuter")[0] as HTMLElement).style.animation = "giveCardAwayExit 1s";

                        if (game.cardLoanRemaining === 0) await game.opponentTurn();
                        if (game.cardLoanRemaining > 0) {
                            game.cardLoanRemaining--;
                            document.getElementsByClassName("cardLoanRemaining")[0].textContent = "Remaining card payments: " + game.cardLoanRemaining;
                        }
                    }
                }
            }
            destination.classList.remove("dragTarget")
        }
        draggedCard = null;
        dragGap.x = -1;
        dragGap.y = -1;
        dragGaps.length = 0;
        for (const card of selectedCards) {
            card.element.classList.remove("dragging");
            card.element.style.left = "";
            card.element.style.top = "";
        }
        setTimeout(() => {   
            for (const card of selectedCards) {
                card.element.classList.remove("dragging");
                card.element.style.left = "";
                card.element.style.top = "";
            }
        }, 100)
    })
}