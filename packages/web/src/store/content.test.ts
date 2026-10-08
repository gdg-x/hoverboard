import { Initialized, Success } from '@abraham/remotedata';
import { describe, expect, it, vi } from 'vitest';
import { subscribeToSpeakers } from '../db/speakers';
import type { SpeakerWithTags } from '../models/speaker';
import {
  PAGE_CONTENT_ID,
  resetContent,
  seedContent,
  seedFromPage,
  serializeContent,
  subscribeToPageContent,
} from './content';
import { store } from '.';
import { selectPartnerGroups } from './partners';
import { selectSpeakersState } from './speakers';

vi.mock('../db/speakers');

describe('seedContent', () => {
  it('fills the store without subscribing to Firestore', () => {
    const speakers = [{ id: 'ada', name: 'Ada' }] as SpeakerWithTags[];

    store.dispatch(
      seedContent({
        speakers,
        partnerGroups: [{ id: 'g', title: 'Group', order: 0 }],
        partners: [{ id: 'p', parentId: 'g', name: 'Partner', logoUrl: '', url: '', order: 0 }],
      }),
    );

    expect(selectSpeakersState(store.getState())).toStrictEqual(new Success(speakers));
    expect(subscribeToSpeakers).not.toHaveBeenCalled();
    expect(selectPartnerGroups(store.getState())).toStrictEqual(
      new Success([
        {
          id: 'g',
          title: 'Group',
          order: 0,
          items: [{ id: 'p', parentId: 'g', name: 'Partner', logoUrl: '', url: '', order: 0 }],
        },
      ]),
    );
  });
});

describe('resetContent', () => {
  it('clears seeded content', () => {
    store.dispatch(seedContent({ speakers: [], partners: [], partnerGroups: [] }));

    store.dispatch(resetContent());

    expect(store.getState().speakers).toStrictEqual(new Initialized());
    expect(store.getState().partners.partners).toStrictEqual(new Initialized());
  });
});

describe('serializeContent', () => {
  it('escapes `<`, so the JSON cannot end its script element', () => {
    const content = { blog: [{ title: '</script><script>alert(1)</script>' }] } as never;

    const json = serializeContent(content);

    expect(json).not.toContain('<');
    expect(JSON.parse(json)).toEqual(content);
  });
});

describe('seedFromPage', () => {
  it("seeds the store from the page's content without subscribing", () => {
    const speakers = [{ id: 'grace', name: 'Grace' }] as SpeakerWithTags[];
    const script = document.createElement('script');
    script.type = 'application/json';
    script.id = PAGE_CONTENT_ID;
    script.textContent = serializeContent({ speakers });
    document.body.append(script);

    seedFromPage(store.dispatch);
    script.remove();

    expect(store.getState().speakers).toStrictEqual(new Success(speakers));
    expect(subscribeToSpeakers).not.toHaveBeenCalled();
  });

  it('does nothing on a page without content', () => {
    const dispatch = vi.fn();

    seedFromPage(dispatch);

    expect(dispatch).not.toHaveBeenCalled();
  });
});

describe('subscribeToPageContent', () => {
  it("subscribes to the page's content for live updates", () => {
    vi.mocked(subscribeToSpeakers).mockReturnValue(new Success(vi.fn()));
    const script = document.createElement('script');
    script.type = 'application/json';
    script.id = PAGE_CONTENT_ID;
    script.textContent = serializeContent({ speakers: [] });
    document.body.append(script);

    subscribeToPageContent();
    script.remove();

    expect(subscribeToSpeakers).toHaveBeenCalledTimes(1);
  });
});
