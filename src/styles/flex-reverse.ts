import { css } from 'lit-element';

export const flexReverse = css`
  [layout][horizontal-reverse],
  [layout][vertical-reverse] {
    display: -ms-flexbox;
    display: -webkit-flex;
    display: flex;
  }

  [layout][horizontal-reverse] {
    -ms-flex-direction: row-reverse;
    -webkit-flex-direction: row-reverse;
    flex-direction: row-reverse;
  }

  [layout][vertical-reverse] {
    -ms-flex-direction: column-reverse;
    -webkit-flex-direction: column-reverse;
    flex-direction: column-reverse;
  }

  [layout][wrap-reverse] {
    -ms-flex-wrap: wrap-reverse;
    -webkit-flex-wrap: wrap-reverse;
    flex-wrap: wrap-reverse;
  }
`;
