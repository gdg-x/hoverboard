import { beforeEach, describe, it, jest } from '@jest/globals';
import { within } from '@testing-library/dom';
import { mocked } from 'jest-mock';
import { html } from 'lit';
// TODO: Switch back to standard @testing-library/dom https://github.com/testing-library/dom-testing-library/issues/413
import { fireEvent, screen } from 'testing-library__dom';
import { fixture } from '../../__tests__/helpers/fixtures';
import { toggleVideoDialog } from '../store/ui/actions';
import './about-block';

jest.mock('../store/ui/actions');

const mockToggleVideoDialogs = mocked(toggleVideoDialog);

describe('about-block', () => {
  beforeEach(() => {
    mockToggleVideoDialogs.mockClear();
  });

  it('defines a component', () => {
    expect(customElements.get('about-block')).toBeDefined();
  });

  it('renders details', async () => {
    await fixture(html`<about-block></about-block>`);

    expect(screen.getByText('{$ aboutBlock.title $}')).toBeInTheDocument();
    expect(
      screen.getByText('{$ aboutBlock.callToAction.featuredSessions.description $}')
    ).toBeInTheDocument();
    expect(
      screen.getByText('{$ aboutBlock.statisticsBlock.attendees.number $}')
    ).toBeInTheDocument();
    expect(
      screen.getByText('{$ aboutBlock.statisticsBlock.attendees.label $}')
    ).toBeInTheDocument();
  });

  it('plays the video', async () => {
    const { shadowRootForWithin } = await fixture(html`<about-block></about-block>`);
    const { getByText } = within(shadowRootForWithin);

    fireEvent.click(getByText('{$ aboutBlock.callToAction.howItWas.label $}'));
    expect(mockToggleVideoDialogs).toHaveBeenCalledTimes(1);
    expect(mockToggleVideoDialogs).toHaveBeenCalledWith({
      title: '{$  aboutBlock.callToAction.howItWas.label $}',
      youtubeId: '{$  aboutBlock.callToAction.howItWas.youtubeId $}',
      disableControls: true,
      opened: true,
    });
  });
});
