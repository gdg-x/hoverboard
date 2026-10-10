import { within } from '@testing-library/dom';
import { html, nothing, render as litRender } from 'lit';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fixture } from '../../__tests__/helpers/fixtures';
import { setFeatures } from '../../__tests__/helpers/features';
import { updateMetadata } from '../utils/metadata';
import type { OfflinePage } from './offline-page';
import './offline-page';

vi.mock('../utils/metadata');

describe('offline-page', () => {
  afterEach(() => {
    litRender(nothing, document.body);
  });

  it('says what still works offline and links home', async () => {
    const { shadowRoot, shadowRootForWithin } = await fixture<OfflinePage>(
      html`<offline-page></offline-page>`,
    );
    const view = within(shadowRootForWithin);

    expect(view.getByText(/You are offline/)).toBeInTheDocument();
    expect(view.getByRole('heading', { level: 2 })).toHaveTextContent('What works offline');
    expect([...shadowRoot.querySelectorAll('li')].map((item) => item.textContent?.trim())).toEqual([
      'Pages you have visited before',
      'Your saved sessions, in My Schedule',
    ]);
    expect(shadowRoot.querySelector('hb-button')).toHaveAttribute('href', '/');
    expect(shadowRoot.querySelector('.illustration svg')).toBeInTheDocument();
    expect(shadowRoot.querySelector('.illustration')).toHaveAttribute('aria-hidden', 'true');
  });

  it('leaves out saved sessions when My Schedule is off', async () => {
    setFeatures({ mySchedule: false });
    const { shadowRoot } = await fixture<OfflinePage>(html`<offline-page></offline-page>`);

    expect(shadowRoot.querySelectorAll('li')).toHaveLength(1);
  });

  it('sets the offline title and description', async () => {
    await fixture<OfflinePage>(html`<offline-page></offline-page>`);

    expect(updateMetadata).toHaveBeenCalledWith('Offline', 'This page is not available offline');
  });
});
