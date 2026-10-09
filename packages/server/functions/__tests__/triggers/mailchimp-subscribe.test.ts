import { getFirestore } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mailchimpSubscribe } from '../../src/triggers/mailchimp-subscribe';
import { expectNoPersonalDataLogged } from '../personal-data';

vi.mock('firebase-admin/firestore');
vi.mock('firebase-functions/logger');

const mockConfigDoc = (data: Record<string, unknown> | undefined) => {
  vi.mocked(getFirestore).mockReturnValue({
    collection: vi.fn().mockReturnValue({
      doc: vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue({
          exists: data !== undefined,
          data: () => data,
        }),
      }),
    }),
  } as never);
};

const mockFetchResponse = (body: Record<string, unknown>, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: () => Promise.resolve(body),
});

const mockFetchOnce = (body: Record<string, unknown>, status = 200) => {
  vi.mocked(fetch).mockResolvedValueOnce(mockFetchResponse(body, status) as never);
};

const subscriberEvent = {
  data: { data: () => ({ email: 'ada@example.com', firstName: 'Ada', lastName: 'Lovelace' }) },
  params: {},
} as never;

const mockSnapshot = (subscriber: Record<string, unknown>) => ({
  data: () => subscriber,
});

describe('mailchimpSubscribe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  // Runs before the restore above, which removes the spies' calls.
  afterEach(expectNoPersonalDataLogged);

  it('adds a new user to the configured Mailchimp list as pending, so Mailchimp asks them to confirm', async () => {
    mockConfigDoc({ dc: 'us1', listid: 'abc123', apikey: 'key-us1' });
    mockFetchOnce({ status: 'pending' });
    const logSpy = vi.spyOn(logger, 'log').mockImplementation(() => undefined);

    await mailchimpSubscribe.run({
      data: mockSnapshot({ email: 'ada@example.com', firstName: 'Ada', lastName: 'Lovelace' }),
      params: {},
    } as never);

    expect(fetch).toHaveBeenCalledWith(
      'https://us1.api.mailchimp.com/3.0/lists/abc123/members',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          email_address: 'ada@example.com',
          status: 'pending',
          merge_fields: { FNAME: 'Ada', LNAME: 'Lovelace' },
        }),
        headers: expect.objectContaining({ Authorization: 'apiKey key-us1' }),
      }),
    );
    expect(logSpy).toHaveBeenCalledWith(
      'Added subscriber b5fc85e557 to the subscribe list. Mailchimp asks them to confirm.',
    );
  });

  it('leaves a member who is already on the list as they are', async () => {
    mockConfigDoc({ dc: 'us1', listid: 'abc123', apikey: 'key-us1' });
    mockFetchOnce({ status: 400, title: 'Member Exists' }, 400);
    const logSpy = vi.spyOn(logger, 'log').mockImplementation(() => undefined);
    const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => undefined);

    await mailchimpSubscribe.run(subscriberEvent);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(logSpy).toHaveBeenCalledWith(
      'Left subscriber b5fc85e557 as is, since they are already on the subscribe list.',
    );
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('logs and skips subscribing when the Mailchimp config is missing', async () => {
    mockConfigDoc(undefined);
    const errorLogSpy = vi.spyOn(logger, 'log').mockImplementation(() => undefined);

    await mailchimpSubscribe.run({
      data: mockSnapshot({ email: 'ada@example.com', firstName: 'Ada', lastName: 'Lovelace' }),
      params: {},
    } as never);

    expect(errorLogSpy).toHaveBeenCalledWith(
      expect.stringContaining("Can't subscribe user, Mailchimp is not configured."),
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it('logs and skips subscribing when the Mailchimp config has empty values', async () => {
    mockConfigDoc({ dc: '', listid: '', apikey: '' });
    const logSpy = vi.spyOn(logger, 'log').mockImplementation(() => undefined);

    await mailchimpSubscribe.run(subscriberEvent);

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining("Can't subscribe user, Mailchimp is not configured."),
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it('propagates network failures so the invocation can be retried', async () => {
    mockConfigDoc({ dc: 'us1', listid: 'abc123', apikey: 'key-us1' });
    vi.mocked(fetch).mockRejectedValue(new Error('network down'));

    await expect(mailchimpSubscribe.run(subscriberEvent)).rejects.toThrow('network down');
  });

  it.each([429, 500, 503])('throws on retryable HTTP status %i', async (status) => {
    mockConfigDoc({ dc: 'us1', listid: 'abc123', apikey: 'key-us1' });
    mockFetchOnce({ title: 'Service Unavailable', detail: 'try later' }, status);

    const error = await mailchimpSubscribe.run(subscriberEvent).catch((e: Error) => e);

    // The runtime logs the thrown error, so it must not hold the email either.
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toBe(
      `Mailchimp POST failed for subscriber b5fc85e557 with status ${status}: Service Unavailable try later`,
    );
  });

  it('logs an error without retrying on non-retryable HTTP failures', async () => {
    mockConfigDoc({ dc: 'us1', listid: 'abc123', apikey: 'key-us1' });
    mockFetchOnce(
      { title: 'Invalid Resource', detail: 'ada@example.com looks fake or invalid' },
      400,
    );
    const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => undefined);
    const logSpy = vi.spyOn(logger, 'log').mockImplementation(() => undefined);

    await mailchimpSubscribe.run(subscriberEvent);

    expect(errorSpy).toHaveBeenCalledWith(
      'Mailchimp POST failed for subscriber b5fc85e557 with status 400: Invalid Resource <email> looks fake or invalid',
    );
    expect(logSpy).not.toHaveBeenCalled();
  });
});
