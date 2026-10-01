/**
 * Issues #1751 and #1754: a side effect on the settings-save path must leave
 * the caller's async context before it touches a file the HMR config watcher
 * watches.
 *
 * The Host wraps a settings mutation in `hmr.runExclusive`, which marks the
 * running async context with an AsyncLocalStorage store. A module-scope
 * side effect (the LAN-bind patch write) therefore ran inside that transaction,
 * and the watcher's refresh re-entered it and was refused with "HMR
 * transactions cannot be nested".
 *
 * The first fix deferred the write with a plain `setImmediate` on the stated
 * belief that "setImmediate starts a fresh AsyncLocalStorage store". These
 * tests pin down that this belief is false, and that runDetached - the
 * mechanism that replaced it - genuinely starts clean.
 */
import { AsyncLocalStorage } from 'node:async_hooks'
import { describe, expect, it } from 'vitest'
import { runDetached } from '../src/detached-work.ts'

/** The mark a Host settings save leaves on its async context. */
const transaction = new AsyncLocalStorage<string>()

/** Resolve on the next macrotask, so timer-scoped context has settled. */
function tick(): Promise<void> {
  return new Promise(resolve => { setImmediate(resolve) })
}

describe('detaching side effects from the settings transaction (#1751, #1754)', () => {
  it('operator sees a plain deferral still carry the transaction mark', async () => {
    // Given a settings save that holds an exclusive transaction
    // When the save defers a side effect with a bare setImmediate
    // Then the deferred work still observes the transaction, which is why
    // deferring alone could never keep the patch write out of the watcher
    const observed: Array<string | undefined> = []
    await new Promise<void>((resolve) => {
      transaction.run('save', () => {
        setImmediate(() => {
          observed.push(transaction.getStore())
          resolve()
        })
      })
    })
    expect(observed).toEqual(['save'])
  })

  it('operator sees the detached scheduler start without the transaction mark', async () => {
    // Given a settings save that holds an exclusive transaction
    // When the save schedules the same side effect through runDetached
    // Then the scheduled work observes no transaction at all
    const observed: Array<string | undefined> = []
    await new Promise<void>((resolve) => {
      transaction.run('save', () => {
        runDetached(() => setImmediate(() => {
          observed.push(transaction.getStore())
          resolve()
        }))
      })
    })
    expect(observed).toEqual([undefined])
  })

  it('operator sees work deferred from detached work stay detached', async () => {
    // Given detached work that itself defers again
    // When the inner deferral runs
    // Then it inherits the detached context rather than the transaction, so a
    // nested timer cannot silently reintroduce the mark
    const observed: Array<string | undefined> = []
    await new Promise<void>((resolve) => {
      transaction.run('save', () => {
        runDetached(() => setImmediate(() => {
          observed.push(transaction.getStore())
          setImmediate(() => {
            observed.push(transaction.getStore())
            resolve()
          })
        }))
      })
    })
    expect(observed).toEqual([undefined, undefined])
  })

  it('operator sees the return value of detached work pass through', () => {
    // Given work scheduled through the detached scheduler
    // When the caller needs its result
    // Then the scheduler is a pass-through and changes nothing about the call
    expect(runDetached(() => 'written')).toBe('written')
  })

  it('operator keeps the transaction on the caller after scheduling detached work', async () => {
    // Given a settings save holding its transaction
    // When it schedules a detached side effect
    // Then the caller still sees its own transaction: detaching the side
    // effect must never strip the save of the context it runs in
    const seen: Array<string | undefined> = []
    await new Promise<void>((resolve) => {
      transaction.run('save', () => {
        runDetached(() => setImmediate(() => { resolve() }))
        seen.push(transaction.getStore())
      })
    })
    await tick()
    expect(seen).toEqual(['save'])
  })
})
