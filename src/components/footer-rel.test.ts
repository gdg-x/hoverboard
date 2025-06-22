import { describe, expect, it } from '@jest/globals';
import { screen, within } from '@testing-library/dom';
import { html } from 'lit';
import { fixture } from '../../__tests__/helpers/fixtures';
import '../components/footer-rel';
import { notifications, subscribeNote } from '../utils/data';

describe('footer-rel', () => {
  it('defines a component', () => {
    expect(customElements.get('footer-rel')).toBeDefined();
  });

  it('renders subscription section', async () => {
    const { shadowRootForWithin } = await fixture(
      html`<footer-rel data-testid="footer-rel"></footer-rel>`,
    );
    const withinShadowRoot = within(shadowRootForWithin);
    const subscriptionHeading = withinShadowRoot.getByText(notifications.subscribe);
    const subscriptionNote = withinShadowRoot.getByText(subscribeNote);

    expect(screen.getByTestId('footer-rel')).toBeInTheDocument();
    expect(subscriptionHeading).toBeInTheDocument();
    expect(subscriptionHeading).toHaveClass('col-heading');
    expect(subscriptionNote).toBeInTheDocument();
  });

  it('renders without errors', async () => {
    const { element } = await fixture(html`<footer-rel></footer-rel>`);

    expect(element).toBeInTheDocument();
    expect(element.shadowRoot).toBeDefined();
  });
});
