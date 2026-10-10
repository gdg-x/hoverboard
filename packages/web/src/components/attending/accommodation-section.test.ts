import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { html, nothing, render as litRender } from 'lit';
import { fixture } from '../../../__tests__/helpers/fixtures';
import { store } from '../../store';
import type { AccommodationSection } from './accommodation-section';
import './accommodation-section';

interface Hotel {
  name: string;
  address?: string;
  note?: string;
  code?: string;
  url?: string;
}

const config = vi.hoisted(() => ({
  accommodation: undefined as { text?: string; hotels?: Hotel[] } | undefined,
}));

vi.mock('../../config/site', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../config/site')>()),
  get attendingPage() {
    return { accommodation: config.accommodation };
  },
}));

const render = async () => {
  const result = await fixture<AccommodationSection>(html`
    <accommodation-section><h2 slot="heading">Accommodation</h2></accommodation-section>
  `);
  await result.element.updateComplete;
  return result;
};

const lastSnackbar = () => store.getState().snackbars.at(-1)?.label;
const writeText = vi.fn<(text: string) => Promise<void>>();

describe('accommodation-section', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
  });

  afterEach(() => {
    litRender(nothing, document.body);
    config.accommodation = undefined;
    writeText.mockReset();
  });

  it('renders nothing without text or hotels', async () => {
    const { shadowRoot } = await render();
    expect(shadowRoot.querySelector('slot')).toBeNull();
    litRender(nothing, document.body);

    config.accommodation = { hotels: [] };
    const empty = await render();
    expect(empty.shadowRoot.querySelector('slot')).toBeNull();
  });

  it('shows the text without hotels', async () => {
    config.accommodation = { text: 'Ask us about hotels.' };
    const { shadowRoot } = await render();

    expect(shadowRoot.querySelector('.text')).toHaveTextContent('Ask us about hotels.');
    expect(shadowRoot.querySelector('.hotels')).toBeNull();
  });

  it('shows each hotel with its address, note, discount code and a link to book', async () => {
    config.accommodation = {
      text: 'We have a discount.',
      hotels: [
        {
          name: 'Hotel Example',
          address: '1 Example St',
          note: 'From 90€ a night.',
          code: 'DEVFEST',
          url: 'https://hotel.example/book',
        },
        { name: 'Hostel Example' },
      ],
    };
    const { shadowRoot } = await render();

    const [hotel, hostel] = shadowRoot.querySelectorAll('.hotel');
    expect(hotel!.querySelector('h3')).toHaveTextContent('Hotel Example');
    expect(hotel!.querySelector('address')).toHaveTextContent('1 Example St');
    expect(hotel!.querySelector('.text')).toHaveTextContent('From 90€ a night.');
    expect(hotel!.querySelector('.code code')).toHaveTextContent('DEVFEST');
    expect(hotel!.querySelector('.book')).toHaveAttribute('href', 'https://hotel.example/book');
    expect(hostel!.querySelector('h3')).toHaveTextContent('Hostel Example');
    expect(hostel!.querySelector('address, .text, .code, .book')).toBeNull();
  });

  it('copies the discount code, and says when it cannot', async () => {
    config.accommodation = { hotels: [{ name: 'Hotel Example', code: 'DEVFEST' }] };
    const { shadowRoot } = await render();
    const copy = shadowRoot.querySelector('.code hb-icon-button')!;
    expect(copy).toHaveAttribute('label', 'Copy DEVFEST');

    writeText.mockResolvedValue();
    copy.dispatchEvent(new Event('click'));
    await vi.waitFor(() => expect(lastSnackbar()).toBe('Copied DEVFEST.'));
    expect(writeText).toHaveBeenCalledWith('DEVFEST');

    writeText.mockRejectedValue(new Error('Denied'));
    copy.dispatchEvent(new Event('click'));
    await vi.waitFor(() =>
      expect(lastSnackbar()).toBe('Could not copy the code. Select it to copy it.'),
    );
  });
});
