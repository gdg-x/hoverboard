import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';
import { SAFE_URL_PATTERN, safeUrl } from './safe-url';

describe('safeUrl', () => {
  it.each([
    'https://example.com/a?b#c',
    'http://example.com',
    'mailto:ada@example.com',
    '/schedule',
    '#top',
    'images/logo.svg',
    '../images/logo.svg',
    '',
  ])('keeps %j', (url) => {
    expect(safeUrl(url)).toBe(url);
  });

  it.each([
    'javascript:alert(1)',
    'JavaScript:alert(1)',
    ' javascript:alert(1)',
    '\u0001javascript:alert(1)',
    'java\tscript:alert(1)',
    'java\nscript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'vbscript:msgbox(1)',
    '//evil.example',
    undefined,
    null,
  ])('drops %j', (url) => {
    expect(safeUrl(url)).toBeUndefined();
  });

  it.each([
    'packages/storage/schemas/content.schema.json',
    'packages/web/schemas/resources.schema.json',
    'packages/web/schemas/site.schema.json',
  ])('matches the link pattern in %s', (file) => {
    const schema = JSON.parse(readFileSync(join(process.cwd(), file), 'utf8')) as {
      $defs: { link: { pattern: string } };
    };
    expect(schema.$defs.link.pattern).toBe(SAFE_URL_PATTERN);
  });
});
