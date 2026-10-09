import { msg } from '@lit/localize';
import { css, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { colorScheme } from '../../config/site';
import { segmented } from '../../styles/segmented';
import {
  applyColorScheme,
  type ChosenColorScheme,
  COLOR_SCHEME_EVENT,
  COLOR_SCHEME_KEY,
  readColorScheme,
} from '../../utils/color-scheme';
import '../shared/hoverboard-icon';
import { ThemedElement } from '../themed-element';

type Choice = ChosenColorScheme | 'system';

const storage = () => localStorage;

/**
 * System, Light or Dark, for this browser. Hidden when the site locks a color scheme. `compact`
 * shows only the icons, with System between Light and Dark.
 */
@customElement('color-scheme-toggle')
export class ColorSchemeToggle extends ThemedElement {
  static override styles = [
    segmented,
    css`
      :host {
        /* The selected option's text takes the band's background color. */
        --hb-segmented-selected-color: var(--hb-footer-background);
      }
    `,
  ];

  @property({ type: Boolean, reflect: true })
  accessor compact = false;

  // System on the server and in the first render, so hydration matches. The stored choice follows.
  @state()
  private accessor choice: Choice = 'system';

  override firstUpdated() {
    this.choice = readColorScheme(storage) ?? 'system';
  }

  // The footer and the demo banner can both have a toggle.
  override connectedCallback() {
    super.connectedCallback();
    window.addEventListener(COLOR_SCHEME_EVENT, this.onOtherChange);
  }

  override disconnectedCallback() {
    window.removeEventListener(COLOR_SCHEME_EVENT, this.onOtherChange);
    super.disconnectedCallback();
  }

  private readonly onOtherChange = () => {
    this.choice = readColorScheme(storage) ?? 'system';
  };

  // A property, not a binding: Lit SSR writes `.checked` as a `checked` attribute even when false.
  override updated() {
    for (const input of this.renderRoot.querySelectorAll('input')) {
      input.checked = input.value === this.choice;
    }
  }

  override render() {
    if (colorScheme !== 'system') return nothing;

    const system = {
      value: 'system' as const,
      icon: 'monitor',
      label: msg('System', { id: 'footer.color-scheme.system' }),
    };
    const light = {
      value: 'light' as const,
      icon: 'sun',
      label: msg('Light', { id: 'footer.color-scheme.light' }),
    };
    const dark = {
      value: 'dark' as const,
      icon: 'moon',
      label: msg('Dark', { id: 'footer.color-scheme.dark' }),
    };
    const options = this.compact ? [light, system, dark] : [system, light, dark];
    const text = this.compact ? 'visually-hidden' : '';
    return html`
      <fieldset>
        <legend class="${text}">
          ${msg('Appearance', {
            id: 'footer.color-scheme.legend',
            desc: 'Picks the light or dark colors, or follows the device.',
          })}
        </legend>
        <div class="options">
          ${options.map(
            ({ value, icon, label }) => html`
              <label>
                <input
                  type="radio"
                  name="color-scheme"
                  value="${value}"
                  ?checked="${this.choice === value}"
                  @change="${this.onChange}"
                />
                <hoverboard-icon name="${icon}"></hoverboard-icon>
                <span class="${text}">${label}</span>
              </label>
            `,
          )}
        </div>
      </fieldset>
    `;
  }

  private readonly onChange = (event: Event) => {
    const choice = (event.target as HTMLInputElement).value as Choice;
    this.choice = choice;
    const scheme = choice === 'system' ? null : choice;
    try {
      if (scheme) {
        localStorage.setItem(COLOR_SCHEME_KEY, scheme);
      } else {
        localStorage.removeItem(COLOR_SCHEME_KEY);
      }
    } catch {
      // Storage can be off. The choice still applies to this page.
    }
    applyColorScheme(document, scheme);
    window.dispatchEvent(new Event(COLOR_SCHEME_EVENT));
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'color-scheme-toggle': ColorSchemeToggle;
  }
}
