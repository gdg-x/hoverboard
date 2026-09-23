import { describe, expect, it, vi } from 'vitest';
import { fireEvent } from '@testing-library/dom';
import { html } from 'lit';
import { fixture } from '../../__tests__/helpers/fixtures';
import { addToHomeScreen } from '../utils/data';
import type { AppInstall } from './app-install';
import './app-install';

interface UserChoice {
  outcome: 'accepted' | 'dismissed';
  platform: string;
}

class MockBeforeInstallPromptEvent extends Event {
  platforms: string[] = [];
  userChoice: Promise<UserChoice> = Promise.resolve({ outcome: 'accepted', platform: 'web' });
  prompt = () => Promise.resolve();

  constructor() {
    super('beforeinstallprompt', { cancelable: true });
  }
}

describe('app-install', () => {
  it('defines a component', () => {
    expect(customElements.get('app-install')).toBeDefined();
  });

  it('hides the install link until the browser fires beforeinstallprompt', async () => {
    const { shadowRoot } = await fixture<AppInstall>(html`<app-install></app-install>`);

    expect(shadowRoot.querySelector('a')).toHaveAttribute('hidden');
  });

  it('shows the install link once beforeinstallprompt fires and prevents the default prompt', async () => {
    const { element, shadowRoot } = await fixture<AppInstall>(html`<app-install></app-install>`);
    const event = new MockBeforeInstallPromptEvent();
    const preventDefault = vi.spyOn(event, 'preventDefault');

    window.dispatchEvent(event);
    await element.updateComplete;

    expect(preventDefault).toHaveBeenCalled();
    expect(shadowRoot.querySelector('a')).not.toHaveAttribute('hidden');
    expect(shadowRoot.querySelector('a')).toHaveTextContent(addToHomeScreen.cta);
  });

  it('prompts for install and hides the link again on click', async () => {
    const { element, shadowRoot } = await fixture<AppInstall>(html`<app-install></app-install>`);
    const event = new MockBeforeInstallPromptEvent();
    const promptSpy = vi.spyOn(event, 'prompt');

    window.dispatchEvent(event);
    await element.updateComplete;

    fireEvent.click(shadowRoot.querySelector('a')!);
    await element.updateComplete;

    expect(promptSpy).toHaveBeenCalledTimes(1);
    expect(shadowRoot.querySelector('a')).toHaveAttribute('hidden');
  });

  it('does nothing when clicked without a deferred prompt', async () => {
    const { element, shadowRoot } = await fixture<AppInstall>(html`<app-install></app-install>`);

    fireEvent.click(shadowRoot.querySelector('a')!);
    await element.updateComplete;

    expect(shadowRoot.querySelector('a')).toHaveAttribute('hidden');
  });
});
