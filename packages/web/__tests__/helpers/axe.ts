import axe from 'axe-core';
import { expect } from 'vitest';

const WCAG_AA = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

// jsdom has no layout or text rendering, so these rules can't compute a result.
const LAYOUT_RULES = [
  'color-contrast',
  'label-content-name-mismatch',
  'link-in-text-block',
  'scrollable-region-focusable',
  'target-size',
];

/** The WCAG 2.2 AA violations axe finds in `element`, shadow roots included, one line per node. */
export const axeViolations = async (element: Element): Promise<string[]> => {
  const { violations, incomplete } = await axe.run(element, {
    runOnly: { type: 'tag', values: WCAG_AA },
    rules: Object.fromEntries(LAYOUT_RULES.map((rule) => [rule, { enabled: false }])),
    resultTypes: ['violations'],
  });
  // A rule that throws checks nothing, so report it instead of passing.
  const errors = incomplete
    .filter((result) => 'error' in result)
    .map(({ id }) => `${id}: the rule threw an error in jsdom`);
  return [
    ...violations.flatMap(({ id, help, nodes }) =>
      nodes.map(({ target }) => `${id}: ${help} (${target.flat().join(' >>> ')})`),
    ),
    ...errors,
  ];
};

export const expectNoAxeViolations = async (element: Element) => {
  expect(await axeViolations(element)).toEqual([]);
};
