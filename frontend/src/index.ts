import { ColorPicker } from "./color-picker";
import { LampCard } from "./lamp-card";
import { LampDialog } from "./lamp-dialog";
import { installGyverLamp2Popup } from "./popup";

type CardWindow = Window & {
  customCards?: {
    type: string;
    name: string;
    description: string;
    preview: boolean;
  }[];
};

for (const [name, component] of [
  ["gyverlamp2-color-picker", ColorPicker],
  ["gyverlamp2-card", LampCard],
  ["gyverlamp2-control-dialog", LampDialog],
] as const) {
  if (!customElements.get(name)) {
    customElements.define(name, component);
  }
}

const cardWindow = window as CardWindow;
cardWindow.customCards ??= [];
if (!cardWindow.customCards.some((card) => card.type === "gyverlamp2-card")) {
  cardWindow.customCards.push({
    type: "gyverlamp2-card",
    name: "GyverLamp2",
    description: "Эффекты, цветовой круг, палитры и параметры лампы",
    preview: false,
  });
}
installGyverLamp2Popup();
