import { css } from 'lit-element';

export const flexAlignment = css`
  /**
       * Alignment in cross axis.
       */
  [layout][start] {
    -ms-flex-align: start;
    -webkit-align-items: flex-start;
    align-items: flex-start;
  }

  [layout][center],
  [layout][center-center] {
    -ms-flex-align: center;
    -webkit-align-items: center;
    align-items: center;
  }

  [layout][end] {
    -ms-flex-align: end;
    -webkit-align-items: flex-end;
    align-items: flex-end;
  }

  [layout][baseline] {
    -ms-flex-align: baseline;
    -webkit-align-items: baseline;
    align-items: baseline;
  }

  /**
       * Alignment in main axis.
       */
  [layout][start-justified] {
    -ms-flex-pack: start;
    -webkit-justify-content: flex-start;
    justify-content: flex-start;
  }

  [layout][center-justified],
  [layout][center-center] {
    -ms-flex-pack: center;
    -webkit-justify-content: center;
    justify-content: center;
  }

  [layout][end-justified] {
    -ms-flex-pack: end;
    -webkit-justify-content: flex-end;
    justify-content: flex-end;
  }

  [layout][around-justified] {
    -ms-flex-pack: distribute;
    -webkit-justify-content: space-around;
    justify-content: space-around;
  }

  [layout][justified] {
    -ms-flex-pack: justify;
    -webkit-justify-content: space-between;
    justify-content: space-between;
  }

  /**
       * Self alignment.
       */
  [self-start] {
    -ms-align-self: flex-start;
    -webkit-align-self: flex-start;
    align-self: flex-start;
  }

  [self-center] {
    -ms-align-self: center;
    -webkit-align-self: center;
    align-self: center;
  }

  [self-end] {
    -ms-align-self: flex-end;
    -webkit-align-self: flex-end;
    align-self: flex-end;
  }

  [self-stretch] {
    -ms-align-self: stretch;
    -webkit-align-self: stretch;
    align-self: stretch;
  }

  [self-baseline] {
    -ms-align-self: baseline;
    -webkit-align-self: baseline;
    align-self: baseline;
  }

  /**
       * multi-line alignment in main axis.
       */
  [layout][start-aligned] {
    -ms-flex-line-pack: start; /* IE10 */
    -ms-align-content: flex-start;
    -webkit-align-content: flex-start;
    align-content: flex-start;
  }

  [layout][end-aligned] {
    -ms-flex-line-pack: end; /* IE10 */
    -ms-align-content: flex-end;
    -webkit-align-content: flex-end;
    align-content: flex-end;
  }

  [layout][center-aligned] {
    -ms-flex-line-pack: center; /* IE10 */
    -ms-align-content: center;
    -webkit-align-content: center;
    align-content: center;
  }

  [layout][between-aligned] {
    -ms-flex-line-pack: justify; /* IE10 */
    -ms-align-content: space-between;
    -webkit-align-content: space-between;
    align-content: space-between;
  }

  [layout][around-aligned] {
    -ms-flex-line-pack: distribute; /* IE10 */
    -ms-align-content: space-around;
    -webkit-align-content: space-around;
    align-content: space-around;
  }
`;
