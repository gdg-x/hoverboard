import { Success } from '@abraham/remotedata';
import { msg } from '@lit/localize';
import '@material/web/button/text-button.js';
import { css, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import type { DialogData } from '../../models/dialog-form';
import { openSubscribeDialog } from '../../store/dialogs';
import { subscribe, type SubscribeState } from '../../store/subscribe';
import type { UserState } from '../../store/user';
import { subscribeBlock } from '../../config/site';
import '../shared/hoverboard-icon';
import { fromStore } from '../../controllers/from-store';
import { ThemedElement } from '../themed-element';

@customElement('subscribe-block')
export class SubscribeBlock extends ThemedElement {
  static override styles = css`
    :host {
      display: flex;
      width: 100%;
      background: var(--default-primary-color);
      color: var(--text-primary-color);
      padding: 16px 0;
    }

    .container {
      display: flex;
      flex-direction: column;
    }

    .description {
      font-size: 24px;
      line-height: 1.5;
      margin: 0 0 16px;
    }

    md-text-button {
      color: var(--text-primary-color);
      --md-text-button-label-text-color: var(--text-primary-color);
      --md-text-button-hover-label-text-color: var(--text-primary-color);
    }

    md-text-button[disabled] {
      background: var(--default-primary-color);
      color: var(--text-primary-color);
    }

    @media (min-width: 640px) {
      :host {
        padding: 32px 0;
      }

      .container {
        align-items: center;
      }

      .description {
        font-size: 32px;
        margin: 0 0 24px;
        text-align: center;
      }
    }
  `;

  private get subscribeBlock() {
    return subscribeBlock;
  }

  @fromStore((state) => state.subscribed)
  accessor subscribed!: SubscribeState;

  @fromStore((state) => state.user)
  accessor user!: UserState;

  private get ctaIcon() {
    return this.subscribed instanceof Success ? 'checked' : 'arrow-right-circle';
  }

  private get ctaLabel() {
    return this.subscribed instanceof Success
      ? msg('Subscribed', { id: 'common.subscribed' })
      : msg('Subscribe', { id: 'common.subscribe', desc: 'Button that submits a subscription.' });
  }

  override render() {
    return html`
      <div class="container">
        <div class="description">
          ${msg('Get notified about the important conference updates', {
            id: 'home.subscribe-block.description',
          })}
        </div>
        <div class="cta-button">
          <md-text-button
            class="animated icon-right"
            trailing-icon
            ?disabled="${this.subscribed instanceof Success}"
            @click="${this.subscribe}"
          >
            <span class="cta-label">${this.ctaLabel}</span>
            <hoverboard-icon slot="icon" name="${this.ctaIcon}"></hoverboard-icon>
          </md-text-button>
        </div>
      </div>
    `;
  }

  private subscribe = () => {
    let userData = {
      firstFieldValue: '',
      secondFieldValue: '',
    };

    if (this.user instanceof Success) {
      const name = this.user.data.displayName?.split(' ') || ['', ''];
      userData = {
        firstFieldValue: name[0] || '',
        secondFieldValue: name[1] || '',
      };

      if (this.user.data.email) {
        this.subscribeAction({ ...userData, email: this.user.data.email });
      }
    }

    if (this.user instanceof Success && this.user.data.email) {
      this.subscribeAction({ ...userData, email: this.user.data.email });
    } else {
      openSubscribeDialog({
        title: this.subscribeBlock.formTitle,
        firstFieldValue: userData.firstFieldValue,
        secondFieldValue: userData.secondFieldValue,
        submit: (data) => this.subscribeAction(data),
      });
    }
  };

  private subscribeAction(data: DialogData) {
    subscribe(data);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'subscribe-block': SubscribeBlock;
  }
}
