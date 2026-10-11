import { afterEach, describe, expect, it, vi } from 'vitest';
import { html, nothing, render as litRender } from 'lit';
import { deepQuerySelector, deepQuerySelectorAll, screen } from 'shadow-dom-testing-library';
import { fixture } from '../../__tests__/helpers/fixtures';
import { setFeatures } from '../../__tests__/helpers/features';
import { updateMetadata } from '../utils/metadata';
import type { NotFoundPage } from './not-found-page';
import './not-found-page';

vi.mock('../utils/metadata');

describe('not-found-page', () => {
  afterEach(() => {
    litRender(nothing, document.body);
  });

  it('shows a drawing, the joke, and links home and to the schedule', async () => {
    const { shadowRoot } = await fixture<NotFoundPage>(html`<not-found-page></not-found-page>`);

    expect(deepQuerySelector(shadowRoot, 'simple-hero')).toHaveAttribute('page', 'notFound');
    expect(deepQuerySelector(shadowRoot, '.illustration.art')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
    expect(deepQuerySelector(shadowRoot, '.illustration.art svg')).toBeInTheDocument();
    expect(screen.getByShadowText('This session was moved to another room.')).toBeInTheDocument();
    const links = deepQuerySelectorAll(shadowRoot, 'hb-button').map((link) =>
      link.getAttribute('href'),
    );
    expect(links).toEqual(['/', '/schedule']);
  });

  it('has no schedule link when the schedule is off', async () => {
    setFeatures({ schedule: false });
    const { shadowRoot } = await fixture<NotFoundPage>(html`<not-found-page></not-found-page>`);

    expect(deepQuerySelectorAll(shadowRoot, 'hb-button')).toHaveLength(1);
  });

  it('updates page metadata', async () => {
    await fixture<NotFoundPage>(html`<not-found-page></not-found-page>`);

    expect(updateMetadata).toHaveBeenCalledWith('Not Found', 'Page not found');
  });
});
