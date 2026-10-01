/** Pure lan-bind decision helpers: flags-win precedence, pendingRestart, firewall gate. */
import { describe, expect, it } from 'vitest'
import { desiredBindHost, desiredBindPort, firewallActionNeeded, pendingRestartOf, resolveManagedProfile } from '../src/lan-bind-plan.ts'

describe('resolveManagedProfile', () => {
  it('operator: an explicit config wins over the launched profile and the environment', () => {
    // Given an explicit profile config beside a launched profile and an
    // environment value
    // When the managed profile resolves
    // Then the explicit config wins
    expect(resolveManagedProfile('qa', 'desktop', 'web')).toBe('qa')
  })

  it('operator: the launched profile wins over the environment (the Desktop client)', () => {
    // Given the Desktop client, which boots "desktop" without exporting
    // DSH_PROFILE (an environment-only resolution edited profiles/web there)
    // When no explicit config is set
    // Then the launched profile is the managed one, environment or not
    expect(resolveManagedProfile(undefined, 'desktop', undefined)).toBe('desktop')
    expect(resolveManagedProfile(undefined, 'desktop', 'web')).toBe('desktop')
  })

  it('operator: resolution falls back to the environment, then to web', () => {
    // Given neither an explicit config nor a launched profile
    // When the environment names a profile, or names nothing
    // Then the environment wins, and the default managed profile is web
    expect(resolveManagedProfile(undefined, undefined, 'web')).toBe('web')
    expect(resolveManagedProfile(undefined, undefined, undefined)).toBe('web')
  })
})

describe('desiredBindHost', () => {
  it('lets an explicit CLI host win over the toggle', () => {
    expect(desiredBindHost(true, '127.0.0.1')).toBe('127.0.0.1')
    expect(desiredBindHost(false, '0.0.0.0')).toBe('0.0.0.0')
  })

  it('falls back to the toggle without a CLI host', () => {
    expect(desiredBindHost(true, undefined)).toBe('0.0.0.0')
    expect(desiredBindHost(false, undefined)).toBe('127.0.0.1')
  })

  it('ignores CLI hosts outside the two managed literals', () => {
    expect(desiredBindHost(true, '192.168.1.5')).toBe('0.0.0.0')
    expect(desiredBindHost(false, '192.168.1.5')).toBe('127.0.0.1')
  })
})

describe('desiredBindPort', () => {
  it('prefers the CLI port, else the live port, else undefined', () => {
    expect(desiredBindPort(4000, 3080)).toBe(4000)
    expect(desiredBindPort(undefined, 3080)).toBe(3080)
    expect(desiredBindPort(undefined, undefined)).toBeUndefined()
    expect(desiredBindPort(undefined, Number.NaN)).toBeUndefined()
  })
})

describe('pendingRestartOf', () => {
  it('is false while the toggle has never been set', () => {
    expect(pendingRestartOf(undefined, undefined, '127.0.0.1')).toBe(false)
  })

  it('flags a live bind that has not caught up with the desired host', () => {
    expect(pendingRestartOf(true, '0.0.0.0', '127.0.0.1')).toBe(true)
    expect(pendingRestartOf(true, '0.0.0.0', '0.0.0.0')).toBe(false)
    expect(pendingRestartOf(false, '127.0.0.1', '0.0.0.0')).toBe(true)
  })

  it('does not flag a flag-managed bind as pending forever', () => {
    // --host 127.0.0.1 with the toggle on: the desired host IS 127.0.0.1.
    expect(pendingRestartOf(true, '127.0.0.1', '127.0.0.1')).toBe(false)
  })
})

describe('firewallActionNeeded', () => {
  it('applies once, then only on state movement', () => {
    expect(firewallActionNeeded(undefined, { enabled: true, port: 3080 })).toBe(true)
    const applied = { enabled: true, port: 3080 }
    expect(firewallActionNeeded(applied, { enabled: true, port: 3080 })).toBe(false)
    expect(firewallActionNeeded(applied, { enabled: false, port: 3080 })).toBe(true)
    expect(firewallActionNeeded(applied, { enabled: true, port: 3191 })).toBe(true)
  })

  it('skips entirely when the next state is not derivable', () => {
    expect(firewallActionNeeded(undefined, undefined)).toBe(false)
    expect(firewallActionNeeded({ enabled: true, port: 3080 }, undefined)).toBe(false)
  })
})
