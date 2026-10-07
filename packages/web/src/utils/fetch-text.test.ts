import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchText } from './fetch-text';

const fetchMock = vi.fn<typeof fetch>();

describe('fetchText', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  const respond = (body: string, init?: ResponseInit) => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockResolvedValue(new Response(body, init));
  };

  it('returns the response text', async () => {
    respond('# Title', { headers: { 'content-type': 'text/markdown' } });

    await expect(fetchText('/post.md')).resolves.toBe('# Title');
    expect(fetchMock).toHaveBeenCalledWith('/post.md');
  });

  it('rejects when the response is not ok', async () => {
    respond('missing', { status: 404 });

    await expect(fetchText('/post.md')).rejects.toThrow('Failed to load /post.md: 404');
  });

  it('rejects when a missing file is rewritten to the HTML app shell', async () => {
    respond('<html></html>', { headers: { 'content-type': 'text/html; charset=utf-8' } });

    await expect(fetchText('/post.md')).rejects.toThrow('Failed to load /post.md: received HTML');
  });
});
