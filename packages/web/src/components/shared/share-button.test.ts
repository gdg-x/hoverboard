import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent } from '@testing-library/dom';
import { html } from 'lit';
import { deepQuerySelector, screen } from 'shadow-dom-testing-library';
import { fixture } from '../../../__tests__/helpers/fixtures';
import './share-button';
import { ShareButton } from './share-button';

const setShare = (share: unknown) =>
  Object.defineProperty(navigator, 'share', { value: share, configurable: true });

describe('share-button', () => {
  afterEach(() => {
    Reflect.deleteProperty(navigator, 'share');
  });

  it('should be registered', () => {
    expect(customElements.get('share-button')).toBeDefined();
  });

  it('renders nothing when the Web Share API is unsupported', async () => {
    setShare(undefined);
    const { shadowRoot } = await fixture<ShareButton>(html`<share-button></share-button>`);

    expect(deepQuerySelector(shadowRoot, 'hb-button')).toBeNull();
  });

  it('shares the data and current url when clicked', async () => {
    const share = vi.fn(() => Promise.resolve());
    setShare(share);
    await fixture<ShareButton>(
      html`<share-button .data="${{ title: 'A talk', text: 'About' }}"></share-button>`,
    );

    fireEvent.click(await screen.findByShadowRole('button', { name: 'Share' }));

    expect(share).toHaveBeenCalledWith({
      url: window.location.href,
      title: 'A talk',
      text: 'About',
    });
  });

  it('ignores a dismissed share sheet', async () => {
    const share = vi.fn(() => Promise.reject(new DOMException('cancelled', 'AbortError')));
    setShare(share);
    await fixture<ShareButton>(html`<share-button></share-button>`);

    fireEvent.click(await screen.findByShadowRole('button', { name: 'Share' }));
    await Promise.resolve();

    expect(share).toHaveBeenCalled();
  });
});
