import { html, render } from 'lit';
import { beforeAll, describe, expect, inject, it, vi } from 'vitest';
import { queryAllDeep } from '../__tests__/helpers/dom';

// Pages subscribe to Firestore when they render. Without a backend they stay loading.
vi.mock('firebase/firestore', async (importOriginal) => ({
  ...(await importOriginal<typeof import('firebase/firestore')>()),
  onSnapshot: vi.fn(() => () => undefined),
  getDoc: vi.fn(() => new Promise(() => undefined)),
}));

const fakeLocale = inject('fakeLocale');

const picker = () =>
  queryAllDeep(document, 'locale-picker')[0]?.shadowRoot?.querySelector('select') ?? null;

describe(`the app with the fake ${fakeLocale} locale`, () => {
  beforeAll(async () => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    localStorage.setItem('hoverboard-locale', fakeLocale);
    await import('./hoverboard-app');
    render(html`<hoverboard-app></hoverboard-app>`, document.body);
    await vi.waitFor(() => expect(picker()).not.toBeNull(), { timeout: 10_000 });
  });

  it('starts in the stored locale', async () => {
    await vi.waitFor(() => expect(picker()).toHaveAttribute('aria-label', '[Language]'));
    expect(document.documentElement).toHaveAttribute('lang', fakeLocale);
    expect([...picker()!.options].map(({ value }) => value)).toEqual(['en', fakeLocale]);
    expect(picker()).toHaveValue(fakeLocale);
  });

  it('switches back to the source locale from the picker', async () => {
    const select = picker()!;
    select.value = 'en';
    select.dispatchEvent(new Event('change'));

    await vi.waitFor(() => expect(picker()).toHaveAttribute('aria-label', 'Language'));
    expect(document.documentElement).toHaveAttribute('lang', 'en');
    expect(localStorage.getItem('hoverboard-locale')).toBe('en');
  });
});
