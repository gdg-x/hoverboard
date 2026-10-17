import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import GithubSlugger from 'github-slugger';
import { marked, type Token, type Tokens } from 'marked';
import { dirname, extname, join, relative, resolve } from 'path';
import { describe, expect, it } from 'vitest';
import { findRepoRoot } from '../utils/node-version.js';

const REPO_ROOT = findRepoRoot(process.cwd())!;

/** Stubs left at pre-reorganization paths until stage 8 adds site redirects. */
const STUB_PATHS = new Set([
  'docs/releases.md',
  'docs/tutorials/00-set-up.md',
  'docs/tutorials/01-configure-app.md',
  'docs/tutorials/02-firebase.md',
  'docs/tutorials/03-styling.md',
  'docs/tutorials/04-deploy.md',
  'docs/tutorials/05-notifications.md',
  'docs/tutorials/06-security.md',
  'docs/tutorials/07-next-edition.md',
  'docs/tutorials/08-run-your-event.md',
  'docs/tutorials/firebase-utils.md',
]);

const SKIP_DIRS = new Set(['.git', '.firebase', 'dist', 'node_modules', 'scratch', 'test-results']);

const walkFiles = (dir: string, predicate: (relPath: string) => boolean): string[] => {
  if (!existsSync(dir)) return [];
  const results: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const fullPath = join(dir, entry.name);
    const relPath = relative(REPO_ROOT, fullPath).replaceAll('\\', '/');
    if (entry.isDirectory()) {
      results.push(...walkFiles(fullPath, predicate));
    } else if (entry.isFile() && predicate(relPath)) {
      results.push(relPath);
    }
  }
  return results.sort();
};

const plainHeadingText = (token: Token): string => {
  if ('tokens' in token && Array.isArray(token.tokens) && token.tokens.length > 0) {
    return token.tokens.map(plainHeadingText).join('');
  }
  if ('text' in token && typeof token.text === 'string') {
    return token.text;
  }
  return '';
};

/** Extracts the GitHub heading slugs of a Markdown string. */
export const extractHeadingSlugs = (markdown: string): Set<string> => {
  const slugger = new GithubSlugger();
  const slugs = new Set<string>();
  const tokens = marked.lexer(markdown);
  void marked.walkTokens(tokens, (token) => {
    if (token.type === 'heading') {
      slugs.add(slugger.slug(plainHeadingText(token)));
    }
  });
  return slugs;
};

interface MarkdownLink {
  href: string;
  line: number;
}

const lineNumberAt = (content: string, index: number): number => {
  let line = 1;
  for (let i = 0; i < index && i < content.length; i++) {
    if (content.charCodeAt(i) === 10) line++;
  }
  return line;
};

/** Parses relative links and images from Markdown using marked's lexer (ignoring code blocks). */
export const extractMarkdownLinks = (markdown: string): MarkdownLink[] => {
  const tokens = marked.lexer(markdown);
  const links: MarkdownLink[] = [];
  let searchFrom = 0;
  void marked.walkTokens(tokens, (token) => {
    if (!isLinkOrImage(token)) return;
    const href = token.href.trim();
    if (
      /^(?:https?:|mailto:|tel:)/i.test(href) ||
      href.includes('{{') ||
      href.startsWith('data:')
    ) {
      return;
    }
    const raw = token.raw;
    let found = markdown.indexOf(raw, searchFrom);
    if (found === -1) found = markdown.indexOf(href, searchFrom);
    if (found === -1) found = markdown.indexOf(href);
    if (found !== -1) searchFrom = found + 1;
    links.push({
      href,
      line: found === -1 ? 1 : lineNumberAt(markdown, found),
    });
  });
  return links;
};

const isLinkOrImage = (token: Token): token is Tokens.Link | Tokens.Image =>
  token.type === 'link' || token.type === 'image';

const DOCS_REF_PATTERN = /(?:^|[\s('"`]|(?:\.\.\/)+)(docs\/[A-Za-z0-9_./-]+(?:#[A-Za-z0-9_-]+)?)/g;

/** Extracts `docs/...` paths (with optional `#anchor`) from source code or workflow files. */
export const extractCodeDocRefs = (source: string): MarkdownLink[] => {
  const refs: MarkdownLink[] = [];
  const lines = source.split('\n');
  lines.forEach((text, index) => {
    for (const match of text.matchAll(DOCS_REF_PATTERN)) {
      const raw = match[1]!.replace(/[.,;:]+$/, '');
      if (raw.includes('<') || raw.includes('*')) continue;
      refs.push({ href: raw, line: index + 1 });
    }
  });
  return refs;
};

export interface RepoSnapshot {
  exists: (relPath: string) => boolean;
  isDirectory: (relPath: string) => boolean;
  readMarkdown: (relPath: string) => string;
  isStub?: (relPath: string) => boolean;
}

const createRepoSnapshot = (root: string): RepoSnapshot => {
  const markdownCache = new Map<string, string>();
  return {
    exists: (relPath) => existsSync(join(root, relPath)),
    isDirectory: (relPath) => {
      const full = join(root, relPath);
      return existsSync(full) && statSync(full).isDirectory();
    },
    readMarkdown: (relPath) => {
      let cached = markdownCache.get(relPath);
      if (cached === undefined) {
        cached = readFileSync(join(root, relPath), 'utf8');
        markdownCache.set(relPath, cached);
      }
      return cached;
    },
    isStub: (relPath) => STUB_PATHS.has(relPath),
  };
};

const resolveTargetRelPath = (fromFile: string, pathPart: string, repo: RepoSnapshot): string => {
  if (!pathPart) return fromFile;
  if (pathPart.startsWith('/')) {
    const trimmed = pathPart.slice(1);
    if (fromFile.startsWith('packages/demo-config/content/')) {
      const demoPublic = `packages/demo-config/public/${trimmed}`;
      if (repo.exists(demoPublic)) return demoPublic;
      const webPublic = `packages/web/public/${trimmed}`;
      if (repo.exists(webPublic)) return webPublic;
    }
    return trimmed;
  }
  const absTarget = resolve(REPO_ROOT, dirname(fromFile), pathPart);
  return relative(REPO_ROOT, absTarget).replaceAll('\\', '/');
};

/** Validates a link from `fromFile` at `line`, returning an error string if broken. */
export const checkLinkTarget = (
  fromFile: string,
  link: MarkdownLink,
  repo: RepoSnapshot,
  headingCache = new Map<string, Set<string>>(),
): string | undefined => {
  const [rawPath = '', anchor] = link.href.split('#', 2);
  let targetRel = resolveTargetRelPath(fromFile, rawPath, repo);

  if (repo.isDirectory(targetRel)) {
    const readmeCandidate = `${targetRel.replace(/\/$/, '')}/README.md`;
    if (targetRel.startsWith('docs/sample-data') || targetRel.startsWith('docs/images')) {
      return undefined;
    }
    if (repo.exists(readmeCandidate)) {
      targetRel = readmeCandidate;
    }
  }

  if (!repo.exists(targetRel)) {
    return `${fromFile}:${link.line}: ${link.href} (missing ${targetRel})`;
  }

  if (repo.isStub?.(targetRel)) {
    return `${fromFile}:${link.line}: ${link.href} (points to moved stub ${targetRel})`;
  }

  if (anchor !== undefined) {
    if (extname(targetRel) !== '.md') {
      return `${fromFile}:${link.line}: ${link.href} (anchor on non-Markdown file ${targetRel})`;
    }
    let slugs = headingCache.get(targetRel);
    if (!slugs) {
      slugs = extractHeadingSlugs(repo.readMarkdown(targetRel));
      headingCache.set(targetRel, slugs);
    }
    if (!slugs.has(anchor)) {
      return `${fromFile}:${link.line}: ${link.href} (missing heading #${anchor} in ${targetRel})`;
    }
  }

  return undefined;
};

describe('documentation links', () => {
  const repo = createRepoSnapshot(REPO_ROOT);
  const headingCache = new Map<string, Set<string>>();

  it('resolves every relative link and heading anchor in tracked Markdown files', () => {
    const markdownFiles = walkFiles(
      REPO_ROOT,
      (relPath) =>
        relPath.endsWith('.md') && relPath !== 'CHANGELOG.md' && !STUB_PATHS.has(relPath),
    );
    expect(markdownFiles.length).toBeGreaterThan(20);

    const failures: string[] = [];
    for (const file of markdownFiles) {
      const content = repo.readMarkdown(file);
      for (const link of extractMarkdownLinks(content)) {
        const failure = checkLinkTarget(file, link, repo, headingCache);
        if (failure) failures.push(failure);
      }
    }
    expect(failures).toEqual([]);
  });

  it('keeps stubs at the old tutorial and release paths pointing to existing pages', () => {
    const failures: string[] = [];
    for (const stub of STUB_PATHS) {
      if (!repo.exists(stub)) {
        failures.push(`${stub}: missing stub file`);
        continue;
      }
      const links = extractMarkdownLinks(repo.readMarkdown(stub));
      if (!links.length) {
        failures.push(`${stub}: stub has no target link`);
      }
      for (const link of links) {
        const failure = checkLinkTarget(stub, link, repo, headingCache);
        if (failure) failures.push(failure);
      }
    }
    expect(failures).toEqual([]);
  });

  it('resolves every docs/... reference in packages, functions and workflows', () => {
    const roots = [
      ...readdirSync(join(REPO_ROOT, 'packages'), { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => join(REPO_ROOT, 'packages', entry.name, 'src')),
      join(REPO_ROOT, 'packages/server/functions/src'),
      join(REPO_ROOT, '.github/workflows'),
    ];

    const files = roots.flatMap((dir) =>
      walkFiles(
        dir,
        (relPath) =>
          /\.(?:ts|js|mjs|yaml|yml)$/.test(relPath) && !relPath.endsWith('links.test.ts'),
      ),
    );
    expect(files.length).toBeGreaterThan(20);

    const failures: string[] = [];
    for (const file of files) {
      const content = readFileSync(join(REPO_ROOT, file), 'utf8');
      for (const ref of extractCodeDocRefs(content)) {
        const failure = checkLinkTarget('README.md', ref, repo, headingCache)?.replace(
          /^README\.md:/,
          `${file}:`,
        );
        if (failure) failures.push(failure);
      }
    }
    expect(failures).toEqual([]);
  });

  it('lists every non-stub page in docs/ in docs/README.md', () => {
    const docPages = walkFiles(
      join(REPO_ROOT, 'docs'),
      (relPath) =>
        relPath.endsWith('.md') && relPath !== 'docs/README.md' && !STUB_PATHS.has(relPath),
    );
    const indexLinks = new Set(
      extractMarkdownLinks(repo.readMarkdown('docs/README.md'))
        .map(({ href }) => resolveTargetRelPath('docs/README.md', href.split('#')[0]!, repo))
        .filter((target) => target.startsWith('docs/')),
    );
    const missing = docPages.filter((page) => !indexLinks.has(page));
    expect(missing).toEqual([]);
  });

  it('fails on a broken file link, a broken anchor, and a non-existent or moved docs/... path in code', () => {
    const fakeRepo: RepoSnapshot = {
      exists: (relPath) => relPath === 'docs/guides/deploy.md',
      isDirectory: () => false,
      readMarkdown: () => '# Deploy\n\n## Custom domain\n',
      isStub: (relPath) => STUB_PATHS.has(relPath),
    };

    expect(
      checkLinkTarget('docs/README.md', { href: 'guides/missing.md', line: 12 }, fakeRepo),
    ).toBe('docs/README.md:12: guides/missing.md (missing docs/guides/missing.md)');

    expect(
      checkLinkTarget(
        'docs/README.md',
        { href: 'guides/deploy.md#no-such-heading', line: 18 },
        fakeRepo,
      ),
    ).toBe(
      'docs/README.md:18: guides/deploy.md#no-such-heading (missing heading #no-such-heading in docs/guides/deploy.md)',
    );

    expect(
      checkLinkTarget(
        'docs/README.md',
        { href: 'guides/deploy.md#custom-domain', line: 19 },
        fakeRepo,
      ),
    ).toBeUndefined();

    const codeRefs = extractCodeDocRefs(
      "console.log('See docs/tutorials/04-deploy.md and docs/guides/nope.md#anchor.');",
    );
    expect(codeRefs).toEqual([
      { href: 'docs/tutorials/04-deploy.md', line: 1 },
      { href: 'docs/guides/nope.md#anchor', line: 1 },
    ]);
    expect(checkLinkTarget('README.md', codeRefs[0]!, repo)).toContain(
      'points to moved stub docs/tutorials/04-deploy.md',
    );
    expect(checkLinkTarget('README.md', codeRefs[1]!, fakeRepo)).toBe(
      'README.md:1: docs/guides/nope.md#anchor (missing docs/guides/nope.md)',
    );
  });
});
