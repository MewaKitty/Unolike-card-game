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
  wild?: boolean,
  dark?: string,
  description?: string
}

interface CardNumber {
  name: string,
  value?: number,
  draw?: number,
  actionId?: string,
  color?: string,
  description?: string,
  unlisted?: boolean,
  abilityWild?: string
}

interface CardModifier {
  name: string,
  actionId?: string,
  draw?: number,
  unlisted?: boolean
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
    const isWild = Math.random() > 0.63;
    this.color = random(colorData.filter(color => isWild ? color.wild : !color.wild));
    const isSymbol = this.color.wild ? true : Math.random() > 0.7;
    this.number = isSymbol ? weightedRandom(symbolData.filter(symbol => symbol.wild === this.color.wild).filter(symbol => !symbol.unlisted)) : random(numberData.filter(number => !number.unlisted));
    if (this.number.color) this.color = colorData.find(color => color.name === this.number.color)!;
    this.hidden = hidden ?? false;
    this.tags = tags ?? [];
    this.modifier = ((this.number.description || this.number.abilityWild) && !this.number.draw) ? null : (Math.random() > 0.5 ? weightedRandom(modifierData.filter(modifier => this.number.value !== undefined && this.number.value !== null ? true : !modifier.modifies?.includes("number"))) : null)
    if (this.number.value === 0 || this.number.value === 7) this.modifier = modifierData.find(modifier => modifier.actionId === "swap") ?? null;
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
      updateInventoryPlayability();
      if (this.tags.includes("pickup") && game.colorChooserActive) return;
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
      if (!game.player.cards.includes(this)) return;
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
    element.style = `--color: ${this.color.color}; --dark: ${this.color.dark}; --text: ${this.color.text ?? "#333"}`;
    if (this.number.actionId === "tower") element.classList.add("towerCard");
    innerElement.textContent = "";
    const cardNameSpan = document.createElement("span");
    cardNameSpan.textContent = this.number.name;
    innerElement.appendChild(cardNameSpan);
    if (this.number.description || this.color.description) {
      const cardDescriptionSpan = document.createElement("span");
      cardDescriptionSpan.classList.add("cardDescriptionSpan");
      cardDescriptionSpan.textContent = this.number.actionId === "tower" && this.color.description ? this.color.description : this.number.description!;
      innerElement.appendChild(cardDescriptionSpan);
    }
    if (this.modifier) {
      const cardModifierSpan = document.createElement("span");
      cardModifierSpan.classList.add("cardModifierSpan");
      cardModifierSpan.textContent = "+ " + this.modifier.name;
      innerElement.appendChild(cardModifierSpan);
    }
    if (!this.hidden) innerElement.style = "";
    if (this.number.actionId === "tower") return;
    if (this.hidden) element.style = `--color: #fff; --dark: #fff; color: black;`;
    if (this.hidden) innerElement.style = "color: black;";
    if (this.hidden) innerElement.textContent = `Card`;
  }
  updateAbilityWild (isOpponent: boolean) {
    if (this.number.abilityWild) {
      if (isOpponent) {

      } else {
        this.innerElement.querySelector(".cardDescriptionSpan")?.remove();
        if (!game.player.ability) return;
        const cardDescriptionSpan = document.createElement("span");
        cardDescriptionSpan.classList.add("cardDescriptionSpan");
        cardDescriptionSpan.textContent = game.player.ability![this.number.abilityWild + "Text" as "wild1Text"];
        this.innerElement.appendChild(cardDescriptionSpan);
      }
    }
  }
  playableOn (card: Card) {
    if (card.number === this.number) return true;
    if (card.color === this.color) return true;
    if (this.color.wild) return true;
    if (card.color.wild) return true;
    if (card.number.actionId === "purpleBlank") return true;
    return false;
  }
  playablePiles (forOpponent?: boolean): number[] {
    if (game.player.isChoosingDrawRemoval) return game.player.drawRemovalCards.includes(this) ? [-1, 0, 1, 2, 3] : [];
    if (game.dangerCard?.attack === "onlyAllowsNumbers" && (this.number.value === undefined || this.number.value === null)) return [];
    if (game.onePileLockType === "+2IfColorMatch") {
      if (!this.color.wild) return [game.onePileLockNumber];
      return [];
    }
    if (game.giveCardAction) return [];
    if (game.drawAmount && (this.number.draw === undefined || this.number.draw === null) && (this.modifier?.draw === undefined || this.modifier?.draw === null)) return [];
    if (game.playersTurn === false && !forOpponent) return [];
    if (game.drawAmount) return [game.drawPile];
    if (this.number.actionId === "99") {
      let hasNon99Card = false;
      for (const card of (forOpponent ? game.dealer.cards : game.player.cards)) {
        if (card.number.actionId !== "99") hasNon99Card = true;
      }
      if (hasNon99Card) return [];
    }
    if (this.number.actionId === "doubles") {
      if (forOpponent) {
        if (!game.dealer.doublesCardAvailable) return [];
      } else {
        if (!game.player.doublesCardAvailable) return [];
      }
    }
    if (this.number.actionId === "tower") return [];
    let availablePiles = [];
    for (let i = -1; i < 4; i++) {
      if (i === game.closedPile) continue;
      if (i === -1 && game.minipile.length === 0) continue;
      if (game.isMinipileActive && i >= 0) continue;
      if (game.lockedPiles.includes(i) && game.checkLockApplication()) {
        if (!this.color.wild && this.modifier?.actionId !== "lock" && this.number?.actionId !== "disarm") continue;
      }
      if (game.forcedColor && (game.forcedColor === "greenWild" ? (this.color.name !== "Green" && !this.color.wild) : (this.color.name !== game.forcedColor))) continue;
      if (i === -1 && game.minipileAction === "war") {
        if (this.number.value !== undefined && this.number.value !== null && this.number.value >= game.minipile.at(-1)?.number.value!) {
          return [i];
        } else {
          return [];
        }
      }
      if (i === -1 && game.minipileAction === "war+2") {
        if ((this.number.value ?? 0) >= game.minipile.at(-1)?.number.value!) {
          return [i];
        } else {
          return [];
        }
      }
      if (this.playableOn(i === -1 ? game.minipile.at(-1)! : game.discarded[i].at(-1)!)) availablePiles.push(i);
    }
    return availablePiles;
  }
  isPlayable () {
    if (game.colorChooserActive) return false;
    if (game.reobtainChooserActive) return false;
    if (game.reflectCard === this) return true;
    if (game.reflectCard) return false;
    if (game.giveCardAction) return true;
    if (game.forcedColor && (game.forcedColor === "greenWild" ? (this.color.name !== "Green" && !this.color.wild) : (this.color.name !== game.forcedColor))) return false;

    if (game.selectedCards.includes(this)) return true;

    console.log("game", game);

    if (game.player.isChoosingDrawRemoval) return game.player.drawRemovalCards.includes(this);
    
    if (game.selectedCards.length === 0) {
      if (this.playablePiles().length > 0) return true;
    }

    if (game.minipile.length > 0 && game.minipileAction === "war") return false;
    if (game.minipile.length > 0 && game.minipileAction === "war+2") return false;

    if (game.drawAmount && (this.number.draw === undefined || this.number.draw === null) && (this.modifier?.draw === undefined || this.modifier?.draw === null)) return false;
    
    // Handle the same symbol rule
    if (game.selectedCards[0]?.number === this.number) return true;

    // Handle the exact match rule
    if (game.selectedCards.length === 1) {
      for (let index = -1; index < game.discarded.length; index++) {
        if (game.isMinipileActive && index >= 0) continue;
        if (!game.isMinipileActive && index === -1) continue;
        const discard = index === -1 ? game.minipile : game.discarded[index];
        if (discard.at(-1)?.color === game.selectedCards[0].color && discard.at(-1)?.number === game.selectedCards[0].number) return true;
      }
    }
    
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
    // Handle the succession rule
    if (game.selectedCards.length > 0) {
        const sorted = [...game.selectedCards, this].sort((a, b) => a.number.value! - b.number.value!);
        console.log(sorted);
        let last = null;
        let isValid = true;
        for (const card of sorted) {
            if (last === null) {
                last = card;
                continue;
            }
            if (card.number.value !== last.number.value! + 1 && last.number.actionId !== "#") isValid = false;
            last = card;
        }
        console.log("isValid: " + isValid)
        if (isValid) return true;
    }
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
        if (this.number.actionId === "#" && numberData.map(number => number.value).includes(discard.at(-1)?.number.value! - game.selectedCards[0].number.value)) return true;
      }
      if (this.number.value === game.selectedCards[0].number.value + 1 || this.number.actionId === "#") {
        return true;
      }
      return false;
    };
    if (game.selectedCards.length === 0) {
      for (const secondCard of game.player.cards) {
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
