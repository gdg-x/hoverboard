import { css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { addToHomeScreen } from '../utils/data';
import { ThemedElement } from './themed-element';

@customElement('app-install')
export class AppInstall extends ThemedElement {
  static override get styles() {
    return [
      ...super.styles,
      css`
        .bottom-drawer-link {
          padding: 16px 24px;
          cursor: pointer;
        }
      `,
    ];
  }

  @state()
  private deferredPrompt: BeforeInstallPromptEvent | undefined;

  constructor() {
    super();
    window.addEventListener('beforeinstallprompt', (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      this.deferredPrompt = e;
    });
  }

  override render() {
    return html`
      <a class="bottom-drawer-link" @click="${this.prompt}" ?hidden=${!this.deferredPrompt}>
        ${addToHomeScreen.cta}
      </a>
    `;
  }

  private async prompt() {
    if (!this.deferredPrompt) {
      return;
    }
    this.deferredPrompt.prompt();
    this.deferredPrompt = undefined;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'app-install': AppInstall;
  }
}

// https://stackoverflow.com/a/67171375/26406
interface UserChoice {
  outcome: 'accepted' | 'dismissed';
  platform: string;
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<UserChoice>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}
