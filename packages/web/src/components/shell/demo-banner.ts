import { msg } from '@lit/localize';
import { css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { density as siteDensity, themeName as siteTheme } from '../../config/site';
import { segmented } from '../../styles/segmented';
import { THEMES } from '../../themes/index';
import { chooseDemo, readDemoChoices } from '../../utils/demo';
import '../footer/color-scheme-toggle';
import '../shared/hoverboard-icon';
import { ThemedElement } from '../themed-element';

type Density = typeof siteDensity;

const DENSITIES: readonly Density[] = ['compact', 'default', 'roomy'];
const DENSITY_ICONS: Record<Density, string> = {
  compact: 'density-small',
  default: 'density-medium',
  roomy: 'density-large',
};
const storage = () => localStorage;

/**
 * A band across the top of a demo site, where visitors try the built-in themes, the spacing and
 * light or dark. The choices stay in this browser.
 */
@customElement('demo-banner')
export class DemoBanner extends ThemedElement {
  static override styles = [
    segmented,
    css`
      :host {
        container-type: inline-size;
        background-color: var(--hb-color-ink);
        color: var(--hb-color-surface);
      }

      .inner {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--hb-space-3) var(--hb-space-6);
        max-inline-size: var(--hb-content-max);
        margin-inline: auto;
        padding: var(--hb-space-2) var(--hb-gutter);
      }

      .intro {
        margin: 0;
        font: 800 var(--hb-text-lg) / 1 var(--hb-font-display);
        letter-spacing: 0.04em;
      }

      select:focus-visible {
        outline: 3px solid var(--hb-color-focus);
        outline-offset: 2px;
      }

      .controls {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--hb-space-3) var(--hb-space-5);
      }

      select {
        min-block-size: var(--hb-target-min);
        padding-inline: var(--hb-space-3);
        border: var(--hb-border-width) solid currentColor;
        border-radius: var(--hb-radius-full);
        background-color: transparent;
        color: inherit;
        font: inherit;
      }

      option {
        background-color: var(--hb-color-ink);
        color: var(--hb-color-surface);
      }

      fieldset,
      color-scheme-toggle {
        --hb-segmented-selected-color: var(--hb-color-ink);
      }
    `,
  ];

  // The site's own theme and spacing on the server and in the first render, so hydration matches.
  @state()
  private accessor theme: string = siteTheme;

  @state()
  private accessor density: Density = siteDensity;

  override firstUpdated() {
    const stored = readDemoChoices(storage);
    if (stored.theme && stored.theme in THEMES) this.theme = stored.theme;
    if (stored.density && (DENSITIES as readonly string[]).includes(stored.density)) {
      this.density = stored.density as Density;
    }
  }

  // Properties, not bindings: Lit SSR writes `.checked` as a `checked` attribute even when false.
  override updated() {
    for (const input of this.renderRoot.querySelectorAll<HTMLInputElement>(
      'input[name="density"]',
    )) {
      input.checked = input.value === this.density;
    }
    const select = this.renderRoot.querySelector('select');
    if (select) select.value = this.theme;
  }

  override render() {
    const labels: Record<Density, string> = {
      compact: msg('Compact', { id: 'shell.demo.density.compact' }),
      default: msg('Default', { id: 'shell.demo.density.default' }),
      roomy: msg('Roomy', { id: 'shell.demo.density.roomy' }),
    };
    return html`
      <aside class="inner" aria-label="${msg('Demo', { id: 'shell.demo.label' })}">
        <p class="intro">${msg('DEMO', { id: 'shell.demo.badge' })}</p>
        <div class="controls">
          <label>
            <span class="visually-hidden">${msg('Theme', { id: 'shell.demo.theme' })}</span>
            <select @change="${this.onTheme}">
              ${Object.keys(THEMES).map(
                (name) =>
                  html`<option value="${name}" ?selected="${name === this.theme}">
                    ${name.charAt(0).toUpperCase() + name.slice(1)}
                  </option>`,
              )}
            </select>
          </label>
          <fieldset>
            <legend class="visually-hidden">${msg('Spacing', { id: 'shell.demo.density' })}</legend>
            <div class="options">
              ${DENSITIES.map(
                (value) => html`
                  <label>
                    <input
                      type="radio"
                      name="density"
                      value="${value}"
                      ?checked="${value === this.density}"
                      @change="${this.onDensity}"
                    />
                    <hoverboard-icon name="${DENSITY_ICONS[value]}"></hoverboard-icon>
                    <span class="visually-hidden">${labels[value]}</span>
                  </label>
                `,
              )}
            </div>
          </fieldset>
          <color-scheme-toggle compact></color-scheme-toggle>
        </div>
      </aside>
    `;
  }

  private readonly onTheme = (event: Event) => {
    this.theme = (event.target as HTMLSelectElement).value;
    chooseDemo('theme', this.theme === siteTheme ? null : this.theme);
  };

  private readonly onDensity = (event: Event) => {
    this.density = (event.target as HTMLInputElement).value as Density;
    chooseDemo('density', this.density === siteDensity ? null : this.density);
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'demo-banner': DemoBanner;
  }
}
