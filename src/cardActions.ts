import type { Game } from "./game.ts";
import { shuffleArray, randomInteger, wait, random } from "./utils.ts";
import { Card } from "./cards.ts";

import colorData from "./data/colors.json";

type CardActionFunction = (game: Game) => void | boolean | Promise<void> | Promise<boolean> | Promise<void | boolean>;

export default {
    "swap": async (game) => {
        if (await game.target.checkForReflectStatus(game.currentPile)) return;
        game.actor.swapCardsWith(game.target);
    },
    "shuffle": async (game) => {
        if (await game.target.checkForReflectStatus(game.currentPile)) return;
        const actingHandCount = game.actor.cards.length;
        const targetHandCount = game.target.cards.length;
        const allCards = [...game.actor.cards, ...game.target.cards];
        game.actor.cards.length = 0;
        game.target.cards.length = 0;
        shuffleArray(allCards)
        for (let i = 0; i < actingHandCount; i++) game.actor.cards.push(allCards.shift()!);
        for (let i = 0; i < targetHandCount; i++) game.target.cards.push(allCards.shift()!);
        game.updateHands();
    },
    "50": async (game) => {
        if (Math.random() > 0.5) {
            game.addDrawAmount(4, game.currentPile);
            return true;
        } else {
            if (await game.target.checkForReflectStatus(game.currentPile)) return;
            game.addDrawAmount(4, game.currentPile);
        }
    },
    "x2": async (game) => {
        game.pressureAmount += 2;
        if (game.pressureAmount >= 10) {
            if (await game.target.checkForReflectStatus(game.currentPile)) return;
            game.pressureAmount = 1;
            game.addDrawAmount(randomInteger(1, 10), game.currentPile)
        }
        document.getElementsByClassName("pressureCount")[0].textContent = "Pressure: " + game.pressureAmount + "/10";
        (document.querySelector(".pressureBar .healthBarContent") as HTMLDivElement).style.width = (game.pressureAmount / 10) * 100 + "%";
    },
    "discardAll": (game) => {
        for (const secondCard of game.actor.cards) {
            if (secondCard.color !== game.currentCard!.color) continue;
            game.pileContents.unshift(secondCard);
            secondCard.wrapper.remove();
            game.actor.cards.splice(game.actor.cards.indexOf(secondCard), 1)
            game.updateInventoryPlayability();
        }
    },
    "x10": async (game) => {
        if (await game.target.checkForReflectStatus(game.currentPile)) return;
        game.pressureAmount = 1;
        document.getElementsByClassName("pressureCount")[0].textContent = "Pressure: " + game.pressureAmount + "/10";
        (document.querySelector(".pressureBar .healthBarContent") as HTMLDivElement).style.width = (game.pressureAmount / 10) * 100 + "%";
        game.addDrawAmount(randomInteger(1, 10), game.currentPile)
    },
    "drawColor": async (game) => {
        if (await game.target.checkForReflectStatus(game.currentPile)) return;
        game.playersTurn = false;
        for (let i = 0; i < 25; i++) {
            const newCard = await game.target.pickup();
            if (newCard.color === game.currentCard!.color) break;
        }
        game.playersTurn = true;
        game.updateInventoryPlayability();
    },
    "randomOccurance": async (game) => {
        if (await game.target.checkForReflectStatus(game.currentPile)) return;
        switch (randomInteger(1, 8)) {
            case 1:
                while (game.actor.cards.length > 2) {
                    game.actor.discardToBottom(game.actor.cards[0]);
                }
                document.getElementsByClassName("randomOccuranceLabel" + game.currentPile)[0].textContent = "Discard all but 2"
                break;
            case 2:
                const number = game.actor.cards[0].number;
                for (const secondCard of game.actor.cards) {
                    if (secondCard.number === number) game.actor.discardToBottom(secondCard);
                }
                document.getElementsByClassName("randomOccuranceLabel" + game.currentPile)[0].textContent = "Discard number"
                break;
            case 3:
                const color = game.actor.cards[0].color;
                for (const secondCard of game.actor.cards) {
                    if (secondCard.color === color) game.actor.discardToBottom(secondCard);
                }
                document.getElementsByClassName("randomOccuranceLabel" + game.currentPile)[0].textContent = "Discard color"
                break;
            case 4:
                document.getElementsByClassName("randomOccuranceLabel" + game.currentPile)[0].textContent = "Draw until color"
                game.playersTurn = false;
                for (let i = 0; i < 25; i++) {
                    const newCard = await game.target.pickup();
                    if (newCard.color === game.currentCard!.color) break;
                }
                game.playersTurn = true;
                break;
            case 5:
                game.actor.swapCardsWith(game.target);
                document.getElementsByClassName("randomOccuranceLabel" + game.currentPile)[0].textContent = "Swap hands"
                break;
            case 6:
                document.getElementsByClassName("randomOccuranceLabel" + game.currentPile)[0].textContent = "Nothing"
                break;
            case 7:
                const highestActor = Array.from(game.actor.cards).sort((a, b) => b.number?.value ?? -1 - (a.number?.value ?? -1))[0]
                const highestTarget = Array.from(game.target.cards).sort((a, b) => b.number?.value ?? -1 - (a.number?.value ?? -1))[0]
                if ((highestActor.number?.value ?? -1) > (highestTarget.number?.value ?? -1)) {
                    game.actor.discardToBottom(highestActor);
                } else {
                    game.target.discardToBottom(highestTarget);
                }
                document.getElementsByClassName("randomOccuranceLabel" + game.currentPile)[0].textContent = "Discard highest card"
                break;
            case 8:
                if (Math.random() > 0.5) {
                    game.actor.discardToBottom(game.actor.cards[0]);
                } else {
                    game.actor.discardToBottom(game.target.cards[0]);
                }
                document.getElementsByClassName("randomOccuranceLabel" + game.currentPile)[0].textContent = "Discard random card"
        }
    },
    "-2": async (game) => {
        if (await game.target.checkForReflectStatus(game.currentPile)) return;
        for (let i = 0; i < 2; i++) {
            game.target.discardToBottom(game.target.cards[0]);
            await game.target.pickup();
        }
    },
    "randomBox": async (game) => {
        if (await game.target.checkForReflectStatus(game.currentPile)) return;
        switch (randomInteger(1, 8)) {
            case 1:
                document.getElementsByClassName("randomOccuranceLabel" + game.currentPile)[0].textContent = "Occurance disappeared?"
                break;
            case 2:
                document.getElementsByClassName("randomOccuranceLabel" + game.currentPile)[0].textContent = "Ye skip a turn"
                return true;
            case 3:
                game.addDrawAmount(2, game.currentPile);
                document.getElementsByClassName("randomOccuranceLabel" + game.currentPile)[0].textContent = "DRAW 2!!!"
                break;
            case 4:
                game.addDrawAmount(1, game.currentPile);
                document.getElementsByClassName("randomOccuranceLabel" + game.currentPile)[0].textContent = "Draw 1"
                break;
            case 5:
                game.target.pickup();
                document.getElementsByClassName("randomOccuranceLabel" + game.currentPile)[0].textContent = "Pickup time"
                return true;
            case 6:
                game.addDrawAmount(2, game.currentPile);
                document.getElementsByClassName("randomOccuranceLabel" + game.currentPile)[0].textContent = "Draw 2 but for YOU"
                return true;
        }
    },
    "lock": (game) => {
        if (!game.lockedPiles.includes(game.currentPile)) game.lockedPiles.push(game.currentPile);
    },
    "minipile": (game) => {
        game.isMinipileActive = true;
        const minipileCard = new Card(false, ["minipile"]);
        document.getElementsByClassName("minipileInner")[0].textContent = "";
        document.getElementsByClassName("minipileInner")[0].appendChild(minipileCard.wrapper)
        game.minipile.push(minipileCard);
        (document.getElementsByClassName("minipileOuter")[0] as HTMLElement).hidden = false;
        document.getElementsByClassName("minipileOuter")[0].classList.remove("minipileExit");
        minipileCard.element.classList.remove("unplayable")
        document.getElementsByClassName("minipileOuter")[0].classList.remove("unplayable");
        game.updateCardDiscard();
        game.updateInventoryPlayability();
    },
    "draw3DiscardColor": async (game) => {
        if (await game.target.checkForReflectStatus(game.currentPile)) return;
        const color = await game.actor.promptColorChooser();
        for (let i = 0; i < 3; i++) {
            await game.target.pickup();
        }
        for (const card of game.target.cards) {
            if (card.color.name === color.name) game.target.discardToBottom(card);
        };
    },
    "draw1To2Color": async (game) => {
        if (await game.target.checkForReflectStatus(game.currentPile)) return;
        const color = await game.actor.promptColorChooser();
        const card = await game.target.pickup();
        if (card.color.name !== color.name) {
            await game.target.pickup();
        }
    },
    "giveAwayColor": async (game) => {
        const color = game.actor.cards[0].color;
        for (const secondCard of game.actor.cards) {
            if (secondCard.color === color) {
                game.actor.cards.splice(game.actor.cards.indexOf(secondCard), 1)
                game.target.cards.push(secondCard);
                const targetParent = game.actor.isOpponent ? document.getElementsByClassName("opponentHand")[0] : document.getElementsByClassName("cardRack")[0]
                await game.animateElementMovement(secondCard.wrapper, targetParent as HTMLElement, targetParent)
                game.updateInventoryPlayability();
            }
        }
    },
    "colorDraw": async (game) => {
        if (await game.target.checkForReflectStatus(game.currentPile)) return;
        const color = await game.target.promptColorChooser();
        game.playersTurn = false;
        for (let i = 0; i < 25; i++) {
            const newCard = await game.target.pickup();
            newCard.hidden = false;
            newCard.updateElement();
            if (newCard.color === color) break;
        }
        return true;
    },
    "lottery": async () => {
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
    },
    "blueRandom": async (game) => {
        switch (randomInteger(1, 6)) {
            case 1:
                game.playersTurn = false;
                for (let i = 0; i < 25; i++) {
                    const newCard = await game.target.pickup();
                    if (newCard.color.name === "Blue" || newCard.number.value === 2 || newCard.number.value === 0 || newCard.color.wild) break;
                }
                break;
            case 2:
                if (game.actor.isOpponent) {
                    await game.applyPlayerDiscardEffects(game.currentCard!, game.currentPile);
                } else {
                    await game.applyOpponentDiscardEffects(game.currentCard!, game.currentPile);
                }
                break;
            case 3:
                for (let i = 0; i < 3; i++) {
                    await game.target.pickup();
                }
                break;
            case 4:
                for (let i = 0; i < 2; i++) {
                    await game.target.pickup();
                }
                break;
            case 5:
                const secondCard = game.actor.cards[0];
                game.actor.cards.splice(game.actor.cards.indexOf(secondCard, 1));
                game.target.cards.push(secondCard);
                const targetParent = game.actor.isOpponent ? document.getElementsByClassName("opponentHand")[0] : document.getElementsByClassName("cardRack")[0]
                targetParent.appendChild(secondCard.wrapper);
                game.updateInventoryPlayability();
                break;
            case 6:
                for (let i = 0; i < 2; i++) {
                    const thirdCard = game.actor.cards[0];
                    game.actor.cards.splice(game.actor.cards.indexOf(thirdCard, 1));
                    (game.currentPile === -1 ? game.minipile : game.discarded[game.currentPile]).push(thirdCard);
                    document.getElementsByClassName("cardDiscard" + game.currentPile)[0].textContent = "";
                    document.getElementsByClassName("cardDiscard" + game.currentPile)[0].appendChild(thirdCard.wrapper);
                    game.updateCardDiscard();
                    break;
                }
        }
    },
    "forced+1": async (game) => {
        if (await game.target.checkForReflectStatus(game.currentPile)) return;
        await game.target.pickup();
    },
    "danger": async (game) => {
        console.debug(game.actor)
        if (game.actor.ability?.passive === "danger-1hp") {
            console.log("danger1hp")
            game.target.health -= 1;
            game.target.updateHealthCount();
        }
        const dangerCard = game.actor.ability?.[random(["enemy1", "enemy2", "enemy3", "enemy4"]) as "enemy1" | "enemy2" | "enemy3" | "enemy4"];
        if (!dangerCard) return;
        document.getElementsByClassName("dangerCardArea")[0].textContent = "";
        const dangerCardDiv = document.createElement("div");
        dangerCardDiv.classList.add("card")
        dangerCardDiv.classList.add("dangerCard");
        const dangerCardDivInner = document.createElement("div");
        dangerCardDivInner.classList.add("cardInner");
        dangerCardDiv.appendChild(dangerCardDivInner);
        document.getElementsByClassName("dangerCardArea")[0].appendChild(dangerCardDiv)
        dangerCardDivInner.style = `--color: #333; color: #fff`;
        const cardDescriptionSpan = document.createElement("span");
        cardDescriptionSpan.classList.add("cardDescriptionSpan");
        cardDescriptionSpan.textContent = dangerCard.description.join("\n");
        dangerCardDivInner.appendChild(cardDescriptionSpan);
        if (dangerCard.start === "-1WildAdd1") {
            const wildCard = game.actor.cards.find(card => card.color.wild);
            if (wildCard) game.actor.discardToBottom(wildCard);
            await game.actor.pickup();
        }
        if (dangerCard.start === "-1hpAdd1") {
            game.actor.health--;
            game.actor.updateHealthCount();
            await game.actor.pickup();
        }
        if (dangerCard.start === "-1hp") {
            game.actor.health--;
            game.actor.updateHealthCount();
        }
        if (dangerCard.start === "-2hp") {
            game.actor.health -= 2;
            game.actor.updateHealthCount();
        }
        if (dangerCard.start === "allAdd1Card") {
            await game.actor.pickup();
            await game.dealer.pickup();
        }
        game.dangerCard = dangerCard;
        if (dangerCard.start === "skip") return true;
    },
    "wild1": async (game) => {
        if (game.actor.ability?.wild1 === "add1card") {
            await game.target.pickup();
        }
        if (game.actor.ability?.wild1 === "add1Card+2hp") {
            await game.target.pickup();
            if (game.dangerCard?.attack !== "noHealing") game.actor.health += 2;
            game.actor.updateHealthCount();
        }
    },
    "wild2": async (game) => {
        if (game.actor.ability?.wild2 === "defeatEnemy") {
            document.getElementsByClassName("dangerCardArea")[0].textContent = "";
            game.dangerCard = null;
            if (game.dealer.ability?.passive === "defeatEnemy+2hp") {
                game.dealer.health += 2;
                game.dealer.updateHealthCount();
            }
        }
    },
    "wild4": async (game) => {
        if (game.actor.ability?.wild4 === "-1hp") {
            game.target.health -= 4;
            game.target.updateHealthCount();
            game.checkForWinCondition(game.actor.isOpponent);
        }
        if (game.actor.ability?.wild4 === "+4hpOther+2") {
            if (game.dangerCard?.attack !== "noHealing") game.actor.health += 4;
            game.actor.updateHealthCount();
            if (game.dangerCard?.attack !== "noHealing") game.dealer.health += 2;
            game.dealer.updateHealthCount();
        }
    },
} satisfies Record<string, CardActionFunction> as Record<string, CardActionFunction>