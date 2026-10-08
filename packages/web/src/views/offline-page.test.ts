import { screen, within } from '@testing-library/dom';
import { html } from 'lit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fixture } from '../../__tests__/helpers/fixtures';
import { updateMetadata } from '../utils/metadata';
import type { OfflinePage } from './offline-page';
import './offline-page';

vi.mock('../utils/metadata');

describe('offline-page', () => {
  beforeEach(() => {
    vi.mocked(updateMetadata).mockClear();
  });

  it('explains that the page is not available offline and links home', async () => {
    const { shadowRootForWithin } = await fixture<OfflinePage>(
      html`<offline-page data-testid="page"></offline-page>`,
    );
    const view = within(shadowRootForWithin);

    expect(screen.getByTestId('page')).toBeInTheDocument();
    expect(view.getByText(/You are offline/)).toBeInTheDocument();
    expect(view.getByRole('link', { name: 'Go to the home page' })).toHaveAttribute('href', '/');
  });

  it('sets the offline title and description', async () => {
    await fixture<OfflinePage>(html`<offline-page></offline-page>`);

    expect(updateMetadata).toHaveBeenCalledWith('Offline', 'This page is not available offline');
  });
});
