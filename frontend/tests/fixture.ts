import { afterEach, vi } from "vitest";
import { LampCard } from "../src/lamp-card";
import { ColorPicker } from "../src/color-picker";
import type { EntityState, HomeAssistant } from "../src/types";
import "../src/index";

interface Call {
  domain: string;
  service: string;
  data: Record<string, unknown>;
  resolve: () => void;
  reject: (error: Error) => void;
}
interface Patch {
  speed?: number;
  scale?: number;
  hue?: number;
  brightness?: number;
  palette?: string;
  mode?: string;
}

afterEach(() => {
  document.body.replaceChildren();
  vi.useRealTimers();
});

export async function fixture() {
  const card = document.createElement("gyverlamp2-card") as LampCard;
  card.setConfig({ entity: "light.test" });
  document.body.append(card);
  const states: Record<string, EntityState> = {
    "light.test": {
      state: "on",
      attributes: {
        friendly_name: "Test lamp",
        brightness: 128,
        effect: "Частицы",
        mode_key: "particles",
        hs_color: [120, 100],
        mode_parameters: {
          speed: true,
          scale: true,
          hue: true,
          palette: true,
          saturation: false,
        },
      },
    },
    "select.test_ha_mode": {
      state: "Частицы",
      attributes: { options: ["Частицы", "Огонь 2020"] },
    },
    "select.test_palette": {
      state: "Rainbow",
      attributes: { options: ["Rainbow", "Ocean"] },
    },
    "select.test_color_source": {
      state: "hue",
      attributes: { options: ["hue", "palette"] },
    },
    "number.test_speed": { state: "128", attributes: {} },
    "number.test_scale": { state: "128", attributes: {} },
    "number.test_hue": { state: "120", attributes: {} },
    "number.test_saturation": { state: "100", attributes: {} },
  };
  const calls: Call[] = [];
  const callService: HomeAssistant["callService"] = (domain, service, data) =>
    new Promise((resolve, reject) => {
      calls.push({
        domain,
        service,
        data,
        resolve: () => resolve(undefined),
        reject,
      });
    });
  const tick = async () => {
    for (let index = 0; index < 5; index++) await Promise.resolve();
    await card.updateComplete;
    await (card.shadowRoot?.querySelector("gyverlamp2-color-picker") as ColorPicker | null)
      ?.updateComplete;
  };
  const refresh = async () => {
    card.hass = { states: structuredClone(states), callService };
    await tick();
  };
  await refresh();
  const $ = <T extends HTMLElement = HTMLInputElement>(selector: string): T => {
    const picker = card.shadowRoot!.querySelector("gyverlamp2-color-picker");
    return (card.shadowRoot!.querySelector(selector === "#color" ? ".color-chip" : selector) ??
      picker?.shadowRoot?.querySelector(selector === "#color" ? ".color-chip" : selector)) as T;
  };
  const input = async (id: string, value: number, commit = true) => {
    const element = $(`#${id}`);
    element.value = String(value);
    element.dispatchEvent(new Event("input", { bubbles: true }));
    if (commit) element.dispatchEvent(new Event("change", { bubbles: true }));
    await tick();
  };
  const update = async (patch: Patch) => {
    if (patch.speed !== undefined) states["number.test_speed"].state = String(patch.speed);
    if (patch.scale !== undefined) states["number.test_scale"].state = String(patch.scale);
    if (patch.hue !== undefined) {
      states["number.test_hue"].state = String(patch.hue);
      states["light.test"].attributes.hs_color = [patch.hue, 100];
    }
    if (patch.brightness !== undefined)
      states["light.test"].attributes.brightness = Math.round((patch.brightness * 255) / 100);
    if (patch.palette !== undefined) states["select.test_palette"].state = patch.palette;
    if (patch.mode !== undefined) {
      states["light.test"].attributes.mode_key = patch.mode;
      states["light.test"].attributes.effect = patch.mode === "fire2020" ? "Огонь 2020" : "Частицы";
      states["select.test_ha_mode"].state = states["light.test"].attributes.effect!;
    }
    await refresh();
  };
  const key = async (direction: string) => {
    $(".wheel").dispatchEvent(
      new KeyboardEvent("keydown", {
        key: direction,
        bubbles: true,
        cancelable: true,
      }),
    );
    await tick();
  };
  return { card, states, calls, $, input, update, refresh, tick, key };
}
