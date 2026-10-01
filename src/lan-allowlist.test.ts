import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { LanAllowlist, addressMatches, isValidRule, normalizeAddress } from './lan-allowlist.ts'

const dirs: string[] = []

function tempFile(): string {
  const dir = mkdtempSync(join(tmpdir(), 'lan-allow-'))
  dirs.push(dir)
  return join(dir, 'lan-allowlist.json')
}

afterEach(() => {
  while (dirs.length > 0) {
    const dir = dirs.pop()
    if (dir !== undefined) rmSync(dir, { recursive: true, force: true })
  }
})

describe('normalizeAddress', () => {
  it('unwraps IPv4-mapped IPv6 peers', () => {
    expect(normalizeAddress('::ffff:192.168.31.40')).toBe('192.168.31.40')
  })

  it('drops an IPv6 zone and lowercases the rest', () => {
    expect(normalizeAddress('FE80::1%12')).toBe('fe80::1')
  })

  it('treats an absent address as empty', () => {
    expect(normalizeAddress(undefined)).toBe('')
  })
})

describe('addressMatches', () => {
  it('matches an exact address', () => {
    expect(addressMatches('192.168.31.40', '192.168.31.40')).toBe(true)
    expect(addressMatches('192.168.31.41', '192.168.31.40')).toBe(false)
  })

  it('matches inside a CIDR block', () => {
    expect(addressMatches('192.168.31.40', '192.168.31.0/24')).toBe(true)
    expect(addressMatches('192.168.32.40', '192.168.31.0/24')).toBe(false)
  })

  it('handles the edge masks', () => {
    expect(addressMatches('8.8.8.8', '0.0.0.0/0')).toBe(true)
    expect(addressMatches('192.168.31.40', '192.168.31.40/32')).toBe(true)
  })

  it('never matches across families or on junk', () => {
    expect(addressMatches('fe80::1', '192.168.31.0/24')).toBe(false)
    expect(addressMatches('', '192.168.31.0/24')).toBe(false)
    expect(addressMatches('192.168.31.40', '192.168.31.0/33')).toBe(false)
  })
})

describe('isValidRule', () => {
  it('accepts addresses and IPv4 CIDR blocks', () => {
    expect(isValidRule('10.0.0.4')).toBe(true)
    expect(isValidRule('10.0.0.0/8')).toBe(true)
  })

  it('rejects malformed blocks', () => {
    expect(isValidRule('10.0.0.0/33')).toBe(false)
    expect(isValidRule('10.0.0.0/x')).toBe(false)
    expect(isValidRule('')).toBe(false)
  })
})

describe('LanAllowlist', () => {
  it('starts enabled and empty', () => {
    const list = new LanAllowlist()
    expect(list.enabled).toBe(true)
    expect(list.entries()).toHaveLength(0)
    expect(list.pending()).toHaveLength(0)
  })

  it('refuses an unknown peer and remembers it as pending', () => {
    let clock = 1_000
    const list = new LanAllowlist({ now: () => clock++ })
    expect(list.match('192.168.31.40')).toBeUndefined()
    const pending = list.note('192.168.31.40', { path: '/remote/api', userAgent: 'Pixel' })
    expect(pending.hits).toBe(1)
    list.note('192.168.31.40', { path: '/', userAgent: 'Pixel' })
    expect(list.pending()).toHaveLength(1)
    expect(list.pending()[0]?.hits).toBe(2)
  })

  it('admits a peer right after approval and clears its pending record', () => {
    const list = new LanAllowlist()
    list.note('192.168.31.40', { path: '/remote/api' })
    const entry = list.approve('192.168.31.40', { userAgent: 'Pixel 8' })
    expect(entry.address).toBe('192.168.31.40')
    expect(list.match('192.168.31.40')?.userAgent).toBe('Pixel 8')
    expect(list.pending()).toHaveLength(0)
  })

  it('matches a mapped-IPv6 peer against an approved IPv4 address', () => {
    const list = new LanAllowlist()
    list.approve('192.168.31.40')
    expect(list.match('::ffff:192.168.31.40')).toBeDefined()
  })

  it('admits every peer inside an approved subnet rule', () => {
    const list = new LanAllowlist()
    list.addRule('192.168.31.0/24')
    expect(list.match('192.168.31.7')?.rule).toBe('192.168.31.0/24')
    expect(list.match('192.168.30.7')).toBeUndefined()
  })

  it('rejects malformed rules', () => {
    const list = new LanAllowlist()
    expect(list.addRule('192.168.31.0/64')).toBeUndefined()
    expect(list.entries()).toHaveLength(0)
  })

  it('removes an entry by address or by rule', () => {
    const list = new LanAllowlist()
    list.approve('192.168.31.40')
    list.addRule('10.1.0.0/16')
    expect(list.remove('192.168.31.40')).toBe(true)
    expect(list.remove('10.1.0.0/16')).toBe(true)
    expect(list.entries()).toHaveLength(0)
    expect(list.match('192.168.31.40')).toBeUndefined()
  })

  it('dismisses a refused peer without approving it', () => {
    const list = new LanAllowlist()
    list.note('192.168.31.99', { path: '/' })
    expect(list.dismiss('192.168.31.99')).toBe(true)
    expect(list.pending()).toHaveLength(0)
    expect(list.match('192.168.31.99')).toBeUndefined()
  })

  it('forgets refused peers once the ttl passes', () => {
    let clock = 1_000
    const list = new LanAllowlist({ now: () => clock, pendingTtlMs: 5_000 })
    list.note('192.168.31.99', { path: '/' })
    clock += 6_000
    expect(list.pending()).toHaveLength(0)
  })

  it('bounds the pending table', () => {
    const list = new LanAllowlist({ maxPending: 2 })
    for (const address of ['10.0.0.1', '10.0.0.2', '10.0.0.3']) list.note(address, { path: '/' })
    expect(list.pending()).toHaveLength(2)
  })

  it('persists approvals, rules and the switch across instances', () => {
    const file = tempFile()
    const first = new LanAllowlist({ file })
    first.approve('192.168.31.40', { userAgent: 'Pixel 8' })
    first.addRule('10.1.0.0/16', { label: 'office' })
    first.setEnabled(false)

    const second = new LanAllowlist({ file })
    expect(second.enabled).toBe(false)
    expect(second.match('192.168.31.40')?.userAgent).toBe('Pixel 8')
    expect(second.match('10.1.9.9')?.label).toBe('office')
    expect(JSON.parse(readFileSync(file, 'utf8')).version).toBe(1)
  })

  it('starts empty when the file is unreadable or corrupt', () => {
    const list = new LanAllowlist({ file: join(tmpdir(), 'definitely-missing', 'lan.json') })
    expect(list.entries()).toHaveLength(0)
    expect(list.enabled).toBe(true)
  })

  it('refreshes lastSeenAt for the entry admitting a peer', () => {
    let clock = 1_000
    const list = new LanAllowlist({ now: () => clock })
    const entry = list.approve('192.168.31.40')
    expect(entry.lastSeenAt).toBe(1_000)
    clock = 2_000
    list.touch('192.168.31.40')
    expect(list.entries()[0]?.lastSeenAt).toBe(2_000)
  })

  it('snapshots the enabled flag with both tables', () => {
    const list = new LanAllowlist()
    list.approve('192.168.31.40')
    list.note('192.168.31.99', { path: '/' })
    const snapshot = list.snapshot()
    expect(snapshot.enabled).toBe(true)
    expect(snapshot.entries).toHaveLength(1)
    expect(snapshot.pending).toHaveLength(1)
  })
})

describe('persistence throttling', () => {
  /** Read the stored last-seen of the only entry, or undefined. */
  function storedLastSeen(file: string): number | undefined {
    const parsed = JSON.parse(readFileSync(file, 'utf8')) as { entries?: { lastSeenAt?: number }[] }
    return parsed.entries?.[0]?.lastSeenAt
  }

  it('keeps touch() in memory between writes and flushes after the window', () => {
    const file = tempFile()
    let now = 1_000_000
    const list = new LanAllowlist({ file, now: () => now })
    list.approve('192.168.31.40')
    expect(storedLastSeen(file)).toBe(1_000_000)

    // Every admitted request touches the entry; only the in-memory value moves.
    now += 5_000
    list.touch('192.168.31.40')
    expect(list.entries()[0]?.lastSeenAt).toBe(1_005_000)
    expect(storedLastSeen(file)).toBe(1_000_000)

    // Past the window the next touch persists the accumulated value.
    now += 61_000
    list.touch('192.168.31.40')
    expect(storedLastSeen(file)).toBe(1_066_000)
  })

  it('records a new refused peer immediately but throttles its retries', () => {
    const file = tempFile()
    let now = 2_000_000
    const list = new LanAllowlist({ file, now: () => now })
    list.note('192.168.31.99', { path: '/remote/api/session' })
    const read = (): { hits?: number }[] => (JSON.parse(readFileSync(file, 'utf8')) as { pending?: { hits?: number }[] }).pending ?? []
    expect(read()[0]?.hits).toBe(1)

    now += 1_000
    list.note('192.168.31.99', { path: '/remote/api/session' })
    expect(list.pending()[0]?.hits).toBe(2)
    // Still one hit on disk: the retry did not rewrite the file.
    expect(read()[0]?.hits).toBe(1)
  })

  it('restores a stored switch over the constructor seed', () => {
    const file = tempFile()
    const seeded = new LanAllowlist({ file, now: () => 1_000_000, enabled: false })
    expect(seeded.enabled).toBe(false)
    // The user's own decision is what later starts must honour.
    seeded.setEnabled(true)
    const reopened = new LanAllowlist({ file, now: () => 1_000_000, enabled: false })
    expect(reopened.enabled).toBe(true)
  })
})
