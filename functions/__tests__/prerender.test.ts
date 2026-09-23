import { getFirestore } from 'firebase-admin/firestore';
import fetch from 'node-fetch';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { prerender } from '../src/prerender';

vi.mock('firebase-admin/firestore');
vi.mock('node-fetch');

const mockConfig = (siteDomain: string, rendertronServer: string) => {
  vi.mocked(getFirestore).mockReturnValue({
    collection: vi.fn().mockReturnValue({
      doc: vi.fn().mockImplementation((docId: string) => ({
        get: vi.fn().mockResolvedValue({
          data: () => (docId === 'site' ? { domain: siteDomain } : { server: rendertronServer }),
        }),
      })),
    }),
  } as never);
};

// `prerender` is the express app tagged as an HttpsFunction by
// `functions.https.onRequest(app)`; it is directly callable as (req, res).
const mockReq = (userAgent: string) => ({
  method: 'GET',
  url: '/talks/some-talk',
  originalUrl: '/talks/some-talk',
  protocol: 'https',
  headers: { 'user-agent': userAgent },
});

// Express re-assigns req/res prototypes internally, but our own properties
// (set as own-properties below) still shadow the prototype's implementations,
// so plain vi.fn() stubs are sufficient without a real HTTP server.
const mockRes = () => ({
  setHeader: vi.fn(),
  set: vi.fn(),
  send: vi.fn(),
  sendFile: vi.fn(),
});

// Waits for the fire-and-forget fetch().then().then() chain inside the bot
// branch of prerender.ts to flush.
const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

describe('prerender', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('serves the PWA shell directly for non-bot user agents', async () => {
    mockConfig('example.com', 'https://rendertron.example.com');
    const req = mockReq('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)');
    const res = mockRes();

    await prerender(req as never, res as never);

    expect(res.sendFile).toHaveBeenCalledWith(expect.stringContaining('index.html'));
    expect(fetch).not.toHaveBeenCalled();
  });

  it('renders through rendertron for known link bots', async () => {
    mockConfig('example.com', 'https://rendertron.example.com');
    vi.mocked(fetch).mockResolvedValue({
      text: () => Promise.resolve('<html>prerendered</html>'),
    } as never);
    const req = mockReq('facebookexternalhit/1.1');
    const res = mockRes();

    await prerender(req as never, res as never);
    await flushPromises();

    // Known pre-existing bug: `generateUrl(req)` is called without `await` in
    // prerender.ts, so the un-resolved Promise is stringified into the URL.
    expect(fetch).toHaveBeenCalledWith('https://rendertron.example.com/render/[object Promise]');
    expect(res.set).toHaveBeenCalledWith('Cache-Control', 'public, max-age=300, s-maxage=600');
    expect(res.set).toHaveBeenCalledWith('Vary', 'User-Agent');
    expect(res.send).toHaveBeenCalledWith('<html>prerendered</html>');
    expect(res.sendFile).not.toHaveBeenCalled();
  });

  it('treats user agents not on the bot list as regular visitors', async () => {
    mockConfig('example.com', 'https://rendertron.example.com');
    const req = mockReq('curl/8.0.1');
    const res = mockRes();

    await prerender(req as never, res as never);

    expect(res.sendFile).toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });
});
