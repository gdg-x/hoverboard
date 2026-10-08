import { render } from '@lit-labs/ssr';
import { collectResult } from '@lit-labs/ssr/lib/render-result.js';
import { html, type TemplateResult } from 'lit';
import { describe, expect, it } from 'vitest';
import { seedPage } from '../data/page';
import type { Post } from '../models/post';
import type { PreviousSpeaker } from '../models/previous-speaker';
import type { Session } from '../models/session';
import type { SpeakerWithTags } from '../models/speaker';
import './post-page';
import './previous-speaker-page';
import './session-page';
import './speaker-page';

const renderToString = async (template: TemplateResult) =>
  // Comments are Lit's hydration markers.
  (await collectResult(render(template))).replace(/<!--[^>]*-->/g, '');

const bio = 'Builds **things** with [Lit](https://lit.dev).';
const renderedBio =
  '<p>Builds <strong>things</strong> with <a href="https://lit.dev" target="_blank" rel="noopener noreferrer">Lit</a>.</p>';

describe('detail pages on the server', () => {
  it('render the speaker from the seeded store', async () => {
    seedPage({
      speakers: [
        { id: 'ada', name: 'Ada Lovelace', bio, socials: [], tags: [] },
      ] as never as SpeakerWithTags[],
      // The page also shows previous speakers.
      previousSpeakers: [],
    });

    const page = await renderToString(html`<speaker-page .speakerId=${'ada'}></speaker-page>`);

    expect(page).toContain('<h2 class="name">Ada Lovelace</h2>');
    expect(page).toContain(renderedBio);
  });

  it('render the previous speaker from the seeded store', async () => {
    seedPage({
      previousSpeakers: [
        { id: 'grace', name: 'Grace Hopper', bio, socials: [], sessions: {} },
      ] as never as PreviousSpeaker[],
    });

    const page = await renderToString(
      html`<previous-speaker-page .speakerId=${'grace'}></previous-speaker-page>`,
    );

    expect(page).toContain('<h2 class="name">Grace Hopper</h2>');
    expect(page).toContain(renderedBio);
  });

  it('render the session from the seeded store', async () => {
    seedPage({
      sessions: [{ id: 's1', title: 'Hydration', description: bio }] as Session[],
    });

    const page = await renderToString(html`<session-page .sessionId=${'s1'}></session-page>`);

    expect(page).toContain('Hydration');
    expect(page).toContain(renderedBio);
  });

  it('render the post from the seeded store', async () => {
    seedPage({
      blog: [{ id: 'p1', title: 'Hello', content: bio, published: '2026-10-08' }] as Post[],
    });

    const page = await renderToString(html`<post-page .postId=${'p1'}></post-page>`);

    expect(page).toContain('Hello');
    expect(page).toContain(renderedBio);
  });

  it('fail when a page reads content it was not seeded with', async () => {
    seedPage({ speakers: [] });

    await expect(
      renderToString(html`<speaker-page .speakerId=${'ada'}></speaker-page>`),
    ).rejects.toThrow('db is not available on the server');
  });

  it('render icons empty, so the first render in the browser matches', async () => {
    const page = await renderToString(html`<hoverboard-icon name="github"></hoverboard-icon>`);

    expect(page).not.toContain('<svg');
  });
});
