import { css } from 'lit';

// Shared styles for every component that extends ThemedElement. Colors come from the theme tokens.
export const theme = css`
  *,
  *::before,
  *::after {
    box-sizing: border-box;
    -moz-osx-font-smoothing: grayscale;
    -webkit-font-smoothing: antialiased;
  }

  /* An explicit "display" on an element would otherwise beat the "hidden" attribute. */
  [hidden] {
    display: none !important;
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    margin: 0;
    font-weight: normal;
  }

  a {
    color: var(--hb-color-primary);
    text-decoration: none;
  }

  :where(img[decoding='async']) {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
`;
