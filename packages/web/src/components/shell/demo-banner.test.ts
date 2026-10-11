import { fireEvent } from '@testing-library/dom';
import { html, render as litRender, nothing } from 'lit';
import {
  deepQuerySelector,
  deepQuerySelectorAll,
  screen,
  within,
} from 'shadow-dom-testing-library';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fixture } from '../../../__tests__/helpers/fixtures';
import { decorations, density, siteAttendance, themeName } from '../../config/site';
import { COLOR_SCHEME_KEY } from '../../utils/color-scheme';
import {
  chooseDemoAttendance,
  chooseDemoTime,
  DEMO_ATTENDANCE_KEY,
  DEMO_DECORATIONS_KEY,
  DEMO_DENSITY_KEY,
  DEMO_THEME_KEY,
  DEMO_TIME_KEY,
} from '../../utils/demo';
import type { ColorSchemeToggle } from '../footer/color-scheme-toggle';
import type { DemoBanner } from './demo-banner';
import './demo-banner';

// It reloads the page, which jsdom can't.
vi.mock('../../utils/demo', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../utils/demo')>()),
  chooseDemoAttendance: vi.fn(),
  chooseDemoTime: vi.fn(),
}));

const root = document.documentElement;

const render = async () => {
  const { element, shadowRoot, shadowRootForWithin } = await fixture<DemoBanner>(
    html`<demo-banner></demo-banner>`,
  );
  await element.updateComplete;
  return { element, shadowRoot, container: shadowRootForWithin };
};

describe('demo-banner', () => {
  afterEach(() => {
    litRender(nothing, document.body);
    localStorage.clear();
    for (const name of ['data-theme', 'data-density', 'data-color-scheme', 'data-decorations']) {
      root.removeAttribute(name);
    }
  });

  it("starts from the site's theme", async () => {
    const { container } = await render();

    expect(within(container).getByRole('complementary', { name: 'Demo' })).toBeInTheDocument();
    expect(within(container).getByText('DEMO')).toBeInTheDocument();
    expect(within(container).getByText('Theme')).toHaveClass('visually-hidden');
    expect(within(container).getByRole('combobox', { name: 'Theme' })).toHaveValue(themeName);
    expect(
      within(within(container).getByRole('combobox', { name: 'Theme' }))
        .getAllByRole('option')
        .map((option) => (option as HTMLOptionElement).value),
    ).toEqual(['festival', 'spotlight', 'paper', 'glass']);
  });

  it("starts from the site's spacing, with the brightness toggle", async () => {
    const { shadowRoot, container } = await render();

    expect(within(container).getByText('Spacing')).toHaveClass('visually-hidden');
    const spacing = within(container).getByRole('group', { name: 'Spacing' });
    expect(
      within(spacing)
        .getAllByRole('radio')
        .map((radio) => radio.getAttribute('value')),
    ).toEqual(['compact', 'default', 'roomy']);
    expect(within(spacing).getByRole('radio', { checked: true })).toHaveAttribute('value', density);
    expect(
      // Only the spacing icons, not those of the nested brightness toggle.
      deepQuerySelectorAll(shadowRoot, '.controls > fieldset hoverboard-icon').map((icon) =>
        icon.getAttribute('name'),
      ),
    ).toEqual(['density-small', 'density-medium', 'density-large']);
    expect(within(container).getByText('Compact')).toHaveClass('visually-hidden');
    expect(deepQuerySelector(shadowRoot, 'color-scheme-toggle')).toHaveAttribute('compact');
  });

  it('switches the theme, and forgets the choice for the site theme', async () => {
    const { container } = await render();
    const select = within(container).getByRole('combobox', { name: 'Theme' });
    const other = themeName === 'festival' ? 'spotlight' : 'festival';

    fireEvent.change(select, { target: { value: other } });
    expect(root).toHaveAttribute('data-theme', other);
    expect(localStorage.getItem(DEMO_THEME_KEY)).toBe(other);

    fireEvent.change(select, { target: { value: themeName } });
    expect(root).not.toHaveAttribute('data-theme');
    expect(localStorage.getItem(DEMO_THEME_KEY)).toBeNull();
  });

  it('switches the spacing', async () => {
    const { container } = await render();

    fireEvent.click(within(container).getByRole('radio', { name: 'Roomy' }));

    expect(root).toHaveAttribute('data-density', 'roomy');
    expect(localStorage.getItem(DEMO_DENSITY_KEY)).toBe('roomy');
  });

  it('switches the decorations', async () => {
    await render();
    const input = await screen.findByShadowRole('switch', { name: 'Decorations' });
    expect(input).toBeChecked();
    expect(decorations).toBe(true);

    fireEvent.click(input);

    expect(root).toHaveAttribute('data-decorations', 'off');
    expect(localStorage.getItem(DEMO_DECORATIONS_KEY)).toBe('off');
  });

  it('shows the stored choices after the first render, and ignores unknown ones', async () => {
    localStorage.setItem(DEMO_THEME_KEY, 'spotlight');
    localStorage.setItem(DEMO_DENSITY_KEY, 'huge');
    const { element, container } = await render();
    await element.updateComplete;

    expect(within(container).getByRole('combobox', { name: 'Theme' })).toHaveValue('spotlight');
    expect(within(container).getByRole('radio', { name: 'Default' })).toBeChecked();
  });

  it("offers in person, hybrid and online, starting from the site's", async () => {
    const { container } = await render();
    const select = within(container).getByRole('combobox', { name: 'How people attend' });

    expect(select).toHaveValue(siteAttendance);
    expect(
      within(select)
        .getAllByRole('option')
        .map((option) => option.textContent?.trim()),
    ).toEqual(['In person', 'Hybrid', 'Online']);
  });

  it('switches how people attend, and forgets the choice for the site', async () => {
    const { container } = await render();
    const select = within(container).getByRole('combobox', { name: 'How people attend' });
    const other = siteAttendance === 'online' ? 'inPerson' : 'online';

    fireEvent.change(select, { target: { value: other } });
    expect(chooseDemoAttendance).toHaveBeenLastCalledWith(other);

    fireEvent.change(select, { target: { value: siteAttendance } });
    expect(chooseDemoAttendance).toHaveBeenLastCalledWith(null);
  });

  it('shows the stored attendance after the first render', async () => {
    localStorage.setItem(DEMO_ATTENDANCE_KEY, 'hybrid');
    const { element, container } = await render();
    await element.updateComplete;

    expect(within(container).getByRole('combobox', { name: 'How people attend' })).toHaveValue(
      'hybrid',
    );
  });

  it('makes it before, during or after the event, or now again', async () => {
    const { container } = await render();
    const select = within(container).getByRole('combobox', { name: 'When' });

    expect(select).toHaveValue('now');
    expect(
      within(select)
        .getAllByRole('option')
        .map((option) => option.textContent?.trim()),
    ).toEqual(['Now', 'Before the event', 'During the event', 'After the event']);

    fireEvent.change(select, { target: { value: 'during' } });
    expect(chooseDemoTime).toHaveBeenLastCalledWith('during');

    fireEvent.change(select, { target: { value: 'now' } });
    expect(chooseDemoTime).toHaveBeenLastCalledWith(null);
  });

  it('shows the stored time after the first render', async () => {
    localStorage.setItem(DEMO_TIME_KEY, 'after');
    const { element, container } = await render();
    await element.updateComplete;

    expect(within(container).getByRole('combobox', { name: 'When' })).toHaveValue('after');
  });

  it('keeps its brightness toggle in sync with the one in the footer', async () => {
    const { shadowRoot } = await render();
    const footer = document.createElement('color-scheme-toggle');
    document.body.append(footer);
    await footer.updateComplete;

    fireEvent.click(
      within(footer.shadowRoot as unknown as HTMLElement).getByRole('radio', { name: 'Dark' }),
    );
    const banner = deepQuerySelector<ColorSchemeToggle>(shadowRoot, 'color-scheme-toggle')!;
    await banner.updateComplete;

    expect(localStorage.getItem(COLOR_SCHEME_KEY)).toBe('dark');
    expect(
      within(banner.shadowRoot as unknown as HTMLElement).getByRole('radio', { name: 'Dark' }),
    ).toBeChecked();
    footer.remove();
  });
});
