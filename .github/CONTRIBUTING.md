# Contributing to Hoverboard

Contributions of all kinds are welcome. Check the [open issues](https://github.com/gdg-x/hoverboard/issues) to see what is planned.

- Issues labeled [`good first issue`](https://github.com/gdg-x/hoverboard/labels/good%20first%20issue) are a good place to start.
- Issues labeled [`help wanted`](https://github.com/gdg-x/hoverboard/labels/help%20wanted) are ready for a pull request.

## Development setup

See [Development](../docs/contributing/development.md) for how to install dependencies, run the local emulators and dev server, and run the linter and tests, and [`AGENTS.md`](../AGENTS.md) for codebase conventions.

## Filing issues

Search [existing issues](https://github.com/gdg-x/hoverboard/issues) first.

- **Bug reports:** include steps to reproduce the problem, what happened, what you expected, and your browser and OS when relevant.
- **Feature requests:** describe who the feature is for (organizer or attendee), when they use it, and what problem it solves.
- **Security vulnerabilities:** do not open a public issue; follow [`SECURITY.md`](SECURITY.md) instead.

## Submitting pull requests

1. **Link the issue** your pull request addresses in the description, for example `Fixes #123`.
1. **Include tests** for every bug fix or new feature, and update the documentation in [`docs/`](../docs/README.md) when behavior, configuration or CLI commands change.
1. **Run `npm run lint` and `npm test`** locally (or `npm run fix` to format with ESLint and Prettier).
1. **Use a [Conventional Commits](https://www.conventionalcommits.org/) title**, for example `fix(web): show session times in the event time zone`. Pull requests are squash merged and the title becomes the release note, so mark breaking changes with `!` and explain them in a `BREAKING CHANGE:` paragraph in the description. See [Releases](../docs/contributing/releases.md#pull-requests).
