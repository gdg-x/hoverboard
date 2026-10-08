import { afterEach, describe, expect, it, vi } from 'vitest';
import { within } from '@testing-library/dom';
import { html, nothing, render as litRender } from 'lit';
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
    const { shadowRoot, shadowRootForWithin } = await fixture<NotFoundPage>(
      html`<not-found-page></not-found-page>`,
    );

    expect(shadowRoot.querySelector('simple-hero')).toHaveAttribute('page', 'notFound');
    expect(shadowRoot.querySelector('.art')).toHaveAttribute('alt', '');
    expect(
      within(shadowRootForWithin).getByText('This session was moved to another room.'),
    ).toBeInTheDocument();
    const links = [...shadowRoot.querySelectorAll('hb-button')].map((link) =>
      link.getAttribute('href'),
    );
    expect(links).toEqual(['/', '/schedule']);
  });

  it('has no schedule link when the schedule is off', async () => {
    setFeatures({ schedule: false });
    const { shadowRoot } = await fixture<NotFoundPage>(html`<not-found-page></not-found-page>`);

    expect(shadowRoot.querySelectorAll('hb-button')).toHaveLength(1);
  });

  it('updates page metadata', async () => {
    await fixture<NotFoundPage>(html`<not-found-page></not-found-page>`);

    expect(updateMetadata).toHaveBeenCalledWith('Not Found', 'Page not found');
  });
});
