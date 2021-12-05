npm run emulators:import
npm run emulators:export -- --force
test -z "$(git diff --exit-code)"
