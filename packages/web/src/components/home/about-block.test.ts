import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent } from '@testing-library/dom';
import { html } from 'lit';
import { deepQuerySelector, deepQuerySelectorAll, screen } from 'shadow-dom-testing-library';
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
    await fixture(html`<about-block data-testid="block"></about-block>`);

    expect(screen.getByTestId('block')).toBeInTheDocument();
    expect(screen.getByShadowText('About')).toBeInTheDocument();
    expect(
      screen.getByShadowText(aboutBlock.callToAction.featuredSessions.description),
    ).toBeInTheDocument();
    expect(screen.getByShadowText(aboutBlock.statisticsBlock.attendees.number)).toBeInTheDocument();
    expect(screen.getByShadowText(aboutBlock.statisticsBlock.attendees.label)).toBeInTheDocument();
  });

  it('renders the numbers as a list, with the optional emoji hidden from screen readers', async () => {
    const { shadowRoot } = await fixture(html`<about-block></about-block>`);

    const stats = screen.getAllByShadowRole('listitem');
    expect(stats).toHaveLength(4);
    expect(stats[0]).toHaveTextContent(aboutBlock.statisticsBlock.attendees.label);
    expect(deepQuerySelector(shadowRoot, '.emoji')).toHaveAttribute('aria-hidden', 'true');
    expect(deepQuerySelectorAll(shadowRoot, '.emoji')).toHaveLength(
      Object.values(aboutBlock.statisticsBlock).filter((stat) => 'emoji' in stat).length,
    );
  });

  it('has a section heading below the page title', async () => {
    await fixture(html`<about-block></about-block>`);

    expect(screen.getByShadowRole('heading', { level: 2 })).toHaveTextContent('About');
    expect(screen.queryByShadowRole('heading', { level: 1 })).not.toBeInTheDocument();
  });

  it('plays the video', async () => {
    await fixture(html`<about-block></about-block>`);
    const video = aboutBlock.callToAction.howItWas!;

    fireEvent.click(screen.getByShadowText(video.label));

    expect(mockToggleVideoDialogs).toHaveBeenCalledTimes(1);
    expect(mockToggleVideoDialogs).toHaveBeenCalledWith({
      title: video.label,
      youtubeId: video.youtubeId,
    });
  });

  it('has no video or its text without one', async () => {
    const video = aboutBlock.callToAction.howItWas!;
    delete aboutBlock.callToAction.howItWas;
    try {
      await fixture(html`<about-block></about-block>`);

      expect(screen.queryByShadowText(video.label)).not.toBeInTheDocument();
      expect(screen.queryByShadowText(video.description)).not.toBeInTheDocument();
    } finally {
      aboutBlock.callToAction.howItWas = video;
    }
  });
});
