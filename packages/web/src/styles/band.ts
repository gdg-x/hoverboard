import { css, unsafeCSS } from 'lit';
import { displayFont } from './shared';

/** A band's centered column, big title, lede and links, for a block or a page that holds bands. */
export const bandContent = css`
  .inner {
    max-inline-size: var(--hb-content-max);
    margin-inline: auto;
  }

  .band-header {
    display: flex;
    flex-direction: var(--hb-band-header-direction);
    flex-wrap: wrap;
    align-items: var(--hb-band-header-align);
    justify-content: space-between;
    gap: var(--hb-space-4) var(--hb-space-6);
    margin-block-end: var(--hb-space-7);
    text-align: var(--hb-band-text-align);
  }

  .band-title {
    margin: 0;
    padding: 0;
    ${displayFont('display', '4xl', 1.05, -0.01)};
    text-decoration: var(--hb-title-underline);
    text-decoration-skip-ink: none;
    text-underline-offset: 0.12em;
    text-wrap: balance;
    overflow-wrap: anywhere;
  }

  /* The theme's eyebrow, the band's number from the page, with no text for screen readers. A float,
     so the title's underline does not reach it. */
  .band-title::before {
    content: var(--hb-band-number, none) / '';
    display: var(--hb-band-eyebrow, none);
    float: inline-start;
    inline-size: 100%;
    margin-block-end: var(--hb-space-3);
    color: var(--hb-eyebrow-color);
    font: 600 calc(var(--hb-text-sm) * var(--hb-accent-scale, 1)) / 1.4 var(--hb-font-accent);
    letter-spacing: 0.08em;
    text-decoration: none;
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

/**
 * A home page section: a full-width band with a centered column, a big title and, beside it, the
 * section's link. The home page sets the band's colors, so blocks keep alternating whichever
 * features are off.
 */
export const band = [
  css`
    :host {
      display: block;
      container-type: inline-size;
      padding: var(--hb-space-9) var(--hb-gutter);
    }
  `,
  bandContent,
];

/** The tones bands take in turn, so two bands of the same color never meet. */
export const BAND_TONES = ['surface', 'accent-4', 'surface', 'accent-2', 'surface', 'accent-1'];

/** The colors of `.band` elements by their `data-tone`, for the page that lays the bands out. */
export const bandTones = css`
  .band {
    --hb-band-background: var(--hb-tone-surface-background);
    --hb-band-color: var(--hb-tone-surface-color);
    --hb-band-pattern: var(--hb-tone-surface-pattern);

    margin: var(--hb-band-inset);
    border-block-start: var(--hb-band-divider);
    border-radius: var(--hb-band-radius);
    background:
      var(--hb-band-pattern),
      color-mix(in srgb, var(--hb-band-background) var(--hb-tint-opacity), transparent);
    color: var(--hb-band-color);
    mask: var(--hb-band-edge);
  }

  ${unsafeCSS(
    Array.from(
      { length: 12 },
      (_, index) =>
        `.band:nth-child(${index + 1} of .band) { --hb-band-number: '${String(index + 1).padStart(2, '0')}'; }`,
    ).join('\n'),
  )}

  .band[data-tone='accent-4'] {
    --hb-band-background: var(--hb-tone-accent-4-background);
    --hb-band-color: var(--hb-tone-accent-4-color);
    --hb-band-pattern: var(--hb-tone-accent-4-pattern);
  }

  .band[data-tone='accent-2'] {
    --hb-band-background: var(--hb-tone-accent-2-background);
    --hb-band-color: var(--hb-tone-accent-2-color);
    --hb-band-pattern: var(--hb-tone-accent-2-pattern);
  }

  .band[data-tone='accent-1'] {
    --hb-band-background: var(--hb-tone-accent-1-background);
    --hb-band-color: var(--hb-tone-accent-1-color);
    --hb-band-pattern: var(--hb-tone-accent-1-pattern);
  }
`;
