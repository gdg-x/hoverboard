import { css } from 'lit';

/**
 * A home page section: a full-width band with a centered column, a big title and, beside it, the
 * section's link. The home page sets the band's colors, so blocks keep alternating whichever
 * features are off.
 */
export const band = css`
  :host {
    display: block;
    container-type: inline-size;
    padding: var(--hb-space-9) var(--hb-gutter);
  }

  .inner {
    max-inline-size: var(--hb-content-max);
    margin-inline: auto;
  }

  .band-header {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
    gap: var(--hb-space-4) var(--hb-space-6);
    margin-block-end: var(--hb-space-7);
  }

  .band-title {
    margin: 0;
    padding: 0;
    font: 800 var(--hb-text-4xl) / 1.05 var(--hb-font-display);
    letter-spacing: -0.01em;
    text-wrap: balance;
    overflow-wrap: anywhere;
  }

  .band-lede {
    max-inline-size: var(--hb-prose-max);
    margin: var(--hb-space-3) 0 0;
    font-size: var(--hb-text-lg);
  }

  /* Accent colors may be too light on the band, so links take the band's text color. */
  .prose a {
    color: inherit;
    text-decoration: underline;
    text-underline-offset: 0.2em;
  }

  ul.plain {
    margin: 0;
    padding: 0;
    list-style: none;
  }
`;
