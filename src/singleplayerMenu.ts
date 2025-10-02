import { client } from "./client.ts";

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

const singleplayerMenuLabel = document.createElement("h2");
singleplayerMenuLabel.textContent = "Singleplayer";
cardCreatorLeftPanel.appendChild(singleplayerMenuLabel);

const cardCreatorRightPanel = document.createElement("div");
cardCreatorRightPanel.classList.add("cardCreatorRightPanel");
singleplayerMenu.appendChild(cardCreatorRightPanel);

const optionsLabel = document.createElement("h2");
optionsLabel.textContent = "Options";
cardCreatorRightPanel.appendChild(optionsLabel);

const optionsDescription = document.createElement("p");
optionsDescription.textContent = "No options are here; maybe coming in a remake";
cardCreatorRightPanel.appendChild(optionsDescription);

const optionsDescriptionB = document.createElement("p");
optionsDescriptionB.textContent = "(very buggy because I tried undoing a remake of the cards system)";
cardCreatorRightPanel.appendChild(optionsDescriptionB);

let selectedDealerAmount = 1;

const dealerForms = document.createElement("div");
dealerForms.classList.add("cardColorForms");
cardCreatorLeftPanel.append(dealerForms);

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
//dealerForms.appendChild(oneDealer)

oneDealer.addEventListener("click", () => {
    selectedDealerAmount = 1;
    oneDealer.classList.add("selectedCard");
    twoDealer.classList.remove("selectedCard");
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
//dealerForms.appendChild(twoDealer)

twoDealer.addEventListener("click", () => {
    selectedDealerAmount = 2;
    oneDealer.classList.remove("selectedCard");
    twoDealer.classList.add("selectedCard");
})


const startButton = document.createElement("button");
startButton.classList.add("startButton");
startButton.textContent = "Start";
startButton.addEventListener("click", async () => {
    if (!client.isMultiplayer) {
        console.log("updateDiscarded")
        client.game?.updateDiscarded();
        client.game?.addPlayer(false);
        await client.game?.addPlayer(true);
        if (selectedDealerAmount === 1) {
            document.querySelector<HTMLDivElement>("#app")!.classList.add("oneDealerGame")
        } else {
            document.querySelector<HTMLDivElement>("#app")!.classList.add("twoDealerGame")
        }
        if (selectedDealerAmount === 2) await client.game!.addPlayer(true);;
    }
    document.querySelector<HTMLDivElement>("#app")!.hidden = false;
    document.querySelector<HTMLDivElement>(".mainMenu")!.hidden = true;
    document.querySelector<HTMLDivElement>("#app")!.tabIndex = -1;
    document.querySelector<HTMLDivElement>(".abilityChooser")!.hidden = false;
    singleplayerMenu.style.animation = "scaleOut .3s";
})
cardCreatorLeftPanel.appendChild(startButton);