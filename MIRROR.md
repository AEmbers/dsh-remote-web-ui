# Standalone mirror of `packages/dsh-remote-web-ui`

This repository exists so the plugin can be installed **from GitHub, quickly**:

```
github:AEmbers/dsh-remote-web-ui#main
```

The canonical source, the build, and the test suite live in the monorepo
[`AEmbers/dsh-web`](https://github.com/AEmbers/dsh-web) under
`packages/dsh-remote-web-ui`. That repository is ~1 GB (skins, market assets,
other family packages), so fetching it as a git dependency downloads far more
than this plugin needs and regularly times out. This mirror carries only the
package tree (~3 MB).

## What differs from the monorepo tree

- `lib/index.js`, `lib/invariant.js`, `lib/client.js` are **prebuilt and
  committed**. A git install therefore needs no build step and no
  `allowBuilds` entry — pnpm refuses to run build scripts for git-hosted
  packages by default, and the monorepo's own `prepare` pinned its pnpm
  through corepack, which failed outright on the consumer side.
- `lib/types/**` (tsc declaration output) is not mirrored: nothing at runtime
  reads it.
- The `tsdown.*` / `tsconfig.*` files reference `../../shared/` and only work
  inside the monorepo. Build there, then sync the result here.

## Syncing a new version

From a checkout of the monorepo, after `pnpm --filter @linxin666/dsh-remote-web-ui build`:

```powershell
$src = "D:\dsh\dsh-web-fork\packages\dsh-remote-web-ui"
$dst = "D:\dsh\dsh-remote-web-ui-dist"
robocopy $src $dst /E /XD node_modules "lib\types" /XF "*.tsbuildinfo" /NFL /NDL /NJH /NJS /NP
cd $dst
git add -A
git commit -m "sync: <what changed>"
git push origin main
```

Then update the consumer:

```powershell
cd $env:USERPROFILE\.dsh\profiles\desktop
pnpm install --no-frozen-lockfile
```
