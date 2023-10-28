import { beforeEach, describe, it, jest } from '@jest/globals';
import { fireEvent, screen, within } from '@testing-library/dom';
import { mocked } from 'jest-mock';
import { html } from 'lit';
import { fixture } from '../../__tests__/helpers/fixtures';
import { openVideoDialog } from '../store/ui/actions';
import { aboutBlock } from '../utils/data';
import './about-block';

jest.mock('../store/ui/actions');

const mockToggleVideoDialogs = mocked(openVideoDialog);

describe('about-block', () => {
  beforeEach(() => {
    mockToggleVideoDialogs.mockClear();
  });

  it('defines a component', () => {
    expect(customElements.get('about-block')).toBeDefined();
  });

  it('renders details', async () => {
    const { shadowRootForWithin } = await fixture(
      html`<about-block data-testid="block"></about-block>`
    );
    const { getByText } = within(shadowRootForWithin);

    expect(screen.getByTestId('block')).toBeInTheDocument();
    expect(getByText(aboutBlock.title)).toBeInTheDocument();
    expect(getByText(aboutBlock.callToAction.featuredSessions.description)).toBeInTheDocument();
    expect(getByText(aboutBlock.statisticsBlock.attendees.number)).toBeInTheDocument();
    expect(getByText(aboutBlock.statisticsBlock.attendees.label)).toBeInTheDocument();
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
