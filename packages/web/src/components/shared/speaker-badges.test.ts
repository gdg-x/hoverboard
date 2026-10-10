import { afterEach, describe, expect, it } from 'vitest';
import { within } from '@testing-library/dom';
import { html, nothing, render as litRender } from 'lit';
import { fixture } from '../../../__tests__/helpers/fixtures';
import type { SpeakerBadges } from './speaker-badges';
import './speaker-badges';

const badges = [
  { description: 'Google Developer Expert', link: 'https://gde.example', name: 'gde' },
  { description: 'Women Techmakers', link: 'https://wtm.example', name: 'wtm' },
];

describe('speaker-badges', () => {
  afterEach(() => {
    litRender(nothing, document.body);
  });

  it('links each badge as a chip in its color, in a named list', async () => {
    const { element, shadowRoot, shadowRootForWithin } = await fixture<SpeakerBadges>(
      html`<speaker-badges></speaker-badges>`,
    );
    element.badges = badges;
    await element.updateComplete;

    const list = within(shadowRootForWithin).getByRole('list', { name: 'Badges' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(2);
    const chip = shadowRoot.querySelector<HTMLElement>('hb-chip')!;
    expect(chip).toHaveTextContent('Google Developer Expert');
    expect(chip).toHaveAttribute('href', 'https://gde.example');
    expect(chip.style.getPropertyValue('--hb-chip-color')).toContain('--hb-on-tag-gde');
  });

  it('renders no list without badges', async () => {
    const element = document.createElement('speaker-badges');
    document.body.append(element);
    await element.updateComplete;

    expect(element.shadowRoot?.querySelector('ul')).toBeNull();
    element.remove();
  });
});
