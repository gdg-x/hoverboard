import { css, html, isServer, type PropertyValues, type SVGTemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ThemedComponent } from '../themed-component';
import cloudOff from './icons/cloud-off';
import cloudUpload from './icons/cloud-upload';

// Lit replacement for the retired `<iron-icon icon="hoverboard:name">` Polymer iconset.
// Each icon is its own module under ./icons so only the icons a page uses are loaded.
const ICONS: Record<string, () => Promise<{ default: SVGTemplateResult }>> = {
  facebook: () => import('./icons/facebook'),
  github: () => import('./icons/github'),
  linkedin: () => import('./icons/linkedin'),
  gde: () => import('./icons/gde'),
  gdg: () => import('./icons/gdg'),
  wtm: () => import('./icons/wtm'),
  google: () => import('./icons/google'),
  instagram: () => import('./icons/instagram'),
  meetup: () => import('./icons/meetup'),
  twitter: () => import('./icons/twitter'),
  youtube: () => import('./icons/youtube'),
  website: () => import('./icons/website'),
  'arrow-right-circle': () => import('./icons/arrow-right-circle'),
  up: () => import('./icons/up'),
  checked: () => import('./icons/checked'),
  'bookmark-check': () => import('./icons/bookmark-check'),
  'bookmark-plus': () => import('./icons/bookmark-plus'),
  'insert-comment': () => import('./icons/insert-comment'),
  'add-circle-outline': () => import('./icons/add-circle-outline'),
  'chevron-left': () => import('./icons/chevron-left'),
  'chevron-right': () => import('./icons/chevron-right'),
  play: () => import('./icons/play'),
  video: () => import('./icons/video'),
  presentation: () => import('./icons/presentation'),
  movie: () => import('./icons/movie'),
  ticket: () => import('./icons/ticket'),
  directions: () => import('./icons/directions'),
  close: () => import('./icons/close'),
  'filter-list': () => import('./icons/filter-list'),
  menu: () => import('./icons/menu'),
  account: () => import('./icons/account'),
  bell: () => import('./icons/bell'),
  'arrow-left': () => import('./icons/arrow-left'),
  calendar: () => import('./icons/calendar'),
  share: () => import('./icons/share'),
  'coffee-break': () => import('./icons/coffee-break'),
  lunch: () => import('./icons/lunch'),
  location: () => import('./icons/location'),
  opening: () => import('./icons/opening'),
  party: () => import('./icons/party'),
  people: () => import('./icons/people'),
  registration: () => import('./icons/registration'),
  'bell-off': () => import('./icons/bell-off'),
  'bell-outline': () => import('./icons/bell-outline'),
  monitor: () => import('./icons/monitor'),
  sun: () => import('./icons/sun'),
  moon: () => import('./icons/moon'),
  'density-small': () => import('./icons/density-small'),
  'density-medium': () => import('./icons/density-medium'),
  'density-large': () => import('./icons/density-large'),
};

// The icons that show offline are bundled, since their chunks might not be cached.
const loaded = new Map<string, SVGTemplateResult>([
  ['cloud-off', cloudOff],
  ['cloud-upload', cloudUpload],
]);

@customElement('hoverboard-icon')
export class HoverboardIcon extends ThemedComponent {
  static override styles = css`
    :host {
      display: inline-flex;
      width: 24px;
      height: 24px;
    }

    svg {
      width: 100%;
      height: 100%;
      fill: currentcolor;
    }
  `;

  @property()
  accessor name = '';

  @state()
  private accessor icon: SVGTemplateResult | undefined;

  private loading: Promise<void> | undefined;

  protected override willUpdate(changedProperties: PropertyValues<this>) {
    // The first render is always empty, as on the server, so hydration matches. The icon follows.
    if (changedProperties.has('name') && !isServer) {
      this.icon = undefined;
      this.loadIcon(this.name);
    }
  }

  // Resolves once the requested icon has rendered, so callers awaiting `updateComplete` see the svg.
  protected override async getUpdateComplete() {
    let result = await super.getUpdateComplete();
    while (this.loading) {
      await this.loading;
      result = await super.getUpdateComplete();
    }
    return result;
  }

  private loadIcon(name: string) {
    const cached = loaded.get(name);
    const load = ICONS[name];
    if (!cached && !load) {
      return;
    }
    const loading = (cached ? Promise.resolve({ default: cached }) : load!())
      .then((module) => {
        loaded.set(name, module.default);
        if (this.name === name) {
          this.icon = module.default;
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (this.loading === loading) {
          this.loading = undefined;
        }
      });
    this.loading = loading;
  }

  override render() {
    if (!this.icon) {
      return html``;
    }

    return html`<svg viewBox="0 0 24 24">${this.icon}</svg>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hoverboard-icon': HoverboardIcon;
  }
}
