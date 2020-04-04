import { css } from 'lit-element';

export const flex = css`
  [layout][horizontal],
  [layout][vertical] {
    display: -ms-flexbox;
    display: -webkit-flex;
    display: flex;
  }

  [layout][inline] {
    display: -ms-inline-flexbox;
    display: -webkit-inline-flex;
    display: inline-flex;
  }

  [layout][horizontal] {
    -ms-flex-direction: row;
    -webkit-flex-direction: row;
    flex-direction: row;
  }

  [layout][vertical] {
    -ms-flex-direction: column;
    -webkit-flex-direction: column;
    flex-direction: column;
  }

  [layout][wrap] {
    -ms-flex-wrap: wrap;
    -webkit-flex-wrap: wrap;
    flex-wrap: wrap;
  }

  [layout][center],
  [layout][center-center] {
    -ms-flex-align: center;
    -webkit-align-items: center;
    align-items: center;
  }

  [layout][center-justified],
  [layout][center-center] {
    -ms-flex-pack: center;
    -webkit-justify-content: center;
    justify-content: center;
  }

  [flex] {
    -ms-flex: 1 1 0.000000001px;
    -webkit-flex: 1;
    flex: 1;
    -webkit-flex-basis: 0.000000001px;
    flex-basis: 0.000000001px;
  }

  [flex-auto] {
    -ms-flex: 1 1 auto;
    -webkit-flex: 1 1 auto;
    flex: 1 1 auto;
  }

  [flex-none] {
    -ms-flex: none;
    -webkit-flex: none;
    flex: none;
  }
`;
