import { ClientCard } from "./client_card";
import { Card } from "./shared/cards";
import { SingleplayerGame } from "./singleplayer_game";


const cardShowcase = document.querySelector(".cardShowcase")!;

const convertRemToPixels = (rem: number) => {
    return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
}

const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
const svgWidth = Math.ceil(innerWidth / convertRemToPixels(7)) * 2 * convertRemToPixels(7);
const svgHeight = Math.ceil(innerHeight / convertRemToPixels(10)) * 2 * convertRemToPixels(10);
svg.style.width = svgWidth + "px";
svg.style.height = svgHeight + "px";
svg.setAttribute("viewBox", `0 0 ${svgWidth} ${svgHeight}`)
svg.setAttribute("width", svgWidth + "");
svg.setAttribute("height", svgHeight + "");

const blobToBase64 = (blob: Blob) => {
  const reader = new FileReader();
  reader.readAsDataURL(blob);
  return new Promise(resolve => {
    reader.onloadend = () => {
      resolve(reader.result);
    };
  });
};

const svgStyle = document.createElementNS("http://www.w3.org/2000/svg", "style");
svgStyle.innerHTML = `@font-face {
    font-family: Cabin;
    src: url("${await blobToBase64(await (await fetch("./Cabin-VariableFont_wdth,wght.ttf")).blob())}");
}`
svg.appendChild(svgStyle);

const renderCard = (card: ClientCard, x: string | number, y: string | number): SVGGElement => {
    const gElement = document.createElementNS("http://www.w3.org/2000/svg", "g");
    gElement.setAttribute("transform", `translate(${x}, ${y})`)
    svg.appendChild(gElement);
    const outerCardRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    outerCardRect.setAttribute("width", convertRemToPixels(7) + "");
    outerCardRect.setAttribute("height", convertRemToPixels(10) + "");
    outerCardRect.setAttribute("rx", convertRemToPixels(.5) + "");
    outerCardRect.setAttribute("ry", convertRemToPixels(.5) + "");
    outerCardRect.setAttribute("fill", "#333");
    gElement.appendChild(outerCardRect);
    const middleCardRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    middleCardRect.setAttribute("x", "2");
    middleCardRect.setAttribute("y", "2");
    middleCardRect.setAttribute("width", convertRemToPixels(7) - 4 + "");
    middleCardRect.setAttribute("height", convertRemToPixels(10) - 4 + "");
    middleCardRect.setAttribute("rx", convertRemToPixels(.5) + "");
    middleCardRect.setAttribute("ry", convertRemToPixels(.5) + "");
    middleCardRect.setAttribute("fill", "#fff");
    gElement.appendChild(middleCardRect);
    const innerCardRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    innerCardRect.setAttribute("x", 2 + convertRemToPixels(.3) + "");
    innerCardRect.setAttribute("y", 2 + convertRemToPixels(.3) + "");
    innerCardRect.setAttribute("width", convertRemToPixels(7) - 4 - convertRemToPixels(.6) + "");
    innerCardRect.setAttribute("height", convertRemToPixels(10) - 4 - convertRemToPixels(.6) + "");
    innerCardRect.setAttribute("rx", convertRemToPixels(.5) + "");
    innerCardRect.setAttribute("ry", convertRemToPixels(.5) + "");
    innerCardRect.setAttribute("fill", card.color!.color);
    gElement.appendChild(innerCardRect);
    document.body.appendChild(svg);
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text")
    text.textContent = "Card";
    text.setAttribute("x", 2 + convertRemToPixels(1) + "");
    text.setAttribute("y", 2 + convertRemToPixels(2) + "");
    text.setAttribute("font-family", "Cabin")
    text.setAttribute("font-size", convertRemToPixels(1) + "px")
    text.setAttribute("fill", card.color!.text ?? "black");
    gElement.appendChild(text);
    return gElement;
}
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

/*
await wait(0);

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

const mainMenuGameB = new SingleplayerGame();*/

const cardSpriteMap: SVGGElement[][] = [];

//const cardShowCaseMap: Record<string, ClientCard>[] = [];
for (let i = 0; i < Math.ceil(innerWidth / convertRemToPixels(7)) * 2; i++) {
    //cardShowCaseMap[i] = {};
    cardSpriteMap.push([]);
    console.log(i);
    for (let j = 0; j < Math.ceil(innerHeight / convertRemToPixels(10)) * 2; j++) {
        //cardShowCaseMap[i][j] = new ClientCard((new Card(mainMenuGame)).data(false));
        cardSpriteMap[i][j] = renderCard(new ClientCard((new Card(mainMenuGame)).data(false)), i * convertRemToPixels(7), j * convertRemToPixels(10));
    }
};

const data = new XMLSerializer().serializeToString(svg);

const dataHeader = 'data:image/svg+xml;charset=utf-8'
const encodeAsB64 = (data: string) => `${dataHeader};base64,${btoa(data)}`
const loadImage = (url: string): Promise<HTMLImageElement> => {
    const image = new Image();
    image.src = url;
    return new Promise((res, rej) => {
        image.addEventListener("load", () => res(image));
        image.addEventListener("error", rej);
    });
}
const image = await loadImage(encodeAsB64(data));
const format = "png";

console.log([svgWidth, svgHeight]);
console.log([image.width, image.height])
const canvas = document.createElement('canvas')
canvas.width = svgWidth * 2
canvas.height = svgHeight * 2
canvas.getContext('2d')!.drawImage(image, 0, 0, image.width, image.height, 0, 0, image.width * 2, image.height * 2)
console.log(URL.createObjectURL(await (await fetch(canvas.toDataURL(`image/${format}`, 1.0))).blob()))

/*
const url = (await app.renderer.extract.image(app.stage)).src;
const blob = await (await fetch(url)).blob();
console.log(URL.createObjectURL(blob))

app.destroy();*/
/*
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
*/
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