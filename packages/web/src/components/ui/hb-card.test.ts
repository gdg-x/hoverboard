import { html } from 'lit';
import { describe, expect, it } from 'vitest';
import { fixture } from '../../../__tests__/helpers/fixtures';
import './hb-card';
import type { HbCard } from './hb-card';

describe('hb-card', () => {
  it('has no link without href', async () => {
    const { shadowRoot } = await fixture<HbCard>(html`<hb-card><p>Text</p></hb-card>`);

    expect(shadowRoot.querySelector('article')).toBeInTheDocument();
    expect(shadowRoot.querySelector('a')).toBeNull();
  });

  it('is covered by a link named by its label', async () => {
    const { shadowRoot } = await fixture<HbCard>(
      html`<hb-card href="/speakers/ada" label="Ada Lovelace"><p>Text</p></hb-card>`,
    );
    const link = shadowRoot.querySelector('a.cover')!;

    expect(link).toHaveAttribute('href', '/speakers/ada');
    expect(link).toHaveAccessibleName('Ada Lovelace');
  });
});
