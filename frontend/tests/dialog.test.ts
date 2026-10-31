import { afterEach, expect, test, vi } from "vitest";
import { LampDialog } from "../src/lamp-dialog";
import { ColorPicker, hexToHs, hsToHex } from "../src/color-picker";
import type { HomeAssistant } from "../src/types";
import "../src/index";

afterEach(() => {
  document.body.replaceChildren();
});

test("dialog opens through the HA lifecycle and removes the card on close", async () => {
  const show = vi.fn(function (this: HTMLDialogElement) {
    this.open = true;
  });
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
    configurable: true,
    value: show,
  });
  Object.defineProperty(HTMLDialogElement.prototype, "close", {
    configurable: true,
    value: function (this: HTMLDialogElement) {
      this.open = false;
    },
  });
  const dialog = document.createElement("gyverlamp2-control-dialog") as LampDialog;
  dialog.hass = {
    states: { "light.test": { state: "off", attributes: {} } },
    callService: async () => {},
  };
  document.body.append(dialog);
  await dialog.showDialog({ config: { entity: "light.test" } });
  expect(show).toHaveBeenCalledTimes(1);
  expect(dialog.shadowRoot!.querySelector("gyverlamp2-card")).not.toBeNull();
  const events: string[] = [];
  dialog.addEventListener("hass-more-info", (event) =>
    events.push((event as CustomEvent).detail.view),
  );
  dialog.shadowRoot!.querySelector<HTMLButtonElement>('[aria-label="История лампы"]')!.click();
  expect(events).toEqual(["history"]);
  const closed = vi.fn();
  dialog.addEventListener("dialog-closed", closed);
  dialog.closeDialog();
  dialog.closeDialog();
  await dialog.updateComplete;
  expect(closed).toHaveBeenCalledTimes(1);
  expect(dialog.shadowRoot!.querySelector("gyverlamp2-card")).toBeNull();
  await dialog.showDialog({ config: { entity: "light.test" } });
  expect(show).toHaveBeenCalledTimes(2);
});

test("keyboard color edits accumulate before a render and are disabled during mode changes", async () => {
  const picker = document.createElement("gyverlamp2-color-picker") as ColorPicker;
  picker.color = [120, 100];
  document.body.append(picker);
  await picker.updateComplete;
  const wheel = picker.shadowRoot!.querySelector<HTMLElement>(".wheel")!;
  const colors: unknown[] = [];
  picker.addEventListener("color-commit", (event) => colors.push((event as CustomEvent).detail));
  for (let index = 0; index < 3; index++)
    wheel.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
  expect(colors).toEqual([
    [125, 100],
    [130, 100],
    [135, 100],
  ]);
  picker.disabled = true;
  wheel.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
  expect(colors).toHaveLength(3);
});

test("unrelated devices never trigger a lamp action", async () => {
  const origin = document.createElement("div") as HTMLElement & {
    hass?: HomeAssistant;
  };
  origin.hass = {
    states: { "light.other": { state: "on", attributes: {} } },
    callService: vi.fn(),
  };
  document.body.append(origin);
  const opened = vi.fn();
  origin.addEventListener("show-dialog", opened);
  origin.dispatchEvent(
    new CustomEvent("hass-more-info", {
      bubbles: true,
      composed: true,
      detail: { entityId: "light.other" },
    }),
  );
  expect(opened).not.toHaveBeenCalled();
  expect(origin.hass!.callService).not.toHaveBeenCalled();
});

test("color conversions preserve the primary hues and saturation", () => {
  for (const [color, hue] of [
    ["#ff0000", 0],
    ["#00ff00", 120],
    ["#0000ff", 240],
  ] as const) {
    expect(hexToHs(color)).toEqual([hue, 100]);
    expect(hsToHex([hue, 100])).toBe(color);
  }
  expect(hsToHex([0, 0])).toBe("#ffffff");
  expect(hexToHs("#ffffff")).toEqual([0, 0]);
});
