import { Failure, Success } from '@abraham/remotedata';
import { msg } from '@lit/localize';
import { css, html, nothing, type PropertyValues } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { decorations, subscribeBlock } from '../../config/site';
import { fromStore } from '../../controllers/from-store';
import { illustration, illustrationStyles } from '../../illustrations/illustration';
import subscribeArt from '../../illustrations/subscribe.svg?raw';
import { subscribe, type SubscribeState } from '../../store/subscribe';
import { needsNetworkMessage, selectOnline } from '../../store/sync';
import type { UserState } from '../../store/user';
import { band } from '../../styles/band';
import '../shared/hoverboard-icon';
import { ThemedComponent } from '../themed-component';
import '../ui/hb-button';
import '../ui/hb-text-field';
import type { HbTextField } from '../ui/hb-text-field';

/** A bright band with the site's only subscribe form: one email field. */
@customElement('subscribe-block')
export class SubscribeBlock extends ThemedComponent {
  static override styles = [
    band,
    illustrationStyles,
    css`
      :host {
        background-color: var(--hb-color-accent-3-container);
        color: var(--hb-color-on-accent-3-container);
      }

      .inner {
        display: grid;
        gap: var(--hb-space-6);
      }

      .illustration {
        display: var(--hb-decorations-display, block);
        inline-size: min(100%, 10rem);
        margin-block-start: var(--hb-space-5);
      }

      /* A sentence, not a word, so smaller than other section titles. */
      .band-title {
        font-size: var(--hb-text-3xl);
      }

      .form {
        display: flex;
        flex-wrap: wrap;
        align-items: flex-end;
        gap: var(--hb-space-3);
      }

      hb-text-field {
        flex: 1 1 18rem;
      }

      .offline {
        flex-basis: 100%;
        margin: 0;
        font-weight: 600;
      }

      .subscribed {
        display: flex;
        align-items: center;
        gap: var(--hb-space-2);
        margin: 0;
        font-size: var(--hb-text-lg);
        font-weight: 600;
      }

      .subscribed hoverboard-icon {
        inline-size: 28px;
        block-size: 28px;
      }

      @container (width >= 800px) {
        .inner {
          grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
          align-items: end;
        }
      }
    `,
  ];

  @fromStore((state) => state.subscribed)
  accessor subscribed!: SubscribeState;

  @fromStore((state) => state.user)
  accessor user!: UserState;

  @fromStore(selectOnline)
  private accessor online!: boolean;

  @state()
  private accessor email = '';

  @query('hb-text-field')
  private accessor emailField!: HbTextField | null;

  // A signed-in visitor's email fills the field until they type their own.
  override willUpdate(changed: PropertyValues<this>) {
    if (changed.has('user') && !this.email && this.user instanceof Success) {
      this.email = this.user.data.email ?? '';
    }
  }

  override render() {
    return html`
      <div class="inner">
        <div>
          <h2 class="band-title">
            ${msg('Get notified about the important conference updates', {
              id: 'home.subscribe-block.description',
            })}
          </h2>
          <p class="band-lede">${subscribeBlock.formTitle}</p>
          ${
            // The demo banner can turn decorations on, so a demo site always has the drawing.
            decorations || __HB_FEATURES__.demo ? illustration(subscribeArt) : nothing
          }
        </div>
        ${this.subscribed instanceof Success ? this.renderSubscribed() : this.renderForm()}
      </div>
    `;
  }

  private renderSubscribed() {
    return html`
      <p class="subscribed" role="status">
        <hoverboard-icon name="checked"></hoverboard-icon>
        ${msg('Subscribed', { id: 'common.subscribed' })}
      </p>
    `;
  }

  private renderForm() {
    return html`
      <div class="form">
        <hb-text-field
          type="email"
          name="email"
          autocomplete="email"
          required
          label="${msg('Your email', { id: 'home.subscribe-block.email' })}"
          .value="${this.email}"
          error="${
            this.subscribed instanceof Failure
              ? msg('Could not subscribe. Please try again.', {
                  id: 'home.subscribe-block.error',
                })
              : ''
          }"
          @input="${this.onInput}"
          @keydown="${this.onKeydown}"
        ></hb-text-field>
        <hb-button size="l" ?disabled="${!this.online}" @click="${this.submit}">
          ${msg('Subscribe', {
            id: 'common.subscribe',
            desc: 'Button that submits a subscription.',
          })}
        </hb-button>
        ${this.online ? nothing : html`<p class="offline">${needsNetworkMessage()}</p>`}
      </div>
    `;
  }

  private readonly onInput = (event: Event) => {
    this.email = (event.target as HbTextField).value;
  };

  // The field's input is in its own shadow root, with no form to submit on Enter.
  private readonly onKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.submit();
    }
  };

  private readonly submit = () => {
    if (!this.emailField?.reportValidity()) return;
    const [firstFieldValue = '', secondFieldValue = ''] =
      this.user instanceof Success ? (this.user.data.displayName?.split(' ') ?? []) : [];
    subscribe({ email: this.email, firstFieldValue, secondFieldValue });
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'subscribe-block': SubscribeBlock;
  }
}
