import { html, nothing, render as litRender } from 'lit';
import { deepQuerySelector, screen } from 'shadow-dom-testing-library';
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
    const { shadowRoot } = await fixture<OfflinePage>(html`<offline-page></offline-page>`);

    expect(screen.getByShadowText(/You are offline/)).toBeInTheDocument();
    expect(screen.getByShadowRole('heading', { level: 2 })).toHaveTextContent('What works offline');
    expect(screen.getAllByShadowRole('listitem').map((item) => item.textContent?.trim())).toEqual([
      'Pages you have visited before',
      'Your saved sessions, in My Schedule',
    ]);
    expect(screen.getByShadowRole('link', { name: 'Go to the home page' })).toHaveAttribute(
      'href',
      '/',
    );
    expect(deepQuerySelector(shadowRoot, '.illustration svg')).toBeInTheDocument();
    expect(deepQuerySelector(shadowRoot, '.illustration')).toHaveAttribute('aria-hidden', 'true');
  });

  it('leaves out saved sessions when My Schedule is off', async () => {
    setFeatures({ mySchedule: false });
    await fixture<OfflinePage>(html`<offline-page></offline-page>`);

    expect(screen.getAllByShadowRole('listitem')).toHaveLength(1);
  });

  it('sets the offline title and description', async () => {
    await fixture<OfflinePage>(html`<offline-page></offline-page>`);

    expect(updateMetadata).toHaveBeenCalledWith('Offline', 'This page is not available offline');
  });
});
