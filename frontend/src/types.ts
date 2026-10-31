export type HsColor = readonly [number, number];
export type Parameter = "speed" | "scale" | "hue" | "saturation";
export type EntityField = `${Parameter | "mode" | "palette" | "color_source"}_entity`;
export type ControlEntities = Partial<Record<EntityField, string | null>>;

export interface CardConfig extends ControlEntities {
  entity: string;
  name?: string;
  subtitle?: string;
}

export interface LampAttributes {
  friendly_name?: string;
  brightness?: number;
  hs_color?: HsColor;
  effect?: string;
  effect_list?: string[];
  mode_key?: string;
  mode_parameters?: Partial<Record<Parameter | "palette" | "from_center", boolean>>;
  gyverlamp2_ui?: ControlEntities & { schema: number };
  options?: string[];
}

export interface EntityState {
  state: string;
  attributes: LampAttributes;
}

export interface HomeAssistant {
  states: Record<string, EntityState | undefined>;
  callService(domain: string, service: string, data: Record<string, unknown>): Promise<unknown>;
}

export interface HassElement extends HTMLElement {
  hass?: HomeAssistant;
}

export interface ControlValues {
  power: boolean | undefined;
  brightness: number | undefined;
  color: HsColor;
  effect: string | undefined;
  speed: number | undefined;
  scale: number | undefined;
  source: string | undefined;
  palette: string | undefined;
}

export type ControlKey = keyof ControlValues;
export type ControlValue = ControlValues[ControlKey];

export interface ServiceAction {
  domain: string;
  service: string;
  data: Record<string, unknown>;
}

export interface MoreInfoDetail {
  entityId?: string;
  view?: string;
  tab?: string;
}

export interface DialogParams {
  config: CardConfig;
}
