import { afterEach, describe, expect, it } from 'vitest';
import { html, nothing, render as litRender } from 'lit';
import { fixture } from '../../../__tests__/helpers/fixtures';
import { type PreviousTalks, talksByYear } from './previous-talks';
import './previous-talks';

const sessions = {
  2018: [{ title: 'Older', tags: ['Web'], videoId: 'abc' }],
  2020: [{ title: 'Newer', tags: [], presentation: 'https://slides.example' }],
};

describe('previous-talks', () => {
  afterEach(() => {
    litRender(nothing, document.body);
  });

  it('lists talks newest year first', () => {
    expect(talksByYear(sessions).map(({ title, year }) => `${year} ${title}`)).toEqual([
      '2020 Newer',
      '2018 Older',
    ]);
  });

  it('shows each talk with its year, tags, video and slides', async () => {
    const { shadowRoot } = await fixture<PreviousTalks>(
      html`<previous-talks .sessions=${sessions}></previous-talks>`,
    );
    const talks = shadowRoot.querySelectorAll('.talk');

    expect(talks).toHaveLength(2);
    expect(talks[0]!.querySelector('hb-sticker')).toHaveTextContent('2020');
    expect(talks[0]!.querySelector('h3')).toHaveTextContent('Newer');
    expect(talks[0]!.querySelector('hb-button')).toHaveAttribute('href', 'https://slides.example');
    expect(talks[1]!.querySelector('hb-chip')).toHaveTextContent('Web');
    expect(talks[1]!.querySelector('hb-button')).toHaveAttribute(
      'href',
      'https://www.youtube.com/watch?v=abc',
    );
  });
});
