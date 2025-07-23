import { ClientCard } from "./client_card";
import { Card } from "./shared/cards";
import { SingleplayerGame } from "./singleplayer_game";
import { Application, Graphics, Sprite, Text, Assets } from "pixi.js";
import { wait } from "./utils.ts";


const cardShowcase = document.querySelector(".cardShowcase")!;

let inMenu = true;
export const setInMenu = (value: boolean) => inMenu = value;
const mainMenu = document.createElement("div");
mainMenu.classList.add("mainMenu");
document.body.appendChild(mainMenu);

const title = document.createElement("h1");
title.classList.add("gameMenuTitle");
mainMenu.appendChild(title);

const gameMenuSingleplayer = document.createElement("button");
gameMenuSingleplayer.classList.add("gameMenuSingleplayer");
gameMenuSingleplayer.classList.add("card");
mainMenu.appendChild(gameMenuSingleplayer);

const singleplayerMenu = document.createElement("article");
singleplayerMenu.classList.add("singleplayerMenu");
document.body.appendChild(singleplayerMenu);
singleplayerMenu.hidden = true;

mainMenu.addEventListener("animationend", e => {
    if (e.animationName === "scaleOut") mainMenu.hidden = true;
});
const gameMenuSingleplayerInner = document.createElement("div");
gameMenuSingleplayerInner.classList.add("gameMenuSingleplayerInner");
gameMenuSingleplayerInner.classList.add("cardInner");
gameMenuSingleplayerInner.textContent = "Singleplayer";
gameMenuSingleplayer.appendChild(gameMenuSingleplayerInner);

gameMenuSingleplayer.addEventListener("click", () => {
    singleplayerMenu.hidden = false;
    singleplayerMenu.style.animation = "scaleIn .3s";
    mainMenu.style.animation = "scaleOut .3s";
})

const cardCreatorMenu = document.createElement("article");
cardCreatorMenu.classList.add("cardCreatorMenu");
document.body.appendChild(cardCreatorMenu);
cardCreatorMenu.hidden = true;

const cardCreatorButton = document.createElement("button");
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
    mainMenu.style.animation = "scaleOut .3s";
})

title.textContent = "U.L.C.G"

const mainMenuGame = new SingleplayerGame();

await wait(0);

const convertRemToPixels = (rem: number) => {
    return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
}

const app = new Application();
await app.init({
    width: innerWidth * 2,
    height: innerHeight * 2
});

await Assets.load("./Cabin-Regular.ttf");

const renderCard = (card: ClientCard, x: number, y: number): [Sprite, Text] => {
    const graphics = new Graphics();

    graphics.roundRect(0, 0, convertRemToPixels(7) * 2, convertRemToPixels(10) * 2, convertRemToPixels(.5) * 2);
    graphics.fill(0x333333);

    graphics.roundRect(4, 4, convertRemToPixels(7) * 2 - 8, convertRemToPixels(10) * 2 - 8, convertRemToPixels(.5) * 2);
    graphics.fill(0xffffff);

    graphics.roundRect(convertRemToPixels(.3) * 2 + 4, convertRemToPixels(.3) * 2 + 4, convertRemToPixels(6.4) * 2 - 8, convertRemToPixels(9.4) * 2 - 8, convertRemToPixels(.5) * 2);
    graphics.fill(card.color?.color);
    const texture = app.renderer.generateTexture(graphics);

    const sprite = new Sprite(texture);
    sprite.x = x;
    sprite.y = y;
    app.stage.addChild(sprite);


    const basicText = new Text({
        text: card.number?.name,
        style: {
            fontFamily: "Cabin Regular",
            fontSize: 32,
            fill: card.color?.text ?? "black"
        }
    });

    basicText.x = x + convertRemToPixels(1) * 2;
    basicText.y = y + convertRemToPixels(1) * 2;

    app.stage.addChild(basicText);

    return [sprite, basicText]
}

const mainMenuGameB = new SingleplayerGame();

const cardSpriteMap: [Sprite, Text][][] = [];

const cardShowCaseMap: Record<string, ClientCard>[] = [];
for (let i = 0; i < Math.ceil(1920 / convertRemToPixels(7)) * 2; i++) {
    cardShowCaseMap[i] = {};
    cardSpriteMap.push([]);
    console.log(i);
    for (let j = 0; j < Math.ceil(1080 / convertRemToPixels(10)) * 2; j++) {
        cardShowCaseMap[i][j] = new ClientCard((new Card(mainMenuGame)).data(false));
        cardSpriteMap[i][j] = renderCard(new ClientCard((new Card(mainMenuGameB)).data(false)), i * convertRemToPixels(14), j * convertRemToPixels(20));
    }
};

const url = (await app.renderer.extract.image(app.stage)).src;
const blob = await (await fetch(url)).blob();
console.log(URL.createObjectURL(blob))

app.destroy();

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

const img = new Image();
img.src = URL.createObjectURL(blob);
img.addEventListener("load", () => {
    const image = new Image();
    image.src = URL.createObjectURL(blob);
    image.style.transform = "scale(.5) translateX(-50%) translateY(-50%)"
    image.style.position = "absolute";
    image.animate([
        {
            left: 0 + "px",
            top: 0 + "px"
        },
        {
            left: img.width / 2 + "px",
            top: img.height / 2 + "px"
        }
    ], {
        iterations: Infinity,
        duration: 60000
    })
    cardShowcase.appendChild(image);

    const imageB = new Image();
    imageB.src = URL.createObjectURL(blob);
    imageB.style.transform = "scale(.5) translateX(-50%) translateY(-50%)"
    imageB.style.position = "absolute";
    imageB.animate([
        {
            left: -img.width / 2 + "px",
            top: -img.height / 2 + "px"
        },
        {
            left: 0 + "px",
            top: 0 + "px"
        }
    ], {
        iterations: Infinity,
        duration: 60000
    })
    cardShowcase.appendChild(imageB);

    const imageC = new Image();
    imageC.src = URL.createObjectURL(blob);
    imageC.style.transform = "scale(.5) translateX(-50%) translateY(-50%)"
    imageC.style.position = "absolute";
    imageC.animate([
        {
            left: 0 + "px",
            top: -img.height / 2 + "px"
        },
        {
            left: img.width / 2 + "px",
            top: 0 + "px"
        }
    ], {
        iterations: Infinity,
        duration: 60000
    })
    cardShowcase.appendChild(imageC);

    const imageD = new Image();
    imageD.src = URL.createObjectURL(blob);
    imageD.style.transform = "scale(.5) translateX(-50%) translateY(-50%)"
    imageD.style.position = "absolute";
    imageD.animate([
        {
            left: -img.width / 2 + "px",
            top: 0 / 2 + "px"
        },
        {
            left: 0 + "px",
            top: img.height / 2 + "px"
        }
    ], {
        iterations: Infinity,
        duration: 60000
    })
    cardShowcase.appendChild(imageD);
})

/*
let lastRender = Date.now();
let animateTime = Math.random() * 5000;
const render = () => {
    if (!inMenu) return;
    const timeDelta = Date.now() - lastRender;
    lastRender = Date.now();
    animateTime += timeDelta;
    const speed = innerWidth * 8;
    const leftDiff = animateTime * convertRemToPixels(7) / speed * xSpeedMult;
    const topDiff = animateTime * convertRemToPixels(10) / speed * ySpeedMult;
    cardShowcase.style.position = "absolute";
    cardShowcase.style.left = leftDiff + "px";
    cardShowcase.style.top = topDiff + "px";
    requestAnimationFrame(render);
}
requestAnimationFrame(render);*/