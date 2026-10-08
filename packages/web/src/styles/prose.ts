import { css } from 'lit';

/** Long-form text from markdown: blog posts, the FAQ and the code of conduct. */
export const prose = css`
  .prose {
    max-inline-size: var(--hb-prose-max);
    color: var(--hb-color-on-surface);
    font-size: var(--hb-text-lg);
    line-height: 1.7;
    overflow-wrap: break-word;
  }

  .prose > :first-child {
    margin-block-start: 0;
  }

  .prose h2 {
    margin: var(--hb-space-8) 0 var(--hb-space-4);
    padding: 0;
    font: 800 var(--hb-text-2xl) / 1.2 var(--hb-font-display);
    text-wrap: balance;
  }

  .prose h3 {
    margin: var(--hb-space-6) 0 var(--hb-space-3);
    padding: 0;
    font: 700 var(--hb-text-xl) / 1.3 var(--hb-font-body);
  }

  .prose h4 {
    margin: var(--hb-space-5) 0 var(--hb-space-2);
    font: 700 var(--hb-text-lg) / 1.4 var(--hb-font-body);
  }

  .prose :is(h2, h3, h4) {
    scroll-margin-block-start: calc(var(--hb-header-height) + var(--hb-space-4));
  }

  .prose :is(p, ul, ol, table, pre, blockquote) {
    margin: 0 0 var(--hb-space-4);
  }

  .prose :is(ul, ol) {
    padding-inline-start: var(--hb-space-6);
  }

  .prose li + li {
    margin-block-start: var(--hb-space-2);
  }

  .prose a {
    color: var(--hb-color-primary);
    text-decoration: underline;
    text-underline-offset: 0.2em;
  }

  .prose a:focus-visible {
    outline: 3px solid var(--hb-color-focus);
    outline-offset: 2px;
    border-radius: 2px;
  }

  .prose img {
    display: block;
    max-inline-size: 100%;
    block-size: auto;
    margin-block: var(--hb-space-5);
    border: var(--hb-border-width) solid var(--hb-border-color);
    border-radius: var(--hb-radius-m);
  }

  .prose blockquote {
    padding: var(--hb-space-3) var(--hb-space-5);
    border-inline-start: 6px solid var(--hb-color-accent-1);
    border-radius: var(--hb-radius-s);
    background-color: var(--hb-color-surface-container);
  }

  .prose blockquote > :last-child {
    margin-block-end: 0;
  }

  .prose code {
    padding: 0.1em 0.35em;
    border-radius: var(--hb-radius-s);
    background-color: var(--hb-color-surface-container);
    font: 0.9em / 1.5 var(--hb-font-mono);
  }

  .prose pre {
    padding: var(--hb-space-4);
    overflow-x: auto;
    border: 1px solid var(--hb-color-outline-variant);
    border-radius: var(--hb-radius-m);
    background-color: var(--hb-color-surface-container);
  }

  .prose pre code {
    padding: 0;
    background: none;
  }

  .prose table {
    inline-size: 100%;
    border-collapse: collapse;
  }

  .prose :is(th, td) {
    padding: var(--hb-space-2) var(--hb-space-3);
    border: 1px solid var(--hb-color-outline-variant);
    text-align: start;
  }

  .prose hr {
    margin-block: var(--hb-space-7);
    border: 0;
    border-block-start: var(--hb-border-width) solid var(--hb-color-outline-variant);
  }
`;
