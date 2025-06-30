import { random, weightedRandom } from "./utils.ts";
import { game, updateInventoryPlayability } from "./game.ts";
import colorData from "./data/colors.json";
import numberData from "./data/numbers.json";
import symbolData from "./data/symbols.json";
import modifierData from "./data/modifiers.json";
import { dragGap, dragGaps, setDraggedCard } from "./dragging.ts";

interface CardColor {
  name: string,
  color: string,
  text?: string,
  wild?: boolean
}

interface CardNumber {
  name: string,
  value?: number,
  draw?: number,
  actionId?: string,
  color?: string,
  description?: string
}

interface CardModifier {
  name: string,
  actionId?: string,
  draw?: number
}

export class Card {
  number: CardNumber
  color: CardColor
  element: HTMLDivElement
  wrapper: HTMLDivElement
  hidden: boolean
  tags: string[]
  modifier: CardModifier | null
  constructor (hidden?: boolean, tags?: string[]) {
    const isWild = Math.random() > 0.9;
    this.color = random(colorData.filter(color => isWild ? color.wild : !color.wild));
    const isSymbol = this.color.wild ? true : Math.random() > 0.7;
    this.number = isSymbol ? weightedRandom(symbolData.filter(symbol => symbol.wild === this.color.wild)) : random(numberData);
    if (this.number.color) this.color = colorData.find(color => color.name === this.number.color)!;
    this.hidden = hidden ?? false;
    this.tags = tags ?? [];
    this.modifier = Math.random() > 0.7 ? weightedRandom(modifierData) : null

    const wrapper = document.createElement("div");
    wrapper.classList.add("cardWrapper");
    const div = document.createElement("div");
    this.element = div;
    this.updateElement();
    wrapper.appendChild(this.element);
    this.wrapper = wrapper;
    let pointerDownTime = 0;
    div.addEventListener("pointerdown", e => {
      if (!this.tags.includes("pickup") && this.playablePiles().length === 0) return;
      if (this.tags.includes("discarded")) return;
      if (!this.tags.includes("pickup") && wrapper.parentElement !== document.getElementsByClassName("cardRack")[0]) return;
      if (!game.playersTurn) return;
      pointerDownTime = Date.now();
      dragGap.x = e.pageX - div.getBoundingClientRect().left;
      dragGap.y = e.pageY - div.getBoundingClientRect().top;
      div.style.left = div.getBoundingClientRect().left + "px";
      div.style.top = div.getBoundingClientRect().top + "px";
      div.classList.add("dragging")
      setDraggedCard(this);
      for (const card of game.selectedCards) {
        dragGaps.push({
          x: e.pageX - card.element.getBoundingClientRect().left,
          y: e.pageY - card.element.getBoundingClientRect().top
        });
      }
      const piles = game.selectedCards.length > 1 && game.selectedCards.includes(this) ? game.selectedCards.filter(card => card !== this).map(card => card.playablePiles()).flat() : this.playablePiles();
      for (let i = 0; i < 4; i++) {
        const cardDiscard = document.getElementsByClassName("cardDiscard" + i)[0];
        if (piles.includes(i)) {
          cardDiscard.classList.remove("unplayable")
        } else {
          cardDiscard.classList.add("unplayable")
        }
        if (i === game.closedPile) cardDiscard.classList.add("unplayable");
      }
    })
    wrapper.addEventListener("pointerup", async () => {
      if (Date.now() - pointerDownTime > 350) return;
      if (!this.tags.includes("pickup") && this.playablePiles().length === 0) return;
      if (!game.inventory.includes(this)) return;
      if (this.tags.includes("discarded")) return;
      if (div.classList.contains("selectedCard")) {
        div.classList.remove("selectedCard")
        game.selectedCards.splice(game.selectedCards.indexOf(this), 1)
      } else {
        div.classList.add("selectedCard")
        game.selectedCards.push(this);
      }
      updateInventoryPlayability();
    })
  }
  updateElement () {
    const div = this.element;
    div.classList.add("card");
    div.style = `--color: ${this.color.color}; color: ${this.color.text ?? "#333"}`;
    div.textContent = "";
    const cardNameSpan = document.createElement("span");
    cardNameSpan.textContent = this.number.name;
    div.appendChild(cardNameSpan);
    if (this.number.description) {
      const cardDescriptionSpan = document.createElement("span");
      cardDescriptionSpan.classList.add("cardDescriptionSpan");
      cardDescriptionSpan.textContent = this.number.description;
      div.appendChild(cardDescriptionSpan);
    }
    if (this.modifier) {
      const cardModifierSpan = document.createElement("span");
      cardModifierSpan.classList.add("cardModifierSpan");
      cardModifierSpan.textContent = "+ " + this.modifier.name;
      div.appendChild(cardModifierSpan);
    }
    if (this.hidden) div.style = `--color: #fff; color: black;`;
    if (this.hidden) div.textContent = `Card`;
  }
  playableOn (card: Card) {
    if (card.number === this.number) return true;
    if (card.color === this.color) return true;
    if (this.color.wild) return true;
    if (card.color.wild) return true;
    return false;
  }
  playablePiles (forOpponent?: boolean): number[] {
    if (game.selectedCards.length > 0 && this.number !== game.selectedCards[0].number) return [];
    if (game.drawAmount && (this.number.draw === undefined || this.number.draw === null) && (this.modifier?.draw === undefined || this.modifier?.draw === null)) return [];
    if (game.playersTurn === false && !forOpponent) return [];
    if (game.drawAmount) return [game.drawPile];
    let availablePiles = [];
    for (let i = 0; i < 4; i++) {
      if (i === game.closedPile) continue;
      if (this.playableOn(game.discarded[i].at(-1)!)) availablePiles.push(i);
    }
    return availablePiles;
  }
}
