/**
 * Issues #1751 and #1754: saving a remote-web-ui setting failed with
 * "HMR transactions cannot be nested".
 *
 * The Host runs settings/mutate inside hmr.runExclusive. Committing a volatile
 * field announces loader/volatile-update, which drove sync() on that same async
 * context, and sync() wrote cordis.patch.yml - the file the HMR config watcher
 * refreshes from. The watcher's refresh then re-entered runExclusive and
 * rejected, which surfaced as the user's save failing.
 *
 * The first fix deferred the write with setImmediate on the belief that a fresh
 * callback starts a fresh AsyncLocalStorage store. That belief is false and is
 * refuted in detached-work.spec.ts; the deferral now runs through the
 * module-scope AsyncResource in src/detached-work.ts, which really does start
 * clean. This file asserts the two placement rules that keep the write off the
 * save path at all: only the deferred worker touches the patch file and the
 * firewall, and the write sits behind the current-vs-desired guard.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { describe, expect, it } from 'vitest'

const here = dirname(fileURLToPath(import.meta.url))
const source = readFileSync(join(here, '..', 'src', 'index.ts'), 'utf8')

/**
 * The body of one top-level const declaration inside applyImpl, found by brace
 * balance from its opening brace.
 * @param name - the local const's name.
 * @returns the function body source, without the closing brace.
 */
function bodyOf(name) {
  const head = new RegExp('const ' + name + ' = \\([^)]*\\): void => \\{')
  const match = head.exec(source)
  if (match === null) throw new Error('no ' + name + ' declaration in src/index.ts')
  const start = match.index + match[0].length - 1
  let depth = 0
  for (let i = start; i < source.length; i++) {
    if (source[i] === '{') depth++
    else if (source[i] === '}') {
      depth--
      if (depth === 0) return source.slice(start + 1, i)
    }
  }
  throw new Error('unbalanced braces after ' + name)
}

describe('remote-web-ui LAN bind vs. the HMR transaction (issues #1751 and #1754)', () => {
  it('operator keeps the patch write and the firewall probes off the sync path', () => {
    // Given the host half that applies the settings
    // When the two functions that own the LAN bind work and the save path are read
    // Then only the deferred worker touches the patch file and the firewall
    const work = bodyOf('applyLanBindWork')
    expect(work).toContain('writeLanBind(')
    expect(work).toContain('ensureFirewallRule(')
    expect(bodyOf('sync')).not.toContain('writeLanBind(')
    expect(bodyOf('sync')).not.toContain('ensureFirewallRule(')
  })

  it('operator writes the block only when the committed one differs from the desired one', () => {
    // Given the deferred worker, the one thing that keeps the patch file out of
    // a second save is that a settled profile produces no write at all
    // When the current-vs-desired comparison that guards the write is read
    // Then the write sits behind that comparison, and re-reading the same block
    // therefore cannot touch the file a second time
    const work = bodyOf('applyLanBindWork')
    expect(work).toContain('current.host !== desiredHost || current.port !== desiredPort')
    const guard = work.indexOf('current.host !== desiredHost || current.port !== desiredPort')
    const write = work.indexOf('writeLanBind(')
    expect(guard).toBeGreaterThan(-1)
    expect(write).toBeGreaterThan(guard)
  })

  it('operator sees the deferred write leave the settings transaction', () => {
    // Given the scheduler that defers the work
    // When it is read
    // Then it schedules through runDetached - the AsyncResource that starts
    // clean - rather than a bare setImmediate that inherits the save's
    // AsyncLocalStorage store and would land the write inside the transaction
    // the watcher then tries to re-enter
    const schedule = bodyOf('scheduleLanBindWork')
    expect(schedule).toContain('runDetached(')
    expect(schedule).toContain('setImmediate(')
    expect(schedule).toContain('applyLanBindWork(resolve())')
    // The detachment must wrap the scheduling, not sit inside the deferred
    // callback: by the time the callback runs, the timer has already captured
    // the caller's context.
    expect(schedule.indexOf('runDetached(')).toBeLessThan(schedule.indexOf('setImmediate('))
  })

  it('operator sees a failed assertion swallowed instead of rejecting the save', () => {
    // Given the scheduler
    // When the deferred worker throws
    // Then the failure is logged, not surfaced: the save already answered and
    // the settings card re-reads the live block on its own poll
    expect(bodyOf('scheduleLanBindWork')).toContain('catch')
  })
})
