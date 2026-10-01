/**
 * The LAN approval list over the real route family: the loopback-only control
 * endpoints, the admission decision for an approved address, the refused-peer
 * record, and the device-gated landing that an approved address reaches with
 * no token at all.
 */
import { createServer, request as httpRequest } from 'node:http'
import { describe, expect, it } from 'vitest'
import type { AddressInfo, IncomingMessage, Server, ServerResponse } from 'node:http'
import type { WebRoute } from '@deepseek-ai/dsh-host-webserver'
import { PairingService } from '../src/pairing.ts'
import { LanAllowlist } from '../src/lan-allowlist.ts'
import { PAIR_PATHS, makeRoutes } from '../src/routes.ts'
import { allowlistDeviceIdOf, noteRefusedPeer } from '../src/remote-api.ts'

/** The LAN base the test server advertises for the phone-facing fence. */
const LAN_BASE = '192.168.1.5:3080'

function makeService(): PairingService {
  const service = new PairingService({
    tokenTtlMs: 60_000,
    offlineAfterMs: 10_000,
    maxDevices: 4,
    cookieName: 'dsh_pair',
  }, {
    now: () => 1_000_000,
    randomToken: () => 'tok-1',
  })
  service.setLanBases([{ address: '192.168.1.5', base: `http://${LAN_BASE}` }])
  return service
}

interface TestServer {
  port: number
  close: () => Promise<void>
}

/** Serve the route family from a real server (loopback peer, spoofable Host). */
async function serve(routes: WebRoute[]): Promise<TestServer> {
  const server: Server = createServer((request, response) => {
    const requestPath = new URL(request.url ?? '/', 'http://x').pathname
    const route = routes.find(r => r.kind === 'exact' && r.path === requestPath)
    if (route === undefined) {
      response.writeHead(404)
      response.end()
      return
    }
    void route.handler(request, response)
  })
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  const address = server.address() as AddressInfo
  return {
    port: address.port,
    close: () => new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error === undefined || error === null) resolve()
        else reject(error)
      })
    }),
  }
}

interface CallResult {
  status: number
  body: Record<string, unknown>
  raw: string
  cookies: string[]
}

/** One JSON call; the caller spoofs the authority a browser would send. */
async function call(
  port: number,
  method: 'GET' | 'POST',
  path: string,
  opts: { host?: string; body?: unknown } = {},
): Promise<CallResult> {
  return await new Promise((resolve, reject) => {
    const payload = opts.body === undefined ? undefined : JSON.stringify(opts.body)
    const headers: Record<string, string> = { host: opts.host ?? `127.0.0.1:${String(port)}` }
    if (payload !== undefined) headers['content-type'] = 'application/json'
    const req = httpRequest({ host: '127.0.0.1', port, path, method, headers }, (response) => {
      const chunks: Buffer[] = []
      response.on('data', (chunk) => { chunks.push(chunk as Buffer) })
      response.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf8')
        let body: Record<string, unknown> = {}
        try { body = JSON.parse(raw) as Record<string, unknown> } catch { /* html or empty body */ }
        resolve({
          status: response.statusCode ?? 0,
          body,
          raw,
          cookies: response.headers['set-cookie'] ?? [],
        })
      })
    })
    req.on('error', reject)
    if (payload !== undefined) req.write(payload)
    req.end()
  })
}

/** A minimal request whose socket reports the given peer address. */
function requestFrom(address: string, userAgent?: string): IncomingMessage {
  return {
    socket: { remoteAddress: address },
    headers: {
      host: LAN_BASE,
      ...(userAgent === undefined ? {} : { 'user-agent': userAgent }),
    },
    url: '/remote/api/session',
  } as unknown as IncomingMessage
}

describe('LAN allowlist admission', () => {
  it('mints a deterministic LAN session for an approved address', () => {
    const service = makeService()
    const allowlist = new LanAllowlist()
    allowlist.approve('192.168.1.9')
    const deviceId = allowlistDeviceIdOf(requestFrom('::ffff:192.168.1.9', 'Pixel'), { service, allowlist } as never)
    expect(deviceId).toBe('lan:192.168.1.9')
    expect(service.hasDevice('lan:192.168.1.9')).toBe(true)
    // The IPv4-mapped form the dual-stack socket reports must resolve to the
    // same session as the plain address the panel approved.
    expect(allowlistDeviceIdOf(requestFrom('192.168.1.9'), { service, allowlist } as never))
      .toBe('lan:192.168.1.9')
  })

  it('refuses an address that was never approved', () => {
    const service = makeService()
    const allowlist = new LanAllowlist()
    allowlist.approve('192.168.1.9')
    expect(allowlistDeviceIdOf(requestFrom('192.168.1.44'), { service, allowlist } as never)).toBeUndefined()
    expect(service.hasDevice('lan:192.168.1.44')).toBe(false)
  })

  it('refuses every address while the switch is off', () => {
    const service = makeService()
    const allowlist = new LanAllowlist()
    allowlist.approve('192.168.1.9')
    allowlist.setEnabled(false)
    expect(allowlistDeviceIdOf(requestFrom('192.168.1.9'), { service, allowlist } as never)).toBeUndefined()
  })

  it('admits a whole subnet through a CIDR entry', () => {
    const service = makeService()
    const allowlist = new LanAllowlist()
    expect(allowlist.addRule('192.168.31.0/24')).toBeDefined()
    expect(allowlistDeviceIdOf(requestFrom('192.168.31.112'), { service, allowlist } as never))
      .toBe('lan:192.168.31.112')
    expect(allowlistDeviceIdOf(requestFrom('192.168.32.112'), { service, allowlist } as never)).toBeUndefined()
  })
})

describe('refused-peer record', () => {
  it('records a refused network peer once per address', () => {
    const service = makeService()
    const allowlist = new LanAllowlist()
    noteRefusedPeer(requestFrom('192.168.1.9', 'Pixel'), '/remote/api/session', { service, allowlist } as never)
    noteRefusedPeer(requestFrom('192.168.1.9', 'Pixel'), '/remote/api/other', { service, allowlist } as never)
    const pending = allowlist.pending()
    expect(pending).toHaveLength(1)
    expect(pending[0]?.address).toBe('192.168.1.9')
    expect(pending[0]?.hits).toBe(2)
    expect(pending[0]?.path).toBe('/remote/api/other')
    expect(pending[0]?.userAgent).toBe('Pixel')
  })

  it('never records loopback, and records nothing while the switch is off', () => {
    const service = makeService()
    const allowlist = new LanAllowlist()
    noteRefusedPeer(requestFrom('127.0.0.1'), '/remote/api/session', { service, allowlist } as never)
    noteRefusedPeer(requestFrom('::1'), '/remote/api/session', { service, allowlist } as never)
    expect(allowlist.pending()).toHaveLength(0)
    const off = new LanAllowlist()
    off.setEnabled(false)
    noteRefusedPeer(requestFrom('192.168.1.9'), '/remote/api/session', { service, allowlist: off } as never)
    expect(off.pending()).toHaveLength(0)
  })
})

describe('LAN allowlist control endpoints', () => {
  /** Mount the route family with an allowlist and a servable app shell. */
  async function mount(): Promise<{ service: PairingService; allowlist: LanAllowlist; server: TestServer }> {
    const service = makeService()
    const allowlist = new LanAllowlist()
    const routes = makeRoutes({
      service,
      indexDocument: async () => '<!doctype html><html><body>INDEX</body></html>',
      allowlist,
    })
    return { service, allowlist, server: await serve(routes) }
  }

  it('reports the switch and both tables', async () => {
    const { allowlist, server } = await mount()
    try {
      allowlist.approve('192.168.1.9')
      allowlist.note('192.168.1.44', { path: '/remote/api/session' })
      const result = await call(server.port, 'GET', PAIR_PATHS.lanState)
      expect(result.status).toBe(200)
      expect(result.body.ok).toBe(true)
      expect(result.body.available).toBe(true)
      expect(result.body.enabled).toBe(true)
      expect((result.body.entries as { address: string }[]).map(entry => entry.address)).toEqual(['192.168.1.9'])
      expect((result.body.pending as { address: string }[]).map(entry => entry.address)).toEqual(['192.168.1.44'])
    } finally {
      await server.close()
    }
  })

  it('approves a refused peer and mints its session in one step', async () => {
    const { service, allowlist, server } = await mount()
    try {
      allowlist.note('192.168.1.44', { path: '/remote/api/session', userAgent: 'Pixel 8' })
      const result = await call(server.port, 'POST', PAIR_PATHS.lanApprove, { body: { address: '192.168.1.44' } })
      expect(result.status).toBe(200)
      expect(result.body.deviceId).toBe('lan:192.168.1.44')
      expect(service.hasDevice('lan:192.168.1.44')).toBe(true)
      expect(allowlist.pending()).toHaveLength(0)
      const approved = allowlist.entries()
      expect(approved).toHaveLength(1)
      // The User-Agent the refused request carried is kept on the entry.
      expect(approved[0]?.userAgent).toBe('Pixel 8')
    } finally {
      await server.close()
    }
  })

  it('removes an entry together with the session it stood for', async () => {
    const { service, allowlist, server } = await mount()
    try {
      allowlist.approve('192.168.1.44')
      service.ensureLanDevice('192.168.1.44')
      const result = await call(server.port, 'POST', PAIR_PATHS.lanRemove, { body: { address: '192.168.1.44' } })
      expect(result.status).toBe(200)
      expect(result.body.removed).toBe(true)
      expect(allowlist.entries()).toHaveLength(0)
      expect(service.hasDevice('lan:192.168.1.44')).toBe(false)
    } finally {
      await server.close()
    }
  })

  it('dismisses a refused peer without granting it anything', async () => {
    const { allowlist, server } = await mount()
    try {
      allowlist.note('192.168.1.44', { path: '/remote/api/session' })
      const result = await call(server.port, 'POST', PAIR_PATHS.lanDismiss, { body: { address: '192.168.1.44' } })
      expect(result.status).toBe(200)
      expect(allowlist.pending()).toHaveLength(0)
      expect(allowlist.entries()).toHaveLength(0)
      expect(allowlist.match('192.168.1.44')).toBeUndefined()
    } finally {
      await server.close()
    }
  })

  it('refuses a malformed write and an untrusted authority', async () => {
    const { allowlist, server } = await mount()
    try {
      const bad = await call(server.port, 'POST', PAIR_PATHS.lanApprove, { body: {} })
      expect(bad.status).toBe(400)
      expect(bad.body.code).toBe('bad-payload')
      expect(allowlist.entries()).toHaveLength(0)
      // A forged authority is not the desktop panel: the control plane is
      // loopback-only, so approving from a foreign Host must not work.
      const forged = await call(server.port, 'POST', PAIR_PATHS.lanApprove, {
        host: 'evil.example',
        body: { address: '192.168.1.44' },
      })
      expect(forged.status).toBe(403)
      expect(allowlist.entries()).toHaveLength(0)
    } finally {
      await server.close()
    }
  })

  it('drops the control plane when no allowlist was injected', async () => {
    const service = makeService()
    const routes = makeRoutes({ service })
    const server = await serve(routes)
    try {
      const result = await call(server.port, 'GET', PAIR_PATHS.lanState)
      expect(result.status).toBe(404)
    } finally {
      await server.close()
    }
  })
})

describe('approved address reaches the app landing', () => {
  it('serves the shell and issues the device cookie with no token', async () => {
    const service = makeService()
    const allowlist = new LanAllowlist()
    allowlist.approve('127.0.0.1')
    const routes = makeRoutes({
      service,
      indexDocument: async () => '<!doctype html><html><body>INDEX</body></html>',
      allowlist,
    })
    const server = await serve(routes)
    try {
      const approved = await call(server.port, 'GET', PAIR_PATHS.appPage, { host: '10.9.9.9:3080' })
      expect(approved.status).toBe(200)
      expect(approved.raw).toContain('INDEX')
      expect(approved.cookies.join(';')).toContain('dsh_pair=lan:127.0.0.1')
    } finally {
      await server.close()
    }
  })

  it('tells an unapproved device to wait, and records the attempt', async () => {
    const service = makeService()
    const allowlist = new LanAllowlist()
    const routes = makeRoutes({
      service,
      indexDocument: async () => '<!doctype html><html><body>INDEX</body></html>',
      allowlist,
    })
    const route = routes.find(entry => entry.kind === 'exact' && entry.path === PAIR_PATHS.appPage)
    expect(route).toBeDefined()
    let status = 0
    let body = ''
    const res = {
      writeHead(code: number) { status = code; return this },
      end(chunk?: string) { body = chunk ?? '' },
      setHeader() {},
    } as unknown as ServerResponse
    // The socket peer is what the fence judges; the HTTP harness always
    // connects from loopback, so this case drives the handler directly.
    const req = {
      method: 'GET',
      url: '/pair-app',
      socket: { remoteAddress: '192.168.1.44' },
      headers: { host: '10.9.9.9:3080', 'user-agent': 'Pixel 8' },
    } as unknown as IncomingMessage
    await route!.handler(req, res as never)
    expect(status).toBe(200)
    expect(body).toContain('Waiting for approval')
    expect(body).not.toContain('INDEX')
    const pending = allowlist.pending()
    expect(pending.map(entry => entry.address)).toEqual(['192.168.1.44'])
    expect(pending[0]?.path).toBe('/pair-app')
    expect(pending[0]?.userAgent).toBe('Pixel 8')
  })

  it('fails closed for an address that is not on the list', async () => {
    const service = makeService()
    const html = '<!doctype html><html><body>INDEX</body></html>'
    const allowlist = new LanAllowlist()
    allowlist.approve('192.168.1.9')
    const routes = makeRoutes({ service, indexDocument: async () => html, allowlist })
    const server = await serve(routes)
    try {
      const refused = await call(server.port, 'GET', PAIR_PATHS.appPage, { host: '10.9.9.9:3080' })
      expect(refused.status).toBe(403)
      expect(refused.raw).not.toContain('INDEX')
      expect(refused.cookies).toHaveLength(0)
    } finally {
      await server.close()
    }
  })
})
