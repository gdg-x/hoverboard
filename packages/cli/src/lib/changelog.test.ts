import { describe, expect, it } from 'vitest';
import { compareVersions, releaseNotes } from './changelog.js';

const CHANGELOG = `# Changelog

## [5.0.0](https://github.com/gdg-x/hoverboard/compare/v4.1.0...v5.0.0) (2028-01-01)


### ⚠ BREAKING CHANGES

* **web:** rename \`heroSettings\`

### Features

* **web:** add a page

## [4.1.0](https://github.com/gdg-x/hoverboard/compare/v4.0.0...v4.1.0) (2027-11-01)


### Bug Fixes

* **cli:** fix a thing

## [4.0.0](https://github.com/gdg-x/hoverboard/compare/v3.1.0...v4.0.0) (2027-10-01)

### Features

* the old release
`;

describe('compareVersions', () => {
  it('compares major, minor and patch as numbers', () => {
    expect(compareVersions('4.10.0', 'v4.9.1')).toBeGreaterThan(0);
    expect(compareVersions('v4.0.0', '4.0.0')).toBe(0);
    expect(compareVersions('3.1.0', '4.0.0')).toBeLessThan(0);
  });
});

describe('releaseNotes', () => {
  it('lists the releases after the current one, with the breaking changes first', () => {
    const notes = releaseNotes(CHANGELOG, '4.0.0', '5.0.0');

    expect(notes.indexOf('Breaking changes:')).toBe(0);
    expect(notes).toContain('v5.0.0\n### ⚠ BREAKING CHANGES\n\n* **web:** rename `heroSettings`');
    expect(notes).toContain('v4.1.0\n### Bug Fixes\n\n* **cli:** fix a thing');
    expect(notes).not.toContain('the old release');
  });

  it('stops at the target release', () => {
    const notes = releaseNotes(CHANGELOG, '4.0.0', '4.1.0');

    expect(notes).not.toContain('Breaking');
    expect(notes).not.toContain('v5.0.0');
  });
});
