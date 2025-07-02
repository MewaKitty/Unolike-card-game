import { random, weightedRandom } from "./utils.ts";
import { game, updateInventoryPlayability } from "./game.ts";
import colorData from "./data/colors.json";
import numberData from "./data/numbers.json";
import symbolData from "./data/symbols.json";
import modifierData from "./data/modifiers.json";
import { dragGap, dragGaps, setDraggedCard } from "./dragging.ts";

export interface CardColor {
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
  description?: string,
  unlisted?: boolean
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
  innerElement: HTMLDivElement
  hidden: boolean
  tags: string[]
  modifier: CardModifier | null
  constructor (hidden?: boolean, tags?: string[]) {
    const isWild = Math.random() > 0.93;
    this.color = random(colorData.filter(color => isWild ? color.wild : !color.wild));
    const isSymbol = true //this.color.wild ? true : Math.random() > 0.8;
    this.number = isSymbol ? weightedRandom(symbolData.filter(symbol => symbol.wild === this.color.wild)) : random(numberData.filter(number => !number.unlisted));
    if (this.number.color) this.color = colorData.find(color => color.name === this.number.color)!;
    this.hidden = hidden ?? false;
    this.tags = tags ?? [];
    this.modifier = (this.number.description && !this.number.draw) ? null : (Math.random() > 0.5 ? weightedRandom(modifierData) : null)

    const wrapper = document.createElement("div");
    wrapper.classList.add("cardWrapper");
    const div = document.createElement("div");
    this.element = div;
    const innerElement = document.createElement("div");
    this.innerElement = innerElement;
    div.appendChild(innerElement);
    this.updateElement();
    wrapper.appendChild(this.element);
    this.wrapper = wrapper;
    let pointerDownTime = 0;
    div.addEventListener("pointerdown", e => {
      if (!this.tags.includes("pickup") && !wrapper.parentElement?.classList.contains("minipileInner") && !this.isPlayable()) return;
      if (this.tags.includes("discarded") && !wrapper.parentElement?.classList.contains("minipileInner")) return;
      if (!this.tags.includes("pickup") && !wrapper.parentElement?.classList.contains("minipileInner") && wrapper.parentElement !== document.getElementsByClassName("cardRack")[0]) return;
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

      if (this.tags.includes("pickup")) return;
      const piles = game.selectedCards.length > 0 && game.selectedCards.includes(this) ? game.playableTwins() : this.playablePiles();

      for (let i = -1; i < 4; i++) {
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
      if (!this.tags.includes("pickup") && !this.isPlayable()) return;
      if (!game.inventory.includes(this)) return;
      if (this.tags.includes("discarded")) return;
      if (div.classList.contains("selectedCard")) {
        div.classList.remove("selectedCard")
        game.selectedCards.splice(game.selectedCards.indexOf(this), 1)
      } else {
        div.classList.add("selectedCard")
        game.selectedCards.push(this);
      }
      if (game.selectedCards.length > 0) {
        const piles = game.playableTwins();
        for (let i = 0; i < 4; i++) {
          const cardDiscard = document.getElementsByClassName("cardDiscard" + i)[0];
          if (piles.includes(i)) {
            cardDiscard.classList.remove("unplayable")
          } else {
            cardDiscard.classList.add("unplayable")
          }
          if (i === game.closedPile) cardDiscard.classList.add("unplayable");
        }
      }
      updateInventoryPlayability();
    })
  }
  updateElement () {
    const element = this.element;
    const innerElement = this.innerElement;
    element.classList.add("card");
    innerElement.classList.add("cardInner");
    innerElement.style = `--color: ${this.color.color}; color: ${this.color.text ?? "#333"}`;
    innerElement.textContent = "";
    const cardNameSpan = document.createElement("span");
    cardNameSpan.textContent = this.number.name;
    innerElement.appendChild(cardNameSpan);
    if (this.number.description) {
      const cardDescriptionSpan = document.createElement("span");
      cardDescriptionSpan.classList.add("cardDescriptionSpan");
      cardDescriptionSpan.textContent = this.number.description;
      innerElement.appendChild(cardDescriptionSpan);
    }
    if (this.modifier) {
      const cardModifierSpan = document.createElement("span");
      cardModifierSpan.classList.add("cardModifierSpan");
      cardModifierSpan.textContent = "+ " + this.modifier.name;
      innerElement.appendChild(cardModifierSpan);
    }
    if (this.hidden) innerElement.style = `--color: #fff; color: black;`;
    if (this.hidden) innerElement.textContent = `Card`;
  }
  playableOn (card: Card) {
    if (card.number === this.number) return true;
    if (card.color === this.color) return true;
    if (this.color.wild) return true;
    if (card.color.wild) return true;
    return false;
  }
  playablePiles (forOpponent?: boolean): number[] {
    /*if (game.selectedCards.length > 0) {
      if (game.selectedCards[0].number.actionId === "discard2Color") {
        if (this.color !== game.selectedCards[0].color || (game.selectedCards.includes(this) ? false : game.selectedCards.length >= 2)) {
          return []
        } else {
          if (this !== game.selectedCards[0]) game.selectedCards[0].playablePiles()
        }
      } else {
        console.log("a")
        console.log(this.number !== game.selectedCards[0].number)
        if (game.selectedCards.length === 1 && game.inventory.length >= 3) {
          let match = [];
          for (const [index, discard] of game.discarded.entries()) {
            if (game.closedPile === index) continue;
            if (discard.at(-1)?.number === game.selectedCards[0].number && discard.at(-1)?.color === game.selectedCards[0].color) match.push(index);
          }
          if (match.length > 0) return match;
        }
        if (game.selectedCards.length === 2 && game.selectedCards[0].number !== game.selectedCards[1].number) return [];
        if (this.number !== game.selectedCards[0].number) {
          return [];
        } else {
          if (this !== game.selectedCards[0]) return game.selectedCards[0].playablePiles()
        }
      }
      return [];
    }*/
    if (game.drawAmount && (this.number.draw === undefined || this.number.draw === null) && (this.modifier?.draw === undefined || this.modifier?.draw === null)) return [];
    if (game.playersTurn === false && !forOpponent) return [];
    if (game.drawAmount) return [game.drawPile];
    let availablePiles = [];
    for (let i = -1; i < 4; i++) {
      if (i === game.closedPile) continue;
      if (i === -1 && game.minipile.length === 0) continue;
      if (game.isMinipileActive && i >= 0) continue;
      if (game.lockedPiles.includes(i) && game.checkLockApplication()) {
        if (!this.color.wild && this.modifier?.actionId !== "lock" && this.number?.actionId !== "disarm") continue;
      }
      if (this.playableOn(i === -1 ? game.minipile.at(-1)! : game.discarded[i].at(-1)!)) availablePiles.push(i);
    }
    return availablePiles;
  }
  isPlayable () {
    if (game.colorChooserActive) return false;
    if (game.reflectCard === this) return true;
    if (game.reflectCard) return false;

    if (game.selectedCards.includes(this)) return true;

    if (game.selectedCards.length === 0) {
      if (this.playablePiles().length > 0) return true;
    }

    if (game.drawAmount && (this.number.draw === undefined || this.number.draw === null) && (this.modifier?.draw === undefined || this.modifier?.draw === null)) return false;
    
    // Handle the same symbol rule
    if (game.selectedCards[0]?.number === this.number) return true;
    
    // Handle discard 2 of color
    if (game.selectedCards[0]?.number.actionId === "discard2Color") {
      if (this.color !== game.selectedCards[0].color || (game.selectedCards.includes(this) ? false : game.selectedCards.length >= 2)) {
        return false;
      } else {
        if (this !== game.selectedCards[0]) return true;
      }
    }

    // Handle the twin rule
    if (this.number.value === null || this.number.value === undefined) return false;
    if (game.selectedCards.length >= 2) return game.selectedCards.includes(this);
    if (game.selectedCards.length === 1) {
      if (game.selectedCards[0].number.value === null || game.selectedCards[0].number.value === undefined) return false;
      for (let index = -1; index < game.discarded.length; index++) {
        if (game.isMinipileActive && index >= 0) continue;
        if (!game.isMinipileActive && index === -1) continue;
        const discard = index === -1 ? game.minipile : game.discarded[index];
        if (game.closedPile === index) continue;
        if (game.lockedPiles.includes(index) && game.checkLockApplication() && ((this.modifier?.actionId !== "lock" && this.number?.actionId !== "disarm") || (game.selectedCards[0].modifier?.actionId !== "lock" && game.selectedCards[0].number?.actionId !== "disarm"))) continue;
        if (game.selectedCards[0].number.value! + this.number.value === discard.at(-1)!.number.value) return true;
        if (game.selectedCards[0].number.actionId === "#" && numberData.map(number => number.value).includes(discard.at(-1)?.number.value! - this.number.value)) return true;
      }
      return false;
    };
    if (game.selectedCards.length === 0) {
      for (const secondCard of game.inventory) {
        if (secondCard.number.value === null || secondCard.number.value === undefined) continue;
        if (this === secondCard) continue;
        for (let index = -1; index < game.discarded.length; index++) {
          if (game.isMinipileActive && index >= 0) continue;
          if (!game.isMinipileActive && index === -1) continue;
          const discard = index === -1 ? game.minipile : game.discarded[index];
          if (game.closedPile === index) continue;
          if (game.lockedPiles.includes(index) && ((this.modifier?.actionId !== "lock" && this.number?.actionId !== "disarm") || (secondCard.modifier?.actionId !== "lock" && secondCard.number?.actionId !== "disarm"))) continue;
          if (discard.at(-1)?.number.value === this.number.value + secondCard.number.value) return true;
          if (this.number.actionId === "#") {
            if (numberData.map(number => number.value).includes(discard.at(-1)?.number.value! - secondCard.number.value)) return true;
          }
          if (secondCard.number.actionId === "#") {
            if (numberData.map(number => number.value).includes(discard.at(-1)?.number.value! - this.number.value)) return true;
          }
        }
      }
    }
    return false;
  }
}
