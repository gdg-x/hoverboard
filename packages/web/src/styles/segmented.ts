import { css } from 'lit';

/**
 * A radio group that looks like a row of buttons: a `fieldset` with a `legend` and `.options`, each
 * option a `label` around a radio `input`. The selected option takes `currentColor` as its
 * background and `--hb-segmented-selected-color` as its text.
 */
export const segmented = css`
  fieldset {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--hb-space-2) var(--hb-space-3);
    margin: 0;
    padding: 0;
    border: 0;
  }

  legend {
    float: left;
    padding: 0;
    font-weight: 600;
  }

  .options {
    display: inline-flex;
    padding: 2px;
    border: var(--hb-border-width) solid currentColor;
    border-radius: var(--hb-radius-full);
  }

  label {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--hb-space-1);
    min-block-size: var(--hb-target-min);
    min-inline-size: var(--hb-target-min);
    padding-inline: var(--hb-space-3);
    border-radius: var(--hb-radius-full);
    cursor: pointer;
  }

  label:hover {
    background-color: color-mix(in srgb, currentColor 8%, transparent);
  }

  label:has(input:checked) {
    background-color: currentColor;
  }

  label:has(input:checked) span,
  label:has(input:checked) hoverboard-icon {
    color: var(--hb-segmented-selected-color, var(--hb-color-surface));
  }

  label:has(input:focus-visible) {
    outline: 3px solid var(--hb-color-focus);
    outline-offset: 2px;
  }

  input {
    position: absolute;
    inset: 0;
    margin: 0;
    opacity: 0;
    cursor: inherit;
  }

  hoverboard-icon {
    inline-size: 18px;
    block-size: 18px;
  }

  /* Still read by screen readers. */
  .visually-hidden {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  @media (forced-colors: active) {
    label:has(input:checked) {
      background-color: Highlight;
    }

    label:has(input:checked) span,
    label:has(input:checked) hoverboard-icon {
      color: HighlightText;
    }
  }
`;
