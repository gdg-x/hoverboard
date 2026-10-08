import { html, render } from 'lit';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { LocalePicker } from './locale-picker';
import './locale-picker';

const localization = vi.hoisted(() => ({
  locales: ['en'],
  getLocale: vi.fn(() => 'en'),
  setLocale: vi.fn(async () => undefined),
}));

vi.mock('../../utils/localization', () => localization);

const renderPicker = async () => {
  const container = document.body.appendChild(document.createElement('div'));
  render(html`<locale-picker></locale-picker>`, container);
  const picker = container.querySelector<LocalePicker>('locale-picker')!;
  await picker.updateComplete;
  return picker.shadowRoot!;
};

afterEach(() => {
  document.body.replaceChildren();
  localization.locales = ['en'];
  vi.clearAllMocks();
});

describe('locale-picker', () => {
  it('renders nothing while the site offers one locale', async () => {
    const shadowRoot = await renderPicker();

    expect(shadowRoot.querySelector('select')).toBeNull();
  });

  it('lists each locale in its own language and selects the current one', async () => {
    localization.locales = ['en', 'es'];
    localization.getLocale.mockReturnValue('es');

    const select = (await renderPicker()).querySelector('select')!;

    expect(select).toHaveAccessibleName('Language');
    expect([...select.options].map((option) => option.textContent?.trim())).toEqual([
      'English',
      'español',
    ]);
    expect(select.value).toBe('es');
  });

  it('switches to the chosen locale', async () => {
    localization.locales = ['en', 'es'];

    const select = (await renderPicker()).querySelector('select')!;
    select.value = 'es';
    select.dispatchEvent(new Event('change'));

    expect(localization.setLocale).toHaveBeenCalledWith('es');
  });
});
