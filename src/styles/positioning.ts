import { css } from 'lit';

export const positioning = css`
  [block] {
    display: block !important;
  }

  [hidden] {
    display: none !important;
  }

  [invisible] {
    visibility: hidden !important;
  }

  [relative] {
    position: relative;
  }

  [fit] {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
  }

  [scroll] {
    -webkit-overflow-scrolling: touch;
    overflow: auto;
  }

  /* fixed position */
  [fixed-bottom],
  [fixed-left],
  [fixed-right],
  [fixed-top] {
    position: fixed;
  }

  [fixed-top] {
    top: 0;
    left: 0;
    right: 0;
  }

  [fixed-right] {
    top: 0;
    right: 0;
    bottom: 0;
  }

  [fixed-bottom] {
    right: 0;
    bottom: 0;
    left: 0;
  }

  [fixed-left] {
    top: 0;
    bottom: 0;
    left: 0;
  }
`;
