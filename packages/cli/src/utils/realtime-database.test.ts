import { afterEach, describe, expect, it, vi } from 'vitest';
import { checkRealtimeDatabase } from './realtime-database.js';

const { listDatabaseInstancesMock } = vi.hoisted(() => ({ listDatabaseInstancesMock: vi.fn() }));

vi.mock('../lib/database-instances.js', () => ({
  listDatabaseInstances: listDatabaseInstancesMock,
}));

const instance = (name: string, state: string) => ({ name, location: 'us-central1', state });

afterEach(() => {
  vi.clearAllMocks();
});

describe('checkRealtimeDatabase', () => {
  it('skips with a warning when no project is selected', async () => {
    expect(await checkRealtimeDatabase('/repo', undefined)).toMatchObject({
      ok: true,
      warning: true,
    });
    expect(listDatabaseInstancesMock).not.toHaveBeenCalled();
  });

  it('passes when the project has no Realtime Database', async () => {
    listDatabaseInstancesMock.mockResolvedValue([]);

    expect(await checkRealtimeDatabase('/repo', 'demo-project')).toEqual({
      name: 'Realtime Database',
      ok: true,
      message: 'None, as Hoverboard expects.',
    });
    expect(listDatabaseInstancesMock).toHaveBeenCalledWith('/repo', 'demo-project');
  });

  it('passes when the Realtime Database API was never turned on', async () => {
    listDatabaseInstancesMock.mockRejectedValue(
      Object.assign(new Error('Failed to list Firebase Realtime Database instances.'), {
        original: new Error(
          'Firebase Realtime Database Management API has not been used in project 123',
        ),
      }),
    );

    expect(await checkRealtimeDatabase('/repo', 'demo-project')).toEqual({
      name: 'Realtime Database',
      ok: true,
      message: 'None, as Hoverboard expects.',
    });
  });

  it('warns about an active database, and links to where to delete it', async () => {
    listDatabaseInstancesMock.mockResolvedValue([
      instance('demo-project-default-rtdb', 'ACTIVE'),
      instance('old', 'DELETED'),
    ]);

    const result = await checkRealtimeDatabase('/repo', 'demo-project');

    expect(result).toMatchObject({ name: 'Realtime Database', ok: true, warning: true });
    expect(result.message).toContain('demo-project-default-rtdb is active in demo-project');
    expect(result.message).toContain(
      'https://console.firebase.google.com/project/demo-project/database',
    );
  });

  it('passes when every database is disabled or deleted', async () => {
    listDatabaseInstancesMock.mockResolvedValue([
      instance('demo-project', 'DISABLED'),
      instance('old', 'DELETED'),
    ]);

    expect(await checkRealtimeDatabase('/repo', 'demo-project')).toEqual({
      name: 'Realtime Database',
      ok: true,
      message: 'demo-project is disabled, so it serves no data.',
    });
  });

  it('warns when the instances cannot be listed', async () => {
    listDatabaseInstancesMock.mockRejectedValue(new Error('Not logged in to Firebase.'));

    expect(await checkRealtimeDatabase('/repo', 'demo-project')).toEqual({
      name: 'Realtime Database',
      ok: true,
      warning: true,
      message:
        'Could not list the Realtime Database instances of demo-project: Not logged in to Firebase.',
    });
  });
});
