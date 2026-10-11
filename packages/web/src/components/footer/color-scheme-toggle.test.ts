import { fireEvent } from '@testing-library/dom';
import { html, render as litRender, nothing } from 'lit';
import { deepQuerySelector, screen, within } from 'shadow-dom-testing-library';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fixture } from '../../../__tests__/helpers/fixtures';
import { COLOR_SCHEME_KEY } from '../../utils/color-scheme';
import type { ColorSchemeToggle } from './color-scheme-toggle';
import './color-scheme-toggle';

const site = vi.hoisted(() => ({ colorScheme: 'system' }));

vi.mock('../../config/site', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../config/site')>()),
  get colorScheme() {
    return site.colorScheme;
  },
}));

const render = async () => {
  const { element, shadowRootForWithin } = await fixture<ColorSchemeToggle>(
    html`<color-scheme-toggle></color-scheme-toggle>`,
  );
  await element.updateComplete;
  return { element, container: shadowRootForWithin };
};

describe('color-scheme-toggle', () => {
  afterEach(() => {
    litRender(nothing, document.body);
    localStorage.clear();
    document.documentElement.removeAttribute('data-color-scheme');
    site.colorScheme = 'system';
  });

  it('offers System, Light and Dark in an Appearance group, with System selected', async () => {
    const { container } = await render();

    expect(within(container).getByRole('group', { name: 'Appearance' })).toBeInTheDocument();
    expect(
      within(container)
        .getAllByRole('radio')
        .map((radio) => radio.getAttribute('value')),
    ).toEqual(['system', 'light', 'dark']);
    expect(within(container).getByRole('radio', { name: 'System' })).toBeChecked();
  });

  it('shows only icons when compact, with System in the middle, and keeps the names', async () => {
    const { element, container } = await render();
    element.compact = true;
    await element.updateComplete;

    expect(within(container).getByRole('group', { name: 'Appearance' })).toBeInTheDocument();
    expect(
      within(container)
        .getAllByRole('radio')
        .map((radio) => radio.getAttribute('value')),
    ).toEqual(['light', 'system', 'dark']);
    expect(within(container).getByText('System')).toHaveClass('visually-hidden');
    expect(within(container).getByText('Appearance')).toHaveClass('visually-hidden');
  });

  it('stores and applies a choice', async () => {
    const { container } = await render();

    fireEvent.click(within(container).getByRole('radio', { name: 'Dark' }));

    expect(localStorage.getItem(COLOR_SCHEME_KEY)).toBe('dark');
    expect(document.documentElement).toHaveAttribute('data-color-scheme', 'dark');
  });

  it('forgets the choice for System', async () => {
    localStorage.setItem(COLOR_SCHEME_KEY, 'light');
    const { container } = await render();

    fireEvent.click(within(container).getByRole('radio', { name: 'System' }));

    expect(localStorage.getItem(COLOR_SCHEME_KEY)).toBeNull();
    expect(document.documentElement).not.toHaveAttribute('data-color-scheme');
  });

  it('selects the stored choice after the first render', async () => {
    localStorage.setItem(COLOR_SCHEME_KEY, 'light');

    const { container } = await render();

    expect(within(container).getByRole('radio', { name: 'Light' })).toBeChecked();
  });

  it('is hidden when the site locks a color scheme', async () => {
    site.colorScheme = 'dark';
    litRender(html`<color-scheme-toggle></color-scheme-toggle>`, document.body);
    const element = deepQuerySelector<ColorSchemeToggle>(document.body, 'color-scheme-toggle')!;
    await element.updateComplete;

    expect(screen.queryByShadowRole('group')).not.toBeInTheDocument();
  });
});
