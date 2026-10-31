import { css } from "lit";
import {
  BRIGHTNESS_WIDTH_PX,
  BRIGHTNESS_HEIGHT_PX,
  BRIGHTNESS_RADIUS_PX,
  BRIGHTNESS_GRIP_WIDTH_PX,
  BRIGHTNESS_GRIP_HEIGHT_PX,
  BRIGHTNESS_GRIP_BOTTOM_PX,
  BRIGHTNESS_GRIP_OFFSET_PX,
  BRIGHTNESS_GRIP_TOP_PX,
  COLOR_WHEEL_SIZE_PX,
  COMPACT_COLOR_WHEEL_SIZE_PX,
  COLOR_MARKER_SIZE_PX,
  COMPACT_VIEWPORT_WIDTH_PX,
  DIALOG_WIDTH_PX,
  DIALOG_VIEWPORT_MARGIN_PX,
  DIALOG_CHROME_HEIGHT_PX,
} from "./constants";

export const cardStyles = css`
  :host {
    display: block;
    color: var(--primary-text-color);
  }

  * {
    box-sizing: border-box;
  }

  [hidden] {
    display: none !important;
  }

  ha-card {
    display: block;
    overflow: hidden;
    background: var(--ha-card-background, var(--card-background-color));
  }

  .card {
    padding: 24px;
  }

  header {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .lamp-icon {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: var(--secondary-background-color);
  }

  .lamp-icon ha-icon {
    color: var(--primary-color);
  }

  .subtitle {
    color: var(--secondary-text-color);
    font-size: 13px;
    margin-bottom: 3px;
  }

  h2 {
    font-size: 22px;
    font-weight: 500;
    margin: 0;
  }

  button,
  select,
  input {
    font: inherit;
  }

  button {
    color: var(--primary-text-color);
    border: 0;
    cursor: pointer;
  }

  button:focus-visible,
  select:focus-visible,
  input:focus-visible {
    outline: 3px solid var(--primary-color);
    outline-offset: 4px;
  }

  .hero {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 24px 0 22px;
  }

  .percent {
    font-size: 44px;
    line-height: 1.15;
    font-weight: 400;
    font-variant-numeric: tabular-nums;
  }

  .state {
    min-height: 20px;
    margin-top: 6px;
    color: var(--secondary-text-color);
    font-size: 13px;
  }

  .brightness {
    width: ${BRIGHTNESS_WIDTH_PX}px;
    height: ${BRIGHTNESS_HEIGHT_PX}px;
    margin: 22px 0 18px;
    border-radius: ${BRIGHTNESS_RADIUS_PX}px;
    position: relative;
    overflow: hidden;
    background: var(--secondary-background-color);
  }

  .fill {
    position: absolute;
    inset: auto 0 0;
    height: var(--level, 0%);
    background: var(--lamp-color, #ffc107);
    pointer-events: none;
  }

  .grip {
    position: absolute;
    left: calc(50% - ${BRIGHTNESS_GRIP_WIDTH_PX / 2}px);
    bottom: clamp(
      ${BRIGHTNESS_GRIP_BOTTOM_PX}px,
      calc(var(--level, 0%) - ${BRIGHTNESS_GRIP_OFFSET_PX}px),
      ${BRIGHTNESS_HEIGHT_PX - BRIGHTNESS_GRIP_TOP_PX}px
    );
    width: ${BRIGHTNESS_GRIP_WIDTH_PX}px;
    height: ${BRIGHTNESS_GRIP_HEIGHT_PX}px;
    border-radius: 4px;
    background: white;
    pointer-events: none;
  }

  .brightness input[type="range"],
  .brightness input[type="range"]:disabled {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    margin: 0;
    writing-mode: vertical-lr;
    direction: rtl;
    opacity: 0 !important;
    cursor: ns-resize;
  }

  .brightness:focus-within {
    outline: 3px solid var(--primary-color);
    outline-offset: 4px;
  }

  .power {
    width: 56px;
    height: 56px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    background: var(--secondary-background-color);
  }

  .power[aria-pressed="true"] {
    color: var(--primary-color);
  }

  .power ha-icon {
    --mdc-icon-size: 28px;
  }

  .controls {
    display: grid;
    gap: 16px;
  }

  .field {
    display: grid;
    gap: 7px;
    font-size: 14px;
  }

  .field > span,
  .range-title {
    color: var(--secondary-text-color);
  }

  select {
    width: 100%;
    min-height: 48px;
    padding: 10px 38px 10px 13px;
    color: var(--primary-text-color);
    background: var(--secondary-background-color);
    border: 1px solid var(--divider-color);
    border-radius: 12px;
    cursor: pointer;
  }

  option {
    color: var(--primary-text-color);
    background: var(--card-background-color);
  }

  .range-title {
    display: flex;
    justify-content: space-between;
    gap: 16px;
  }

  output {
    color: var(--primary-text-color);
    font-variant-numeric: tabular-nums;
  }

  .field input[type="range"] {
    width: 100%;
    min-height: 34px;
    margin: 0;
    accent-color: var(--primary-color);
    cursor: pointer;
  }

  .note {
    margin: 18px 0 0;
    font-size: 12px;
    color: var(--secondary-text-color);
  }

  .error {
    margin-top: 14px;
    color: var(--error-color, #db4437);
    font-size: 14px;
    overflow-wrap: anywhere;
  }

  button:disabled,
  select:disabled,
  input:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  @media (max-width: ${COMPACT_VIEWPORT_WIDTH_PX}px) {
    .card {
      padding: 18px;
    }
  }
`;

export const dialogStyles = css`
  dialog {
    width: ${DIALOG_WIDTH_PX}px;
    max-width: calc(100vw - ${DIALOG_VIEWPORT_MARGIN_PX}px);
    max-height: calc(100dvh - ${DIALOG_VIEWPORT_MARGIN_PX}px);
    padding: 0;
    border: 1px solid var(--divider-color);
    border-radius: 24px;
    color: var(--primary-text-color);
    background: var(--ha-card-background, var(--card-background-color));
    box-shadow: 0 12px 48px #0006;
    overflow: hidden;
  }

  dialog::backdrop {
    background: #0008;
  }

  .tools {
    display: flex;
    justify-content: flex-end;
    gap: 4px;
    padding: 8px 10px;
    background: var(--ha-card-background, var(--card-background-color));
  }

  button {
    width: 38px;
    height: 38px;
    display: grid;
    place-items: center;
    border: 0;
    border-radius: 50%;
    cursor: pointer;
    color: var(--primary-text-color);
    background: transparent;
  }

  button:hover {
    background: var(--secondary-background-color);
  }

  button:focus-visible {
    outline: 3px solid var(--primary-color);
  }

  .content {
    max-height: calc(100dvh - ${DIALOG_VIEWPORT_MARGIN_PX + DIALOG_CHROME_HEIGHT_PX}px);
    overflow: auto;
    overscroll-behavior: contain;
  }

  gyverlamp2-card {
    --ha-card-border-width: 0;
    --ha-card-box-shadow: none;
  }
`;

export const colorPickerStyles = css`
  :host {
    display: block;
  }

  [hidden] {
    display: none !important;
  }

  .wheel:focus-visible {
    outline: 3px solid var(--primary-color);
    outline-offset: 4px;
  }

  .color {
    padding: 4px 0;
  }

  .wheel {
    position: relative;
    width: ${COLOR_WHEEL_SIZE_PX}px;
    height: ${COLOR_WHEEL_SIZE_PX}px;
    margin: 12px auto 0;
    border-radius: 50%;
    touch-action: none;
    cursor: crosshair;
    background:
      radial-gradient(circle, white 0%, transparent 71%),
      conic-gradient(from 90deg, red, yellow, lime, cyan, blue, magenta, red);
    box-shadow: inset 0 0 0 1px #0002;
  }

  .wheel-marker {
    position: absolute;
    width: ${COLOR_MARKER_SIZE_PX}px;
    height: ${COLOR_MARKER_SIZE_PX}px;
    border: 3px solid white;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    box-shadow:
      0 0 0 1px #0008,
      0 1px 5px #0008;
    pointer-events: none;
  }

  .color-tools {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 10px;
    gap: 12px;
  }

  .color-tools small {
    color: var(--secondary-text-color);
  }

  .color-chip {
    appearance: none;
    -webkit-appearance: none;
    border: 0;
    background: none;
    padding: 0;
    width: 42px;
    height: 32px;
    cursor: pointer;
  }

  .color-chip::-webkit-color-swatch-wrapper {
    padding: 0;
  }

  .color-chip::-webkit-color-swatch {
    border: 1px solid var(--divider-color);
    border-radius: 8px;
  }

  @media (max-width: ${COMPACT_VIEWPORT_WIDTH_PX}px) {
    .wheel {
      width: ${COMPACT_COLOR_WHEEL_SIZE_PX}px;
      height: ${COMPACT_COLOR_WHEEL_SIZE_PX}px;
    }
  }
`;
