import { getMessaging } from 'firebase-admin/messaging';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  isFid,
  isInvalidTokenError,
  MULTICAST_BATCH_SIZE,
  sendToTokens,
} from '../../src/utils/messaging';

vi.mock('firebase-admin/messaging');

// Firebase Installation IDs are 22 characters long.
const fidsOfLength = (length: number) =>
  Array.from({ length }, (_, index) => `fid${String(index).padStart(19, '0')}`);
const tokensOfLength = (length: number) =>
  Array.from({ length }, (_, index) => `legacy-token-${index}:APA91b`);

describe('utils/messaging', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('recognizes invalid recipient error codes', () => {
    expect(isInvalidTokenError('messaging/invalid-registration-token')).toBe(true);
    expect(isInvalidTokenError('messaging/registration-token-not-registered')).toBe(true);
    expect(isInvalidTokenError('messaging/installation-id-not-registered')).toBe(true);
    expect(isInvalidTokenError('messaging/internal-error')).toBe(false);
  });

  it('tells installation ids apart from registration tokens', () => {
    expect(isFid('cJ1xZ_a-9Qk0sTuVwXyZ12')).toBe(true);
    expect(isFid('cJ1xZ_a-9Qk:APA91bHunNk')).toBe(false);
    expect(isFid('short')).toBe(false);
  });

  it('sends installation ids with the fids payload in a single batch', async () => {
    const sendEachForMulticast = vi.fn().mockResolvedValue({ responses: [{ success: true }] });
    vi.mocked(getMessaging).mockReturnValue({ sendEachForMulticast } as never);

    const failures = await sendToTokens(fidsOfLength(MULTICAST_BATCH_SIZE), { title: 'Hi' });

    expect(failures).toStrictEqual([]);
    expect(sendEachForMulticast).toHaveBeenCalledTimes(1);
    expect(sendEachForMulticast.mock.calls[0]![0].fids).toHaveLength(500);
    expect(sendEachForMulticast.mock.calls[0]![0]).not.toHaveProperty('tokens');
    expect(sendEachForMulticast.mock.calls[0]![0].data).toStrictEqual({ title: 'Hi' });
  });

  it('does not send legacy registration tokens and reports them as invalid', async () => {
    const sendEachForMulticast = vi.fn();
    vi.mocked(getMessaging).mockReturnValue({ sendEachForMulticast } as never);
    const [legacyToken] = tokensOfLength(1);

    const failures = await sendToTokens([legacyToken!], { title: 'Hi' });

    expect(sendEachForMulticast).not.toHaveBeenCalled();
    expect(failures).toHaveLength(1);
    expect(failures[0]!.token).toBe(legacyToken);
    expect(isInvalidTokenError(failures[0]!.error.code)).toBe(true);
  });

  it('splits more than 500 installation ids into batches of at most 500', async () => {
    const sendEachForMulticast = vi.fn().mockResolvedValue({ responses: [] });
    vi.mocked(getMessaging).mockReturnValue({ sendEachForMulticast } as never);

    await sendToTokens(fidsOfLength(1201), { title: 'Hi' });

    const batchSizes = sendEachForMulticast.mock.calls.map(([message]) => message.fids.length);
    expect(batchSizes).toStrictEqual([500, 500, 201]);
  });

  it('does not call messaging when there are no recipients', async () => {
    const sendEachForMulticast = vi.fn();
    vi.mocked(getMessaging).mockReturnValue({ sendEachForMulticast } as never);

    await expect(sendToTokens([], { title: 'Hi' })).resolves.toStrictEqual([]);

    expect(sendEachForMulticast).not.toHaveBeenCalled();
  });

  it('maps failures back to the recipient from the batch they were sent in', async () => {
    const firstError = { code: 'messaging/installation-id-not-registered' };
    const secondError = { code: 'messaging/internal-error' };
    const fids = fidsOfLength(502);
    const sendEachForMulticast = vi
      .fn()
      .mockResolvedValueOnce({
        responses: fidsOfLength(500).map((_, index) =>
          index === 499 ? { success: false, error: firstError } : { success: true },
        ),
      })
      .mockResolvedValueOnce({
        responses: [{ success: false, error: secondError }, { success: true }],
      });
    vi.mocked(getMessaging).mockReturnValue({ sendEachForMulticast } as never);

    const failures = await sendToTokens(fids, { title: 'Hi' });

    expect(failures).toStrictEqual([
      { token: fids[499], error: firstError },
      { token: fids[500], error: secondError },
    ]);
  });
});
