import {
  CONFIRMATION_TIMEOUT_MS,
  HUE_CONFIRMATION_TOLERANCE,
  SATURATION_CONFIRMATION_TOLERANCE,
  FULL_CIRCLE_DEGREES,
} from "./constants";
import type { ReactiveController, ReactiveControllerHost } from "lit";
import type { ControlKey, ControlValue, ControlValues, ServiceAction } from "./types";

interface StateReader {
  readonly scope: string | undefined;
  read<K extends ControlKey>(key: K): ControlValues[K];
}

interface Draft {
  value: ControlValue;
  scope: string | undefined;
}
interface Command extends ServiceAction {
  key: ControlKey;
  value: ControlValue;
  scope?: string;
  status: "queued" | "sending" | "awaiting";
  acknowledged: boolean;
  timer?: ReturnType<typeof setTimeout>;
}

const structuralKeys: ControlKey[] = ["effect", "source", "palette"];

export class CommandController implements ReactiveController {
  private drafts = new Map<ControlKey, Draft>();
  private pending = new Map<ControlKey, Command>();
  private queue: Command[] = [];
  private connected = false;
  busy = false;
  error = "";

  constructor(
    private host: ReactiveControllerHost,
    private state: StateReader,
    private execute: (action: ServiceAction) => Promise<unknown>,
  ) {
    host.addController(this);
  }

  hostConnected(): void {
    this.connected = true;
  }

  hostDisconnected(): void {
    this.connected = false;
    this.drafts.clear();
    for (const key of this.pending.keys()) {
      this.clearPending(key);
    }
  }

  value<K extends ControlKey>(key: K): ControlValues[K] {
    return (this.drafts.get(key)?.value ??
      this.pending.get(key)?.value ??
      this.state.read(key)) as ControlValues[K];
  }

  preview<K extends ControlKey>(key: K, value: ControlValues[K]): void {
    this.drafts.set(key, { value, scope: this.state.scope });
    this.host.requestUpdate();
  }

  cancelPreview(key: ControlKey): void {
    this.drafts.delete(key);
    this.host.requestUpdate();
  }

  get structuralPending(): boolean {
    return structuralKeys.some((key) => this.pending.has(key));
  }

  reconcile(): void {
    for (const [key, draft] of this.drafts) {
      if (draft.scope !== this.state.scope) {
        this.drafts.delete(key);
      }
    }

    for (const [key, command] of this.pending) {
      if (this.isStale(command)) {
        this.clearPending(key);
        continue;
      }
      if (command.status === "queued") {
        continue;
      }
      if (this.matches(key, this.state.read(key), command.value)) {
        command.acknowledged = true;
      }
      if (command.status === "awaiting" && command.acknowledged) {
        this.clearPending(key);
      }
    }
    this.host.requestUpdate();
  }

  submit<K extends ControlKey>(key: K, value: ControlValues[K], action: ServiceAction): void {
    this.drafts.delete(key);
    this.clearPending(key);

    const command: Command = {
      ...action,
      key,
      value,
      scope: key === "effect" || key === "power" ? undefined : this.state.scope,
      status: "queued",
      acknowledged: false,
    };

    this.pending.set(key, command);

    let replaceIndex = -1;
    for (let index = this.queue.length - 1; index >= 0; index--) {
      const queued = this.queue[index];
      if (structuralKeys.includes(queued.key)) {
        break;
      }
      if (queued.key === key && queued.scope === command.scope) {
        replaceIndex = index;
        break;
      }
    }

    if (replaceIndex >= 0) {
      this.queue[replaceIndex] = command;
    } else {
      this.queue.push(command);
    }

    this.error = "";
    this.host.requestUpdate();
    if (!this.busy) {
      void this.drain();
    }
  }

  private isStale(command: Command): boolean {
    return command.scope !== undefined && command.scope !== this.state.scope;
  }

  private clearPending(key: ControlKey): void {
    clearTimeout(this.pending.get(key)?.timer);
    this.pending.delete(key);
  }

  private matches(key: ControlKey, actual: ControlValue, desired: ControlValue): boolean {
    if (key !== "color") {
      return actual === desired;
    }
    if (!Array.isArray(actual) || !Array.isArray(desired)) {
      return false;
    }

    const [actualHue, actualSaturation] = actual;
    const [desiredHue, desiredSaturation] = desired;
    const distance = Math.abs(actualHue - desiredHue) % FULL_CIRCLE_DEGREES;

    return (
      Math.min(distance, FULL_CIRCLE_DEGREES - distance) < HUE_CONFIRMATION_TOLERANCE &&
      Math.abs(actualSaturation - desiredSaturation) < SATURATION_CONFIRMATION_TOLERANCE
    );
  }

  private async drain(): Promise<void> {
    this.busy = true;
    try {
      while (this.queue.length) {
        const command = this.queue.shift()!;
        if (this.isStale(command)) {
          if (this.pending.get(command.key) === command) {
            this.clearPending(command.key);
          }
          continue;
        }

        command.status = "sending";
        try {
          await this.execute(command);
          command.status = "awaiting";
          this.reconcile();
          if (this.pending.get(command.key) === command && this.connected) {
            command.timer = setTimeout(() => {
              if (this.pending.get(command.key) !== command) {
                return;
              }
              this.clearPending(command.key);
              this.error =
                "Home Assistant не подтвердил изменение. Показано последнее полученное значение.";
              this.host.requestUpdate();
            }, CONFIRMATION_TIMEOUT_MS);
          }
        } catch (error) {
          if (this.pending.get(command.key) === command) {
            this.clearPending(command.key);
            this.error = error instanceof Error ? error.message : "Не удалось выполнить команду";
          }
        }
        this.host.requestUpdate();
      }
    } finally {
      this.busy = false;
      this.host.requestUpdate();
    }
  }
}
