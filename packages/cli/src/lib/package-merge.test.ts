import { describe, expect, it } from 'vitest';
import { mergePackageJson } from './package-merge.js';

describe('mergePackageJson', () => {
  const base = {
    name: 'web',
    version: '4.0.0',
    scripts: { build: 'astro build', test: 'vitest' },
    dependencies: { astro: '^7.0.0', lit: '^3.0.0', old: '^1.0.0' },
  };

  it("takes the release's version and dependencies, and keeps the ones only the fork added", () => {
    const ours = {
      ...base,
      dependencies: { astro: '^7.0.0', lit: '^3.1.0', old: '^1.0.0', widget: '^2.0.0' },
    };
    const theirs = {
      ...base,
      version: '4.1.0',
      dependencies: { astro: '^7.1.0', lit: '^3.0.0', 'new-dep': '^1.0.0' },
    };

    expect(mergePackageJson(base, ours, theirs)).toEqual({
      merged: {
        ...base,
        version: '4.1.0',
        dependencies: {
          astro: '^7.1.0',
          lit: '^3.0.0',
          'new-dep': '^1.0.0',
          widget: '^2.0.0',
        },
      },
      conflicts: [],
      reverted: ['dependencies.lit: ^3.1.0 to ^3.0.0'],
    });
  });

  it('keeps a dependency the fork removed, removed', () => {
    const ours = { ...base, dependencies: { astro: '^7.0.0', lit: '^3.0.0' } };

    expect(mergePackageJson(base, ours, base).merged['dependencies']).toEqual({
      astro: '^7.0.0',
      lit: '^3.0.0',
    });
  });

  it('takes the side that changed other keys, and reports keys both changed', () => {
    const ours = { ...base, scripts: { ...base.scripts, lint: 'eslint .', test: 'vitest run' } };
    const theirs = { ...base, scripts: { ...base.scripts, build: 'astro build --x', test: 'vt' } };

    const { merged, conflicts } = mergePackageJson(base, ours, theirs);

    expect(merged['scripts']).toEqual({
      build: 'astro build --x',
      test: 'vitest run',
      lint: 'eslint .',
    });
    expect(conflicts).toEqual(['scripts.test']);
  });
});
