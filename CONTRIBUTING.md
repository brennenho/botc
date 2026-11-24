# Contributing to BOTC Townsquare

Hey, I'm Brennen! I'm a solo developer and support this project in my
spare time. If there's a feature you'd like to see or a bug you know how to
fix, you're welcome to put up a pull request for it. Small changes like
clearing up a confusing instruction are welcome too. Otherwise, feel free to
create issues and I'll tackle them when I can!

## Opening a PR

1. Fork the repo, clone your fork, and create a branch from `main`. The
   [local setup guide](README.md#local-setup) will help you get the app running.
2. Keep the PR focused on the change you have in mind. If you're editing the
   docs, try the instructions and links you changed. For code changes, run
   `pnpm check` and `pnpm test`. If you change what a player sees, try it as
   both the Storyteller and a player in separate browser profiles. You can find
   the build, database, and multiplayer checks in the
   [development guide](docs/DEVELOPMENT.md#verification).
3. Push your branch to your fork and open a PR against `main`. Tell me how
   your change helps and how you tested it. Link a related issue if there is
   one. A screenshot helps me review a visual change. Please leave out game
   codes, invite links, and player names.

If you're working with character data or artwork, you can find the sources and
usage terms in the [third-party notices](THIRD_PARTY_NOTICES.md).
