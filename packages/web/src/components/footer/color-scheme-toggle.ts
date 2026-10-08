import { msg } from '@lit/localize';
import { css, html, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { colorScheme } from '../../config/site';
import {
  applyColorScheme,
  type ChosenColorScheme,
  COLOR_SCHEME_KEY,
  readColorScheme,
} from '../../utils/color-scheme';
import '../shared/hoverboard-icon';
import { ThemedElement } from '../themed-element';

type Choice = ChosenColorScheme | 'system';

const storage = () => localStorage;

/** System, Light or Dark, for this browser. Hidden when the site locks a color scheme. */
@customElement('color-scheme-toggle')
export class ColorSchemeToggle extends ThemedElement {
  static override styles = css`
    fieldset {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--hb-space-2) var(--hb-space-3);
      margin: 0;
      padding: 0;
      border: 0;
    }

    legend {
      float: left;
      padding: 0;
      font-weight: 600;
    }

    .options {
      display: inline-flex;
      padding: 2px;
      border: var(--hb-border-width) solid currentColor;
      border-radius: var(--hb-radius-full);
    }

    label {
      position: relative;
      display: inline-flex;
      align-items: center;
      gap: var(--hb-space-1);
      min-block-size: var(--hb-target-min);
      padding-inline: var(--hb-space-3);
      border-radius: var(--hb-radius-full);
      cursor: pointer;
    }

    label:hover {
      background-color: color-mix(in srgb, currentColor 8%, transparent);
    }

    label:has(input:checked) {
      background-color: currentColor;
    }

    label:has(input:checked) span,
    label:has(input:checked) hoverboard-icon {
      /* The selected option's text takes the band's background color. */
      color: var(--hb-footer-background, var(--hb-color-surface));
    }

    label:has(input:focus-visible) {
      outline: 3px solid var(--hb-color-focus);
      outline-offset: 2px;
    }

    input {
      position: absolute;
      inset: 0;
      margin: 0;
      opacity: 0;
      cursor: inherit;
    }

    hoverboard-icon {
      inline-size: 18px;
      block-size: 18px;
    }

    @media (forced-colors: active) {
      label:has(input:checked) {
        background-color: Highlight;
      }

      label:has(input:checked) span,
      label:has(input:checked) hoverboard-icon {
        color: HighlightText;
      }
    }
  `;

  // System on the server and in the first render, so hydration matches. The stored choice follows.
  @state()
  private accessor choice: Choice = 'system';

  override firstUpdated() {
    this.choice = readColorScheme(storage) ?? 'system';
  }

  // A property, not a binding: Lit SSR writes `.checked` as a `checked` attribute even when false.
  override updated() {
    for (const input of this.renderRoot.querySelectorAll('input')) {
      input.checked = input.value === this.choice;
    }
  }

  override render() {
    if (colorScheme !== 'system') return nothing;

    const options: { value: Choice; icon: string; label: string }[] = [
      {
        value: 'system',
        icon: 'monitor',
        label: msg('System', { id: 'footer.color-scheme.system' }),
      },
      { value: 'light', icon: 'sun', label: msg('Light', { id: 'footer.color-scheme.light' }) },
      { value: 'dark', icon: 'moon', label: msg('Dark', { id: 'footer.color-scheme.dark' }) },
    ];
    return html`
      <fieldset>
        <legend>
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
                <span>${label}</span>
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
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'color-scheme-toggle': ColorSchemeToggle;
  }
}
