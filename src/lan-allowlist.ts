/**
 * LAN allowlist: fail-closed peer approval for the remote channel.
 *
 * A non-loopback connection is admitted only when its peer address is on the
 * allowlist. Anything else is recorded as a pending request and refused, so the
 * desktop UI can approve it with one click; the approval adds the address and
 * the next connection from that device simply works — no pairing token, no QR.
 *
 * The list also accepts IPv4 CIDR rules (`192.168.31.0/24`) for callers that
 * prefer to trust a whole subnet, and every mutation is persisted so an
 * approval survives a restart.
 */

import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

/** One approved peer, exact address or CIDR rule. */
export interface LanAllowEntry {
  /** Exact address when `rule` is absent; otherwise the rule that matched. */
  address: string
  /** CIDR rule this entry stands for (`192.168.31.0/24`), when it is a rule. */
  rule?: string
  /** Free-form label shown in the panel. */
  label?: string
  /** User-Agent observed when the peer was approved. */
  userAgent?: string
  approvedAt: number
  lastSeenAt: number
}

/** One refused peer waiting for a decision on the desktop. */
export interface LanPendingEntry {
  /** Peer address as seen by the socket (normalized). */
  address: string
  /** User-Agent of the refused request, when it sent one. */
  userAgent?: string
  /** Path of the most recent refused request. */
  path: string
  firstSeenAt: number
  lastSeenAt: number
  /** How many refused requests this peer made. */
  hits: number
}

/** Persisted shape of the allowlist file. */
export interface LanAllowlistFile {
  version: 1
  enabled: boolean
  entries: LanAllowEntry[]
  pending: LanPendingEntry[]
}

/** Construction knobs; every one is optional. */
export interface LanAllowlistOptions {
  /** JSON file backing the list; omit for an in-memory list. */
  file?: string
  /**
   * Seed for the on/off switch, used only while the backing file has never
   * stored one. After the panel flips the switch the stored value wins, so a
   * config default cannot silently undo a user's decision on every restart.
   */
  enabled?: boolean
  /** Clock, injected for tests. */
  now?: () => number
  /** How many refused peers are remembered at once. */
  maxPending?: number
  /** Refused peers older than this are forgotten. */
  pendingTtlMs?: number
}

const DEFAULT_MAX_PENDING = 50
const DEFAULT_PENDING_TTL_MS = 24 * 60 * 60 * 1000
/**
 * A last-seen refresh writes the file at most this often. Every admitted
 * request touches its entry (a phone heartbeats every 10 s, and each API call
 * counts), so persisting on every touch would rewrite the JSON hundreds of
 * times an hour for a value that only needs minute-level accuracy.
 */
const TOUCH_PERSIST_INTERVAL_MS = 60_000

/**
 * Normalize a peer address: Node reports IPv4-mapped IPv6 (`::ffff:10.0.0.4`)
 * on dual-stack sockets, which must compare equal to the plain IPv4 form.
 * @param address - raw socket address, possibly with an IPv6 zone.
 * @returns the comparison form, or an empty string when unusable.
 */
export function normalizeAddress(address: string | undefined): string {
  if (address === undefined) return ''
  let value = address.trim().toLowerCase()
  const zone = value.indexOf('%')
  if (zone >= 0) value = value.slice(0, zone)
  if (value.startsWith('::ffff:')) value = value.slice('::ffff:'.length)
  return value
}

/** Parse a dotted-quad address into 32 bits, or undefined when malformed. */
function ipv4ToInt(value: string): number | undefined {
  const parts = value.split('.')
  if (parts.length !== 4) return undefined
  let out = 0
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return undefined
    const octet = Number(part)
    if (octet > 255) return undefined
    out = (out * 256) + octet
  }
  return out
}

/**
 * Whether a rule is usable: an exact address or an IPv4 CIDR block.
 * @param rule - candidate rule.
 * @returns true when the rule can be matched against peer addresses.
 */
export function isValidRule(rule: string): boolean {
  const value = normalizeAddress(rule)
  if (value.length === 0) return false
  const slash = value.indexOf('/')
  if (slash < 0) return true
  const base = value.slice(0, slash)
  const bits = Number(value.slice(slash + 1))
  return ipv4ToInt(base) !== undefined && Number.isInteger(bits) && bits >= 0 && bits <= 32
}

/**
 * Whether one peer address matches one rule (exact address or IPv4 CIDR).
 * @param address - normalized or raw peer address.
 * @param rule - an address or CIDR rule.
 * @returns true on a match.
 */
export function addressMatches(address: string, rule: string): boolean {
  const peer = normalizeAddress(address)
  const candidate = normalizeAddress(rule)
  if (peer.length === 0 || candidate.length === 0) return false
  if (!candidate.includes('/')) return peer === candidate
  const slash = candidate.indexOf('/')
  const base = ipv4ToInt(candidate.slice(0, slash))
  const peerInt = ipv4ToInt(peer)
  const bits = Number(candidate.slice(slash + 1))
  if (base === undefined || peerInt === undefined) return false
  if (!Number.isInteger(bits) || bits < 0 || bits > 32) return false
  if (bits === 0) return true
  const mask = bits === 32 ? 0xffff_ffff : (0xffff_ffff << (32 - bits)) >>> 0
  return ((base & mask) >>> 0) === ((peerInt & mask) >>> 0)
}

/**
 * The LAN approval list. Reads its file once, persists every mutation, and
 * keeps the refused-peer table bounded.
 */
export class LanAllowlist {
  private state: LanAllowlistFile
  private readonly file: string | undefined
  private readonly now: () => number
  private readonly maxPending: number
  private readonly pendingTtlMs: number
  /** Whether the backing file carried an explicit on/off switch. */
  private storedEnabled = false
  /** When the file was last written, for the touch throttle. */
  private lastWriteAt = 0

  constructor(options: LanAllowlistOptions = {}) {
    this.file = options.file
    this.now = options.now ?? (() => Date.now())
    this.maxPending = options.maxPending ?? DEFAULT_MAX_PENDING
    this.pendingTtlMs = options.pendingTtlMs ?? DEFAULT_PENDING_TTL_MS
    this.state = { version: 1, enabled: true, entries: [], pending: [] }
    this.load()
    // A stored switch is the user's own decision and outranks the config seed;
    // the seed only covers a file that has never recorded one (first run).
    if (options.enabled !== undefined && !this.storedEnabled) this.state.enabled = options.enabled
  }

  /** Whether allowlist admission is active at all. */
  get enabled(): boolean {
    return this.state.enabled
  }

  /** Turn allowlist admission on or off; refused peers are kept either way. */
  setEnabled(value: boolean): void {
    if (this.state.enabled === value) return
    this.state.enabled = value
    this.persist()
  }

  /** Approved peers, newest last-seen first. */
  entries(): readonly LanAllowEntry[] {
    return [...this.state.entries].sort((left, right) => right.lastSeenAt - left.lastSeenAt)
  }

  /** Refused peers still waiting for a decision, newest first. */
  pending(): readonly LanPendingEntry[] {
    this.sweep()
    return [...this.state.pending].sort((left, right) => right.lastSeenAt - left.lastSeenAt)
  }

  /** The entry admitting this peer, or undefined. */
  match(address: string): LanAllowEntry | undefined {
    const peer = normalizeAddress(address)
    if (peer.length === 0) return undefined
    return this.state.entries.find(entry => addressMatches(peer, entry.rule ?? entry.address))
  }

  /**
   * Approve one peer: it leaves the pending table and joins the allowlist.
   * @param address - the peer address to approve.
   * @param meta - optional label / User-Agent carried into the record.
   * @returns the stored entry.
   */
  approve(address: string, meta: { label?: string, userAgent?: string } = {}): LanAllowEntry {
    const peer = normalizeAddress(address)
    const existing = this.state.entries.find(entry => entry.rule === undefined && entry.address === peer)
    if (existing !== undefined) {
      existing.lastSeenAt = this.now()
      if (meta.userAgent !== undefined) existing.userAgent = meta.userAgent
      if (meta.label !== undefined) existing.label = meta.label
      this.dismiss(peer)
      this.persist()
      return existing
    }
    const entry: LanAllowEntry = {
      address: peer,
      approvedAt: this.now(),
      lastSeenAt: this.now(),
      ...(meta.label === undefined ? {} : { label: meta.label }),
      ...(meta.userAgent === undefined ? {} : { userAgent: meta.userAgent }),
    }
    this.state.entries.push(entry)
    this.dismiss(peer)
    this.persist()
    return entry
  }

  /**
   * Add a CIDR rule (or another exact address) directly, without a peer.
   * @param rule - address or CIDR block.
   * @param meta - optional label.
   * @returns the stored entry, or undefined when the rule is malformed.
   */
  addRule(rule: string, meta: { label?: string } = {}): LanAllowEntry | undefined {
    const value = normalizeAddress(rule)
    if (!isValidRule(value)) return undefined
    const existing = this.state.entries.find(entry => (entry.rule ?? entry.address) === value)
    if (existing !== undefined) return existing
    const entry: LanAllowEntry = {
      address: value,
      approvedAt: this.now(),
      lastSeenAt: this.now(),
      ...(value.includes('/') ? { rule: value } : {}),
      ...(meta.label === undefined ? {} : { label: meta.label }),
    }
    this.state.entries.push(entry)
    this.persist()
    return entry
  }

  /**
   * Remove one entry, by its address or by the rule it stands for.
   * @returns true when an entry was removed.
   */
  remove(addressOrRule: string): boolean {
    const value = normalizeAddress(addressOrRule)
    const before = this.state.entries.length
    this.state.entries = this.state.entries.filter(entry => (entry.rule ?? entry.address) !== value && entry.address !== value)
    const removed = this.state.entries.length !== before
    if (removed) this.persist()
    return removed
  }

  /** Forget one refused peer without approving it. */
  dismiss(address: string): boolean {
    const peer = normalizeAddress(address)
    const before = this.state.pending.length
    this.state.pending = this.state.pending.filter(entry => entry.address !== peer)
    const removed = this.state.pending.length !== before
    if (removed) this.persist()
    return removed
  }

  /**
   * Record a refused request so the desktop panel can offer an approval.
   * @param address - the peer address.
   * @param meta - path and User-Agent of the refused request.
   * @returns the pending record.
   */
  note(address: string, meta: { path: string, userAgent?: string }): LanPendingEntry {
    const peer = normalizeAddress(address)
    const timestamp = this.now()
    const existing = this.state.pending.find(entry => entry.address === peer)
    if (existing !== undefined) {
      existing.lastSeenAt = timestamp
      existing.hits += 1
      existing.path = meta.path
      if (meta.userAgent !== undefined && meta.userAgent.length > 0) existing.userAgent = meta.userAgent
      // Same throttle as touch(): a refused peer that keeps retrying must not
      // turn every attempt into a disk write.
      if (timestamp - this.lastWriteAt >= TOUCH_PERSIST_INTERVAL_MS) this.persist()
      return existing
    }
    const entry: LanPendingEntry = {
      address: peer,
      path: meta.path,
      firstSeenAt: timestamp,
      lastSeenAt: timestamp,
      hits: 1,
      ...(meta.userAgent === undefined || meta.userAgent.length === 0 ? {} : { userAgent: meta.userAgent }),
    }
    this.state.pending.push(entry)
    this.sweep()
    this.persist()
    return entry
  }

  /** Refresh the last-seen stamp of the entry admitting this peer. */
  touch(address: string): void {
    const entry = this.match(address)
    if (entry === undefined) return
    const now = this.now()
    entry.lastSeenAt = now
    // Throttled: the write is a convenience for the panel, and the in-memory
    // value is already current for every reader in this process.
    if (now - this.lastWriteAt >= TOUCH_PERSIST_INTERVAL_MS) this.persist()
  }

  /** Everything the panel needs in one object. */
  snapshot(): { enabled: boolean, entries: LanAllowEntry[], pending: LanPendingEntry[] } {
    return { enabled: this.state.enabled, entries: [...this.entries()], pending: [...this.pending()] }
  }

  /** Drop stale and overflowing pending records. */
  private sweep(): void {
    const cutoff = this.now() - this.pendingTtlMs
    let next = this.state.pending.filter(entry => entry.lastSeenAt >= cutoff)
    if (next.length > this.maxPending) {
      next = [...next].sort((left, right) => right.lastSeenAt - left.lastSeenAt).slice(0, this.maxPending)
    }
    if (next.length !== this.state.pending.length) {
      this.state.pending = next
      this.persist()
    }
  }

  /** Read the backing file; a missing or unparsable file starts empty. */
  private load(): void {
    if (this.file === undefined) return
    try {
      const parsed = JSON.parse(readFileSync(this.file, 'utf8')) as Partial<LanAllowlistFile>
      this.storedEnabled = typeof parsed.enabled === 'boolean'
      this.state = {
        version: 1,
        enabled: parsed.enabled !== false,
        entries: Array.isArray(parsed.entries) ? parsed.entries.filter(entry => typeof entry?.address === 'string') : [],
        pending: Array.isArray(parsed.pending) ? parsed.pending.filter(entry => typeof entry?.address === 'string') : [],
      }
    } catch {
      // Missing file is the normal first-run state; a corrupt file must not
      // take the fence down, so the list simply starts empty.
    }
  }

  /** Write the backing file atomically (temp file + rename, mode 0600). */
  private persist(): void {
    if (this.file === undefined) return
    try {
      mkdirSync(dirname(this.file), { recursive: true })
      const temp = `${this.file}.tmp`
      writeFileSync(temp, JSON.stringify(this.state, null, 2), { mode: 0o600 })
      renameSync(temp, this.file)
      this.lastWriteAt = this.now()
    } catch {
      rmSync(`${this.file}.tmp`, { force: true })
    }
  }
}
