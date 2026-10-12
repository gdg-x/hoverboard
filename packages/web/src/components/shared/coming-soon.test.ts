import { html, nothing, render as litRender } from 'lit';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectNoAxeViolations } from '../../../__tests__/helpers/axe';
import { setFeatures } from '../../../__tests__/helpers/features';
import { fixture } from '../../../__tests__/helpers/fixtures';
import './coming-soon';

const call = { url: 'https://example.com/cfp', opens: '2027-01-10', closes: '2027-03-01' };

vi.mock('../../config/site', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../config/site')>()),
  callForPapers: { url: 'https://example.com/cfp', opens: '2027-01-10', closes: '2027-03-01' },
}));

describe('coming-soon', () => {
  afterEach(() => {
    litRender(nothing, document.body);
    vi.useRealTimers();
  });

  it('links to the call for papers while it is open, when asked', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2027-02-01T12:00:00Z'));

    const { element, shadowRoot } = await fixture(
      html`<coming-soon call-for-papers>Speakers are coming soon.</coming-soon>`,
    );
    await element.updateComplete;

    const [submit, updates] = shadowRoot.querySelectorAll('hb-button');
    expect(submit).toHaveTextContent('Submit a talk');
    expect(submit).toHaveAttribute('href', call.url);
    expect(updates).toHaveTextContent('Get updates');
    await expectNoAxeViolations(element);
  });

  it("doesn't link to the call for papers once it closes, or when not asked", async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2027-03-02T12:00:00Z'));

    const closed = await fixture(
      html`<coming-soon call-for-papers>Speakers are coming soon.</coming-soon>`,
    );
    await closed.element.updateComplete;
    expect(closed.shadowRoot.querySelectorAll('hb-button')).toHaveLength(1);

    litRender(nothing, document.body);
    vi.setSystemTime(new Date('2027-02-01T12:00:00Z'));
    const notAsked = await fixture(html`<coming-soon>Schedule coming soon.</coming-soon>`);
    await notAsked.element.updateComplete;
    expect(notAsked.shadowRoot.querySelectorAll('hb-button')).toHaveLength(1);
  });

  it('shows the slotted message and a link to get updates', async () => {
    const { element, shadowRoot } = await fixture(
      html`<coming-soon>Speakers are coming soon.</coming-soon>`,
    );

    expect(element).toHaveTextContent('Speakers are coming soon.');
    expect(shadowRoot.querySelector('p slot')).toBeInTheDocument();
    const button = shadowRoot.querySelector('hb-button');
    expect(button).toHaveTextContent('Get updates');
    expect(button).toHaveAttribute('href', '/#subscribe');
    await expectNoAxeViolations(element);
  });

  it('has no link to get updates when subscribe is off', async () => {
    setFeatures({ subscribe: false });

    const { element, shadowRoot } = await fixture(
      html`<coming-soon>The schedule is coming soon.</coming-soon>`,
    );

    expect(shadowRoot.querySelector('hb-button')).toBeNull();
    await expectNoAxeViolations(element);
  });
});
