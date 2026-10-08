import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  goto,
  postPath,
  previousSpeakerPath,
  routeNameFor,
  sessionPath,
  speakerPath,
} from './navigation';

describe('routeNameFor', () => {
  it('returns "home" for the root path', () => {
    expect(routeNameFor('/')).toBe('home');
    expect(routeNameFor('')).toBe('home');
  });

  it('returns the first path segment', () => {
    expect(routeNameFor('/blog')).toBe('blog');
    expect(routeNameFor('/schedule/2026-10-08')).toBe('schedule');
    expect(routeNameFor('/faq')).toBe('faq');
  });

  it('selects the schedule for sessions and the speakers for previous speakers', () => {
    expect(routeNameFor('/sessions/123')).toBe('schedule');
    expect(routeNameFor('/previous-speakers/jane-doe')).toBe('speakers');
  });
});

describe('paths', () => {
  it('builds the path of each detail page', () => {
    expect(postPath('my-post')).toBe('/blog/my-post');
    expect(sessionPath('1')).toBe('/sessions/1');
    expect(speakerPath('ada')).toBe('/speakers/ada');
    expect(previousSpeakerPath('ada')).toBe('/previous-speakers/ada');
  });

  it('encodes the id', () => {
    expect(postPath('a b/c')).toBe('/blog/a%20b%2Fc');
  });
});

describe('goto', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('loads the page', () => {
    const assign = vi.fn();
    vi.stubGlobal('location', { assign });

    goto('/404');

    expect(assign).toHaveBeenCalledWith('/404');
  });
});
