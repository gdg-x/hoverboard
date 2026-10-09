import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, within } from '@testing-library/dom';
import { html } from 'lit';
import { fixture } from '../../../__tests__/helpers/fixtures';
import { openVideoDialog } from '../../store/ui';
import { aboutBlock } from '../../config/site';
import './about-block';

vi.mock('../../store/ui', async (importOriginal) => ({
  __esModule: true,
  ...(await importOriginal<typeof import('../../store/ui')>()),
  openVideoDialog: vi.fn(),
}));

const mockToggleVideoDialogs = vi.mocked(openVideoDialog);

describe('about-block', () => {
  beforeEach(() => {
    mockToggleVideoDialogs.mockClear();
  });

  it('defines a component', () => {
    expect(customElements.get('about-block')).toBeDefined();
  });

  it('renders details', async () => {
    const { shadowRootForWithin } = await fixture(
      html`<about-block data-testid="block"></about-block>`,
    );
    const { getByText } = within(shadowRootForWithin);

    expect(screen.getByTestId('block')).toBeInTheDocument();
    expect(getByText('About')).toBeInTheDocument();
    expect(getByText(aboutBlock.callToAction.featuredSessions.description)).toBeInTheDocument();
    expect(getByText(aboutBlock.statisticsBlock.attendees.number)).toBeInTheDocument();
    expect(getByText(aboutBlock.statisticsBlock.attendees.label)).toBeInTheDocument();
  });

  it('renders the numbers as a list, with the optional emoji hidden from screen readers', async () => {
    const { shadowRoot } = await fixture(html`<about-block></about-block>`);

    const stats = shadowRoot.querySelectorAll('.stat');
    expect(stats).toHaveLength(4);
    expect(stats[0]).toHaveTextContent(aboutBlock.statisticsBlock.attendees.label);
    expect(shadowRoot.querySelector('.emoji')).toHaveAttribute('aria-hidden', 'true');
    expect(shadowRoot.querySelectorAll('.emoji')).toHaveLength(
      Object.values(aboutBlock.statisticsBlock).filter((stat) => 'emoji' in stat).length,
    );
  });

  it('has a section heading below the page title', async () => {
    const { shadowRoot } = await fixture(html`<about-block></about-block>`);

    expect(shadowRoot.querySelector('h2')).toHaveTextContent('About');
    expect(shadowRoot.querySelector('h1')).toBeNull();
  });

  it('plays the video', async () => {
    const { shadowRootForWithin } = await fixture(html`<about-block></about-block>`);
    const { getByText } = within(shadowRootForWithin);

    fireEvent.click(getByText(aboutBlock.callToAction.howItWas.label));

    expect(mockToggleVideoDialogs).toHaveBeenCalledTimes(1);
    expect(mockToggleVideoDialogs).toHaveBeenCalledWith({
      title: aboutBlock.callToAction.howItWas.label,
      youtubeId: aboutBlock.callToAction.howItWas.youtubeId,
    });
  });
});
