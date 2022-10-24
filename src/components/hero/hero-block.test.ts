import { beforeEach, describe, it } from '@jest/globals';
import { screen } from '@testing-library/dom';
import { mocked } from 'jest-mock';
import { html } from 'lit';
import { fixture } from '../../../__tests__/helpers/fixtures';
import { setHeroSettings } from '../../store/ui/actions';
import './hero-block';
import { HeroBlock } from './hero-block';

jest.mock('../../store/ui/actions');

const mockSetHeroSettings = mocked(setHeroSettings);

describe('hero-block', () => {
  beforeEach(() => {
    mockSetHeroSettings.mockClear();
  });

  it('should be registered', () => {
    expect(customElements.get('hero-block')).toBeDefined();
  });

  it('has default values', async () => {
    const { element, shadowRoot } = await fixture<HeroBlock>(html`<hero-block></hero-block>`);
    expect(element.backgroundImage).toBe('');
    expect(element.backgroundColor).toBe('#fff');
    expect(element.fontColor).toBe('#000');
    expect(element.hideLogo).toBe(false);
    expect(shadowRoot.querySelector<HTMLDivElement>('.hero-overlay')).not.toHaveAttribute('show');
    expect(shadowRoot.querySelector<HTMLDivElement>('.hero-image')).toBeNull();
  });

  it('accepts values', async () => {
    const { element, shadowRoot } = await fixture<HeroBlock>(
      html`
        <hero-block
          background-image="/example.jpg"
          background-color="#000"
          font-color="#fff"
          hide-logo
        ></hero-block>
      `
    );
    expect(element.backgroundImage).toBe('/example.jpg');
    expect(element.backgroundColor).toBe('#000');
    expect(element.fontColor).toBe('#fff');
    expect(element.hideLogo).toBe(true);
    expect(shadowRoot.querySelector<HTMLDivElement>('.hero-overlay')).toHaveAttribute('show');
    expect(shadowRoot.querySelector<HTMLDivElement>('.hero-image')).not.toBeNull();
  });

  it('displays slot elements', async () => {
    const { shadowRoot } = await fixture<HeroBlock>(
      html`
        <hero-block>
          <p>default slot</p>
          <p slot="bottom">bottom slot</p>
        </hero-block>
      `
    );
    const slots = shadowRoot.querySelectorAll('slot');
    expect(slots).toHaveLength(2);
    expect(screen.getByText('default slot')).toBeVisible();
    expect(slots[0]).not.toHaveAttribute('name');
    expect(slots[0]!.assignedElements()[0]).toHaveTextContent('default slot');
    expect(screen.getByText('bottom slot')).toBeVisible();
    expect(slots[1]).toHaveAttribute('name', 'bottom');
    expect(slots[1]!.assignedElements()[0]).toHaveTextContent('bottom slot');
  });

  it('renders an image', async () => {
    const { shadowRoot } = await fixture<HeroBlock>(
      html`<hero-block background-image="/example.jpg"></hero-block>`
    );
    expect(shadowRoot.querySelector('.hero-image')).toHaveAttribute('src', '/example.jpg');
  });

  it('setHeroSettings notifies', async () => {
    await fixture<HeroBlock>(html`<hero-block background-image="/example.jpg"></hero-block>`);
    expect(mockSetHeroSettings).toHaveBeenCalledTimes(1);
    expect(mockSetHeroSettings).toHaveBeenCalledWith({
      backgroundColor: '#fff',
      backgroundImage: '/example.jpg',
      fontColor: '#000',
      hideLogo: false,
    });
  });
});
