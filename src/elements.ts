import { game, updateInventoryPlayability } from "./game.ts";
import { setupDragging } from "./dragging.ts";
import { Card } from "./cards.ts";
import colorData from "./data/colors.json";

const app = document.querySelector<HTMLDivElement>('#app')!;

for (let i = 0; i < 4; i++) {
    const cardDiscard = document.createElement("div");
    cardDiscard.classList.add("cardDiscard");
    cardDiscard.classList.add("dragDestination");
    cardDiscard.classList.add("cardDiscard" + i)
    cardDiscard.dataset.index = i + "";
    cardDiscard.appendChild(game.discarded[i][0].wrapper)
    app.appendChild(cardDiscard);
    if (i === game.closedPile) cardDiscard.classList.add("closed");
}

export const cardRack = document.createElement("div");
cardRack.classList.add("cardRack");
cardRack.classList.add("dragDestination");
for (const card of game.inventory) cardRack.appendChild(card.wrapper);

updateInventoryPlayability();

app.appendChild(cardRack);

export const pickupPile = document.createElement("div");
pickupPile.classList.add("pickupPile");
const pickupLabel = document.createElement("span");
pickupPile.appendChild(pickupLabel);
pickupLabel.textContent = "Pick up here until you can discard a card";
pickupPile.appendChild((game.pickupCard).wrapper)
app.appendChild(pickupPile);

let pointerDownTime = 0
pickupPile.addEventListener("pointerdown", async () => {
    let hasPlayable = false;
    for (const card of game.inventory) {
        if (card.isPlayable()) hasPlayable = true;
    }
    if (hasPlayable) return;
    pointerDownTime = Date.now();
});
pickupPile.addEventListener("pointerup", async () => {
    if (Date.now() - pointerDownTime > 350) return;
    if (!game.playersTurn) return;
    console.log(game.wasDragging)
    if (game.wasDragging) return;
    //game.playersTurn = false;
    const placeholderDiv = document.createElement("div");
    placeholderDiv.classList.add("wrapper");
    cardRack.appendChild(placeholderDiv)
    setTimeout(() => placeholderDiv.remove(), 200)
    await game.animateElementMovement(game.pickupCard.element, placeholderDiv, game.pickupCard.wrapper)
    if (game.pickupCard.number.actionId === "draw3More") game.drawAmount += 3;
    game.addToRack(game.pickupCard)
    console.debug("draw", game.drawAmount)
    for (let i = 0; i < Math.min(game.drawAmount - 1, 30); i++) {
        const newCard = new Card();
        if (newCard.number.actionId === "draw3More") game.drawAmount += 3;
        game.addToRack(newCard)
    }
    game.drawAmount = 0;
    document.getElementsByClassName("drawAmountText")[0].textContent = "";
    //game.opponentTurn();
})

const opponentHand = document.createElement("div");
opponentHand.classList.add("opponentHand")
for (const card of game.opponentHand) {
    opponentHand.appendChild(card.wrapper);
}
app.appendChild(opponentHand);

const opponentHandLabel = document.createElement("span");
opponentHandLabel.classList.add("opponentHandLabel");
opponentHandLabel.textContent = "Dealer's cards";
app.appendChild(opponentHandLabel);

const drawAmountText = document.createElement("span");
drawAmountText.classList.add("drawAmountText")
app.appendChild(drawAmountText);

const pressureCount = document.createElement("span");
pressureCount.classList.add("pressureCount")
pressureCount.textContent = "Pressure: 1/10";
app.appendChild(pressureCount);

const minipileOuter = document.createElement("div");
minipileOuter.classList.add("minipileOuter");
const minipileInfo = document.createElement("div")
minipileInfo.classList.add("minipileInfo");
const minipileLabel = document.createElement("span");
minipileLabel.classList.add("minipileLabel");
minipileLabel.textContent = "Minipile";
minipileInfo.appendChild(minipileLabel)
const minipileDescription = document.createElement("span");
minipileDescription.classList.add("minipileDescription");
minipileDescription.textContent = "Drag the entire pile to your inventory if you can't play or defend against a plus card.";
minipileInfo.appendChild(minipileDescription)
minipileOuter.appendChild(minipileInfo);
const minipileInner = document.createElement("div");
minipileInner.classList.add("minipileInner");
minipileInner.classList.add("cardDiscard-1");
minipileInner.dataset.index = "-1";
minipileOuter.appendChild(minipileInner);
minipileInner.classList.add("dragDestination");
minipileOuter.classList.add("minipileExit");
minipileOuter.hidden = true;
app.appendChild(minipileOuter);

minipileOuter.addEventListener("transitionend", () => {
    if (minipileOuter.classList.contains("minipileExit")) minipileOuter.hidden = true;
})

const colorChooser = document.createElement("div");
colorChooser.classList.add("colorChooser");
const colorChooserLabel = document.createElement("span");
colorChooserLabel.textContent = "Choose a color";
colorChooser.appendChild(colorChooserLabel);
const colorChooserInner = document.createElement("div");
colorChooserInner.classList.add("colorChooserInner");
for (const color of colorData) {
    if (color.wild) continue;
    const colorEntry = document.createElement("div");
    colorEntry.classList.add("colorEntry")
    colorEntry.style.background = color.color;
    colorChooserInner.appendChild(colorEntry);
    colorEntry.addEventListener("click", async () => {
        colorChooser.classList.add("colorChooserExit");
        game.colorChooserActive = false;
        game.playersTurn = false;
        switch (game.colorChooserAction) {
            case "draw3DiscardColor":
                for (let i = 0; i < 3; i++) {
                    await game.opponentPickup();
                }
                for (const card of game.opponentHand) {
                    if (card.color.name === color.name) {
                        game.opponentHand.splice(game.opponentHand.indexOf(card), 1);
                        card.wrapper.remove();
                        if (game.colorChooserPile === -1) {
                            game.minipile.unshift(card);
                        } else {
                            game.discarded[game.colorChooserPile].unshift(card);
                        }
                    }
                }
                break;
            case "draw1To2Color":
                const card = await game.opponentPickup();
                if (card.color.name !== color.name) {
                    await game.opponentPickup();
                }
                break;
            case "colorDraw":
                const placeholderDiv = document.createElement("div");
                placeholderDiv.classList.add("wrapper");
                document.getElementsByClassName("cardRack")[0].appendChild(placeholderDiv)
                setTimeout(() => placeholderDiv.remove(), 200)
                await game.animateElementMovement(game.pickupCard.element, placeholderDiv, game.pickupCard.wrapper)
                const pickupCard = game.pickupCard
                game.addToRack(game.pickupCard)
                if (pickupCard.color === color) return;
                for (let i = 0; i < 25; i++) {
                    const newCard = new Card();
                    game.addToRack(newCard);
                    if (newCard.color === color) return;
                }
                await game.opponentTurn();
                break;
            case "promise":
                game.colorChooserPromise?.(color);
        }
        game.playersTurn = true;
        game.colorChooserActive = false;
        updateInventoryPlayability();
        game.updateCardDiscard();
    })
}
colorChooser.appendChild(colorChooserInner)
colorChooser.hidden = true;
colorChooser.classList.add("colorChooserExit");
app.appendChild(colorChooser);
setupDragging();

colorChooser.addEventListener("transitionend", () => {
    if (colorChooser.classList.contains("colorChooserExit")) colorChooser.hidden = true;
})

const useReflectBox = document.createElement("div");
useReflectBox.classList.add("useReflectBox");
const reflectDisplay = document.createElement("div");
reflectDisplay.classList.add("reflectDisplay");
useReflectBox.appendChild(reflectDisplay);
const reflectDisplayGap = document.createElement("div");
reflectDisplayGap.classList.add("reflectDisplayGap");
useReflectBox.appendChild(reflectDisplayGap);

const reflectBoxPanel = document.createElement("div")
reflectBoxPanel.classList.add("reflectBoxPanel")
const useReflectLabel = document.createElement("span");
useReflectLabel.textContent = "Use reflect card?"
reflectBoxPanel.appendChild(useReflectLabel)
useReflectBox.appendChild(reflectBoxPanel)
useReflectBox.classList.add("reflectBoxExit")
useReflectBox.hidden = true;
app.appendChild(useReflectBox)

useReflectBox.addEventListener("transitionend", () => {
    if (useReflectBox.classList.contains("reflectBoxExit")) useReflectBox.hidden = true;
})

const reflectBoxYes = document.createElement("button");
reflectBoxYes.textContent = "Use";
reflectBoxPanel.appendChild(reflectBoxYes)

reflectBoxYes.addEventListener("click", async () => {
    useReflectBox.classList.add("reflectBoxExit");
    const card = (game.reflectPile === -1 ? game.minipile : game.discarded[game.reflectPile]).at(-1);
    (game.reflectPile === -1 ? game.minipile : game.discarded[game.reflectPile]).push(game.reflectCard!);
    game.inventory.splice(game.inventory.indexOf(game.reflectCard!), 1);
    await game.animateElementMovement(game.reflectCard!.wrapper, document.getElementsByClassName("cardDiscard" + game.reflectPile)[0].children[0] as HTMLElement, document.getElementsByClassName("cardDiscard" + game.reflectPile)[0]);
    game.reflectRes?.(true);
    (document.getElementsByClassName("reflectPlaceholder")[0] as HTMLDivElement).style.minWidth = "0";
    setTimeout(() => document.getElementsByClassName("reflectPlaceholder")[0].remove(), 160)
    game.reflectCard = null;
    updateInventoryPlayability();
    if (card) await game.applyPlayerDiscardEffects(card, game.reflectPile);
    await game.opponentTurn();
})
const reflectBoxNo = document.createElement("button");
reflectBoxNo.textContent = "Keep";
reflectBoxPanel.appendChild(reflectBoxNo)

reflectBoxNo.addEventListener("click", async () => {
    useReflectBox.classList.add("reflectBoxExit")
    await game.animateElementMovement(game.reflectCard!.wrapper, document.getElementsByClassName("reflectPlaceholder")[0] as HTMLElement, document.getElementsByClassName("reflectPlaceholder")[0])
    document.getElementsByClassName("reflectPlaceholder")[0].parentElement?.insertBefore(game.reflectCard!.wrapper, document.getElementsByClassName("reflectPlaceholder")[0])
    document.getElementsByClassName("reflectPlaceholder")[0].remove();
    game.reflectCard = null;
    updateInventoryPlayability();
    game.reflectRes?.(false);
})

for (let i = -1; i < 4; i++) {
    const randomOccuranceLabel = document.createElement("span");
    randomOccuranceLabel.classList.add("randomOccuranceLabel")
    randomOccuranceLabel.classList.add("randomOccuranceLabel" + i)
    app.appendChild(randomOccuranceLabel);
}

const lotteryRow = document.createElement("div");
lotteryRow.classList.add("lotteryRow");
lotteryRow.hidden = true;
app.appendChild(lotteryRow);

const lotteryDarken = document.createElement("div");
lotteryDarken.classList.add("lotteryDarken");
lotteryDarken.hidden = true;
app.appendChild(lotteryDarken);

lotteryDarken.addEventListener("animationend", e => {
    if (e.animationName === "lotteryOpacityOut") {
        lotteryDarken.hidden = true;
    };
})

const lotteryResult = document.createElement("div");
lotteryResult.classList.add("lotteryResult");
lotteryResult.hidden = true;
app.appendChild(lotteryResult);

lotteryRow.addEventListener("animationend", e => {
    if (e.animationName === "lotteryOpacityOut") {
        lotteryRow.textContent = "";
        lotteryRow.hidden = true;
        lotteryRow.style.animation = "";
        lotteryResult.textContent = "";
        lotteryResult.hidden = true;
    };
})

const resultScreen = document.createElement("div");
resultScreen.classList.add("resultScreen");
resultScreen.hidden = true;
app.appendChild(resultScreen);

const playerCardCount = document.createElement("div");
playerCardCount.classList.add("playerCardCount");
playerCardCount.textContent = "7";
app.appendChild(playerCardCount)

const opponentCardCount = document.createElement("div");
opponentCardCount.classList.add("opponentCardCount");
opponentCardCount.textContent = "7";
app.appendChild(opponentCardCount)

const reobtainRack = document.createElement("div");
reobtainRack.classList.add("reobtainRack");
reobtainRack.hidden = true;
app.appendChild(reobtainRack);

reobtainRack.addEventListener("animationend", e => {
    if (e.animationName === "moveRightOut") {
        reobtainRack.hidden = true;
        reobtainRack.textContent = "";
    }
})

const playerLiveCounter = document.createElement("span");
playerLiveCounter.classList.add("playerLiveCounter")
playerLiveCounter.textContent = "Lives: 2";
app.appendChild(playerLiveCounter);

const opponentLiveCounter = document.createElement("span");
opponentLiveCounter.classList.add("opponentLiveCounter")
opponentLiveCounter.textContent = "Lives: 2";
app.appendChild(opponentLiveCounter);