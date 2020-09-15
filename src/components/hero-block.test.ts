import { getByText } from '@testing-library/dom';
import { html } from 'lit-html';
import { mocked } from 'ts-jest/utils';
import { fixture } from '../../__tests__/helpers/fixtures';
import { uiActions } from '../redux/actions';
import './hero-block';
import { HeroBlock } from './hero-block';

jest.mock('../redux/actions');

const setHeroSettings = mocked(uiActions.setHeroSettings);

describe('hero-block', () => {
  beforeEach(() => {
    setHeroSettings.mockClear();
  });

  it('should be registered', () => {
    expect(customElements.get('hero-block')).toBeDefined();
  });

  it('has default values', async () => {
    const { element, shadowRoot } = await fixture<HeroBlock>(html`<hero-block></hero-block>`);
    expect(element.active).toStrictEqual(false);
    expect(element.backgroundImage).toStrictEqual('');
    expect(element.backgroundColor).toStrictEqual('#fff');
    expect(element.fontColor).toStrictEqual('#000');
    expect(element.hideLogo).toStrictEqual(false);
    expect(shadowRoot.querySelector<HTMLDivElement>('.hero-overlay')).not.toHaveAttribute('show');
    expect(shadowRoot.querySelector<HTMLDivElement>('.hero-image')).toBeNull();
  });

  it('accepts values', async () => {
    const { element, shadowRoot } = await fixture<HeroBlock>(
      html`
        <hero-block
          active
          background-image="/example.jpg"
          background-color="#000"
          font-color="#fff"
          hide-logo
        ></hero-block>
      `
    );
    expect(element.active).toStrictEqual(true);
    expect(element.backgroundImage).toStrictEqual('/example.jpg');
    expect(element.backgroundColor).toStrictEqual('#000');
    expect(element.fontColor).toStrictEqual('#fff');
    expect(element.hideLogo).toStrictEqual(true);
    expect(shadowRoot.querySelector<HTMLDivElement>('.hero-overlay')).toHaveAttribute('show');
    expect(shadowRoot.querySelector<HTMLDivElement>('.hero-image')).not.toBeNull();
  });

  it('displays slot elements', async () => {
    const { element, shadowRoot } = await fixture<HeroBlock>(
      html`
        <hero-block>
          <p>default slot</p>
          <p slot="bottom">bottom slot</p>
        </hero-block>
      `
    );
    const slots = shadowRoot.querySelectorAll('slot');
    expect(slots).toHaveLength(2);
    expect(getByText(element, 'default slot')).toBeVisible();
    expect(slots[0]).not.toHaveAttribute('name');
    expect(slots[0].assignedElements()[0]).toHaveTextContent('default slot');
    expect(getByText(element, 'bottom slot')).toBeVisible();
    expect(slots[1]).toHaveAttribute('name', 'bottom');
    expect(slots[1].assignedElements()[0]).toHaveTextContent('bottom slot');
  });

  it('renders an image', async () => {
    const { shadowRoot } = await fixture<HeroBlock>(
      html`<hero-block background-image="/example.jpg"></hero-block>`
    );
    expect(shadowRoot.querySelector('.hero-image')).toHaveAttribute('src', '/example.jpg');
  });

  describe('setHeroSettings', () => {
    it('notifies when active', async () => {
      await fixture<HeroBlock>(
        html`<hero-block active background-image="/example.jpg"></hero-block>`
      );
      expect(setHeroSettings).toHaveBeenCalledTimes(1);
      expect(setHeroSettings).toHaveBeenCalledWith({
        backgroundColor: '#fff',
        backgroundImage: '/example.jpg',
        fontColor: '#000',
        hideLogo: false,
      });
    });

    it('does not notify when inactive', async () => {
      await fixture<HeroBlock>(html`<hero-block background-image="/example.jpg"></hero-block>`);
      expect(setHeroSettings).not.toHaveBeenCalled();
    });
  });
});
