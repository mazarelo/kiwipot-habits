# Habit tracker for Kiwipot

A [Kiwipot](https://kiwipot.com) plugin: habits to tick off each day, in a note.

- **In the note:** each habit and its last 7 days, tapped to tick or untick, and how many days in a row.
- **On its page:** a card per habit with its last five weeks, its days in the last 30 and its best run.
- **Rename or delete** a habit from its name, in Kiwipot's own menu.
- Works offline and on every device, in light and dark, in English, German, Spanish, French, Italian and Portuguese.

Install it in Kiwipot from **Settings → Plugins → Reviewed plugins**, then type `/habits` in a note.

## What it may do

Nothing beyond its own blocks: it asks for no permissions. It doesn't reach the internet or your account. Its data is the block's (your habits and the days you ticked), and the picture public pages show is each habit and its last 7 days.

## Building

```bash
npm ci
npm test
npm run build
```

The script is `dist/plugin.js`, one file built with esbuild from `src/`. `src/kiwipot-plugin-sdk.ts` is Kiwipot's SDK as served at https://kiwipot.com/developers/sdk/.

Try it in [Kiwipot's playground](https://kiwipot.com/developers/playground): serve this folder with CORS (`npx http-server --cors -p 8080`) and load `http://localhost:8080/kiwipot-plugin.json`.

## Releasing

Raise `version` in `kiwipot-plugin.json` and `package.json`, and push a tag with that version (`1.1.0`). The release workflow builds it and attaches the manifest (its `main` an absolute link to the release's `plugin.js`) and the script to the GitHub release. Then pin it in [kiwipot-plugins](https://github.com/mazarelo/kiwipot-plugins).
