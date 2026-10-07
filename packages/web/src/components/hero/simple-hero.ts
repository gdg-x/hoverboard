import { html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { heroSettings } from '../../config/site';
import { ThemedElement } from '../themed-element';
import './hero-block';

type HeroKeys = keyof typeof heroSettings;
type SimpleHeroKeys = Extract<
  HeroKeys,
  'coc' | 'blog' | 'faq' | 'notFound' | 'previousSpeakers' | 'schedule' | 'speakers' | 'team'
>;

interface Description {
  description: string;
}

interface Title {
  title: string;
}

const hasDescription = (setting: Description | {}): setting is Description => {
  return 'description' in setting;
};

const hasTitle = (setting: Title | {}): setting is Title => {
  return 'title' in setting;
};

@customElement('simple-hero')
export class SimpleHero extends ThemedElement {
  @property()
  accessor page: SimpleHeroKeys = 'notFound';

  private renderDescription() {
    if (hasDescription(heroSettings[this.page])) {
      return html`<p class="hero-description">
        ${(heroSettings[this.page] as Description).description}
      </p>`;
    } else {
      return nothing;
    }
  }

  private renderTitle() {
    if (hasTitle(heroSettings[this.page])) {
      return html`<div class="hero-title">${(heroSettings[this.page] as Title).title}</div>`;
    } else {
      return nothing;
    }
  }

  override render() {
    return html`
      <hero-block>
        ${this.renderTitle()} ${this.renderDescription()}

        <slot></slot>
      </hero-block>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'simple-hero': SimpleHero;
  }
}
