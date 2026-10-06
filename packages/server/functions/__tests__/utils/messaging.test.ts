import { getMessaging } from 'firebase-admin/messaging';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { isInvalidTokenError, MULTICAST_BATCH_SIZE, sendToTokens } from '../../src/utils/messaging';

vi.mock('firebase-admin/messaging');

const tokensOfLength = (length: number) => Array.from({ length }, (_, index) => `token-${index}`);

describe('utils/messaging', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('recognizes invalid token error codes', () => {
    expect(isInvalidTokenError('messaging/invalid-registration-token')).toBe(true);
    expect(isInvalidTokenError('messaging/registration-token-not-registered')).toBe(true);
    expect(isInvalidTokenError('messaging/internal-error')).toBe(false);
  });

  it('sends a single batch when there are at most 500 tokens', async () => {
    const sendEachForMulticast = vi.fn().mockResolvedValue({ responses: [{ success: true }] });
    vi.mocked(getMessaging).mockReturnValue({ sendEachForMulticast } as never);

    const failures = await sendToTokens(tokensOfLength(MULTICAST_BATCH_SIZE), { title: 'Hi' });

    expect(failures).toStrictEqual([]);
    expect(sendEachForMulticast).toHaveBeenCalledTimes(1);
    expect(sendEachForMulticast.mock.calls[0]![0].tokens).toHaveLength(500);
    expect(sendEachForMulticast.mock.calls[0]![0].data).toStrictEqual({ title: 'Hi' });
  });

  it('splits more than 500 tokens into batches of at most 500', async () => {
    const sendEachForMulticast = vi.fn().mockResolvedValue({ responses: [] });
    vi.mocked(getMessaging).mockReturnValue({ sendEachForMulticast } as never);

    await sendToTokens(tokensOfLength(1201), { title: 'Hi' });

    const batchSizes = sendEachForMulticast.mock.calls.map(([message]) => message.tokens.length);
    expect(batchSizes).toStrictEqual([500, 500, 201]);
  });

  it('does not call messaging when there are no tokens', async () => {
    const sendEachForMulticast = vi.fn();
    vi.mocked(getMessaging).mockReturnValue({ sendEachForMulticast } as never);

    await expect(sendToTokens([], { title: 'Hi' })).resolves.toStrictEqual([]);

    expect(sendEachForMulticast).not.toHaveBeenCalled();
  });

  it('maps failures back to the token from the batch they were sent in', async () => {
    const firstError = { code: 'messaging/invalid-registration-token' };
    const secondError = { code: 'messaging/internal-error' };
    const sendEachForMulticast = vi
      .fn()
      .mockResolvedValueOnce({
        responses: tokensOfLength(500).map((_, index) =>
          index === 499 ? { success: false, error: firstError } : { success: true },
        ),
      })
      .mockResolvedValueOnce({
        responses: [{ success: false, error: secondError }, { success: true }],
      });
    vi.mocked(getMessaging).mockReturnValue({ sendEachForMulticast } as never);

    const failures = await sendToTokens(tokensOfLength(502), { title: 'Hi' });

    expect(failures).toStrictEqual([
      { token: 'token-499', error: firstError },
      { token: 'token-500', error: secondError },
    ]);
  });
});
