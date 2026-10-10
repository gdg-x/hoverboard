import { msg, str } from '@lit/localize';
import { css, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import type { BuiltSession } from '../../schedule/build-schedule';
import { tagChipStyle } from '../../utils/styles';
import '../ui/hb-chip';
import { ThemedElement } from '../themed-element';

/** A session's chips: plain details, such as its day and track, then whether it is sponsored, then its tags. */
@customElement('session-chips')
export class SessionChips extends ThemedElement {
  static override styles = css`
    :host {
      display: block;
    }

    ul {
      display: flex;
      flex-wrap: wrap;
      gap: var(--hb-session-chips-gap, var(--hb-space-2));
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .plain {
      --hb-chip-border-color: currentColor;
    }
  `;

  @property({ attribute: false })
  accessor session: Pick<BuiltSession, 'sponsor' | 'tags'> | undefined;
  @property({ attribute: false })
  accessor details: string[] = [];
  /** Says "Sponsored by Acme" rather than "Sponsored". */
  @property({ type: Boolean, attribute: 'name-sponsor' })
  accessor nameSponsor = false;
  /** The list's accessible name. */
  @property()
  accessor label: string | undefined;

  override render() {
    const sponsor = this.session?.sponsor;
    const tags = this.session?.tags ?? [];
    if (!this.details.length && !sponsor && !tags.length) return nothing;
    return html`
      <ul aria-label="${this.label ?? nothing}">
        ${this.details.map((detail) => html`<li><hb-chip class="plain">${detail}</hb-chip></li>`)}
        ${
          sponsor
            ? html`<li>
                <hb-chip class="sponsored" accent="1">
                  ${
                    this.nameSponsor
                      ? msg(str`Sponsored by ${sponsor}`, { id: 'pages.session.sponsored-by' })
                      : msg('Sponsored', { id: 'schedule.session.sponsored' })
                  }
                </hb-chip>
              </li>`
            : nothing
        }
        ${tags.map(
          (tag) => html`<li><hb-chip style="${styleMap(tagChipStyle(tag))}">${tag}</hb-chip></li>`,
        )}
      </ul>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'session-chips': SessionChips;
  }
}
