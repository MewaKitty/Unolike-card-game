import { setInMenu } from "./mainMenu";

const singleplayerMenu = document.querySelector<HTMLDivElement>(".singleplayerMenu")!;

const exitButton = document.createElement("button");
exitButton.classList.add("cardCreatorCloseButton");
exitButton.textContent = "Close";
singleplayerMenu.appendChild(exitButton);

exitButton.addEventListener("click", () => {
    singleplayerMenu.style.animation = "scaleOut .3s";
    document.querySelector<HTMLDivElement>(".mainMenu")!.hidden = false;
    document.querySelector<HTMLDivElement>(".mainMenu")!.style.animation = "scaleIn .3s";
})

singleplayerMenu.addEventListener("animationend", e => {
    if (e.animationName === "scaleOut") singleplayerMenu.hidden = true;
})

const cardCreatorLeftPanel = document.createElement("div");
cardCreatorLeftPanel.classList.add("cardCreatorLeftPanel");
singleplayerMenu.appendChild(cardCreatorLeftPanel);

const cardCreatorRightPanel = document.createElement("div");
cardCreatorRightPanel.classList.add("cardCreatorRightPanel");
singleplayerMenu.appendChild(cardCreatorRightPanel);

let selectedDealerAmount = 1;

const oneDealer = document.createElement("div");
oneDealer.classList.add("card");
oneDealer.classList.add("dealerAmount");
oneDealer.classList.add("selectedCard");
oneDealer.style.setProperty("--color", "#ffffaa");
oneDealer.style.setProperty("--dark", "#999900");
const oneDealerInner = document.createElement("div");
oneDealerInner.classList.add("cardInner");
oneDealerInner.textContent = "One dealer";
oneDealer.appendChild(oneDealerInner);
cardCreatorRightPanel.appendChild(oneDealer)

oneDealer.addEventListener("click", () => {
    selectedDealerAmount = 1;
    oneDealer.classList.add("selectedCard");
})

const twoDealer = document.createElement("div");
twoDealer.classList.add("card");
twoDealer.classList.add("dealerAmount");
twoDealer.style.setProperty("--color", "#ff9f00");
twoDealer.style.setProperty("--dark", "#9f4f00");
const twoDealerInner = document.createElement("div");
twoDealerInner.classList.add("cardInner");
twoDealerInner.textContent = "Two dealers";
twoDealer.appendChild(twoDealerInner);
cardCreatorRightPanel.appendChild(twoDealer)

twoDealer.addEventListener("click", () => {
    selectedDealerAmount = 1;
    twoDealer.classList.add("selectedCard");
})

const startButton = document.createElement("button");
startButton.classList.add("startButton");
startButton.textContent = "Start";
startButton.addEventListener("click", () => {
    document.querySelector<HTMLDivElement>("#app")!.hidden = false;
    document.querySelector<HTMLDivElement>(".mainMenu")!.hidden = true;
    setInMenu(false);
    document.querySelector<HTMLDivElement>("#app")!.tabIndex = -1;
    document.querySelector<HTMLDivElement>(".abilityChooser")!.hidden = false;
    singleplayerMenu.style.animation = "scaleOut .3s";
})
cardCreatorRightPanel.appendChild(startButton);