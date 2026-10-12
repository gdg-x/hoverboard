import { msg, str } from '@lit/localize';
import { css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { mailto } from '../../config/site';
import { ThemedComponent } from '../themed-component';

/** A line at the end of a speaker's or a session's page, so speakers can email a correction. */
@customElement('report-mistake')
export class ReportMistake extends ThemedComponent {
  static override styles = css`
    :host {
      display: block;
      margin-block-start: var(--hb-space-8);
      color: var(--hb-color-on-surface-variant);
      font-size: var(--hb-text-sm);
    }

    p {
      margin: 0;
    }

    a {
      color: inherit;
      text-decoration: underline;
      text-underline-offset: 0.2em;
    }
  `;

  /** What the correction is about, such as the speaker's name or the session's title. */
  @property()
  accessor subject = '';

  override render() {
    const subject = msg(str`Correction: ${this.subject}`, {
      id: 'shared.report-mistake.subject',
      desc: "The subject of the email, with the speaker's name or the session's title.",
    });
    const link = html`<a href="mailto:${mailto}?subject=${encodeURIComponent(subject)}"
      >${msg('Report a mistake', { id: 'shared.report-mistake.link' })}</a
    >`;
    return html`<p>${msg(html`Speaking here? ${link}`, { id: 'shared.report-mistake.text' })}</p>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'report-mistake': ReportMistake;
  }
}
