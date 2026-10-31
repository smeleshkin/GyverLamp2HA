import { test, vi } from "vitest";
import assert from "node:assert/strict";
import { fixture } from "./fixture";
import { installGyverLamp2Popup } from "../src/popup";
import type { CardConfig, HassElement } from "../src/types";

test("a dragged speed survives unrelated old HA updates before release", async () => {
  const f = await fixture();
  await f.input("speed", 40, false);
  await f.refresh();
  assert.equal(f.$("#speed").value, "40");
  assert.equal(f.$("#speed-value").textContent, "40");
  assert.equal(f.calls.length, 0);
  f.$("#speed").dispatchEvent(new window.Event("change", { bubbles: true }));
  assert.equal(f.calls[0].data.speed, 40);
});

test("a submitted range keeps its target until a delayed HA event arrives", async () => {
  const f = await fixture();
  await f.input("scale", 75);
  assert.equal(f.$("#scale").value, "75");
  assert.equal(f.$("#scale").disabled, false);
  await f.refresh();
  assert.equal(f.$("#scale-value").textContent, "75");
  f.calls[0].resolve();
  await f.tick();
  await f.refresh();
  assert.equal(f.$("#scale").value, "75");
  await f.update({ scale: 75 });
  assert.equal(f.$("#scale").value, "75");
  await f.update({ scale: 35 });
  assert.equal(f.$("#scale").value, "35", "external changes resume after acknowledgement");
});

test("rapid range edits serialize and coalesce to the final desired value", async () => {
  const f = await fixture();
  await f.input("speed", 10);
  await f.input("speed", 20);
  await f.input("speed", 30);
  assert.equal(f.calls.length, 1, "one HA call at a time");
  assert.equal(f.$("#speed").value, "30");
  await f.update({ speed: 10 });
  assert.equal(f.$("#speed").value, "30", "older in-flight result must not replace latest target");
  f.calls[0].resolve();
  await f.tick();
  assert.equal(f.calls.length, 2);
  assert.equal(f.calls[1].data.speed, 30, "intermediate unsent values are superseded");
  await f.update({ speed: 30 });
  f.calls[1].resolve();
  await f.tick();
  assert.equal(f.$("#speed-value").textContent, "30");
});

test("rapid color changes keep their target while old state events arrive", async () => {
  const f = await fixture();
  await f.key("ArrowRight");
  await f.key("ArrowRight");
  assert.equal(f.$("#color").value, "#00ff2a");
  await f.refresh();
  assert.equal(f.$("#color").value, "#00ff2a");
  await f.update({ hue: 125 });
  f.calls[0].resolve();
  await f.tick();
  assert.equal(f.$("#color").value, "#00ff2a");
  assert.equal(f.calls.length, 2);
  assert.equal(f.calls[1].data.hue, 130);
  assert.equal(f.calls[1].data.mode, "Частицы");
  await f.update({ hue: 130 });
  f.calls[1].resolve();
  await f.tick();
  assert.equal(f.$("#color").value, "#00ff2a");
  assert.equal(f.$("#effect").value, "Частицы");
});

test("brightness fill and percentage do not snap to stale HA brightness", async () => {
  const f = await fixture();
  await f.input("brightness", 44, false);
  await f.refresh();
  assert.equal(f.$(".percent").textContent?.trim(), "44%");
  assert.equal(f.$(".brightness").style.getPropertyValue("--level"), "44%");
  await f.input("brightness", 44);
  await f.refresh();
  assert.equal(f.$("#brightness").value, "44");
  assert.equal(f.$("#brightness").disabled, false);
  f.calls[0].resolve();
  await f.tick();
  assert.equal(f.$(".percent").textContent?.trim(), "44%");
  await f.update({ brightness: 44 });
  assert.equal(f.$(".percent").textContent?.trim(), "44%");
});

test("a rejected action restores actual state with a visible error", async () => {
  const f = await fixture();
  await f.input("scale", 50);
  f.calls[0].reject(new Error("No connection"));
  await f.tick();
  assert.equal(f.$("#scale").value, "128");
  assert.equal(f.$(".error").hidden, false);
  assert.match(f.$(".error").textContent!, /No connection/);
  assert.equal(f.$("#scale").disabled, false);
});

test("an older failed request cannot roll back a newer queued change", async () => {
  const f = await fixture();
  await f.input("speed", 10);
  await f.input("speed", 60);
  f.calls[0].reject(new Error("first failed"));
  await f.tick();
  assert.equal(f.$("#speed").value, "60");
  assert.equal(f.calls[1].data.speed, 60);
  await f.update({ speed: 60 });
  f.calls[1].resolve();
  await f.tick();
  assert.equal(f.$("#speed-value").textContent, "60");
  assert.equal(f.$(".error").hidden, true);
});

test("a new mode does not inherit a pending control value from the previous effect", async () => {
  const f = await fixture();
  await f.input("scale", 75);
  await f.update({ mode: "fire2020", scale: 170 });
  assert.equal(f.$("#scale").value, "170");
  f.calls[0].resolve();
  await f.tick();
  assert.equal(f.$("#scale").value, "170");
});

test("palette selection remains stable through delayed HA updates", async () => {
  const f = await fixture();
  f.$("#palette").value = "Ocean";
  f.$("#palette").dispatchEvent(new window.Event("change", { bubbles: true }));
  await f.refresh();
  assert.equal(f.$("#palette").value, "Ocean");
  f.calls[0].resolve();
  await f.tick();
  assert.equal(f.$("#palette").value, "Ocean");
  await f.update({ palette: "Ocean" });
  assert.equal(f.$("#palette").disabled, false);
});

test("pointer color preview survives heartbeat updates and sends only on release", async () => {
  const f = await fixture();
  const wheel = f.$(".wheel");
  wheel.setPointerCapture = () => {};
  wheel.getBoundingClientRect = () => ({ left: 0, top: 0, width: 220, height: 220 }) as DOMRect;
  wheel.dispatchEvent(
    new window.MouseEvent("pointerdown", {
      clientX: 220,
      clientY: 110,
      bubbles: true,
      cancelable: true,
    }),
  );
  await f.refresh();
  assert.equal(f.$("#color").value, "#ff0000");
  assert.equal(f.calls.length, 0);
  wheel.dispatchEvent(
    new window.MouseEvent("pointerup", {
      clientX: 220,
      clientY: 110,
      bubbles: true,
    }),
  );
  assert.equal(f.calls.length, 1);
  assert.equal(f.calls[0].data.hue, 0);
  await f.refresh();
  assert.equal(f.$("#color").value, "#ff0000");
  await f.update({ hue: 0 });
  f.calls[0].resolve();
  await f.tick();
  assert.equal(f.$("#color").value, "#ff0000");
});

test("a queued old-mode command is discarded after an external mode switch", async () => {
  const f = await fixture();
  await f.input("speed", 10);
  await f.input("scale", 75);
  await f.update({ mode: "fire2020", scale: 170 });
  f.calls[0].resolve();
  await f.tick();
  assert.equal(f.calls.length, 1, "do not send queued parameters for a different effect");
  assert.equal(f.$("#scale").value, "170");
});

test("unacknowledged state shows an error rather than silently reverting", async () => {
  const f = await fixture();
  vi.useFakeTimers();
  await f.input("scale", 75);
  f.calls[0].resolve();
  await f.tick();
  assert.equal(f.$("#scale").value, "75");
  vi.advanceTimersByTime(10000);
  await f.tick();
  assert.equal(f.$("#scale").value, "128");
  assert.equal(f.$(".error").hidden, false);
  assert.match(f.$(".error").textContent!, /не подтвердил/);
});

test("bundled popup discovers renamed lamps and preserves unrelated HA dialogs", async () => {
  await fixture();
  installGyverLamp2Popup();
  installGyverLamp2Popup(); // Idempotent even with a second lamp/entry.
  const origin = window.document.createElement("div") as HassElement;
  origin.hass = {
    callService: async () => {},
    states: {
      "light.renamed": {
        state: "on",
        attributes: { gyverlamp2_ui: { schema: 1 } },
      },
      "light.second": {
        state: "on",
        attributes: { gyverlamp2_ui: { schema: 1 } },
      },
      "light.other": { state: "on", attributes: {} },
    },
  };
  window.document.body.append(origin);
  const opened: CardConfig[] = [];
  origin.addEventListener("show-dialog", (e) =>
    opened.push(
      (e as CustomEvent<{ dialogParams: { config: CardConfig } }>).detail.dialogParams.config,
    ),
  );
  const open = (entityId: string, view?: string) =>
    origin.dispatchEvent(
      new window.CustomEvent("hass-more-info", {
        bubbles: true,
        composed: true,
        cancelable: true,
        detail: { entityId, view },
      }),
    );
  assert.equal(open("light.renamed"), false);
  assert.equal(open("light.second"), false);
  assert.equal(open("light.other"), true);
  assert.equal(open("light.renamed", "history"), true);
  assert.equal(open("light.renamed", "settings"), true);
  assert.deepEqual(
    opened.map((c) => c.entity),
    ["light.renamed", "light.second"],
  );
  delete origin.hass!.states["light.second"];
  assert.equal(open("light.second"), true, "removed entries use the normal HA dialog");
});

test("card resolves actual sibling entity IDs and follows registry renames", async () => {
  const f = await fixture();
  f.states["light.test"].attributes.gyverlamp2_ui = {
    schema: 1,
    speed_entity: "number.renamed_speed",
    mode_entity: "select.renamed_mode",
  };
  f.states["number.renamed_speed"] = { state: "73", attributes: {} };
  f.states["select.renamed_mode"] = f.states["select.test_ha_mode"];
  await f.refresh();
  assert.equal(f.$("#speed").value, "73");
  await f.input("speed", 74);
  assert.equal(f.calls[0].data.entity_id, "light.test");
  f.calls[0].resolve();
  await f.update({ speed: 74 });
  f.$("#effect").value = "Огонь 2020";
  f.$("#effect").dispatchEvent(new Event("change", { bubbles: true }));
  assert.equal(f.calls[1].data.entity_id, "select.renamed_mode");
  f.calls[1].resolve();
  await f.update({ mode: "fire2020" });
  f.states["light.test"].attributes.gyverlamp2_ui!.speed_entity = "number.renamed_again";
  f.states["number.renamed_again"] = { state: "81", attributes: {} };
  await f.refresh();
  assert.equal(f.$("#speed").value, "81");
});

test("closing the card preserves the last committed queued command", async () => {
  const f = await fixture();
  await f.input("speed", 10);
  await f.input("speed", 65);
  f.card.remove();
  f.calls[0].resolve();
  for (let index = 0; index < 6; index++) await Promise.resolve();
  assert.equal(f.calls.length, 2);
  assert.equal(f.calls[1].data.speed, 65);
  f.calls[1].resolve();
});
