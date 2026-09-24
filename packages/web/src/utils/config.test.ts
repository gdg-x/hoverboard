import { afterEach, describe, expect, it } from 'vitest';
import { CONFIG, getConfig } from './config';

describe('getConfig', () => {
  afterEach(() => {
    document.head.innerHTML = '';
  });

  it('returns the content of the matching meta tag', () => {
    const meta = document.createElement('meta');
    meta.name = `config-${CONFIG.BASEPATH}`;
    meta.content = '/basepath';
    document.head.appendChild(meta);

    expect(getConfig(CONFIG.BASEPATH)).toBe('/basepath');
  });

  it('throws when the meta tag is missing', () => {
    expect(() => getConfig(CONFIG.URL)).toThrow(
      `Config ${CONFIG.URL} is missing or doesn't have a value`,
    );
  });

  it('throws when the meta tag has an empty value', () => {
    const meta = document.createElement('meta');
    meta.name = `config-${CONFIG.GOOGLE_MAPS_API_KEY}`;
    document.head.appendChild(meta);

    expect(() => getConfig(CONFIG.GOOGLE_MAPS_API_KEY)).toThrow(
      `Config ${CONFIG.GOOGLE_MAPS_API_KEY} is missing or doesn't have a value`,
    );
  });
});
