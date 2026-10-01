/**
 * Run one piece of work outside the caller's async context.
 *
 * The Host performs a settings mutation inside `hmr.runExclusive`, which marks
 * the running async context with an AsyncLocalStorage store. Side effects that
 * live on that path - writing `cordis.patch.yml`, the very file the HMR config
 * watcher refreshes from - must not run under that mark, or the watcher's
 * refresh can re-enter the exclusive transaction and be refused with "HMR
 * transactions cannot be nested" (#1751, #1754).
 *
 * Deferring is NOT enough, and the earlier belt that this one replaces was
 * built on a disproven premise: Node propagates an AsyncLocalStorage store into
 * `setImmediate`, into `node:timers`, into promise continuations, and into any
 * AsyncResource scoped to the current async id. Measured on Node 24:
 *
 * ```
 * als.run(true, () => setImmediate(() => als.getStore()))   // -> true
 * ```
 *
 * What DOES start clean is an AsyncResource whose `triggerAsyncId` is not the
 * transaction. A resource created once at module scope - that is, before any
 * transaction existed - carries no store, and everything it schedules inherits
 * that emptiness rather than the caller's mark:
 *
 * ```
 * const detached = new AsyncResource('...')      // module scope
 * als.run(true, () => detached.runInAsyncScope(() => setImmediate(() => als.getStore())))
 * // -> undefined
 * ```
 *
 * @module
 */

import { AsyncResource } from 'node:async_hooks'

/**
 * The escape hatch, created at module scope on purpose: a resource built while
 * a transaction is running would capture that transaction, so this single
 * instance is the only one the module ever needs. It carries no context of its
 * own, so every job run through it starts from the process's root context.
 */
const DETACHED = new AsyncResource('dsh-remote-web-ui:detached-work', { triggerAsyncId: 0 })

/**
 * Run `work` outside the caller's AsyncLocalStorage context.
 *
 * The call itself is synchronous - this schedules, it does not defer. Work that
 * must not block the caller should schedule its own `setImmediate` inside
 * `work`, which then also starts clean because it inherits this resource's
 * empty context rather than the caller's.
 *
 * @param work - the side effect to detach from the caller's async context.
 * @returns whatever `work` returns.
 */
export function runDetached<T>(work: () => T): T {
  return DETACHED.runInAsyncScope(work)
}
