import './about-block';
import { html } from 'lit-html';
import { fixture } from '../../__tests__/helpers/fixtures';
import { getByText, fireEvent } from '@testing-library/dom';
import { uiActions } from '../redux/actions';
import { mocked } from 'ts-jest/utils';

jest.mock('../redux/actions');

const toggleVideoDialogs = mocked(uiActions.toggleVideoDialog);

describe('about-block', () => {
  beforeEach(() => {
    toggleVideoDialogs.mockClear();
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
    expect(toggleVideoDialogs).toHaveBeenCalledTimes(1);
    expect(toggleVideoDialogs).toHaveBeenCalledWith({
      title: '{$  aboutBlock.callToAction.howItWas.title $}',
      youtubeId: '{$  aboutBlock.callToAction.howItWas.youtubeId $}',
      disableControls: true,
      opened: true,
    });
  });
});
