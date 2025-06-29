import { random } from "./utils.ts";
import { game } from "./game.ts";
import colorData from "./data/colors.json";
import numberData from "./data/numbers.json";
import { dragGap, setDraggedCard } from "./dragging.ts";

interface CardColor {
  name: string,
  color: string
}

interface CardNumber {
  name: string,
  value: number
}


export class Card {
  number: CardNumber
  color: CardColor
  element: HTMLDivElement
  wrapper: HTMLDivElement
  hidden: boolean
  tags: string[]
  constructor (hidden?: boolean, tags?: string[]) {
    this.number = random(numberData);
    this.color = random(colorData);
    this.hidden = hidden ?? false;
    this.tags = tags ?? [];

    const wrapper = document.createElement("div");
    wrapper.classList.add("cardWrapper");
    const div = document.createElement("div");
    this.element = div;
    this.updateElement();
    wrapper.appendChild(this.element);
    this.wrapper = wrapper;
    div.addEventListener("pointerdown", e => {
      if (!hidden && !this.playableOn(game.discarded.at(-1)!)) return;
      if (this.tags.includes("discarded")) return;
      dragGap.x = e.pageX - div.getBoundingClientRect().left;
      dragGap.y = e.pageY - div.getBoundingClientRect().top;
      div.style.left = div.getBoundingClientRect().left + "px";
      div.style.top = div.getBoundingClientRect().top + "px";
      div.classList.add("dragging")
      setDraggedCard(this);
    })
  }
  updateElement () {
    const div = this.element;
    div.classList.add("card");
    div.style = `--color: ${this.color.color}`;
    div.textContent = this.number.name;
    if (this.hidden) div.style = `--color: #333; color: white;`;
    if (this.hidden) div.textContent = `Card`;
  }
  playableOn (card: Card) {
    if (card.number === this.number) return true;
    if (card.color === this.color) return true;
    return false;
  }
}
