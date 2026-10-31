import {
  UI_VERSION,
  BYTE_MIN,
  BYTE_MAX,
  BRIGHTNESS_MIN_PERCENT,
  PERCENT_MAX,
  PARAMETER_STEP,
  COLOR_ROUNDING_FACTOR,
  CARD_HEIGHT_UNITS,
  GRID_COLUMNS,
  GRID_MIN_COLUMNS,
  DEFAULT_LAMP_COLOR,
} from "./constants";
import { LitElement, html } from "lit";
import { live } from "lit/directives/live.js";
import { CommandController } from "./command-controller";
import { hsToHex } from "./color-picker";
import { LampState } from "./lamp-state";
import { cardStyles } from "./styles";
import type {
  CardConfig,
  ControlKey,
  ControlValues,
  EntityField,
  HomeAssistant,
  HsColor,
} from "./types";

export class LampCard extends LitElement {
  static styles = cardStyles;

  private state = new LampState();
  private commands = new CommandController(this, this.state, (action) => {
    if (!this.state.hass) {
      return Promise.reject(new Error("Нет подключения к Home Assistant"));
    }
    return this.state.hass.callService(action.domain, action.service, action.data);
  });

  set hass(hass: HomeAssistant) {
    this.state.update(hass);
    this.commands.reconcile();
  }

  set cardConfig(config: CardConfig) {
    this.setConfig(config);
  }

  setConfig(config: CardConfig): void {
    this.state.configure(config);
    this.commands.reconcile();
  }

  getCardSize() {
    return CARD_HEIGHT_UNITS;
  }

  getGridOptions() {
    return { columns: GRID_COLUMNS, rows: "auto", min_columns: GRID_MIN_COLUMNS };
  }

  static getStubConfig(): CardConfig {
    return { entity: "light.gyverlamp2" };
  }

  protected render() {
    if (!this.state.hass || !this.state.config.entity) {
      return html``;
    }

    const power = this.commands.value("power");
    const brightness = this.commands.value("brightness");
    const color = this.commands.value("color");
    const unavailable = this.state.unavailable;
    const disabled = this.commands.structuralPending;

    const title = this.state.config.name || this.state.attributes.friendly_name || "GyverLamp2";
    const status = unavailable
      ? "Нет связи с лампой"
      : power === true
        ? "Включена"
        : power === false
          ? "Выключена"
          : "Питание неизвестно";

    const sourceAvailable = this.state.available(this.state.control("color_source_entity"));
    const paletteVisible =
      this.state.available(this.state.control("palette_entity")) &&
      (!sourceAvailable || this.commands.value("source") === "palette");

    return html`
      <ha-card data-version=${UI_VERSION}>
        <div class="card">
          <header>
            <span class="lamp-icon"><ha-icon icon="mdi:lava-lamp"></ha-icon></span>
            <div>
              <div class="subtitle">${this.state.config.subtitle ?? ""}</div>
              <h2>${title}</h2>
            </div>
          </header>

          <section class="hero" aria-label="Яркость и питание">
            <div class="percent">${brightness === undefined ? "—" : `${brightness}%`}</div>
            <div class="state">${status}</div>
            <div
              class="brightness"
              style="--level:${brightness ?? 0}%;--lamp-color:${this.state.supports("hue") ? hsToHex(color) : DEFAULT_LAMP_COLOR}"
            >
              <div class="fill"></div>
              <div class="grip"></div>
              <input
                id="brightness"
                type="range"
                min=${BRIGHTNESS_MIN_PERCENT}
                max=${PERCENT_MAX}
                step=${PARAMETER_STEP}
                aria-label="Яркость"
                .value=${live(String(brightness ?? PERCENT_MAX))}
                ?disabled=${disabled || unavailable}
                @input=${(event: Event) => this.previewNumber("brightness", event)}
                @change=${this.changeBrightness}
                @pointercancel=${() => this.commands.cancelPreview("brightness")}
              />
            </div>
            <button
              class="power"
              type="button"
              aria-pressed=${power === true}
              aria-label=${power === true ? "Выключить лампу" : "Включить лампу"}
              ?disabled=${disabled || unavailable}
              @click=${this.togglePower}
            >
              <ha-icon icon="mdi:power"></ha-icon>
            </button>
          </section>

          <div class="controls" aria-busy=${this.commands.busy}>
            ${this.selectField("effect", "Эффект", "mode_entity")}
            ${this.selectField("source", "Источник цвета", "color_source_entity", !sourceAvailable, { hue: "Оттенок", palette: "Палитра" })}
            ${this.selectField("palette", "Палитра", "palette_entity", !paletteVisible)}
            <section id="color-field" class="field" ?hidden=${!this.state.supports("hue")}>
              <span>Цвет</span>
              <gyverlamp2-color-picker
                .color=${live(color)}
                .saturationEnabled=${this.state.supports("saturation")}
                .disabled=${disabled || !this.state.supports("hue")}
                @color-preview=${(event: CustomEvent<HsColor>) => this.commands.preview("color", event.detail)}
                @color-commit=${(event: CustomEvent<HsColor>) => this.changeColor(event.detail)}
                @color-cancel=${() => this.commands.cancelPreview("color")}
              ></gyverlamp2-color-picker>
            </section>

            ${this.numberField("speed", "Скорость")} ${this.numberField("scale", "Масштаб")}
          </div>

          <p class="note" ?hidden=${!unavailable}>
            Настройки можно изменить без связи. Они отправятся при следующем управлении лампой.
          </p>
          <div class="error" role="alert" ?hidden=${!this.commands.error}>
            ${this.commands.error}
          </div>
        </div>
      </ha-card>
    `;
  }

  private selectField(
    key: "effect" | "source" | "palette",
    label: string,
    field: EntityField,
    hidden = false,
    labels: Record<string, string> = {},
  ) {
    const selected = this.commands.value(key);

    return html`
      <label class="field" id="${key}-field" ?hidden=${hidden}>
        <span>${label}</span>
        <select
          id=${key}
          aria-label=${label}
          ?disabled=${this.commands.structuralPending}
          @change=${(event: Event) => this.changeSelection(key, field, event)}
        >
          ${this.state.options(field).map(
            (option) => html`
              <option value=${option} .selected=${live(option === selected)}>
                ${labels[option] ?? option}
              </option>
            `,
          )}
        </select>
      </label>
    `;
  }

  private numberField(key: "speed" | "scale", label: string) {
    const visible =
      this.state.supports(key) && this.state.available(this.state.control(`${key}_entity`));
    const value = this.commands.value(key);

    return html`
      <label id="${key}-field" class="field" ?hidden=${!visible}>
        <span class="range-title">
          ${label}
          <output id="${key}-value">${value ?? ""}</output>
        </span>
        <input
          id=${key}
          type="range"
          min=${BYTE_MIN}
          max=${BYTE_MAX}
          step=${PARAMETER_STEP}
          aria-label=${label}
          .value=${live(String(value ?? 0))}
          ?disabled=${this.commands.structuralPending}
          @input=${(event: Event) => this.previewNumber(key, event)}
          @change=${(event: Event) => this.changeParameter(key, event)}
          @pointercancel=${() => this.commands.cancelPreview(key)}
        />
      </label>
    `;
  }

  private inputNumber(event: Event): number {
    return Number((event.target as HTMLInputElement).value);
  }

  private previewNumber(key: "brightness" | "speed" | "scale", event: Event): void {
    this.commands.preview(key, this.inputNumber(event));
  }

  private changeBrightness(event: Event): void {
    const value = this.inputNumber(event);
    this.commands.submit("brightness", value, {
      domain: "light",
      service: "turn_on",
      data: { entity_id: this.state.config.entity, brightness_pct: value },
    });
  }

  private togglePower(): void {
    const on = this.commands.value("power") === true;
    this.commands.submit("power", !on, {
      domain: "light",
      service: on ? "turn_off" : "turn_on",
      data: { entity_id: this.state.config.entity },
    });
  }

  private changeSelection(
    key: "effect" | "source" | "palette",
    field: EntityField,
    event: Event,
  ): void {
    const option = (event.target as HTMLSelectElement).value;
    this.commands.submit(key, option, {
      domain: "select",
      service: "select_option",
      data: { entity_id: this.state.config[field], option },
    });
  }

  private changeParameter(key: "speed" | "scale", event: Event): void {
    const value = this.inputNumber(event);
    this.submitMode(key, value, { [key]: value });
  }

  private changeColor([hue, saturation]: HsColor): void {
    const roundedHue = Math.round(hue * COLOR_ROUNDING_FACTOR) / COLOR_ROUNDING_FACTOR;
    const roundedSaturation = this.state.supports("saturation")
      ? Math.round(saturation * COLOR_ROUNDING_FACTOR) / COLOR_ROUNDING_FACTOR
      : PERCENT_MAX;
    this.submitMode("color", [roundedHue, roundedSaturation], {
      hue: roundedHue,
      ...(this.state.supports("saturation") ? { saturation: roundedSaturation } : {}),
    });
  }

  private submitMode<K extends ControlKey>(
    key: K,
    value: ControlValues[K],
    changes: Record<string, number>,
  ): void {
    this.commands.submit(key, value, {
      domain: "gyverlamp2",
      service: "set_mode",
      data: {
        entity_id: this.state.config.entity,
        mode: this.state.read("effect"),
        ...changes,
      },
    });
  }
}
