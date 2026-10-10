import { msg, str } from '@lit/localize';
import { css, html, nothing } from 'lit';
import { customElement } from 'lit/decorators.js';
import { attendingPage } from '../../config/site';
import { store } from '../../store';
import { queueSnackbar } from '../../store/snackbars';
import '../shared/hoverboard-icon';
import { ThemedComponent } from '../themed-component';
import '../ui/hb-button';
import '../ui/hb-icon-button';
import { contentStyles, markdown } from './content';

/**
 * Where to stay: the organizers' text, then each hotel with its address, note, discount code and a
 * link to book. Without text or hotels, it renders nothing.
 */
@customElement('accommodation-section')
export class AccommodationSection extends ThemedComponent {
  static override styles = [
    contentStyles,
    css`
      .hotels {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr));
        gap: var(--hb-space-6);
        margin: var(--hb-space-6) 0 0;
        padding: 0;
        list-style: none;
      }

      .hotel {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        align-items: start;
        gap: var(--hb-space-3);
      }

      .hotel h3 {
        margin: 0;
        font: 700 var(--hb-text-md) / 1.3 var(--hb-font-body);
      }

      address {
        margin-block-start: var(--hb-space-1);
        font-style: normal;
      }

      .hotel .text {
        margin-block-start: var(--hb-space-2);
      }

      .code {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--hb-space-2);
        margin: var(--hb-space-3) 0 0;
      }

      code {
        padding: var(--hb-space-1) var(--hb-space-2);
        border: var(--hb-border-width) solid currentColor;
        border-radius: var(--hb-radius-s);
        font: 700 var(--hb-text-md) / 1.3 var(--hb-font-mono);
      }

      .book {
        margin-block-start: var(--hb-space-3);
      }
    `,
  ];

  override render() {
    const { text, hotels = [] } = attendingPage?.accommodation ?? {};
    if (!text && !hotels.length) return nothing;
    return html`
      <slot name="heading"></slot>
      ${markdown(text)}
      ${
        hotels.length
          ? html`<ul class="hotels">
              ${hotels.map(
                ({ name, address, note, code, url }) => html`
                  <li class="hotel">
                    <hoverboard-icon name="hotel"></hoverboard-icon>
                    <div>
                      <h3>${name}</h3>
                      ${address ? html`<address>${address}</address>` : nothing} ${markdown(note)}
                      ${code ? this.renderCode(code) : nothing}
                      ${
                        url
                          ? html`<hb-button
                              class="book"
                              variant="outlined"
                              href="${url}"
                              target="_blank"
                            >
                              ${msg('Book', { id: 'attending.accommodation.book' })}
                            </hb-button>`
                          : nothing
                      }
                    </div>
                  </li>
                `,
              )}
            </ul>`
          : nothing
      }
    `;
  }

  private renderCode(code: string) {
    return html`
      <p class="code">
        ${msg('Discount code', { id: 'attending.accommodation.code' })}
        <code>${code}</code>
        <hb-icon-button
          label="${msg(str`Copy ${code}`, { id: 'attending.accommodation.copy' })}"
          @click="${() => this.copy(code)}"
        >
          <hoverboard-icon name="copy"></hoverboard-icon>
        </hb-icon-button>
      </p>
    `;
  }

  private async copy(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      store.dispatch(
        queueSnackbar(msg(str`Copied ${code}.`, { id: 'attending.accommodation.copied' })),
      );
    } catch {
      store.dispatch(
        queueSnackbar(
          msg('Could not copy the code. Select it to copy it.', {
            id: 'attending.accommodation.copy-failed',
          }),
        ),
      );
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'accommodation-section': AccommodationSection;
  }
}
