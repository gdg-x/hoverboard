import { describe, expect, it, vi } from 'vitest';
import type { ReactiveControllerHost } from 'lit';
import { updateMetadata } from '../utils/metadata';
import { PageMetadataController } from './page-metadata-controller';

vi.mock('../utils/metadata');

const host = { addController: vi.fn() } as unknown as ReactiveControllerHost;
const localeStatus = (status: string) =>
  window.dispatchEvent(new CustomEvent('lit-localize-status', { detail: { status } }));

describe('PageMetadataController', () => {
  it('sets the page metadata on connect and when a locale finishes loading', () => {
    const controller = new PageMetadataController(host, 'team');

    controller.hostConnected();
    expect(updateMetadata).toHaveBeenCalledWith('Team', 'Get more info about organizers');

    localeStatus('loading');
    expect(updateMetadata).toHaveBeenCalledTimes(1);

    localeStatus('ready');
    expect(updateMetadata).toHaveBeenCalledTimes(2);

    controller.hostDisconnected();
    localeStatus('ready');
    expect(updateMetadata).toHaveBeenCalledTimes(2);
  });
});
