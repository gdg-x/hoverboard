import { css } from 'lit';

export const flexReverse = css`
  [layout][horizontal-reverse],
  [layout][vertical-reverse] {
    display: flex;
  }

  [layout][horizontal-reverse] {
    flex-direction: row-reverse;
  }

  [layout][vertical-reverse] {
    flex-direction: column-reverse;
  }

  [layout][wrap-reverse] {
    flex-wrap: wrap-reverse;
  }
`;
