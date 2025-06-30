import { game, updateInventoryPlayability } from "./game.ts";
import { setupDragging } from "./dragging.ts";
import { Card } from "./cards.ts";

const app = document.querySelector<HTMLDivElement>('#app')!;

export const cardDiscard = document.createElement("div");
cardDiscard.classList.add("cardDiscard");
cardDiscard.classList.add("dragDestination");
cardDiscard.appendChild(game.discarded[0].element)

export const cardRack = document.createElement("div");
cardRack.classList.add("cardRack");
cardRack.classList.add("dragDestination");
for (const card of game.inventory) cardRack.appendChild(card.wrapper);

updateInventoryPlayability();

app.appendChild(cardRack);

app.appendChild(cardDiscard);

export const pickupPile = document.createElement("div");
pickupPile.classList.add("pickupPile");
const pickupLabel = document.createElement("span");
pickupPile.appendChild(pickupLabel);
pickupLabel.textContent = "Pick up here";
pickupPile.appendChild((game.pickupCard).wrapper)
app.appendChild(pickupPile);
pickupPile.addEventListener("click", async () => {
    if (!game.playersTurn) return;
    game.playersTurn = false;
    const placeholderDiv = document.createElement("div");
    placeholderDiv.classList.add("wrapper");
    cardRack.appendChild(placeholderDiv)
    setTimeout(() => placeholderDiv.remove(), 200)
    await game.animateElementMovement(game.pickupCard.element, placeholderDiv, game.pickupCard.wrapper)
    game.addToRack(game.pickupCard)
    for (let i = 0; i < game.drawAmount - 1; i++) {
        game.addToRack(new Card())
    }
    game.drawAmount = 0;
    document.getElementsByClassName("drawAmountText")[0].textContent = "";
    game.opponentTurn();
})

const opponentHand = document.createElement("div");
opponentHand.classList.add("opponentHand")
for (const card of game.opponentHand) {
    opponentHand.appendChild(card.wrapper);
}
app.appendChild(opponentHand);

const drawAmountText = document.createElement("span");
drawAmountText.classList.add("drawAmountText")
app.appendChild(drawAmountText);

setupDragging();