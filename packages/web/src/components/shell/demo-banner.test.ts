import { fireEvent, within } from '@testing-library/dom';
import { html, render as litRender, nothing } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { fixture } from '../../../__tests__/helpers/fixtures';
import { density, themeName } from '../../config/site';
import { COLOR_SCHEME_KEY } from '../../utils/color-scheme';
import { DEMO_DENSITY_KEY, DEMO_THEME_KEY } from '../../utils/demo';
import type { DemoBanner } from './demo-banner';
import './demo-banner';

const root = document.documentElement;

const render = async () => {
  const { element, shadowRoot, shadowRootForWithin } = await fixture<DemoBanner>(
    html`<demo-banner></demo-banner>`,
  );
  await element.updateComplete;
  return { element, shadowRoot, view: within(shadowRootForWithin) };
};

describe('demo-banner', () => {
  afterEach(() => {
    litRender(nothing, document.body);
    localStorage.clear();
    for (const name of ['data-theme', 'data-density', 'data-color-scheme']) {
      root.removeAttribute(name);
    }
  });

  it("starts from the site's theme and spacing, with the brightness toggle", async () => {
    const { shadowRoot, view } = await render();

    expect(view.getByRole('complementary', { name: 'Demo' })).toBeInTheDocument();
    expect(view.getByText('DEMO')).toBeInTheDocument();
    expect(view.getByText('Theme')).toHaveClass('visually-hidden');
    expect(view.getByText('Spacing')).toHaveClass('visually-hidden');
    expect(view.getByRole('combobox', { name: 'Theme' })).toHaveValue(themeName);
    expect(
      view.getAllByRole('option').map((option) => (option as HTMLOptionElement).value),
    ).toEqual(['festival', 'spotlight']);
    const spacing = within(view.getByRole('group', { name: 'Spacing' }));
    expect(spacing.getAllByRole('radio').map((radio) => radio.getAttribute('value'))).toEqual([
      'compact',
      'default',
      'roomy',
    ]);
    expect(spacing.getByRole('radio', { checked: true })).toHaveAttribute('value', density);
    expect(
      [...shadowRoot.querySelectorAll('fieldset hoverboard-icon')].map((icon) =>
        icon.getAttribute('name'),
      ),
    ).toEqual(['density-small', 'density-medium', 'density-large']);
    expect(view.getByText('Compact')).toHaveClass('visually-hidden');
    expect(shadowRoot.querySelector('color-scheme-toggle')).toHaveAttribute('compact');
  });

  it('switches the theme, and forgets the choice for the site theme', async () => {
    const { view } = await render();
    const select = view.getByRole('combobox', { name: 'Theme' });
    const other = themeName === 'festival' ? 'spotlight' : 'festival';

    fireEvent.change(select, { target: { value: other } });
    expect(root).toHaveAttribute('data-theme', other);
    expect(localStorage.getItem(DEMO_THEME_KEY)).toBe(other);

    fireEvent.change(select, { target: { value: themeName } });
    expect(root).not.toHaveAttribute('data-theme');
    expect(localStorage.getItem(DEMO_THEME_KEY)).toBeNull();
  });

  it('switches the spacing', async () => {
    const { view } = await render();

    fireEvent.click(view.getByRole('radio', { name: 'Roomy' }));

    expect(root).toHaveAttribute('data-density', 'roomy');
    expect(localStorage.getItem(DEMO_DENSITY_KEY)).toBe('roomy');
  });

  it('shows the stored choices after the first render, and ignores unknown ones', async () => {
    localStorage.setItem(DEMO_THEME_KEY, 'spotlight');
    localStorage.setItem(DEMO_DENSITY_KEY, 'huge');
    const { element, view } = await render();
    await element.updateComplete;

    expect(view.getByRole('combobox', { name: 'Theme' })).toHaveValue('spotlight');
    expect(view.getByRole('radio', { name: 'Default' })).toBeChecked();
  });

  it('keeps its brightness toggle in sync with the one in the footer', async () => {
    const { shadowRoot } = await render();
    const footer = document.createElement('color-scheme-toggle');
    document.body.append(footer);
    await footer.updateComplete;

    fireEvent.click(
      within(footer.shadowRoot as unknown as HTMLElement).getByRole('radio', { name: 'Dark' }),
    );
    const banner = shadowRoot.querySelector('color-scheme-toggle')!;
    await banner.updateComplete;

    expect(localStorage.getItem(COLOR_SCHEME_KEY)).toBe('dark');
    expect(
      within(banner.shadowRoot as unknown as HTMLElement).getByRole('radio', { name: 'Dark' }),
    ).toBeChecked();
    footer.remove();
  });
});
