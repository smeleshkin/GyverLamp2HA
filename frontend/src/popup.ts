import { UI_BINDINGS_SCHEMA_VERSION } from "./constants";
import type { CardConfig, HassElement, MoreInfoDetail } from "./types";

const registryKey = Symbol.for("gyverlamp2.popup-configs");
type PopupWindow = Window & { [registryKey]?: Map<string, CardConfig> };

export function installGyverLamp2Popup(config?: CardConfig): void {
  if (config && !config.entity.startsWith("light.")) {
    throw new Error("Popup requires a light entity");
  }
  const popupWindow = window as PopupWindow;
  if (!popupWindow[registryKey]) {
    popupWindow[registryKey] = new Map();
    window.addEventListener("hass-more-info", openLampDialog, {
      capture: true,
    });
  }
  if (config) {
    popupWindow[registryKey]!.set(config.entity, { ...config });
  }
}

function openLampDialog(event: Event): void {
  const details = (event as CustomEvent<MoreInfoDetail>).detail;
  const entityId = details?.entityId;
  if (!entityId?.startsWith("light.") || (details.view || details.tab || "info") !== "info") {
    return;
  }
  const origin = event
    .composedPath()
    .find(
      (node): node is HassElement =>
        node instanceof HTMLElement && !!(node as HassElement).hass?.states[entityId],
    );
  if (!origin) {
    return;
  }
  const manualConfig = (window as PopupWindow)[registryKey]?.get(entityId);
  const controls = origin.hass?.states[entityId]?.attributes.gyverlamp2_ui;
  if (!manualConfig && controls?.schema !== UI_BINDINGS_SCHEMA_VERSION) {
    return;
  }
  event.preventDefault();
  event.stopImmediatePropagation();
  origin.dispatchEvent(
    new CustomEvent("show-dialog", {
      bubbles: true,
      composed: true,
      detail: {
        dialogTag: "gyverlamp2-control-dialog",
        dialogImport: () => Promise.resolve(),
        dialogParams: { config: manualConfig ?? { entity: entityId } },
      },
    }),
  );
}
