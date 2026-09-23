import { getFirestore } from 'firebase-admin/firestore';
import * as functions from 'firebase-functions';
import fetch from 'node-fetch';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mailchimpSubscribe } from '../src/mailchimp-subscribe';

vi.mock('firebase-admin/firestore');
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

const mockFetchResponse = (body: Record<string, unknown>) => {
  vi.mocked(fetch).mockResolvedValue({ json: () => Promise.resolve(body) } as never);
};

const mockSnapshot = (subscriber: Record<string, unknown>) => ({
  data: () => subscriber,
});

describe('mailchimpSubscribe', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('subscribes a new user to the configured Mailchimp list', async () => {
    mockConfigDoc({ dc: 'us1', listid: 'abc123', apikey: 'key-us1' });
    mockFetchResponse({ status: 'subscribed' });
    const logSpy = vi.spyOn(functions.logger, 'log').mockImplementation(() => undefined);

    await mailchimpSubscribe.run(
      mockSnapshot({ email: 'ada@example.com', firstName: 'Ada', lastName: 'Lovelace' }) as never,
      {} as never,
    );

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
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ status: 400, title: 'Member Exists' }),
      } as never)
      .mockResolvedValueOnce({ json: () => Promise.resolve({ status: 'updated' }) } as never);
    const logSpy = vi.spyOn(functions.logger, 'log').mockImplementation(() => undefined);

    await mailchimpSubscribe.run(
      mockSnapshot({ email: 'ada@example.com', firstName: 'Ada', lastName: 'Lovelace' }) as never,
      {} as never,
    );

    expect(fetch).toHaveBeenCalledTimes(2);
    const [secondUrl, secondOptions] = vi.mocked(fetch).mock.calls[1]!;
    expect(secondUrl).toMatch(
      /^https:\/\/us1\.api\.mailchimp\.com\/3\.0\/lists\/abc123\/members\/[a-f0-9]{32}$/,
    );
    expect(secondOptions).toMatchObject({ method: 'PATCH' });
    expect(logSpy).toHaveBeenCalledWith('ada@example.com was updated in subscribe list.');
  });

  it('logs an error and still attempts to subscribe when the Mailchimp config is missing', async () => {
    mockConfigDoc(undefined);
    mockFetchResponse({ status: 'subscribed' });
    const errorLogSpy = vi.spyOn(functions.logger, 'log').mockImplementation(() => undefined);

    await mailchimpSubscribe.run(
      mockSnapshot({ email: 'ada@example.com', firstName: 'Ada', lastName: 'Lovelace' }) as never,
      {} as never,
    );

    expect(errorLogSpy).toHaveBeenCalledWith("Can't subscribe user, Mailchimp config is empty.");
  });

  it('logs an error when the Mailchimp request fails', async () => {
    mockConfigDoc({ dc: 'us1', listid: 'abc123', apikey: 'key-us1' });
    vi.mocked(fetch).mockRejectedValue(new Error('network down'));
    const errorSpy = vi.spyOn(functions.logger, 'error').mockImplementation(() => undefined);

    await mailchimpSubscribe.run(
      mockSnapshot({ email: 'ada@example.com', firstName: 'Ada', lastName: 'Lovelace' }) as never,
      {} as never,
    );

    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Error occured during Mailchimp subscription:'),
    );
  });
});
