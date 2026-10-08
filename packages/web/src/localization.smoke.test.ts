import { html, render } from 'lit';
import { beforeAll, describe, expect, inject, it, vi } from 'vitest';
import { resources } from 'virtual:hoverboard/site';
import { queryAllDeep } from '../__tests__/helpers/dom';
import { useLocale } from '../__tests__/helpers/locale';
import { getLocale } from './utils/localization';

// Pages subscribe to Firestore when they render. Without a backend they stay loading.
vi.mock('firebase/firestore', async (importOriginal) => ({
  ...(await importOriginal<typeof import('firebase/firestore')>()),
  onSnapshot: vi.fn(() => () => undefined),
  getDoc: vi.fn(() => new Promise(() => undefined)),
}));

const fakeLocale = inject('fakeLocale');

const picker = () =>
  queryAllDeep(document, 'locale-picker')[0]?.shadowRoot?.querySelector('select') ?? null;
const signInTab = () => queryAllDeep(document, '.signin-tab')[0];

describe(`the app with the fake ${fakeLocale} locale`, () => {
  beforeAll(async () => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    localStorage.setItem('hoverboard-locale', fakeLocale);
    await import('./components/shell/app-header');
    await import('./components/footer/footer-block');
    await import('./views/home-page');
    render(
      html`<app-header></app-header><home-page></home-page><footer-block></footer-block>`,
      document.body,
    );
    void (await import('./app')).startApp();
    await vi.waitFor(() => expect(picker()).not.toBeNull(), { timeout: 10_000 });
  });

  it('starts in the stored locale', async () => {
    await vi.waitFor(() => expect(picker()).toHaveAttribute('aria-label', '[Language]'));
    expect(document.documentElement).toHaveAttribute('lang', fakeLocale);
    expect([...picker()!.options].map(({ value }) => value)).toEqual(['en', fakeLocale]);
    expect(picker()).toHaveValue(fakeLocale);
    expect(signInTab()).toHaveTextContent('[Sign in]');
  });

  it('shows the event content translated for the locale', async () => {
    await vi.waitFor(() => expect(document.title).toBe(`[${resources.title}]`));
  });

  it('switches back to the source locale from the picker', async () => {
    const select = picker()!;
    select.value = 'en';
    select.dispatchEvent(new Event('change'));

    await vi.waitFor(() => expect(picker()).toHaveAttribute('aria-label', 'Language'));
    expect(document.documentElement).toHaveAttribute('lang', 'en');
    expect(localStorage.getItem('hoverboard-locale')).toBe('en');
    expect(signInTab()).toHaveTextContent(/^Sign in$/);
    expect(document.title).toBe(resources.title);
  });

  it('switches locale with the useLocale helper', async () => {
    await useLocale(fakeLocale);

    expect(getLocale()).toBe(fakeLocale);
    expect(document.documentElement).toHaveAttribute('lang', fakeLocale);
    await vi.waitFor(() => expect(signInTab()).toHaveTextContent('[Sign in]'));
    await expect(useLocale('xx')).rejects.toThrow('The site does not offer xx.');
  });

  it('hydrates the next page in the source locale, then switches back', async () => {
    await useLocale(fakeLocale);
    localStorage.setItem('hoverboard-locale', fakeLocale);
    const event = Object.assign(new Event('astro:before-preparation'), {
      loader: () => Promise.resolve(),
    });

    document.dispatchEvent(event);
    await event.loader();

    expect(getLocale()).toBe('en');
    await vi.waitFor(() => expect(signInTab()).toHaveTextContent(/^Sign in$/));

    document.dispatchEvent(new Event('astro:after-swap'));

    await vi.waitFor(() => expect(getLocale()).toBe(fakeLocale));
    await vi.waitFor(() => expect(signInTab()).toHaveTextContent('[Sign in]'));
  });
});
