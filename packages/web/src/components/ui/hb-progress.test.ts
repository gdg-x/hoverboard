import { html } from 'lit';
import { describe, expect, it } from 'vitest';
import { fixture } from '../../../__tests__/helpers/fixtures';
import './hb-progress';
import type { HbProgress } from './hb-progress';

describe('hb-progress', () => {
  it('shows that something is loading without a value', async () => {
    const { shadowRoot } = await fixture<HbProgress>(html`<hb-progress></hb-progress>`);
    const progress = shadowRoot.querySelector('progress')!;

    expect(progress).not.toHaveAttribute('value');
    expect(progress).toHaveAccessibleName('Loading...');
  });

  it('shows its value and label', async () => {
    const { shadowRoot } = await fixture<HbProgress>(
      html`<hb-progress value="3" max="4" label="Fundraising"></hb-progress>`,
    );
    const progress = shadowRoot.querySelector('progress')!;

    expect(progress).toHaveAttribute('value', '3');
    expect(progress).toHaveAttribute('max', '4');
    expect(progress).toHaveAccessibleName('Fundraising');
  });
});
