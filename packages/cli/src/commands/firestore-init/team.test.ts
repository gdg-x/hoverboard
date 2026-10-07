import { afterEach, describe, expect, it, vi } from 'vitest';
import { importTeam } from './team.js';

const { teamCollectionMock, docMock, membersCollectionMock, memberDocMock, setMock } = vi.hoisted(
  () => {
    const setMock = vi.fn();
    const memberDocMock = vi.fn((id: string) => `members/${id}`);
    const membersCollectionMock = vi.fn(() => ({ doc: memberDocMock }));
    const docMock = vi.fn(() => ({ collection: membersCollectionMock }));
    const teamCollectionMock = vi.fn(() => ({ doc: docMock }));
    return { teamCollectionMock, docMock, membersCollectionMock, memberDocMock, setMock };
  },
);

vi.mock('../../lib/firestore.js', () => ({
  firestore: {
    collection: teamCollectionMock,
    batch: vi.fn(() => ({ set: setMock, commit: vi.fn().mockResolvedValue([{}, {}]) })),
  },
}));

const member = {
  name: 'Abraham',
  order: 0,
  photo: '',
  photoUrl: '',
  socials: [],
  title: 'Organizer',
};

vi.mock('../../../../../docs/default-firebase-data.json', () => ({
  default: {
    team: [
      {
        title: 'Organizers',
        members: [
          { name: 'Abraham', order: 0, photo: '', photoUrl: '', socials: [], title: 'Organizer' },
        ],
      },
      undefined,
    ],
  },
}));

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe('importTeam', () => {
  it('batch-sets each team document and its nested members, warning about missing ones', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    await importTeam();

    expect(teamCollectionMock).toHaveBeenCalledWith('team');
    expect(docMock).toHaveBeenCalledWith('0');
    expect(setMock).toHaveBeenCalledWith(docMock.mock.results[0]?.value, {
      title: 'Organizers',
    });
    expect(membersCollectionMock).toHaveBeenCalledWith('members');
    expect(memberDocMock).toHaveBeenCalledWith('0');
    expect(setMock).toHaveBeenCalledWith('members/0', member);
    expect(warnSpy).toHaveBeenCalledWith('Skipping missing team 1');
  });
});
