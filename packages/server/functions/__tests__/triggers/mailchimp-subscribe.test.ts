import { getFirestore } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';
import fetch from 'node-fetch';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mailchimpSubscribe } from '../../src/triggers/mailchimp-subscribe';

vi.mock('firebase-admin/firestore');
vi.mock('firebase-functions/logger');
vi.mock('node-fetch');

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
    vi.mocked(fetch).mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('subscribes a new user to the configured Mailchimp list', async () => {
    mockConfigDoc({ dc: 'us1', listid: 'abc123', apikey: 'key-us1' });
    mockFetchOnce({ status: 'subscribed' });
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
          status: 'subscribed',
          merge_fields: { FNAME: 'Ada', LNAME: 'Lovelace' },
        }),
        headers: expect.objectContaining({ Authorization: 'apiKey key-us1' }),
      }),
    );
    expect(logSpy).toHaveBeenCalledWith('ada@example.com was added to subscribe list.');
  });

  it('retries as a PATCH against the member hash when the member already exists', async () => {
    mockConfigDoc({ dc: 'us1', listid: 'abc123', apikey: 'key-us1' });
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        mockFetchResponse({ status: 400, title: 'Member Exists' }, 400) as never,
      )
      .mockResolvedValueOnce(mockFetchResponse({ status: 'updated' }) as never);
    const logSpy = vi.spyOn(logger, 'log').mockImplementation(() => undefined);

    await mailchimpSubscribe.run({
      data: mockSnapshot({ email: 'ada@example.com', firstName: 'Ada', lastName: 'Lovelace' }),
      params: {},
    } as never);

    expect(fetch).toHaveBeenCalledTimes(2);
    const [secondUrl, secondOptions] = vi.mocked(fetch).mock.calls[1]!;
    expect(secondUrl).toMatch(
      /^https:\/\/us1\.api\.mailchimp\.com\/3\.0\/lists\/abc123\/members\/[a-f0-9]{32}$/,
    );
    expect(secondOptions).toMatchObject({ method: 'PATCH' });
    expect(logSpy).toHaveBeenCalledWith('ada@example.com was updated in subscribe list.');
  });

  it('logs and skips subscribing when the Mailchimp config is missing', async () => {
    mockConfigDoc(undefined);
    const errorLogSpy = vi.spyOn(logger, 'log').mockImplementation(() => undefined);

    await mailchimpSubscribe.run({
      data: mockSnapshot({ email: 'ada@example.com', firstName: 'Ada', lastName: 'Lovelace' }),
      params: {},
    } as never);

    expect(errorLogSpy).toHaveBeenCalledWith("Can't subscribe user, Mailchimp config is empty.");
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

    await expect(mailchimpSubscribe.run(subscriberEvent)).rejects.toThrow(
      `with status ${status}: Service Unavailable try later`,
    );
  });

  it('logs an error without retrying on non-retryable HTTP failures', async () => {
    mockConfigDoc({ dc: 'us1', listid: 'abc123', apikey: 'key-us1' });
    mockFetchOnce({ title: 'Invalid Resource', detail: 'bad email' }, 400);
    const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => undefined);
    const logSpy = vi.spyOn(logger, 'log').mockImplementation(() => undefined);

    await mailchimpSubscribe.run(subscriberEvent);

    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('with status 400: Invalid Resource bad email'),
    );
    expect(logSpy).not.toHaveBeenCalled();
  });

  it('does not loop when the PATCH for an existing member also reports Member Exists', async () => {
    mockConfigDoc({ dc: 'us1', listid: 'abc123', apikey: 'key-us1' });
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ status: 400, title: 'Member Exists' }, 400) as never,
    );
    const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => undefined);

    await mailchimpSubscribe.run(subscriberEvent);

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(errorSpy).toHaveBeenCalled();
  });
});
