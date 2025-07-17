import { ClientCard } from "./client_card";
import { Card } from "./shared/cards";
import { SingleplayerGame } from "./singleplayer_game";

const mainMenu = document.createElement("div");
mainMenu.classList.add("mainMenu");
document.body.appendChild(mainMenu);

const title = document.createElement("span");
title.classList.add("gameMenuTitle");
mainMenu.appendChild(title);

const gameMenuSingleplayer = document.createElement("div");
gameMenuSingleplayer.classList.add("gameMenuSingleplayer");
gameMenuSingleplayer.classList.add("card");
mainMenu.appendChild(gameMenuSingleplayer);

const gameMenuSingleplayerInner = document.createElement("div");
gameMenuSingleplayerInner.classList.add("gameMenuSingleplayerInner");
gameMenuSingleplayerInner.classList.add("cardInner");
gameMenuSingleplayerInner.textContent = "Singleplayer";
gameMenuSingleplayer.appendChild(gameMenuSingleplayerInner);

gameMenuSingleplayer.addEventListener("click", () => {
    document.querySelector<HTMLDivElement>("#app")!.hidden = false;
    mainMenu.hidden = true;
})

const cardCreatorMenu = document.createElement("div");
cardCreatorMenu.classList.add("cardCreatorMenu");
document.body.appendChild(cardCreatorMenu);
cardCreatorMenu.hidden = true;

const cardCreatorButton = document.createElement("div");
cardCreatorButton.classList.add("cardCreatorButton");
cardCreatorButton.classList.add("card");
mainMenu.appendChild(cardCreatorButton);

const cardCreatorButtonInner = document.createElement("div");
cardCreatorButtonInner.classList.add("cardCreatorButtonInner");
cardCreatorButtonInner.classList.add("cardInner");
cardCreatorButtonInner.textContent = "Card creator";
cardCreatorButton.appendChild(cardCreatorButtonInner);

cardCreatorButton.addEventListener("click", () => {
    cardCreatorMenu.hidden = false;
    cardCreatorMenu.style.animation = "scaleIn .3s";
})

title.textContent = "U.L.C.G"

const mainMenuGame = new SingleplayerGame();

const cardShowcase = document.createElement("div");
cardShowcase.classList.add("cardShowcase");
cardShowcase.ariaHidden = "true";
mainMenu.appendChild(cardShowcase);

const convertRemToPixels = (rem: number) => {    
    return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
}

const cardShowCaseMap: Record<string, ClientCard>[] = [];
for (let i = 0; i < Math.ceil(innerWidth / convertRemToPixels(7)) * 2; i++) {
    cardShowCaseMap[i] = {};
    for (let j = 0; j < Math.ceil(innerHeight / convertRemToPixels(10)) * 2; j++) {
        cardShowCaseMap[i][j] = new ClientCard((new Card(mainMenuGame)).data(false));
    }
}

addEventListener("resize", () => {
    cardShowCaseMap.length = 0;
    for (let i = 0; i < Math.ceil(innerWidth / convertRemToPixels(7)) * 2; i++) {
        cardShowCaseMap[i] = {};
        for (let j = 0; j < Math.ceil(innerHeight / convertRemToPixels(10)) * 2; j++) {
            cardShowCaseMap[i][j] = new ClientCard((new Card(mainMenuGame)).data(false));
        }
    }
})
console.log(Math.ceil(innerWidth / convertRemToPixels(7)))
console.log(Math.ceil(innerHeight / convertRemToPixels(10)))

const xSpeedMult = Math.random() + 1;
const ySpeedMult = Math.random() + 1;

let lastRender = Date.now();
let animateTime = Math.random() * 5000;
const render = () => {
    const timeDelta = Date.now() - lastRender;
    lastRender = Date.now();
    animateTime += timeDelta;
    const totalWidth = cardShowCaseMap.length;
    const totalHeight = Object.keys(cardShowCaseMap[0]).length;
    cardShowcase.textContent = "";
    const speed = innerWidth * 8;
    const leftDiff = animateTime * convertRemToPixels(7) / speed * xSpeedMult;
    const topDiff = animateTime * convertRemToPixels(10) / speed * ySpeedMult;
    const leftCard = Math.floor(animateTime / speed * xSpeedMult);
    const topCard = Math.floor(animateTime / speed * ySpeedMult);
    for (let i = leftCard; i < Math.ceil(innerWidth / convertRemToPixels(7)) + leftCard + 1; i++) {
        for (let j = topCard; j < Math.ceil(innerHeight / convertRemToPixels(10)) + topCard + 1; j++) {
            const card = cardShowCaseMap[i % totalWidth][j % totalHeight];
            card.wrapper.style.position = "absolute";
            card.wrapper.style.left = convertRemToPixels(i * 7) - leftDiff + "px";
            card.wrapper.style.top = convertRemToPixels(j * 10) - topDiff + "px";
            cardShowcase.appendChild(card.wrapper);
        }
    }
    requestAnimationFrame(render);
}
requestAnimationFrame(render);