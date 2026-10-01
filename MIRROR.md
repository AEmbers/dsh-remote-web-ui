# dsh-remote-web-ui — standalone source & install repo

Install the plugin straight from here:

```
github:AEmbers/dsh-remote-web-ui#main
```

`lib/index.js`, `lib/invariant.js` and `lib/client.js` are **prebuilt and
committed**, so a git install needs no build step and no `allowBuilds` entry:
pnpm refuses to run build scripts for git-hosted packages by default, which is
exactly what made the original monorepo install fail.

## Why this repo exists

The plugin used to live in the monorepo `AEmbers/dsh-web` (~1 GB: 16 family
packages, skins, market assets). Fetching it as a git dependency downloaded the
whole tree and regularly timed out. This repository carries just the package
(~2.8 MB) and installs in seconds. The monorepo has since been deleted, so
**this repository is now the source of truth**.

## Layout

- `src/` — TypeScript source: the host half (pairing, LAN approval list,
  `/api/pair` routes, the `/remote` channel) and the browser half (panel,
  mobile adapt, remote channel rewrite).
- `lib/` — prebuilt runtime bundles, committed on purpose (see above).
- `tests/` and `src/*.test.ts` — the vitest suite (`node_modules/.bin/vitest run`
  once dependencies are installed; the configs reference the monorepo `shared/`
  helper described below).
- Not mirrored: `lib/types/**` (tsc declaration output) — nothing reads it at
  runtime.

## Building

`tsdown.config.ts` / `tsdown.prepare.config.ts` / the `tsconfig.*.json` files
were written for the monorepo and import `../../shared/tsdown.client.ts`. To
rebuild the bundles, either build in a monorepo checkout that provides
`shared/tsdown.client.ts` and copy the result here, or add that file (plus a
`shared/` sibling directory) to this repository and repoint the two imports.

## Updating a consumer

```powershell
cd $env:USERPROFILE\.dsh\profiles\desktop
pnpm update "@linxin666/dsh-remote-web-ui"
```

Then restart DSH: the host half is loaded at boot.
