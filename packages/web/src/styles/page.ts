import { css } from 'lit';

/** A page's column under its hero. Content-box, so the text lines up with the hero's. */
export const pageInner = css`
  :host {
    display: block;
    background-color: var(--hb-section-background);
    color: var(--hb-color-on-surface);
  }

  .inner {
    box-sizing: content-box;
    max-inline-size: var(--hb-content-max);
    margin-inline: auto;
    padding: var(--hb-space-7) var(--hb-gutter) var(--hb-space-9);
  }
`;
