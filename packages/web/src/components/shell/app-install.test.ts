import { describe, expect, it, vi } from 'vitest';
import { fireEvent } from '@testing-library/dom';
import { html } from 'lit';
import { screen } from 'shadow-dom-testing-library';
import { fixture } from '../../../__tests__/helpers/fixtures';
import type { AppInstall } from './app-install';
import './app-install';

// By text, because a hidden button has no accessible name.
const installButton = () => screen.getByShadowText('Add to Home Screen', { selector: 'button' });

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
    await fixture<AppInstall>(html`<app-install></app-install>`);

    expect(installButton()).toHaveAttribute('hidden');
  });

  it('shows the install link once beforeinstallprompt fires and prevents the default prompt', async () => {
    const { element } = await fixture<AppInstall>(html`<app-install></app-install>`);
    const event = new MockBeforeInstallPromptEvent();
    const preventDefault = vi.spyOn(event, 'preventDefault');

    window.dispatchEvent(event);
    await element.updateComplete;

    expect(preventDefault).toHaveBeenCalled();
    expect(screen.getByShadowRole('button', { name: 'Add to Home Screen' })).not.toHaveAttribute(
      'hidden',
    );
  });

  it('prompts for install and hides the link again on click', async () => {
    const { element } = await fixture<AppInstall>(html`<app-install></app-install>`);
    const event = new MockBeforeInstallPromptEvent();
    const promptSpy = vi.spyOn(event, 'prompt');

    window.dispatchEvent(event);
    await element.updateComplete;

    fireEvent.click(installButton());
    await element.updateComplete;

    expect(promptSpy).toHaveBeenCalledTimes(1);
    expect(installButton()).toHaveAttribute('hidden');
  });

  it('does nothing when clicked without a deferred prompt', async () => {
    const { element } = await fixture<AppInstall>(html`<app-install></app-install>`);

    fireEvent.click(installButton());
    await element.updateComplete;

    expect(installButton()).toHaveAttribute('hidden');
  });
});
