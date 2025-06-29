import { Card } from "./cards.ts";
import { game, updateInventoryPlayability } from "./game.ts";

let draggedCard: Card | null = null;
export let dragGap: { x: number, y: number } = { x: -1, y: -1 };
export const setDraggedCard = (card: Card) => draggedCard = card;

export const setupDragging = () => {
    const cardDiscard = document.getElementsByClassName("cardDiscard")[0];
    const cardRack = document.getElementsByClassName("cardRack")[0];
    const pickupPile = document.getElementsByClassName("pickupPile")[0];
    document.body.addEventListener("pointermove", e => {
        if (!draggedCard) return;
        draggedCard.element.style.left = e.pageX - dragGap.x + "px";
        draggedCard.element.style.top = e.pageY - dragGap.y + "px";
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
                    cardDiscard.textContent = "";
                    cardDiscard.appendChild(draggedCard.wrapper)
                    game.discarded.push(draggedCard);
                    game.inventory.splice(game.inventory.indexOf(draggedCard), 1)
                    updateInventoryPlayability();
                    game.updateCardDiscard();
                    game.opponentTurn();
                }
                if (destination === cardRack) {
                    cardRack.appendChild(draggedCard.wrapper);
                    if (game.inventory.includes(draggedCard)) game.inventory.splice(game.inventory.indexOf(draggedCard), 1)
                    game.inventory.push(draggedCard);
                    draggedCard.hidden = false;
                    draggedCard.updateElement();
                    updateInventoryPlayability();
                    if (draggedCard.tags.includes("pickup")) {
                        draggedCard.tags.splice(draggedCard.tags.indexOf("pickup"), 1);
                        game.pickupCard = new Card(true, ["pickup"])
                        pickupPile.appendChild(game.pickupCard.wrapper)
                        game.opponentTurn();
                    }
                }
            }
            destination.classList.remove("dragTarget")
        }
        draggedCard = null;
        dragGap.x = -1;
        dragGap.y = -1;
    })
}