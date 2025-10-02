import { client } from "./client.ts";

const roomsMenu = document.querySelector<HTMLDivElement>(".roomsMenu")!;

const exitButton = document.createElement("button");
exitButton.classList.add("cardCreatorCloseButton");
exitButton.textContent = "Close";
roomsMenu.appendChild(exitButton);

exitButton.addEventListener("click", () => {
    roomsMenu.style.animation = "scaleOut .3s";
    document.querySelector<HTMLDivElement>(".mainMenu")!.hidden = false;
    document.querySelector<HTMLDivElement>(".mainMenu")!.style.animation = "scaleIn .3s";
})

roomsMenu.addEventListener("animationend", async e => {
    if (e.animationName === "scaleOut") roomsMenu.hidden = true;
    const rooms = await (await fetch("http://localhost:3000/api/rooms")).json();
    if (rooms.length === 0) {
        cardCreatorRightPanel.textContent = "No rooms, try creating one?"
    }
})

const cardCreatorLeftPanel = document.createElement("div");
cardCreatorLeftPanel.classList.add("cardCreatorLeftPanel");
roomsMenu.appendChild(cardCreatorLeftPanel);

const cardCreatorRightPanel = document.createElement("div");
cardCreatorRightPanel.classList.add("cardCreatorRightPanel");
roomsMenu.appendChild(cardCreatorRightPanel);

const roomsMenuLabel = document.createElement("h2");
roomsMenuLabel.textContent = "Rooms";
cardCreatorLeftPanel.appendChild(roomsMenuLabel);

const createRoomButton = document.createElement("button");
createRoomButton.classList.add("createRoomButton")
createRoomButton.textContent = "Create room";
cardCreatorLeftPanel.appendChild(createRoomButton);