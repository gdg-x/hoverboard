import { html, nothing, render as litRender } from 'lit';
import { screen } from 'shadow-dom-testing-library';
import { afterEach, describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../../__tests__/helpers/axe';
import { fixture } from '../../../__tests__/helpers/fixtures';
import { mailto } from '../../config/site';
import './report-mistake';

describe('report-mistake', () => {
  afterEach(() => {
    litRender(nothing, document.body);
  });

  it('emails the organizers a correction, with what it is about in the subject', async () => {
    const { element } = await fixture(
      html`<report-mistake .subject="${'Ada & Grace: a talk'}"></report-mistake>`,
    );

    expect(element.shadowRoot).toHaveTextContent('Speaking here? Report a mistake');
    expect(screen.getByShadowRole('link', { name: 'Report a mistake' })).toHaveAttribute(
      'href',
      `mailto:${mailto}?subject=${encodeURIComponent('Correction: Ada & Grace: a talk')}`,
    );
    await expectNoAxeViolations(element);
  });
});
