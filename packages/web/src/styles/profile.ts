import { css } from 'lit';

/** A person's page: the hero with their photo, name, details and badges, and the body below it. */
export const profile = css`
  .profile {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--hb-space-5) var(--hb-space-6);
  }

  .profile > div {
    flex: 1 1 18rem;
    min-inline-size: 0;
  }

  .details {
    margin: var(--hb-space-3) 0 0;
    font-size: var(--hb-text-lg);
  }

  ul {
    display: flex;
    flex-wrap: wrap;
    gap: var(--hb-space-2);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .badges {
    margin-block-start: var(--hb-space-4);
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
