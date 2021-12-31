import { css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
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
  private deferredPrompt?: BeforeInstallPromptEvent;

  constructor() {
    super();
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
    });
  }

  override render() {
    return html`
      <a class="bottom-drawer-link" @click="${this.prompt}" ?hidden=${!this.deferredPrompt}>
        {$ addToHomeScreen.cta $}
      </a>
    `;
  }

  private async prompt() {
    if (!this.deferredPrompt) {
      return;
    }
    this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      // eslint-disable-next-line no-undef
      ga('send', 'event', 'add_to_home_screen_prompt', 'accepted');
    } else {
      // eslint-disable-next-line no-undef
      ga('send', 'event', 'add_to_home_screen_prompt', 'dismissed');
    }
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
