# Known accessibility issues

The violations of WCAG 2.2 AA that the `A11y` tests find on the built site and accept for now. [packages/web/\_\_tests\_\_/a11y/known-issues.json](../packages/web/__tests__/a11y/known-issues.json) lists them by ID for the tests. The tests fail on a violation that isn't listed, and on a listed one that no longer happens, so remove an issue here and there when you fix it.

The tests run axe on one page of each template in every built-in theme, light and dark, and on a few pages with decorations off, forced colors, reduced motion and a 320px screen. See [ACCESSIBILITY.md](ACCESSIBILITY.md) for what Hoverboard aims for.

| ID  | Rule | WCAG | Where | Severity |
| --- | ---- | ---- | ----- | -------- |

None at the moment. List a new one with the next ID, `A2`, in this table and in the JSON file, and describe it in a section below.

## Reported, not failing

axe's best-practice rules run too. The tests save their results in `packages/web/test-results/a11y`, but don't fail on them. On the last run:

- `region`: the skip link of the minimal site is outside a landmark. axe only treats a link as a skip link when it comes before the page's first other link, and it can't compare positions across shadow roots. The minimal site has no navigation links next to the skip link in the header's shadow root, so axe misses that it is one. The skip link works.
