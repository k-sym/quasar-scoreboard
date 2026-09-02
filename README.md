# Simple Scoreboard App

A simple, visually-appealing scoreboard I put together for a monthly quiz night I host at the
local pub. It keeps score on the same screen I run the quiz from, so the participants can watch the
standings update live.

At the end of each round I enter every team's score, flag any team that played their **joker** that
round (which doubles their score for it), and hit the sort button — the rows then animate into rank
order, with gold and silver highlights for first and second. It's gimmicky, but the crowd seems to
like it, so I'm keeping it and thought I'd share!

## How it works

- **Teams** view — add and remove teams. Teams and scores are saved to the browser's
  `localStorage`, so they survive a page reload.
- **Board** view — a row per team with an input per round. Tap the joker (card) button on a round to
  double that round's score; the cell shows the doubled figure in bold green and the total counts it
  twice. Tap it again to undo. Press the sort button to reveal totals and rank the teams.

Built with [Quasar](https://quasar.dev) (Vue 3 + Pinia + Vite).

## Install the dependencies

```bash
npm install
```

## Start the app in development mode (hot-code reloading, error reporting, etc.)

```bash
quasar dev
```

## Run the tests

```bash
npm test
```

The store's scoring logic (totals, jokers, persistence) is covered by [Vitest](https://vitest.dev),
as is the board's ranking behaviour. There's no jsdom in the toolchain, so component tests mount
into the tiny plain-object renderer in `test/mount.js` rather than a fake browser.

## Lint the files

```bash
npm run lint
```

## Build the app for production

```bash
quasar build
```

## Customize the configuration

See [Configuring quasar.config.js](https://v2.quasar.dev/quasar-cli-vite/quasar-config-js).
