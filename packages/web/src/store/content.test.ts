import { Success } from '@abraham/remotedata';
import { describe, expect, it, vi } from 'vitest';
import { subscribeToSpeakers } from '../db/speakers';
import type { SpeakerWithTags } from '../models/speaker';
import { seedContent } from './content';
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
