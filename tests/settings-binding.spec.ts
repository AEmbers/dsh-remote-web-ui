/**
 * Client settings-form binding on the 0.1.7 cohort.
 *
 * A settings form is addressed by profile entry id there, while the card knows
 * only its family namespace: the family binder (dsh-web-settings) resolves one
 * onto the other, and the shared configuration forms service bound at this
 * package's own profile row ids is the fallback for a page that serves no
 * binder.
 *
 * The regression this file pins: the fallback used to answer the bare namespace
 * whenever the describe mirror held nothing yet, which is the normal state at
 * plugin activation. The Host serves no entry under that id, so the card
 * rendered as a form whose every save was rejected and which reported the
 * namespace as unexposed.
 */
import { describe, expect, it, vi } from 'vitest'
import type { ConfigForms } from '@deepseek-ai/dsh-client-ui-settings/client'
import { servedEntryId } from '../src/client/index.ts'

/**
 * The shared configuration forms service as the card reads it: describe()
 * answers the served namespace rows, or nothing at all while the Host has not
 * answered yet.
 * @param servedNamespaces - the row ids the mirror reports; undefined models an unanswered mirror.
 * @param refuses - when true the mirror read throws instead of answering.
 * @returns the service double.
 */
function forms(servedNamespaces?: string[], refuses = false): ConfigForms {
  return {
    get: vi.fn(),
    describe: () => ({
      getSnapshot: () => {
        if (refuses) throw new Error('mirror unavailable')
        return servedNamespaces === undefined
          ? { status: 'idle', view: undefined, error: null }
          : {
              status: 'ready',
              view: {
                namespaces: servedNamespaces.map(ns => ({ ns })),
                writable: true,
                hasDocument: true,
              },
              error: null,
            }
      },
    }),
  } as unknown as ConfigForms
}

describe('remote-web-ui settings binding', () => {
  it('user on an aggregate install binds the row the aggregate generates', () => {
    // Given a page whose mirror serves the aggregate row
    // When the card resolves its entry id
    // Then that row id is the one bound
    expect(servedEntryId(forms(['web-ui-remote-web-ui']))).toBe('web-ui-remote-web-ui')
  })

  it('user on a standalone install binds the standalone bundle row', () => {
    // Given a profile carrying this package's own bundle row instead of the aggregate one
    // When the card resolves its entry id
    // Then the standalone row id is the one bound
    expect(servedEntryId(forms(['ui-remote-web-ui']))).toBe('ui-remote-web-ui')
  })

  it('user whose mirror has not answered yet binds the aggregate row rather than the namespace', () => {
    // Given a cold start where the describe mirror holds no answer, as at plugin activation
    // When the card resolves its entry id
    // Then it binds a row the Host can actually serve, so a save is not rejected
    expect(servedEntryId(forms())).toBe('web-ui-remote-web-ui')
  })

  it('user whose mirror answers an empty document binds the aggregate row', () => {
    // Given a mirror that answered with no namespace at all
    // When the card resolves its entry id
    // Then it still binds the aggregate row
    expect(servedEntryId(forms([]))).toBe('web-ui-remote-web-ui')
  })

  it('user whose mirror read is refused binds the aggregate row', () => {
    // Given a mirror that throws instead of answering
    // When the card resolves its entry id
    // Then the refusal is treated as unanswered, not as absence
    expect(servedEntryId(forms(undefined, true))).toBe('web-ui-remote-web-ui')
  })

  it('user of a profile serving none of this package rows binds the bare namespace', () => {
    // Given a mirror that explicitly answers with other plugins' rows
    // When the card resolves its entry id
    // Then the namespace itself is addressed, which is the pre-0.1.7 keying shape
    expect(servedEntryId(forms(['web-ui-pet', 'web-ui-ssh']))).toBe('remote-web-ui')
  })
})
