import { LitElement, html } from "lit";
import { dialogStyles } from "./styles";
import type { CardConfig, DialogParams, HomeAssistant } from "./types";

export class LampDialog extends LitElement {
  static properties = { hass: { attribute: false }, config: { state: true } };

  static styles = dialogStyles;
  hass?: HomeAssistant;
  private config?: CardConfig;
  private opened = false;

  protected render() {
    return html`
      <dialog
        aria-label="Управление GyverLamp2"
        @cancel=${this.cancel}
        @close=${this.closeDialog}
        @click=${this.closeOnBackdrop}
      >
        <div class="tools">
          <button
            type="button"
            aria-label="История лампы"
            title="История"
            @click=${() => this.moreInfo("history")}
          >
            <ha-icon icon="mdi:chart-box-outline"></ha-icon>
          </button>
          <button
            type="button"
            aria-label="Настройки сущности лампы"
            title="Настройки"
            @click=${() => this.moreInfo("settings")}
          >
            <ha-icon icon="mdi:cog-outline"></ha-icon>
          </button>
          <button
            id="close"
            type="button"
            aria-label="Закрыть управление лампой"
            title="Закрыть"
            autofocus
            @click=${this.closeDialog}
          >
            <ha-icon icon="mdi:close"></ha-icon>
          </button>
        </div>
        <div class="content">
          ${
            this.config
              ? html`
                  <gyverlamp2-card .cardConfig=${this.config} .hass=${this.hass}></gyverlamp2-card>
                `
              : ""
          }
        </div>
      </dialog>
    `;
  }

  async showDialog({ config }: DialogParams): Promise<void> {
    this.config = config;
    this.opened = true;
    await this.updateComplete;
    this.openNative();
  }

  connectedCallback(): void {
    super.connectedCallback();
    void this.updateComplete.then(() => this.openNative());
  }

  closeDialog(): boolean {
    if (!this.opened) {
      return true;
    }
    this.opened = false;
    const dialog = this.renderRoot.querySelector("dialog");
    if (dialog?.open) {
      dialog.close();
    }
    this.config = undefined;
    this.dispatchEvent(
      new CustomEvent("dialog-closed", {
        bubbles: true,
        composed: true,
        detail: { dialog: this.localName },
      }),
    );
    return true;
  }

  private openNative(): void {
    const dialog = this.renderRoot.querySelector("dialog");
    if (!this.isConnected || !this.opened || !dialog || dialog.open) {
      return;
    }
    dialog.showModal();
    this.renderRoot.querySelector(".content")?.scrollTo?.(0, 0);
  }

  private moreInfo(view: string): void {
    this.dispatchEvent(
      new CustomEvent("hass-more-info", {
        bubbles: true,
        composed: true,
        detail: { entityId: this.config?.entity, view },
      }),
    );
  }

  private cancel(event: Event): void {
    event.preventDefault();
    this.closeDialog();
  }

  private closeOnBackdrop(event: MouseEvent): void {
    const dialog = event.currentTarget as HTMLDialogElement;
    if (event.target !== dialog) {
      return;
    }
    const rect = dialog.getBoundingClientRect();
    if (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    ) {
      this.closeDialog();
    }
  }
}
