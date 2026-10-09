import { msg } from '@lit/localize';
import { css, html, nothing } from 'lit';
import { customElement } from 'lit/decorators.js';
import { getLocale, locales, setLocale } from '../../utils/localization';
import { ThemedElement } from '../themed-element';

// Each language in its own language, so people can find theirs.
const languageName = (locale: string) =>
  new Intl.DisplayNames([locale], { type: 'language' }).of(locale) ?? locale;

@customElement('locale-picker')
export class LocalePicker extends ThemedElement {
  static override styles = css`
    /* No box, so a site with one locale has no empty space next to the appearance toggle. */
    :host {
      display: contents;
    }

    select {
      padding: 4px 8px;
      font: inherit;
      color: inherit;
      background: transparent;
      border: 1px solid var(--hb-color-outline-variant);
      border-radius: 4px;
    }
  `;

  override render() {
    if (locales.length < 2) return nothing;

    const current = getLocale();
    return html`
      <select
        aria-label="${msg('Language', { id: 'footer.locale-picker.label' })}"
        @change="${this.onChange}"
      >
        ${locales.map(
          (locale) =>
            html`<option value="${locale}" ?selected="${locale === current}" lang="${locale}">
              ${languageName(locale)}
            </option>`,
        )}
      </select>
    `;
  }

  private readonly onChange = (event: Event) => {
    void setLocale((event.target as HTMLSelectElement).value);
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'locale-picker': LocalePicker;
  }
}
