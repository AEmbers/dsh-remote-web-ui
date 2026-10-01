/**
 * LAN bind toggle: the managed cordis patch block that pins the web
 * server's bind. On = a block binding 0.0.0.0; off = the same block binding
 * 127.0.0.1. The block takes effect on the next `dsh web` start (the live
 * patch watcher cannot rebind a running listener, and on this harness line
 * the user patch layer cannot evaluate webStartup-dependent expressions
 * reliably - static values are the only dependable form), so the plugin
 * re-asserts the block at every boot and the settings card reports the
 * running bind honestly.
 *
 * Same-id patch rows REPLACE the row config wholesale, so the block carries
 * the official web-app webserver row's full config (bind + compression)
 * with the bind values materialized. The CLI's --host 0.0.0.0 guard stays
 * intact: deliberate LAN exposure happens through this configuration layer
 * only. Until the user flips the toggle once, the plugin never touches the
 * patch file.
 *
 * The block discipline (markers, atomic write, strip-and-rewrite) follows
 * the dsh-LAN reference implementation (MIT).
 */

import { existsSync, mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve, sep } from 'node:path'
import { parseDocument } from 'yaml'
import { dshHome } from './dsh-home.ts'

/** Profile names safe to interpolate into the patch path: one path segment, no traversal. */
const PROFILE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*$/

export const LAN_BIND_BLOCK_BEGIN = '# --- remote-web-ui lan-bind block (managed - do not edit) ---'
export const LAN_BIND_BLOCK_END = '# --- end remote-web-ui lan-bind block ---'

/** The two bind hosts the managed block pins. */
export type LanBindHost = '0.0.0.0' | '127.0.0.1'

/**
 * The absolute path of the profile patch file this toggle manages. The value
 * is config-controlled (and the runtime/environment fallbacks bypass schema
 * validation entirely), so the path is guarded twice: the profile must be a
 * single safe path segment, and the resolved file must stay under the
 * profiles directory.
 */
export function profilePatchFile(profile: string, home: string = dshHome()): string {
  if (!PROFILE_PATTERN.test(profile)) {
    throw new Error(`remote-web-ui: unsafe lan-bind profile ${JSON.stringify(profile)}`)
  }
  const file = resolve(join(home, 'profiles', profile, 'cordis.patch.yml'))
  const root = resolve(join(home, 'profiles')) + sep
  if (!file.startsWith(root)) {
    throw new Error(`remote-web-ui: lan-bind profile ${JSON.stringify(profile)} escapes the profiles directory`)
  }
  return file
}

function readPatchContent(file: string): string {
  if (!existsSync(file)) return ''
  return readFileSync(file, 'utf8')
}

/** One top-level sequence item inside a managed-block region. */
interface BlockItem {
  /** Offset of the item's first character inside the region. */
  start: number
  /** Offset just past the item's last character inside the region. */
  end: number
  /** The item's source text, line terminator included. */
  text: string
}

/**
 * Split a block-sequence region into its top-level items. Only a column-0 `-`
 * starts an item: that is the shape every writer of this file produces - the
 * managed block itself and the YAML document API's block-style re-emission.
 * @param region - text between two line boundaries.
 * @returns the items in source order; text outside them is not returned.
 */
function blockItems(region: string): BlockItem[] {
  const items: BlockItem[] = []
  let start = -1
  let offset = 0
  for (const line of region.split('\n')) {
    if (line.startsWith('- ') || line === '-') {
      if (start !== -1) items.push({ start, end: offset, text: region.slice(start, offset) })
      start = offset
    }
    offset += line.length + 1
  }
  if (start !== -1) items.push({ start, end: region.length, text: region.slice(start) })
  return items
}

/**
 * Whether one top-level item is the webserver row this plugin's block owns.
 * The row id is the whole signal: the markers declare everything inside them
 * managed, our block always writes `- id: webserver`, and a same-id row later
 * in the patch replaces this one wholesale anyway - so an id-webserver row
 * found inside our markers is this plugin's row (a hand-truncated block may
 * have lost its `name` line).
 * @param item - one top-level item's text.
 * @returns true when the item is the managed webserver row.
 */
function isManagedWebserverItem(item: string): boolean {
  return /^- id:\s*['"]?webserver['"]?[ \t]*(?:\r?\n|$)/.test(item)
}

/**
 * The text between a block's BEGIN and END markers: from the character after
 * the BEGIN line's terminator to the start of the END marker's line (or to
 * the end of the content without an END marker).
 * @param content - the patch file text.
 * @param begin - index of the BEGIN marker.
 * @param end - index of the END marker, or -1 when the block is unterminated.
 * @returns the region's text.
 */
function managedRegion(content: string, begin: number, end: number): string {
  const newlineAfterBegin = content.indexOf('\n', begin)
  const innerStart = newlineAfterBegin === -1 ? content.length : newlineAfterBegin + 1
  const endLineStart = end === -1 ? content.length : content.lastIndexOf('\n', end - 1) + 1
  return content.slice(innerStart, Math.max(innerStart, endLineStart))
}

/**
 * Remove the managed block (its markers and the webserver row this plugin
 * wrote) from patch content, keeping every other row.
 *
 * The markers travel with the file through writers that append rows through
 * the YAML document API: the appended rows land at the end of the sequence,
 * which is BEFORE a trailing END comment, so the region between the markers
 * can hold rows this plugin never wrote. Deleting the whole region silently
 * removed the user's model, plugin and remote-control rows on the next rewrite
 * - the remote-control row carries the LAN toggle itself, so the feature reset
 * to `undefined` and the phone was locked out again after a restart (DSH
 * Desktop report, 2026-09-30). Only the managed item is removed here; every
 * foreign row is kept in place and the fresh block is appended after them (the
 * same-id row last wins).
 * @param content - the patch file text.
 * @returns the text with the markers and the managed row removed.
 */
export function stripManagedBlock(content: string): string {
  let text = content
  for (;;) {
    const begin = text.indexOf(LAN_BIND_BLOCK_BEGIN)
    if (begin === -1) return text
    const end = text.indexOf(LAN_BIND_BLOCK_END, begin)
    const blockStart = text.lastIndexOf('\n', begin - 1) + 1
    const newlineAfterEnd = end === -1 ? -1 : text.indexOf('\n', end)
    const resumeAt = end === -1 ? text.length : (newlineAfterEnd === -1 ? text.length : newlineAfterEnd + 1)
    const region = managedRegion(text, begin, end)
    let kept = ''
    let cursor = 0
    for (const item of blockItems(region)) {
      if (!isManagedWebserverItem(item.text)) continue
      kept += region.slice(cursor, item.start)
      cursor = item.end
    }
    kept += region.slice(cursor)
    text = text.slice(0, blockStart) + kept + text.slice(resumeAt)
  }
}

/**
 * Render the managed block for one bind state. The values are static: the
 * user patch layer has no reliable lazy service evaluation, and the plugin
 * re-asserts the block at every boot so CLI flags (--port, --host) win by
 * rewriting it before the next start.
 */
/**
 * Whether the base opens a flow collection at the root. That is the shape the
 * plugin manager's YAML document round-trip leaves behind when it appends rows
 * to the profile's placeholder `[]`: `[ { id: … }, … ]`. Every other base
 * (empty, block sequence, comment-only prefix) keeps the historical string
 * concatenation, so the common paths stay byte-identical.
 */
function isFlowRoot(base: string): boolean {
  return base.trimStart().startsWith('[')
}

/** Force one parsed collection (and its item collections) into block style. */
function toBlockStyle(node: unknown): void {
  if (typeof node !== 'object' || node === null) return
  const collection = node as { flow?: boolean; items?: unknown[] }
  if (!Array.isArray(collection.items) && typeof collection.flow !== 'boolean') return
  collection.flow = false
  for (const item of collection.items ?? []) toBlockStyle(item)
}

/** Plain-value view of one parsed node (YAML nodes keep their own accessors). */
function plainOf(node: unknown): unknown {
  if (typeof node !== 'object' || node === null) return node
  const json = (node as { toJSON?: () => unknown }).toJSON
  return typeof json === 'function' ? json.call(node) : node
}

/**
 * Produce the file text for one bind state. A flow-style base is re-emitted as
 * a block sequence before the managed block is appended, so the file stays
 * exactly one valid YAML document; concatenating the block onto a non-empty
 * flow array produced two root documents and the profile failed to parse at
 * `dsh web` startup (#1675). A base that cannot be parsed is refused with the
 * file path rather than written half-valid.
 */
function mergePatchContent(base: string, block: string, file: string): string {
  if (base.length === 0) return block
  if (!isFlowRoot(base)) return `${base}\n\n${block}`
  const doc = parseDocument(base, { uniqueKeys: false })
  if (doc.errors.length > 0 || doc.contents === null) {
    throw new Error(`remote-web-ui: cannot update the lan-bind block in ${file}: ${doc.errors[0]?.message ?? 'the patch file is not a YAML document'}`)
  }
  if (!('items' in (doc.contents as { items?: unknown[] }))) {
    throw new Error(`remote-web-ui: cannot update the lan-bind block in ${file}: the patch file is not a top-level patch list`)
  }
  toBlockStyle(doc.contents)
  const rendered = doc.toString({ lineWidth: 0 }).trimEnd()
  return `${rendered}\n\n${block}`
}

/**
 * Render the managed block for one bind state. The values are static: the
 * user patch layer has no reliable lazy service evaluation, and the plugin
 * re-asserts the block at every boot so CLI flags (--port, --host) win by
 * rewriting it before the next start.
 */
export function managedBlock(host: LanBindHost, port: number): string {
  return [
    LAN_BIND_BLOCK_BEGIN,
    '- id: webserver',
    "  name: '@deepseek-ai/dsh-host-webserver'",
    '  config:',
    `    host: '${host}'`,
    `    port: ${String(port)}`,
    '    compression: gzip',
    '    compressionLevel: 1',
    '    compressionThresholdBytes: 1024',
    LAN_BIND_BLOCK_END,
    '',
  ].join('\n')
}

/** The bind state a managed block pins (undefined when there is no block). */
export interface ManagedBindState {
  host: LanBindHost | (string & {})
  port: number | undefined
}

/**
 * Parse the block's pinned bind out of patch content. A block whose values
 * were hand-edited reports the literals as-is so the card can surface them
 * instead of silently claiming one of the two known states.
 */
export function managedBindOf(content: string): ManagedBindState | undefined {
  const begin = content.indexOf(LAN_BIND_BLOCK_BEGIN)
  if (begin === -1) return undefined
  const end = content.indexOf(LAN_BIND_BLOCK_END, begin)
  const region = managedRegion(content, begin, end)
  // Read the bind out of the managed row itself. A region a YAML writer
  // displaced holds foreign rows too, and their `host`/`port` keys are not
  // this block's bind - reading them made the boot re-assert
  // believe the block was already applied. A region without a recognizable
  // managed row (hand-edited literals) keeps the historical whole-region read.
  const items = blockItems(region).filter(item => isManagedWebserverItem(item.text))
  const scope = items.length > 0 ? items.map(item => item.text).join('') : region
  const hostMatch = /host:\s*'([^']+)'/.exec(scope)
  const portMatch = /port:\s*(\d+)/.exec(scope)
  return {
    host: hostMatch?.[1] ?? '',
    port: portMatch !== null ? Number(portMatch[1]) : undefined,
  }
}

/** Full file-level state for the settings card and the boot re-assert. */
export function lanBindState(profile: string, home: string = dshHome()): { blockPresent: boolean; host?: string; port?: number } {
  const state = managedBindOf(readPatchContent(profilePatchFile(profile, home)))
  if (state === undefined) return { blockPresent: false }
  return { blockPresent: true, host: state.host, port: state.port }
}

/**
 * Write (or rewrite) the managed block with the given bind. The rest of the
 * patch file is preserved; the block is rewritten atomically (unique temp
 * file + rename, so concurrent writers can never rename a half-written
 * file) with the original file's permissions preserved. A hand-truncated
 * unterminated block (BEGIN marker without END) is consumed by
 * stripManagedBlock as well - markers and managed row removed, foreign rows
 * kept - so the rewrite can never stack a second webserver row onto the
 * orphan.
 *
 * The written file is always exactly one valid YAML document: a base the
 * plugin manager left in flow style is re-emitted as a block sequence before
 * the managed block is appended (see mergePatchContent).
 */
export function writeLanBind(host: LanBindHost, port: number, profile: string, home: string = dshHome()): void {
  const file = profilePatchFile(profile, home)
  const rawBase = stripManagedBlock(readPatchContent(file)).trimEnd()
  const base = rawBase.replace(/\[\s*\]\s*$/, '').trimEnd()
  const block = managedBlock(host, port)
  const content = mergePatchContent(base, block, file)
  const mode = existsSync(file) ? statSync(file).mode & 0o777 : 0o600
  mkdirSync(dirname(file), { recursive: true })
  const temp = `${file}.remote-web-ui-tmp-${process.pid.toString(36)}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
  writeFileSync(temp, content, { mode })
  renameSync(temp, file)
}