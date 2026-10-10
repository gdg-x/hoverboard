import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { confirm } from '../lib/prompt.js';
import { siteFeatures } from '../utils/site-features.js';
import { runNotify } from './notify.js';

const { create, doc, collection } = vi.hoisted(() => {
  const create = vi.fn();
  const doc = vi.fn(() => ({ create }));
  const collection = vi.fn(() => ({ doc }));
  return { create, doc, collection };
});

vi.mock('../lib/firestore.js', () => ({ firestore: { collection } }));
vi.mock('../lib/prompt.js', () => ({ confirm: vi.fn() }));
vi.mock('../utils/site-features.js', () => ({ siteFeatures: vi.fn() }));
vi.mock('../utils/firebase-project.js', () => ({ resolveFirebaseProjectId: () => 'fest-2027' }));

const output = () => vi.mocked(console.log).mock.calls.map(([line]) => String(line));

describe('runNotify', () => {
  const isTTY = process.stdin.isTTY;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.mocked(siteFeatures).mockReturnValue({});
    vi.setSystemTime(new Date('2027-10-15T09:00:00Z'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    vi.useRealTimers();
    delete process.env['FIRESTORE_TARGET'];
    process.stdin.isTTY = isTTY;
  });

  it('adds the notification to the emulator, which the function sends', async () => {
    expect(await runNotify({ title: ' Doors open ', body: 'Welcome!', path: '/schedule' })).toBe(
      true,
    );

    expect(collection).toHaveBeenCalledWith('notifications');
    expect(doc).toHaveBeenCalledWith(String(Date.parse('2027-10-15T09:00:00Z')));
    expect(create).toHaveBeenCalledWith({
      title: 'Doors open',
      body: 'Welcome!',
      path: '/schedule',
    });
    expect(output().at(-1)).toContain('to the emulator');
    expect(confirm).not.toHaveBeenCalled();
  });

  it('refuses an empty title or body, and a link that could run code', async () => {
    expect(await runNotify({ title: ' ', body: 'Welcome!' })).toBe(false);
    expect(
      await runNotify({ title: 'Doors open', body: 'Welcome!', path: 'javascript:alert(1)' }),
    ).toBe(false);

    expect(create).not.toHaveBeenCalled();
    expect(output()).toContain('✘ The title is empty.');
    expect(output().some((line) => line.includes('path'))).toBe(true);
  });

  it('refuses when notifications or functions are off, since nothing would send it', async () => {
    vi.mocked(siteFeatures).mockReturnValue({ functions: false });

    expect(await runNotify({ title: 'Doors open', body: 'Welcome!' })).toBe(false);
    expect(create).not.toHaveBeenCalled();
    expect(output()).toEqual(['✘ Nothing would send it: features.functions off.']);
  });

  it('asks before sending from production, and sends nothing when told no', async () => {
    process.env['FIRESTORE_TARGET'] = 'production';
    process.stdin.isTTY = true;
    vi.mocked(confirm).mockResolvedValueOnce(false).mockResolvedValueOnce(true);

    expect(await runNotify({ title: 'Doors open', body: 'Welcome!' })).toBe(false);
    expect(create).not.toHaveBeenCalled();

    expect(await runNotify({ title: 'Doors open', body: 'Welcome!' })).toBe(true);
    expect(confirm).toHaveBeenCalledWith(
      'Send "Doors open" to every subscribed device of fest-2027?',
    );
    expect(output().at(-1)).toContain('to fest-2027');
  });

  it('needs --yes for production without a terminal to ask in', async () => {
    process.env['FIRESTORE_TARGET'] = 'production';
    process.stdin.isTTY = false;

    expect(await runNotify({ title: 'Doors open', body: 'Welcome!' })).toBe(false);
    expect(create).not.toHaveBeenCalled();

    expect(await runNotify({ title: 'Doors open', body: 'Welcome!', yes: true })).toBe(true);
    expect(confirm).not.toHaveBeenCalled();
  });
});
