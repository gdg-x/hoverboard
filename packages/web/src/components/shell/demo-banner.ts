import { msg } from '@lit/localize';
import { css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import {
  decorations as siteDecorations,
  density as siteDensity,
  siteAttendance,
  themeName as siteTheme,
} from '../../config/site';
import { segmented } from '../../styles/segmented';
import { THEMES } from '../../themes/index';
import {
  ATTENDANCES,
  type Attendance,
  chooseDecorations,
  chooseDemo,
  chooseDemoAttendance,
  readDemoAttendance,
  readDemoChoices,
} from '../../utils/demo';
import '../footer/color-scheme-toggle';
import '../shared/hoverboard-icon';
import { ThemedComponent } from '../themed-component';
import type { HbSwitch } from '../ui/hb-switch';
import '../ui/hb-switch';

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
export class DemoBanner extends ThemedComponent {
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

  // The site's own choices on the server and in the first render, so hydration matches.
  @state()
  private accessor theme: string = siteTheme;

  @state()
  private accessor density: Density = siteDensity;

  @state()
  private accessor decorations: boolean = siteDecorations;

  @state()
  private accessor attendance: Attendance = siteAttendance;

  override firstUpdated() {
    const stored = readDemoChoices(storage);
    if (stored.theme && stored.theme in THEMES) this.theme = stored.theme;
    if (stored.density && (DENSITIES as readonly string[]).includes(stored.density)) {
      this.density = stored.density as Density;
    }
    if (stored.decorations === 'on' || stored.decorations === 'off') {
      this.decorations = stored.decorations === 'on';
    }
    this.attendance = readDemoAttendance() ?? siteAttendance;
  }

  // Properties, not bindings: Lit SSR writes `.checked` as a `checked` attribute even when false.
  override updated() {
    for (const input of this.renderRoot.querySelectorAll<HTMLInputElement>(
      'input[name="density"]',
    )) {
      input.checked = input.value === this.density;
    }
    const theme = this.renderRoot.querySelector<HTMLSelectElement>('select.theme');
    if (theme) theme.value = this.theme;
    const attendance = this.renderRoot.querySelector<HTMLSelectElement>('select.attendance');
    if (attendance) attendance.value = this.attendance;
  }

  override render() {
    const labels: Record<Density, string> = {
      compact: msg('Compact', { id: 'shell.demo.density.compact' }),
      default: msg('Default', { id: 'shell.demo.density.default' }),
      roomy: msg('Roomy', { id: 'shell.demo.density.roomy' }),
    };
    const attendanceLabels: Record<Attendance, string> = {
      inPerson: msg('In person', { id: 'shell.demo.attendance.in-person' }),
      hybrid: msg('Hybrid', { id: 'shell.demo.attendance.hybrid' }),
      online: msg('Online', { id: 'event.online' }),
    };
    return html`
      <aside class="inner" aria-label="${msg('Demo', { id: 'shell.demo.label' })}">
        <p class="intro">${msg('DEMO', { id: 'shell.demo.badge' })}</p>
        <div class="controls">
          <label>
            <span class="visually-hidden">${msg('Theme', { id: 'shell.demo.theme' })}</span>
            <select class="theme" @change="${this.onTheme}">
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
          <hb-switch
            label="${msg('Decorations', { id: 'shell.demo.decorations' })}"
            ?checked="${this.decorations}"
            @change="${this.onDecorations}"
          >
            <hoverboard-icon name="party"></hoverboard-icon>
          </hb-switch>
          <label>
            <span class="visually-hidden">
              ${msg('How people attend', { id: 'shell.demo.attendance' })}
            </span>
            <select class="attendance" @change="${this.onAttendance}">
              ${ATTENDANCES.map(
                (value) =>
                  html`<option value="${value}" ?selected="${value === this.attendance}">
                    ${attendanceLabels[value]}
                  </option>`,
              )}
            </select>
          </label>
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

  private readonly onDecorations = (event: Event) => {
    this.decorations = (event.target as HbSwitch).checked;
    chooseDecorations(this.decorations, siteDecorations);
  };

  private readonly onAttendance = (event: Event) => {
    const value = (event.target as HTMLSelectElement).value as Attendance;
    chooseDemoAttendance(value === siteAttendance ? null : value);
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'demo-banner': DemoBanner;
  }
}
