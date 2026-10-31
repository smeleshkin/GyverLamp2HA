import {
  BYTE_MAX,
  BRIGHTNESS_MIN_PERCENT,
  PERCENT_MAX,
  UI_BINDINGS_SCHEMA_VERSION,
} from "./constants";
import type {
  CardConfig,
  ControlEntities,
  ControlKey,
  ControlValues,
  EntityField,
  EntityState,
  HomeAssistant,
  HsColor,
  Parameter,
} from "./types";

const controlNames = [
  "mode",
  "palette",
  "color_source",
  "speed",
  "scale",
  "hue",
  "saturation",
] as const;

export class LampState {
  private knownBrightness = new Map<string | undefined, number>();
  private explicitConfig: CardConfig = { entity: "" };
  config: CardConfig = { entity: "" };
  hass?: HomeAssistant;

  configure(config: CardConfig): void {
    if (!config.entity.startsWith("light.")) {
      throw new Error("Укажите entity: light.<имя лампы>");
    }
    this.explicitConfig = { ...config };
    const base = config.entity.slice("light.".length);
    this.config = {
      ...Object.fromEntries(
        controlNames.map((key) => [
          `${key}_entity`,
          `${["mode", "palette", "color_source"].includes(key) ? "select" : "number"}.${base}_${key === "mode" ? "ha_mode" : key}`,
        ]),
      ),
      ...config,
    };
    this.resolveBindings();
  }

  update(hass: HomeAssistant): void {
    this.hass = hass;
    this.resolveBindings();

    const brightness = this.light?.attributes.brightness;
    if (brightness !== undefined && Number.isFinite(brightness)) {
      this.knownBrightness.set(this.scope, brightness);
    }
  }

  private resolveBindings(): void {
    const controls = this.light?.attributes.gyverlamp2_ui;
    if (controls?.schema !== UI_BINDINGS_SCHEMA_VERSION) {
      return;
    }
    for (const key of controlNames) {
      const field: EntityField = `${key}_entity`;
      this.config[field] = this.explicitConfig[field] || controls[field];
    }
  }

  entity(id?: string | null): EntityState | undefined {
    return id ? this.hass?.states[id] : undefined;
  }

  control(field: keyof ControlEntities): EntityState | undefined {
    return this.entity(this.config[field]);
  }

  get light(): EntityState | undefined {
    return this.entity(this.config.entity);
  }

  get attributes() {
    return this.light?.attributes ?? {};
  }

  get scope(): string | undefined {
    return this.attributes.mode_key ?? this.attributes.effect ?? this.control("mode_entity")?.state;
  }

  get unavailable(): boolean {
    return !this.light || this.light.state === "unavailable";
  }

  available(entity?: EntityState): boolean {
    return !!entity && !["unavailable", "unknown"].includes(entity.state);
  }

  supports(parameter: Parameter): boolean {
    return this.attributes.mode_parameters?.[parameter] === true;
  }

  options(field: EntityField): string[] {
    return (
      this.control(field)?.attributes.options ??
      (field === "mode_entity" ? (this.attributes.effect_list ?? []) : [])
    );
  }

  read<K extends ControlKey>(key: K): ControlValues[K] {
    const numeric = (field: EntityField) => {
      const value = this.control(field)?.state;
      return value !== undefined && Number.isFinite(Number(value)) ? Number(value) : undefined;
    };
    const brightness = this.attributes.brightness ?? this.knownBrightness.get(this.scope);
    const color: HsColor = this.attributes.hs_color ?? [
      numeric("hue_entity") ?? 0,
      this.supports("saturation") ? (numeric("saturation_entity") ?? 0) : PERCENT_MAX,
    ];

    const values: ControlValues = {
      power: this.light?.state === "on" ? true : this.light?.state === "off" ? false : undefined,
      brightness:
        brightness !== undefined && Number.isFinite(brightness)
          ? Math.max(BRIGHTNESS_MIN_PERCENT, Math.round((brightness * PERCENT_MAX) / BYTE_MAX))
          : undefined,
      color,
      effect: this.attributes.effect ?? this.control("mode_entity")?.state,
      speed: numeric("speed_entity"),
      scale: numeric("scale_entity"),
      source: this.control("color_source_entity")?.state,
      palette: this.control("palette_entity")?.state,
    };

    return values[key];
  }
}
