import { css } from 'lit';

export const flex = css`
  [layout][horizontal],
  [layout][vertical] {
    display: flex;
  }

  [layout][inline] {
    display: inline-flex;
  }

  [layout][horizontal] {
    flex-direction: row;
  }

  [layout][vertical] {
    flex-direction: column;
  }

  [layout][wrap] {
    flex-wrap: wrap;
  }

  [layout][center],
  [layout][center-center] {
    align-items: center;
  }

  [layout][center-justified],
  [layout][center-center] {
    justify-content: center;
  }

  [flex] {
    flex: 1;
    flex-basis: 1px;
  }

  [flex-auto] {
    flex: 1 1 auto;
  }

  [flex-none] {
    flex: none;
  }
`;
