import "./cardCreator.css";
import effectData from "./data/effects.json";

const cardCreator = document.querySelector<HTMLDivElement>(".cardCreatorMenu")!;

const cardCreatorLeftPanel = document.createElement("div");
cardCreatorLeftPanel.classList.add("cardCreatorLeftPanel");
cardCreator.appendChild(cardCreatorLeftPanel);

const cardCreatorTitle = document.createElement("h2");
cardCreatorTitle.textContent = "Card creator";
cardCreatorLeftPanel.appendChild(cardCreatorTitle);

const cardCreatorRightPanel = document.createElement("div");
cardCreatorRightPanel.classList.add("cardCreatorRightPanel");
cardCreator.appendChild(cardCreatorRightPanel);

const cardInfoTitle = document.createElement("h2");
cardInfoTitle.textContent = "Card";
cardCreatorRightPanel.appendChild(cardInfoTitle);

const exitButton = document.createElement("button");
exitButton.classList.add("cardCreatorCloseButton");
exitButton.textContent = "Close";
cardCreatorRightPanel.appendChild(exitButton);

exitButton.addEventListener("click", () => {
    cardCreator.style.animation = "scaleOut .3s";
    document.querySelector<HTMLDivElement>(".mainMenu")!.hidden = false;
    document.querySelector<HTMLDivElement>(".mainMenu")!.style.animation = "scaleIn .3s";
})

cardCreator.addEventListener("animationend", e => {
    if (e.animationName === "scaleOut") cardCreator.hidden = true;
})

const cardNameLabel = document.createElement("label");
cardNameLabel.setAttribute("for", "cardName");
cardNameLabel.classList.add("cardNameLabel");
cardNameLabel.textContent = "Card name";
cardCreatorRightPanel.appendChild(cardNameLabel);

const cardNameInput = document.createElement("input");
cardNameInput.id = "cardName";
cardCreatorRightPanel.appendChild(cardNameInput);

const cardDescriptionLabel = document.createElement("label");
cardDescriptionLabel.setAttribute("for", "cardDescription");
cardDescriptionLabel.classList.add("cardDescriptionLabel");
cardDescriptionLabel.textContent = "Description";
cardCreatorRightPanel.appendChild(cardDescriptionLabel);

const cardDescriptionInput = document.createElement("textarea");
cardDescriptionInput.id = "cardDescription";
cardCreatorRightPanel.appendChild(cardDescriptionInput);

const previewCard = document.createElement("div");
previewCard.classList.add("previewCard");
previewCard.classList.add("card");
cardCreatorLeftPanel.appendChild(previewCard);

const previewCardInner = document.createElement("div");
previewCardInner.classList.add("previewCardInner");
previewCardInner.classList.add("cardInner");
previewCard.appendChild(previewCardInner);

const previewNameSpan = document.createElement("span");
previewNameSpan.textContent = "Card name here";
previewCardInner.appendChild(previewNameSpan);

cardNameInput.addEventListener("input", () => {
    previewNameSpan.textContent = cardNameInput.value || "Card name here";
})

const previewDescriptionSpan = document.createElement("span");
previewDescriptionSpan.classList.add("cardDescriptionSpan");
previewDescriptionSpan.textContent = "";
previewCardInner.appendChild(previewDescriptionSpan);

cardDescriptionInput.addEventListener("input", () => {
    previewDescriptionSpan.textContent = cardDescriptionInput.value;
})

const drawAmountField = document.createElement("div");
drawAmountField.classList.add("drawAmountField");
cardCreatorRightPanel.appendChild(drawAmountField);

const cardDrawLabel = document.createElement("label");
cardDrawLabel.setAttribute("for", "cardDraw");
cardDrawLabel.classList.add("cardDrawLabel");
cardDrawLabel.textContent = "Draw how many cards";
drawAmountField.appendChild(cardDrawLabel);

const cardDrawInput = document.createElement("input");
cardDrawInput.id = "cardDraw";
cardDrawInput.type = "number";
cardDrawInput.value = "0";
drawAmountField.appendChild(cardDrawInput);

const cardColorForms = document.createElement("div");
cardColorForms.classList.add("cardColorForms");
cardCreatorRightPanel.append(cardColorForms);

let selectedCardType = "color";

const coloredColorCard = document.createElement("div");
coloredColorCard.classList.add("coloredColorCard");
coloredColorCard.classList.add("card");
cardColorForms.appendChild(coloredColorCard);

const coloredColorCardInner = document.createElement("div");
coloredColorCardInner.classList.add("coloredColorCardInner");
coloredColorCardInner.classList.add("cardInner");
coloredColorCard.appendChild(coloredColorCardInner);

coloredColorCardInner.textContent = "Color";

coloredColorCard.classList.add("selectedCard");

const wildColorCard = document.createElement("div");
wildColorCard.classList.add("wildColorCard");
wildColorCard.classList.add("card");
cardColorForms.appendChild(wildColorCard);

const wildColorCardInner = document.createElement("div");
wildColorCardInner.classList.add("wildColorCardInner");
wildColorCardInner.classList.add("cardInner");
wildColorCard.appendChild(wildColorCardInner);

wildColorCardInner.textContent = "Wild";

coloredColorCard.addEventListener("click", () => {
    selectedCardType = "color";
    coloredColorCard.classList.add("selectedCard");
    wildColorCard.classList.remove("selectedCard");
    previewCardInner.classList.add("coloredColorCard")
    previewCardInner.classList.remove("wildColorCardInner")
})

wildColorCard.addEventListener("click", () => {
    selectedCardType = "wild";
    coloredColorCard.classList.remove("selectedCard");
    wildColorCard.classList.add("selectedCard");
    previewCardInner.classList.remove("coloredColorCard")
    previewCardInner.classList.add("wildColorCardInner")
})

const copyJSONButton = document.createElement("button");
copyJSONButton.classList.add("copyJSONButton");
copyJSONButton.textContent = "Copy JSON";
cardCreatorLeftPanel.appendChild(copyJSONButton);

copyJSONButton.addEventListener("click", async () => {
    const data: {
        name?: string,
        description?: string,
        draw?: number,
        wild?: boolean
    } = {};
    data.name = cardNameInput.value;
    if (cardDescriptionInput.value) data.description = cardDescriptionInput.value;
    if (+cardDrawInput.value) data.draw = +cardDrawInput.value;
    if (selectedCardType === "wild") data.wild = true;
    await navigator.clipboard.writeText(JSON.stringify(data));
    copyJSONButton.textContent = "Copied!";
    setTimeout(() => copyJSONButton.textContent = "Copy JSON", 1000)
})

const cardCreatorEffectsPanel = document.createElement("div");
cardCreatorEffectsPanel.classList.add("cardCreatorEffectsPanel");
cardCreator.appendChild(cardCreatorEffectsPanel);

const cardCreatorEffectsLabel = document.createElement("h3");
cardCreatorEffectsLabel.textContent = "Effects";
cardCreatorEffectsPanel.appendChild(cardCreatorEffectsLabel);

const effectCreateDiv = document.createElement("div");
effectCreateDiv.classList.add("effectCreateDiv");

const effectSelect = document.createElement("select");
for (const effect of effectData) {
    const optionElement = document.createElement("option");
    optionElement.value = effect.id;
    optionElement.textContent = effect.name;
    effectSelect.appendChild(optionElement);
}
effectCreateDiv.appendChild(effectSelect);

const addEffectButton = document.createElement("button");
addEffectButton.classList.add("addEffectButton");
addEffectButton.textContent = "Add effect";
effectCreateDiv.appendChild(addEffectButton);

cardCreatorEffectsPanel.appendChild(effectCreateDiv);

addEffectButton.addEventListener("click", () => {
    const effect = effectData.find(effect => effect.id === effectSelect.value);
    if (!effect) return;
    const effectDiv = document.createElement("div");
    const effectNameHeader = document.createElement("h4");
    effectNameHeader.textContent = effect.name ?? null;
    effectDiv.appendChild(effectNameHeader);
    cardCreatorEffectsPanel.appendChild(effectDiv);
    for (const field of effect.fields) {
        
    }
})