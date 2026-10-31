import {
  BYTE_MAX,
  PERCENT_MAX,
  FULL_CIRCLE_DEGREES,
  KEYBOARD_HUE_STEP,
  KEYBOARD_SATURATION_STEP,
} from "./constants";
import { LitElement, html } from "lit";
import { live } from "lit/directives/live.js";
import { colorPickerStyles } from "./styles";
import type { HsColor } from "./types";

const HSV_SECTOR_COUNT = 6;
const HSV_SECTOR_DEGREES = FULL_CIRCLE_DEGREES / HSV_SECTOR_COUNT;
const HSV_COMPONENT_PEAK = 4;
const HSV_GREEN_SECTOR = 2;
const HSV_BLUE_SECTOR = 4;
const HSV_RED_PHASE = 5;
const HSV_GREEN_PHASE = 3;
const HSV_BLUE_PHASE = 1;
const HEX_RADIX = 16;
const HEX_COMPONENT_LENGTH = 2;
const RGB_HEX_OFFSETS = [1, 3, 5];
const HALF_CIRCLE_DEGREES = FULL_CIRCLE_DEGREES / 2;
const WHEEL_CENTER_PERCENT = PERCENT_MAX / 2;

export function hsToHex([hue, saturation]: HsColor): string {
  const component = (offset: number) => {
    const position = (offset + hue / HSV_SECTOR_DEGREES) % HSV_SECTOR_COUNT;
    const value =
      1 -
      (saturation / PERCENT_MAX) *
        Math.max(0, Math.min(position, HSV_COMPONENT_PEAK - position, 1));
    return Math.round(value * BYTE_MAX)
      .toString(HEX_RADIX)
      .padStart(HEX_COMPONENT_LENGTH, "0");
  };
  return `#${component(HSV_RED_PHASE)}${component(HSV_GREEN_PHASE)}${component(HSV_BLUE_PHASE)}`;
}

export function hexToHs(hex: string): HsColor {
  const [red, green, blue] = RGB_HEX_OFFSETS.map(
    (start) => parseInt(hex.slice(start, start + HEX_COMPONENT_LENGTH), HEX_RADIX) / BYTE_MAX,
  );

  const maximum = Math.max(red, green, blue);
  const delta = maximum - Math.min(red, green, blue);

  let hue = 0;
  if (delta) {
    if (maximum === red) {
      hue = ((green - blue) / delta) % HSV_SECTOR_COUNT;
    } else if (maximum === green) {
      hue = (blue - red) / delta + HSV_GREEN_SECTOR;
    } else {
      hue = (red - green) / delta + HSV_BLUE_SECTOR;
    }
  }
  return [
    (hue * HSV_SECTOR_DEGREES + FULL_CIRCLE_DEGREES) % FULL_CIRCLE_DEGREES,
    maximum === 0 ? 0 : (delta / maximum) * PERCENT_MAX,
  ];
}

export class ColorPicker extends LitElement {
  static properties = {
    color: { attribute: false },
    saturationEnabled: { type: Boolean },
    disabled: { type: Boolean },
  };

  static styles = colorPickerStyles;
  color: HsColor = [0, PERCENT_MAX];
  saturationEnabled = false;
  disabled = false;
  private dragging = false;

  protected render() {
    const [hue, saturation] = this.color;
    const angle = (hue * Math.PI) / HALF_CIRCLE_DEGREES;
    const markerLeft = WHEEL_CENTER_PERCENT + (Math.cos(angle) * saturation) / 2;
    const markerTop = WHEEL_CENTER_PERCENT + (Math.sin(angle) * saturation) / 2;

    return html`
      <div
        class="wheel"
        tabindex=${this.disabled ? -1 : 0}
        role="group"
        aria-label="Цветовой круг: стрелки меняют оттенок, Shift со стрелками меняет насыщенность"
        aria-disabled=${this.disabled}
        @pointerdown=${this.startDrag}
        @pointermove=${this.moveDrag}
        @pointerup=${this.finishDrag}
        @pointercancel=${this.cancelDrag}
        @keydown=${this.onKey}
      >
        <div class="wheel-marker" style="left:${markerLeft}%;top:${markerTop}%"></div>
      </div>
      <div class="color-tools">
        <small>Оттенок эффекта</small>
        <input
          type="color"
          class="color-chip"
          aria-label="Выбрать точный цвет"
          .value=${live(hsToHex(this.color))}
          ?disabled=${this.disabled}
          @input=${this.previewNativeColor}
          @change=${this.commitNativeColor}
          @pointercancel=${this.cancelDrag}
        />
      </div>
    `;
  }

  private emit(name: string, color?: HsColor): void {
    this.dispatchEvent(new CustomEvent(name, { detail: color, bubbles: true, composed: true }));
  }

  private normalizeColor([hue, saturation]: HsColor): HsColor {
    return [hue, this.saturationEnabled ? saturation : PERCENT_MAX];
  }

  private position(event: PointerEvent): HsColor {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const x = (event.clientX - rect.left - rect.width / 2) / (rect.width / 2);
    const y = (event.clientY - rect.top - rect.height / 2) / (rect.height / 2);
    return this.normalizeColor([
      ((Math.atan2(y, x) * HALF_CIRCLE_DEGREES) / Math.PI + FULL_CIRCLE_DEGREES) %
        FULL_CIRCLE_DEGREES,
      Math.min(PERCENT_MAX, Math.hypot(x, y) * PERCENT_MAX),
    ]);
  }

  private startDrag(event: PointerEvent): void {
    if (this.disabled) {
      return;
    }
    event.preventDefault();
    this.dragging = true;
    const wheel = event.currentTarget as HTMLElement;
    wheel.focus();
    wheel.setPointerCapture(event.pointerId);
    this.color = this.position(event);
    this.emit("color-preview", this.color);
  }

  private moveDrag(event: PointerEvent): void {
    if (!this.dragging || this.disabled) {
      return;
    }
    this.color = this.position(event);
    this.emit("color-preview", this.color);
  }

  private finishDrag(event: PointerEvent): void {
    if (!this.dragging) {
      return;
    }
    this.dragging = false;
    if (this.disabled) {
      this.emit("color-cancel");
      return;
    }
    this.color = this.position(event);
    this.emit("color-commit", this.color);
  }

  private cancelDrag(): void {
    this.dragging = false;
    this.emit("color-cancel");
  }

  private onKey(event: KeyboardEvent): void {
    if (this.disabled || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
      return;
    }
    event.preventDefault();
    const sign = ["ArrowLeft", "ArrowDown"].includes(event.key) ? -1 : 1;
    const [hue, saturation] = this.color;
    this.color =
      event.shiftKey && this.saturationEnabled
        ? [hue, Math.max(0, Math.min(PERCENT_MAX, saturation + sign * KEYBOARD_SATURATION_STEP))]
        : [
            (hue + sign * KEYBOARD_HUE_STEP + FULL_CIRCLE_DEGREES) % FULL_CIRCLE_DEGREES,
            saturation,
          ];
    this.emit("color-commit", this.color);
  }

  private previewNativeColor(event: Event): void {
    this.color = this.normalizeColor(hexToHs((event.target as HTMLInputElement).value));
    this.emit("color-preview", this.color);
  }

  private commitNativeColor(event: Event): void {
    this.color = this.normalizeColor(hexToHs((event.target as HTMLInputElement).value));
    this.emit("color-commit", this.color);
  }
}
