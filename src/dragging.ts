import { Card } from "./cards.ts";
import { game } from "./game.ts";

let draggedCard: Card | null = null;
export let dragGap: { x: number, y: number } = { x: -1, y: -1 };
export const dragGaps: {x: number, y: number}[] = [];
export const setDraggedCard = (card: Card) => draggedCard = card;

export const setupDragging = () => {
    const cardDiscard = document.getElementsByClassName("cardDiscard")[0];
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
                destination.classList.add("dragTarget")
            } else {
                destination.classList.remove("dragTarget")
            }
        }
    })

    document.body.addEventListener("pointerup", e => {
        if (!draggedCard) return;
        draggedCard.element.classList.remove("dragging");
        draggedCard.element.style.left = "";
        draggedCard.element.style.top = "";
        console.log(game.inventory)
        for (const destination of document.getElementsByClassName("dragDestination")) {
            if (e.pageX > destination.getBoundingClientRect().x
                && e.pageY > destination.getBoundingClientRect().y
                && e.pageX < destination.getBoundingClientRect().x + destination.getBoundingClientRect().width
                && e.pageY < destination.getBoundingClientRect().y + destination.getBoundingClientRect().height) {
                if (!draggedCard.tags.includes("pickup") && destination === cardDiscard) {
                    if (game.selectedCards.includes(draggedCard)) {
                        for (const card of game.selectedCards) card.element.classList.remove("selectedCard");
                        for (const card of game.selectedCards.filter(card => card !== draggedCard)) game.discardCard(card);
                        game.discardCard(draggedCard);
                        game.selectedCards.length = 0;
                    } else {
                        game.discardCard(draggedCard);
                    };
                    game.opponentTurn();
                }
                if (destination === cardRack) {
                    if (!game.inventory.includes(draggedCard)) game.addToRack(draggedCard);
                }
            }
            destination.classList.remove("dragTarget")
        }
        draggedCard = null;
        dragGap.x = -1;
        dragGap.y = -1;
        dragGaps.length = 0;
        for (const card of game.selectedCards) {
            card.element.classList.remove("dragging");
            card.element.style.left = "";
            card.element.style.top = "";
        }
        setTimeout(() => {   
            for (const card of game.selectedCards) {
                card.element.classList.remove("dragging");
                card.element.style.left = "";
                card.element.style.top = "";
            }
        }, 100)
    })
}