import { css } from 'lit';

/** A band's centered column, big title, lede and links, for a block or a page that holds bands. */
export const bandContent = css`
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
    --hb-band-background: var(--hb-color-surface);
    --hb-band-color: var(--hb-color-on-surface);

    background-color: color-mix(
      in srgb,
      var(--hb-band-background) var(--hb-tint-opacity),
      transparent
    );
    color: var(--hb-band-color);
  }

  .band[data-tone='accent-4'] {
    --hb-band-background: var(--hb-color-accent-4-container);
    --hb-band-color: var(--hb-color-on-accent-4-container);
  }

  .band[data-tone='accent-2'] {
    --hb-band-background: var(--hb-color-accent-2-container);
    --hb-band-color: var(--hb-color-on-accent-2-container);
  }

  .band[data-tone='accent-1'] {
    --hb-band-background: var(--hb-color-accent-1-container);
    --hb-band-color: var(--hb-color-on-accent-1-container);
  }
`;
