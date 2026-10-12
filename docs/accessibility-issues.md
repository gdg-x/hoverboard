# Known accessibility issues

The violations of WCAG 2.2 AA that the `A11y` tests find on the built site and accept for now. [packages/web/\_\_tests\_\_/a11y/known-issues.json](../packages/web/__tests__/a11y/known-issues.json) lists them by ID for the tests. The tests fail on a violation that isn't listed, and on a listed one that no longer happens, so remove an issue here and there when you fix it.

The tests run axe on one page of each template in every built-in theme, light and dark, and on a few pages with decorations off, forced colors, reduced motion and a 320px screen. See [ACCESSIBILITY.md](ACCESSIBILITY.md) for what Hoverboard aims for.

| ID  | Rule                 | WCAG               | Where                                                                              | Severity |
| --- | -------------------- | ------------------ | ---------------------------------------------------------------------------------- | -------- |
| A1  | `link-in-text-block` | 1.4.1 Use of color | Team page, links in the team's text. Festival, spotlight and paper, light and dark | Serious  |

## A1: Links in the team text rely on color

Links inside the team page's text (`short-markdown` in `team-page`) have no underline, and their color is too close to the text around them, less than 3:1. People who can't tell the colors apart can't find the links. The glass and minimalist themes pass.

Fix: underline links in `short-markdown`, as the footer and prose do, or give them 3:1 against the text and an underline on hover and focus.

## Reported, not failing

axe's best-practice rules run too. The tests save their results in `packages/web/test-results/a11y`, but don't fail on them. On the last run:

- `heading-order`: session cards on the schedule and speaker cards on the speakers page skip a heading level.
- `region`: the skip link of the minimal site is outside a landmark.
