import { css } from 'lit';

export const flexAlignment = css`
  /**
       * Alignment in cross axis.
       */
  [layout][start] {
    align-items: flex-start;
  }

  [layout][center],
  [layout][center-center] {
    align-items: center;
  }

  [layout][end] {
    align-items: flex-end;
  }

  [layout][baseline] {
    align-items: baseline;
  }

  /**
       * Alignment in main axis.
       */
  [layout][start-justified] {
    justify-content: flex-start;
  }

  [layout][center-justified],
  [layout][center-center] {
    justify-content: center;
  }

  [layout][end-justified] {
    justify-content: flex-end;
  }

  [layout][around-justified] {
    justify-content: space-around;
  }

  [layout][justified] {
    justify-content: space-between;
  }

  /**
       * Self alignment.
       */
  [self-start] {
    align-self: flex-start;
  }

  [self-center] {
    align-self: center;
  }

  [self-end] {
    align-self: flex-end;
  }

  [self-stretch] {
    align-self: stretch;
  }

  [self-baseline] {
    align-self: baseline;
  }

  /**
       * multi-line alignment in main axis.
       */
  [layout][start-aligned] {
    align-content: flex-start;
  }

  [layout][end-aligned] {
    align-content: flex-end;
  }

  [layout][center-aligned] {
    align-content: center;
  }

  [layout][between-aligned] {
    align-content: space-between;
  }

  [layout][around-aligned] {
    align-content: space-around;
  }
`;
