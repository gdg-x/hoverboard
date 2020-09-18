import { fireEvent, getByText } from '@testing-library/dom';
import { html } from 'lit-html';
import { mocked } from 'ts-jest/utils';
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
    const { container } = await fixture(html`<about-block></about-block>`);
    expect(getByText(container, '{$ aboutBlock.title $}')).toBeDefined();
    expect(
      getByText(container, '{$ aboutBlock.callToAction.featuredSessions.description $}')
    ).toBeDefined();
    expect(getByText(container, '{$ aboutBlock.statisticsBlock.attendees.number $}')).toBeDefined();
    expect(getByText(container, '{$ aboutBlock.statisticsBlock.attendees.label $}')).toBeDefined();
  });

  it('plays the video', async () => {
    const { container } = await fixture(html`<about-block></about-block>`);
    fireEvent.click(getByText(container, '{$ aboutBlock.callToAction.howItWas.label $}'));
    expect(mockToggleVideoDialogs).toHaveBeenCalledTimes(1);
    expect(mockToggleVideoDialogs).toHaveBeenCalledWith({
      title: '{$  aboutBlock.callToAction.howItWas.title $}',
      youtubeId: '{$  aboutBlock.callToAction.howItWas.youtubeId $}',
      disableControls: true,
      opened: true,
    });
  });
});
