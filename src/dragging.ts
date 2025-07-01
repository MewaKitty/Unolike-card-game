import { Card } from "./cards.ts";
import { game, updateInventoryPlayability } from "./game.ts";

let draggedCard: Card | null = null;
export let dragGap: { x: number, y: number } = { x: -1, y: -1 };
export const dragGaps: {x: number, y: number}[] = [];
export const setDraggedCard = (card: Card) => draggedCard = card;
export const getDraggedCard = () => draggedCard;

export const setupDragging = () => {
    const cardRack = document.getElementsByClassName("cardRack")[0];
    document.body.addEventListener("pointermove", e => {
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
                if (destination.classList.contains("cardDiscard") && !(game.selectedCards.includes(draggedCard) ? game.playableTwins() : draggedCard.playablePiles()).includes(pile)) return;
                destination.classList.add("dragTarget")
            } else {
                destination.classList.remove("dragTarget")
            }
        }
    })

    document.body.addEventListener("pointerup", e => {
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
        console.log(game.inventory)
        const selectedCards = Array.from(game.selectedCards);
        for (const destination of document.getElementsByClassName("dragDestination")) {
            if (e.pageX > destination.getBoundingClientRect().x
                && e.pageY > destination.getBoundingClientRect().y
                && e.pageX < destination.getBoundingClientRect().x + destination.getBoundingClientRect().width
                && e.pageY < destination.getBoundingClientRect().y + destination.getBoundingClientRect().height) {
                if (!draggedCard.tags.includes("pickup") && destination.classList.contains("cardDiscard")) {
                    const pile = +(destination as HTMLDivElement).dataset.index!;
                    if (game.selectedCards.length > 1 && game.selectedCards.includes(draggedCard)) {
                        const piles = game.playableTwins();
                        if (!piles.includes(pile)) return;
                    } else {
                        if (destination.classList.contains("cardDiscard") && !draggedCard.playablePiles().includes(pile)) return;
                    };
                    let skip = false;
                    if (game.selectedCards.includes(draggedCard)) {
                        for (const card of game.selectedCards) card.element.classList.remove("selectedCard");
                        if (game.selectedCards.length === 2 && game.selectedCards[0]?.number.value === game.selectedCards[1]?.number.value && (game.selectedCards[0]?.color !== game.discarded[pile].at(-1)?.color || game.selectedCards[0]?.number !== game.discarded[pile].at(-1)?.number)) {
                            const sameColor = game.selectedCards.filter(card => card.color === game.discarded[pile].at(-1)?.color);
                            const differentColor = game.selectedCards.filter(card => card.color !== game.discarded[pile].at(-1)?.color);
                            console.info("the a")
                            for (const card of sameColor) {
                                if (game.discardCard(card, pile)) skip = true;
                            }
                            for (const card of differentColor) {
                                if (game.discardCard(card, pile)) skip = true;
                            }
                        } else {
                            for (const card of game.selectedCards.filter(card => card !== draggedCard)) {
                                if (game.discardCard(card, pile)) skip = true;
                            }
                            if (game.discardCard(draggedCard, pile)) skip = true;
                        }
                    } else {
                        if (game.discardCard(draggedCard, pile)) skip = true;
                    };
                    game.selectedCards.length = 0;
                    game.checkForWinCondition();
                    if (draggedCard.number.actionId !== "skip" && !skip) game.opponentTurn();
                    updateInventoryPlayability();
                }
                if (destination === cardRack) {
                    if (!game.inventory.includes(draggedCard)) {
                        game.addToRack(draggedCard);
                        for (let i = 0; i < game.drawAmount - 1; i++) {
                            game.addToRack(new Card())
                        }
                        game.drawAmount = 0;
                        document.getElementsByClassName("drawAmountText")[0].textContent = "";
                        game.opponentTurn();
                    };
                }
            }
            destination.classList.remove("dragTarget")
        }
        console.log("time to reset")
        draggedCard = null;
        dragGap.x = -1;
        dragGap.y = -1;
        dragGaps.length = 0;
        console.info("sc", selectedCards)
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