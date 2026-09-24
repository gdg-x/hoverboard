import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, within } from '@testing-library/dom';
import { html } from 'lit';
import { fixture } from '../../__tests__/helpers/fixtures';
import { openVideoDialog } from '../store/ui';
import { aboutBlock } from '../utils/data';
import './about-block';

vi.mock('../store/ui', async (importOriginal) => ({
  __esModule: true,
  ...(await importOriginal<typeof import('../store/ui')>()),
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
    expect(getByText(aboutBlock.title)).toBeInTheDocument();
    expect(getByText(aboutBlock.callToAction.featuredSessions.description)).toBeInTheDocument();
    expect(getByText(aboutBlock.statisticsBlock.attendees.number)).toBeInTheDocument();
    expect(getByText(aboutBlock.statisticsBlock.attendees.label)).toBeInTheDocument();
  });

  it('renders hoverboard-icon arrow-right-circle icons for both call-to-actions', async () => {
    const { shadowRootForWithin } = await fixture(
      html`<about-block data-testid="block"></about-block>`,
    );

    const icons = shadowRootForWithin.querySelectorAll(
      'hoverboard-icon[name="arrow-right-circle"]',
    );
    expect(icons).toHaveLength(2);
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
