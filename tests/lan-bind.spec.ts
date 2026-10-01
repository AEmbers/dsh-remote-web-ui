/** The managed lan-bind patch block: parse, strip, and write semantics. */
import { mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import process from 'node:process'
import { afterEach, describe, expect, it } from 'vitest'
import { parseAllDocuments } from 'yaml'
import { LAN_BIND_BLOCK_BEGIN, LAN_BIND_BLOCK_END, lanBindState, managedBlock, managedBindOf, profilePatchFile, stripManagedBlock, writeLanBind } from '../src/lan-bind.ts'

const tempDirs: string[] = []

function tempHome(): string {
  const dir = mkdtempSync(join(tmpdir(), 'remote-web-ui-lan-bind-'))
  tempDirs.push(dir)
  return dir
}

/** Single patch list per file, in plain values, the way the harness reads it. */
function parsePatch(content: string): Record<string, unknown>[] {
  const docs = parseAllDocuments(content)
  expect(docs.map(doc => doc.errors.map(error => error.message))).toEqual([[]])
  const roots = docs.map(doc => doc.toJS() as unknown).filter(root => root !== null)
  expect(roots).toHaveLength(1)
  expect(Array.isArray(roots[0])).toBe(true)
  return roots[0] as Record<string, unknown>[]
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

describe('managedBindOf / managedBlock', () => {
  it('parses the pinned bind out of the block', () => {
    expect(managedBindOf(managedBlock('0.0.0.0', 3080))).toEqual({ host: '0.0.0.0', port: 3080 })
    expect(managedBindOf(managedBlock('127.0.0.1', 3191))).toEqual({ host: '127.0.0.1', port: 3191 })
  })

  it('returns undefined without a managed block', () => {
    expect(managedBindOf('- id: other\n  config:\n    host: 0.0.0.0\n')).toBeUndefined()
    expect(managedBindOf('')).toBeUndefined()
  })

  it('surfaces hand-edited values instead of claiming a known state', () => {
    const handEdited = managedBlock('0.0.0.0', 3080).replace("'0.0.0.0'", "'192.168.1.5'")
    expect(managedBindOf(handEdited)?.host).toBe('192.168.1.5')
  })
})

describe('stripManagedBlock', () => {
  it('removes the block and keeps surrounding content byte-identical', () => {
    const before = '- id: a\n  config:\n    x: 1\n'
    const content = `${before}${LAN_BIND_BLOCK_BEGIN}\n- id: webserver\n  config:\n    host: '0.0.0.0'\n    port: 3080\n${LAN_BIND_BLOCK_END}\n- id: b\n`
    expect(stripManagedBlock(content)).toBe(`${before}- id: b\n`)
  })

  it('leaves content without a block untouched', () => {
    const content = '- id: only\n'
    expect(stripManagedBlock(content)).toBe(content)
  })

  // The plugin manager appends rows through the YAML document API, so
  // they land at the end of the sequence - before a trailing END marker that
  // was written last. Stripping the whole region deleted the user's rows.
  it('operator: every row a YAML writer appended inside the displaced markers survives', () => {
    // Given a patch holding the block plus rows appended after it.
    const content = [
      '- id: before',
      LAN_BIND_BLOCK_BEGIN,
      '- id: webserver',
      "  name: '@deepseek-ai/dsh-host-webserver'",
      '  config:',
      "    host: '0.0.0.0'",
      '    port: 19387',
      '- id: web-ui-remote-web-ui',
      '  config:',
      '    lanBind: true',
      '- id: after',
      LAN_BIND_BLOCK_END,
      '',
    ].join('\n')
    // When the block is stripped for a rewrite.
    const stripped = stripManagedBlock(content)
    // Then only the markers and the managed row are gone.
    expect(stripped).toBe([
      '- id: before',
      '- id: web-ui-remote-web-ui',
      '  config:',
      '    lanBind: true',
      '- id: after',
      '',
    ].join('\n'))
  })

  it('operator: the pinned bind is read from the managed row, not a displaced one', () => {
    // Given a region whose first row belongs to another plugin.
    const content = [
      LAN_BIND_BLOCK_BEGIN,
      '- id: other-plugin',
      '  config:',
      "    host: '10.0.0.9'",
      '    port: 9',
      '- id: webserver',
      "  name: '@deepseek-ai/dsh-host-webserver'",
      '  config:',
      "    host: '0.0.0.0'",
      '    port: 19387',
      LAN_BIND_BLOCK_END,
      '',
    ].join('\n')
    // When the pinned bind is read back.
    // Then the foreign row's host and port are ignored.
    expect(managedBindOf(content)).toEqual({ host: '0.0.0.0', port: 19387 })
  })
})

describe('writeLanBind / lanBindState', () => {
  it('appends the block, preserves other rows, and rewrites in place', () => {
    const home = tempHome()
    const patch = join(home, 'profiles', 'web', 'cordis.patch.yml')
    mkdirSync(join(home, 'profiles', 'web'), { recursive: true })
    writeFileSync(patch, '- insert:\n    - id: remote-web-ui\n      name: \'@linxin666/dsh-remote-web-ui\'\n')
    writeLanBind('0.0.0.0', 3080, 'web', home)
    const afterOn = readFileSync(patch, 'utf8')
    expect(afterOn).toContain('- id: remote-web-ui')
    expect(managedBindOf(afterOn)).toEqual({ host: '0.0.0.0', port: 3080 })
    expect(lanBindState('web', home)).toEqual({ blockPresent: true, host: '0.0.0.0', port: 3080 })
    // Flipping rewrites the same block (no duplication).
    writeLanBind('127.0.0.1', 3191, 'web', home)
    const afterOff = readFileSync(patch, 'utf8')
    expect(managedBindOf(afterOff)).toEqual({ host: '127.0.0.1', port: 3191 })
    expect(afterOff.split(LAN_BIND_BLOCK_BEGIN)).toHaveLength(2)
  })

  it('reports a missing file as untouched', () => {
    const home = tempHome()
    expect(lanBindState('web', home)).toEqual({ blockPresent: false })
  })

  it('refuses profiles that escape the profiles directory', () => {
    const home = tempHome()
    expect(() => writeLanBind('0.0.0.0', 3080, '../elsewhere', home)).toThrow(/unsafe lan-bind profile/)
    expect(() => writeLanBind('0.0.0.0', 3080, 'a/b', home)).toThrow(/unsafe lan-bind profile/)
    expect(() => writeLanBind('0.0.0.0', 3080, '..', home)).toThrow(/unsafe lan-bind profile/)
    expect(() => profilePatchFile('../../elsewhere', home)).toThrow(/unsafe lan-bind profile/)
  })

  it('replaces an unterminated block instead of stacking a second webserver row', () => {
    const home = tempHome()
    const patch = join(home, 'profiles', 'web', 'cordis.patch.yml')
    mkdirSync(join(home, 'profiles', 'web'), { recursive: true })
    // A hand-truncated file: BEGIN present, END missing, and a row after the
    // orphan that the rewrite must not eat.
    writeFileSync(patch, '- id: keep\n' + `${LAN_BIND_BLOCK_BEGIN}\n- id: webserver\n  config:\n    host: '0.0.0.0'\n- id: keep-after\n`)
    writeLanBind('127.0.0.1', 3191, 'web', home)
    const after = readFileSync(patch, 'utf8')
    expect(managedBindOf(after)).toEqual({ host: '127.0.0.1', port: 3191 })
    expect(after.split(LAN_BIND_BLOCK_BEGIN)).toHaveLength(2)
    expect(after.split('- id: webserver')).toHaveLength(2)
    expect(after).toContain('- id: keep')
    expect(after).toContain('- id: keep-after')
  })

  // Write path: the boot re-assert (and every toggle flip) reaches
  // stripManagedBlock. It must leave rows another writer displaced into the
  // markers alone - the remote-control row carries the LAN toggle itself, so
  // deleting it turned the feature back off and locked the phone out again.
  it('operator: the boot re-assert keeps rows displaced inside the markers', () => {
    const home = tempHome()
    // Given a Desktop profile whose remote-control row and model rows were
    // appended through the YAML document API while the block was last.
    const patch = join(home, 'profiles', 'desktop', 'cordis.patch.yml')
    mkdirSync(join(home, 'profiles', 'desktop'), { recursive: true })
    writeFileSync(patch, [
      '- id: keep-before',
      LAN_BIND_BLOCK_BEGIN,
      '- id: webserver',
      "  name: '@deepseek-ai/dsh-host-webserver'",
      '  config:',
      "    host: '0.0.0.0'",
      '    port: 19387',
      '- id: web-ui-remote-web-ui',
      '  config:',
      "    plugin: '@linxin666/dsh-remote-web-ui'",
      '    lanBind: true',
      '- id: llm-verifier',
      '  config:',
      '    model: gpt-6-sol',
      LAN_BIND_BLOCK_END,
      '',
    ].join('\n'))
    // When the boot re-assert rewrites the block for the same bind.
    writeLanBind('0.0.0.0', 19387, 'desktop', home)
    // Then every foreign row survives and one block still carries the bind.
    const content = readFileSync(patch, 'utf8')
    expect(parsePatch(content).map(item => item.id)).toEqual([
      'keep-before',
      'web-ui-remote-web-ui',
      'llm-verifier',
      'webserver',
    ])
    expect(managedBindOf(content)).toEqual({ host: '0.0.0.0', port: 19387 })
    expect(content.split(LAN_BIND_BLOCK_BEGIN)).toHaveLength(2)
    expect(content.split('- id: webserver')).toHaveLength(2)
  })

  it.skipIf(process.platform === 'win32')('preserves the original file permissions instead of resetting to umask', () => {
    const home = tempHome()
    const patch = join(home, 'profiles', 'web', 'cordis.patch.yml')
    mkdirSync(join(home, 'profiles', 'web'), { recursive: true })
    writeFileSync(patch, '- id: a\n', { mode: 0o600 })
    writeLanBind('0.0.0.0', 3080, 'web', home)
    expect(statSync(patch).mode & 0o777).toBe(0o600)
  })

  it('strips empty array placeholder [] so cordis.patch.yml remains valid YAML', () => {
    const home = tempHome()

    // Case 1: only []
    const patch1 = join(home, 'profiles', 'p1', 'cordis.patch.yml')
    mkdirSync(join(home, 'profiles', 'p1'), { recursive: true })
    writeFileSync(patch1, '[]\n')
    writeLanBind('0.0.0.0', 3080, 'p1', home)
    const content1 = readFileSync(patch1, 'utf8')
    expect(content1).not.toContain('[]')
    expect(content1.trimStart().startsWith(LAN_BIND_BLOCK_BEGIN)).toBe(true)
    expect(managedBindOf(content1)).toEqual({ host: '0.0.0.0', port: 3080 })

    // Case 2: # comment followed by []
    const patch2 = join(home, 'profiles', 'p2', 'cordis.patch.yml')
    mkdirSync(join(home, 'profiles', 'p2'), { recursive: true })
    writeFileSync(patch2, '# user patch\n[]\n')
    writeLanBind('0.0.0.0', 3080, 'p2', home)
    const content2 = readFileSync(patch2, 'utf8')
    expect(content2).not.toContain('[]')
    expect(content2).toContain('# user patch')
    expect(managedBindOf(content2)).toEqual({ host: '0.0.0.0', port: 3080 })

    // Case 3: existing entries followed by []
    const patch3 = join(home, 'profiles', 'p3', 'cordis.patch.yml')
    mkdirSync(join(home, 'profiles', 'p3'), { recursive: true })
    writeFileSync(patch3, '- id: keep\n  config:\n    x: 1\n[]\n')
    writeLanBind('0.0.0.0', 3080, 'p3', home)
    const content3 = readFileSync(patch3, 'utf8')
    expect(content3).not.toContain('[]')
    expect(content3).toContain('- id: keep')
    expect(managedBindOf(content3)).toEqual({ host: '0.0.0.0', port: 3080 })
  })

  // #1675: the plugin manager appends rows through the YAML document API,
  // which preserves the placeholder's flow style, leaving a NON-empty flow
  // array. Appending the block sequence there produced two root documents and
  // the profile failed to parse at dsh web startup (7:1).
  it('operator: a flow-array profile stays one document after the block is written', () => {
    const home = tempHome()
    // Given a profile whose placeholder [] was rewritten into flow rows.
    const patch = join(home, 'profiles', 'web', 'cordis.patch.yml')
    mkdirSync(join(home, 'profiles', 'web'), { recursive: true })
    writeFileSync(patch, '[ { id: web-ui-ssh, name: "@linxin666/dsh-web-all/ssh", disabled: false } ]\n')
    // When the LAN bind toggle writes its managed block.
    writeLanBind('0.0.0.0', 3080, 'web', home)
    // Then the file is exactly one patch list holding the user's row and the
    // managed webserver row, and no second root document exists.
    const content = readFileSync(patch, 'utf8')
    const items = parsePatch(content)
    expect(items).toHaveLength(2)
    expect(items.map(item => item.id)).toEqual(['web-ui-ssh', 'webserver'])
    expect(managedBindOf(content)).toEqual({ host: '0.0.0.0', port: 3080 })
    expect(content.trimStart().startsWith('[')).toBe(false)
  })

  it('operator: the managed row is appended last so it overrides the user rows', () => {
    const home = tempHome()
    // Given a flow-array profile that already carries a webserver row.
    const patch = join(home, 'profiles', 'web', 'cordis.patch.yml')
    mkdirSync(join(home, 'profiles', 'web'), { recursive: true })
    writeFileSync(patch, '[ { id: webserver, name: "@deepseek-ai/dsh-host-webserver", config: { host: "127.0.0.1", port: 3000 } }, { id: other, name: x } ]\n')
    // When the LAN bind toggle writes its managed block.
    writeLanBind('0.0.0.0', 3080, 'web', home)
    // Then the user's rows are untouched and the appended managed row carries
    // the bind (same-id patch rows replace wholesale).
    const content = readFileSync(patch, 'utf8')
    const items = parsePatch(content)
    expect(items.map(item => item.id)).toEqual(['webserver', 'other', 'webserver'])
    const last = items[items.length - 1] as { config?: { host?: unknown; port?: unknown } }
    expect(last.config?.host).toBe('0.0.0.0')
    expect(last.config?.port).toBe(3080)
    expect(managedBindOf(content)).toEqual({ host: '0.0.0.0', port: 3080 })
  })

  it('operator: repeated writes leave one managed row and the latest bind', () => {
    const home = tempHome()
    // Given a flow-array profile the toggle has not touched yet.
    const patch = join(home, 'profiles', 'web', 'cordis.patch.yml')
    mkdirSync(join(home, 'profiles', 'web'), { recursive: true })
    writeFileSync(patch, '[ { id: keep, name: y } ]\n')
    // When the toggle is flipped twice (LAN on, then off).
    writeLanBind('0.0.0.0', 3080, 'web', home)
    writeLanBind('127.0.0.1', 3191, 'web', home)
    // Then the file holds one block and one webserver row carrying the last bind.
    const content = readFileSync(patch, 'utf8')
    expect(parsePatch(content)).toHaveLength(2)
    expect(content.split(LAN_BIND_BLOCK_BEGIN)).toHaveLength(2)
    expect(content.split('- id: webserver')).toHaveLength(2)
    expect(managedBindOf(content)).toEqual({ host: '127.0.0.1', port: 3191 })
  })

  it('operator: an unparsable profile is refused instead of half-rewritten', () => {
    const home = tempHome()
    // Given a profile whose text is not a YAML patch list.
    const patch = join(home, 'profiles', 'web', 'cordis.patch.yml')
    mkdirSync(join(home, 'profiles', 'web'), { recursive: true })
    writeFileSync(patch, '[ not: [a, patch, list]\n')
    // When the LAN bind toggle runs.
    // Then it reports the file it cannot update and leaves the bytes alone.
    expect(() => { writeLanBind('0.0.0.0', 3080, 'web', home) }).toThrow(/cannot update the lan-bind block/)
    expect(readFileSync(patch, 'utf8')).toBe('[ not: [a, patch, list]\n')
  })
});

