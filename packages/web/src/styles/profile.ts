import { css } from 'lit';

/** The body of a person's page, under the hero: the bio and its sections. */
export const profile = css`
  ul {
    display: flex;
    flex-wrap: wrap;
    gap: var(--hb-space-2);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  /* Content-box, so the text column lines up with the hero's. */
  .inner {
    box-sizing: content-box;
    max-inline-size: var(--hb-content-max);
    margin-inline: auto;
    padding: var(--hb-space-6) var(--hb-gutter) var(--hb-space-9);
  }

  .bio {
    display: block;
    max-inline-size: var(--hb-prose-max);
    margin-block: var(--hb-space-5);
    font-size: var(--hb-text-lg);
    line-height: 1.6;
  }

  .section-title {
    margin: var(--hb-space-8) 0 var(--hb-space-4);
    padding: 0;
    font: 800 var(--hb-text-2xl) / 1.15 var(--hb-font-display);
  }
`;
