import { dirname, isAbsolute, join, resolve, sep } from "node:path";
import { setInterval, setTimeout as setTimeout$1 } from "node:timers";
import z from "@deepseek-ai/schemastery";
import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { homedir, networkInterfaces } from "node:os";
import { isAbsolute as isAbsolute$1, join as join$1 } from "node:path/posix";
import { Service } from "@deepseek-ai/cordis";
import { z as z$1 } from "zod";
import http, { request } from "node:http";
import { connect } from "node:net";
import { spawn, spawnSync } from "node:child_process";
import { parseDocument } from "yaml";
import { EventEmitter } from "node:events";
import { Tunnel, bin, install } from "cloudflared";
import { AsyncResource } from "node:async_hooks";
//#region src/lan-allowlist.ts
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
const DEFAULT_MAX_PENDING = 50;
const DEFAULT_PENDING_TTL_MS = 1440 * 60 * 1e3;
/**
* A last-seen refresh writes the file at most this often. Every admitted
* request touches its entry (a phone heartbeats every 10 s, and each API call
* counts), so persisting on every touch would rewrite the JSON hundreds of
* times an hour for a value that only needs minute-level accuracy.
*/
const TOUCH_PERSIST_INTERVAL_MS = 6e4;
/**
* Normalize a peer address: Node reports IPv4-mapped IPv6 (`::ffff:10.0.0.4`)
* on dual-stack sockets, which must compare equal to the plain IPv4 form.
* @param address - raw socket address, possibly with an IPv6 zone.
* @returns the comparison form, or an empty string when unusable.
*/
function normalizeAddress(address) {
	if (address === void 0) return "";
	let value = address.trim().toLowerCase();
	const zone = value.indexOf("%");
	if (zone >= 0) value = value.slice(0, zone);
	if (value.startsWith("::ffff:")) value = value.slice(7);
	return value;
}
/** Parse a dotted-quad address into 32 bits, or undefined when malformed. */
function ipv4ToInt(value) {
	const parts = value.split(".");
	if (parts.length !== 4) return void 0;
	let out = 0;
	for (const part of parts) {
		if (!/^\d{1,3}$/.test(part)) return void 0;
		const octet = Number(part);
		if (octet > 255) return void 0;
		out = out * 256 + octet;
	}
	return out;
}
/**
* Whether a rule is usable: an exact address or an IPv4 CIDR block.
* @param rule - candidate rule.
* @returns true when the rule can be matched against peer addresses.
*/
function isValidRule(rule) {
	const value = normalizeAddress(rule);
	if (value.length === 0) return false;
	const slash = value.indexOf("/");
	if (slash < 0) return true;
	const base = value.slice(0, slash);
	const bits = Number(value.slice(slash + 1));
	return ipv4ToInt(base) !== void 0 && Number.isInteger(bits) && bits >= 0 && bits <= 32;
}
/**
* Whether one peer address matches one rule (exact address or IPv4 CIDR).
* @param address - normalized or raw peer address.
* @param rule - an address or CIDR rule.
* @returns true on a match.
*/
function addressMatches(address, rule) {
	const peer = normalizeAddress(address);
	const candidate = normalizeAddress(rule);
	if (peer.length === 0 || candidate.length === 0) return false;
	if (!candidate.includes("/")) return peer === candidate;
	const slash = candidate.indexOf("/");
	const base = ipv4ToInt(candidate.slice(0, slash));
	const peerInt = ipv4ToInt(peer);
	const bits = Number(candidate.slice(slash + 1));
	if (base === void 0 || peerInt === void 0) return false;
	if (!Number.isInteger(bits) || bits < 0 || bits > 32) return false;
	if (bits === 0) return true;
	const mask = bits === 32 ? 4294967295 : 4294967295 << 32 - bits >>> 0;
	return (base & mask) >>> 0 === (peerInt & mask) >>> 0;
}
/**
* The LAN approval list. Reads its file once, persists every mutation, and
* keeps the refused-peer table bounded.
*/
var LanAllowlist = class {
	state;
	file;
	now;
	maxPending;
	pendingTtlMs;
	/** Whether the backing file carried an explicit on/off switch. */
	storedEnabled = false;
	/** When the file was last written, for the touch throttle. */
	lastWriteAt = 0;
	constructor(options = {}) {
		this.file = options.file;
		this.now = options.now ?? (() => Date.now());
		this.maxPending = options.maxPending ?? DEFAULT_MAX_PENDING;
		this.pendingTtlMs = options.pendingTtlMs ?? DEFAULT_PENDING_TTL_MS;
		this.state = {
			version: 1,
			enabled: true,
			entries: [],
			pending: []
		};
		this.load();
		if (options.enabled !== void 0 && !this.storedEnabled) this.state.enabled = options.enabled;
	}
	/** Whether allowlist admission is active at all. */
	get enabled() {
		return this.state.enabled;
	}
	/** Turn allowlist admission on or off; refused peers are kept either way. */
	setEnabled(value) {
		if (this.state.enabled === value) return;
		this.state.enabled = value;
		this.persist();
	}
	/** Approved peers, newest last-seen first. */
	entries() {
		return [...this.state.entries].sort((left, right) => right.lastSeenAt - left.lastSeenAt);
	}
	/** Refused peers still waiting for a decision, newest first. */
	pending() {
		this.sweep();
		return [...this.state.pending].sort((left, right) => right.lastSeenAt - left.lastSeenAt);
	}
	/** The entry admitting this peer, or undefined. */
	match(address) {
		const peer = normalizeAddress(address);
		if (peer.length === 0) return void 0;
		return this.state.entries.find((entry) => addressMatches(peer, entry.rule ?? entry.address));
	}
	/**
	* Approve one peer: it leaves the pending table and joins the allowlist.
	* @param address - the peer address to approve.
	* @param meta - optional label / User-Agent carried into the record.
	* @returns the stored entry.
	*/
	approve(address, meta = {}) {
		const peer = normalizeAddress(address);
		const existing = this.state.entries.find((entry) => entry.rule === void 0 && entry.address === peer);
		if (existing !== void 0) {
			existing.lastSeenAt = this.now();
			if (meta.userAgent !== void 0) existing.userAgent = meta.userAgent;
			if (meta.label !== void 0) existing.label = meta.label;
			this.dismiss(peer);
			this.persist();
			return existing;
		}
		const entry = {
			address: peer,
			approvedAt: this.now(),
			lastSeenAt: this.now(),
			...meta.label === void 0 ? {} : { label: meta.label },
			...meta.userAgent === void 0 ? {} : { userAgent: meta.userAgent }
		};
		this.state.entries.push(entry);
		this.dismiss(peer);
		this.persist();
		return entry;
	}
	/**
	* Add a CIDR rule (or another exact address) directly, without a peer.
	* @param rule - address or CIDR block.
	* @param meta - optional label.
	* @returns the stored entry, or undefined when the rule is malformed.
	*/
	addRule(rule, meta = {}) {
		const value = normalizeAddress(rule);
		if (!isValidRule(value)) return void 0;
		const existing = this.state.entries.find((entry) => (entry.rule ?? entry.address) === value);
		if (existing !== void 0) return existing;
		const entry = {
			address: value,
			approvedAt: this.now(),
			lastSeenAt: this.now(),
			...value.includes("/") ? { rule: value } : {},
			...meta.label === void 0 ? {} : { label: meta.label }
		};
		this.state.entries.push(entry);
		this.persist();
		return entry;
	}
	/**
	* Remove one entry, by its address or by the rule it stands for.
	* @returns true when an entry was removed.
	*/
	remove(addressOrRule) {
		const value = normalizeAddress(addressOrRule);
		const before = this.state.entries.length;
		this.state.entries = this.state.entries.filter((entry) => (entry.rule ?? entry.address) !== value && entry.address !== value);
		const removed = this.state.entries.length !== before;
		if (removed) this.persist();
		return removed;
	}
	/** Forget one refused peer without approving it. */
	dismiss(address) {
		const peer = normalizeAddress(address);
		const before = this.state.pending.length;
		this.state.pending = this.state.pending.filter((entry) => entry.address !== peer);
		const removed = this.state.pending.length !== before;
		if (removed) this.persist();
		return removed;
	}
	/**
	* Record a refused request so the desktop panel can offer an approval.
	* @param address - the peer address.
	* @param meta - path and User-Agent of the refused request.
	* @returns the pending record.
	*/
	note(address, meta) {
		const peer = normalizeAddress(address);
		const timestamp = this.now();
		const existing = this.state.pending.find((entry) => entry.address === peer);
		if (existing !== void 0) {
			existing.lastSeenAt = timestamp;
			existing.hits += 1;
			existing.path = meta.path;
			if (meta.userAgent !== void 0 && meta.userAgent.length > 0) existing.userAgent = meta.userAgent;
			if (timestamp - this.lastWriteAt >= TOUCH_PERSIST_INTERVAL_MS) this.persist();
			return existing;
		}
		const entry = {
			address: peer,
			path: meta.path,
			firstSeenAt: timestamp,
			lastSeenAt: timestamp,
			hits: 1,
			...meta.userAgent === void 0 || meta.userAgent.length === 0 ? {} : { userAgent: meta.userAgent }
		};
		this.state.pending.push(entry);
		this.sweep();
		this.persist();
		return entry;
	}
	/** Refresh the last-seen stamp of the entry admitting this peer. */
	touch(address) {
		const entry = this.match(address);
		if (entry === void 0) return;
		const now = this.now();
		entry.lastSeenAt = now;
		if (now - this.lastWriteAt >= TOUCH_PERSIST_INTERVAL_MS) this.persist();
	}
	/** Everything the panel needs in one object. */
	snapshot() {
		return {
			enabled: this.state.enabled,
			entries: [...this.entries()],
			pending: [...this.pending()]
		};
	}
	/** Drop stale and overflowing pending records. */
	sweep() {
		const cutoff = this.now() - this.pendingTtlMs;
		let next = this.state.pending.filter((entry) => entry.lastSeenAt >= cutoff);
		if (next.length > this.maxPending) next = [...next].sort((left, right) => right.lastSeenAt - left.lastSeenAt).slice(0, this.maxPending);
		if (next.length !== this.state.pending.length) {
			this.state.pending = next;
			this.persist();
		}
	}
	/** Read the backing file; a missing or unparsable file starts empty. */
	load() {
		if (this.file === void 0) return;
		try {
			const parsed = JSON.parse(readFileSync(this.file, "utf8"));
			this.storedEnabled = typeof parsed.enabled === "boolean";
			this.state = {
				version: 1,
				enabled: parsed.enabled !== false,
				entries: Array.isArray(parsed.entries) ? parsed.entries.filter((entry) => typeof entry?.address === "string") : [],
				pending: Array.isArray(parsed.pending) ? parsed.pending.filter((entry) => typeof entry?.address === "string") : []
			};
		} catch {}
	}
	/** Write the backing file atomically (temp file + rename, mode 0600). */
	persist() {
		if (this.file === void 0) return;
		try {
			mkdirSync(dirname(this.file), { recursive: true });
			const temp = `${this.file}.tmp`;
			writeFileSync(temp, JSON.stringify(this.state, null, 2), { mode: 384 });
			renameSync(temp, this.file);
			this.lastWriteAt = this.now();
		} catch {
			rmSync(`${this.file}.tmp`, { force: true });
		}
	}
};
//#endregion
//#region src/pairing.ts
/**
* Pairing state machine: one active one-time token, a device-session table,
* and presence tracking. Pure TypeScript with injected clock/randomness so
* the whole security semantics are unit-testable without cordis. The
* cordis-facing surfaces (routes, the api/gate listener) live next door.
*
* Security invariants:
* - One active token at a time; `issue()` replaces it, so a refreshed QR
*   immediately invalidates the previous link.
* - A token is a bearer credential for its whole window: it is refused only
*   when unknown, expired, or after `stop()`, and the same link may pair
*   repeatedly within that window (each accept mints a fresh device session).
*   Mobile flows routinely split across cookie contexts (camera preview to
*   in-app browser to the system browser), and the later context must be
*   able to complete its own pairing from the same link.
* - Tokens expire; `accept()` on an expired token is refused like an
*   unknown one (no oracle for validity).
* - `stop()` revokes every device session and clears the token, so paired
*   devices are cut off on their next gated request.
* - `revoke()` drops one device session; idle sessions older than
*   `idleExpireMs` are deleted on sweep, load, and the next gated request.
*/
/**
* Default idle-expiry window: 30 days without a heartbeat or a gated
* request. The reopen service worker refreshes lastSeenAt on every
* navigation it serves, so the window only runs out through genuine
* disuse; 30 days matches the browser-credential lifetimes the surrounding
* flow was built around, while the effective device lifetime stays shorter
* than the 365-day cookie because of this sweep. Override per deployment
* through the idleExpireMs config.
*/
const DEFAULT_IDLE_EXPIRE_MS = 720 * 60 * 60 * 1e3;
/** Cap on the persisted/displayed User-Agent string. */
const MAX_USER_AGENT_CHARS = 180;
/** Thrown by issue() for an address outside the sampled LAN literals. */
var UnknownLanAddressError = class extends Error {
	/**
	* @param address - the offending literal.
	*/
	constructor(address) {
		super(`remote-web-ui: unknown LAN address ${JSON.stringify(address)}`);
		this.name = "UnknownLanAddressError";
	}
};
/** Real clock/entropy: 32 random hex chars per token. */
const defaultClock = {
	now: () => Date.now(),
	randomToken: () => randomBytes(16).toString("hex")
};
/**
* The pairing state machine. Structural mutations issue/accept/stop/revoke
* and config updates (LAN bases, tunnel, posture) notify state listeners
* after the commit point that makes them true, and notification dedupes
* against the last emitted snapshot. Presence-only updates (touchDevice /
* heartbeat) just mark the store dirty and broadcast on the next sweep,
* which also surfaces time-driven transitions (a device aging offline)
* without any mutation.
*/
var PairingService = class {
	config;
	clock;
	fs;
	tokens = /* @__PURE__ */ new Map();
	devices = /* @__PURE__ */ new Map();
	listeners = /* @__PURE__ */ new Set();
	lastEmitted;
	stopped = false;
	tokenSerial = 0;
	/** LAN base URLs keyed by the advertised IP literal (interface order). */
	lanBases = /* @__PURE__ */ new Map();
	/** Public (tunneled) base URL, e.g. a Cloudflare Tunnel quick URL. */
	publicBase;
	/** Auto-tunnel status, while the auto-tunnel feature is active. */
	tunnelStatus;
	relayStatus;
	posture;
	/** True when lastSeenAt changed since the last persist (flushed on sweep). */
	dirty = false;
	/**
	* @param config - tunables. The settings surface replaces the object (a
	* fresh literal) when a committed section changes; every operation reads
	* the current one.
	* @param clock - clock/entropy source (injectable for tests).
	*/
	constructor(config, clock = defaultClock, fs = {}) {
		this.config = config;
		this.clock = clock;
		this.fs = fs;
		this.loadPersisted();
	}
	/**
	* Restore device sessions persisted by a previous process run. A corrupt
	* or missing file is tolerated (an empty device table, never a throw) —
	* persistence is an availability convenience, not a security boundary.
	*
	* Every still-valid session is restored, deliberately without applying
	* `maxDevices`: the constructor runs with whatever cap the configuration
	* layer has delivered so far (the schema default until the saved settings
	* row is applied), and trimming here would permanently drop authorizations
	* the user never revoked — the trimmed table reaches disk on the next
	* heartbeat/sweep write. The cap is enforced where a device is admitted
	* (see `accept`), against the configuration in force at that moment.
	*/
	loadPersisted() {
		const file = this.config.devicesFile;
		if (file === void 0) return;
		try {
			const saved = JSON.parse(readFileSync(file, "utf8"));
			if (typeof saved !== "object" || saved === null) return;
			for (const [deviceId, session] of Object.entries(saved)) {
				if (typeof deviceId !== "string") continue;
				if (typeof session !== "object" || session === null) continue;
				const { createdAt, lastSeenAt, userAgent } = session;
				if (typeof createdAt !== "number" || typeof lastSeenAt !== "number") continue;
				const label = typeof userAgent === "string" ? sanitizeUserAgent(userAgent) : void 0;
				this.devices.set(deviceId, {
					createdAt,
					lastSeenAt,
					...label !== void 0 ? { userAgent: label } : {}
				});
			}
			if (this.evictIdle()) this.persistRevocation();
		} catch {}
	}
	/** Drop sessions whose lastSeenAt is older than idleExpireMs. */
	evictIdle() {
		const now = this.clock.now();
		const limit = this.config.idleExpireMs ?? 2592e6;
		let removed = false;
		for (const [id, session] of [...this.devices]) if (now - session.lastSeenAt > limit) {
			this.devices.delete(id);
			removed = true;
		}
		return removed;
	}
	/**
	* Write the current device table to the configured file. Called on the
	* mutation boundaries that change the set of live sessions (accept, stop,
	* revoke, idle eviction) and, throttled, from sweep() so lastSeenAt
	* survives a restart without a write per request.
	*
	* Device ids are session credentials (the gate authorizes requests by the
	* cookie's device id), so the file is written 0600 via a temp file and
	* atomic rename; a crash mid-write can never leave a half-written store.
	*/
	persist() {
		const file = this.config.devicesFile;
		if (file === void 0) return true;
		try {
			mkdirSync(dirname(file), { recursive: true });
			const temp = `${file}.${process.pid}.${randomBytes(4).toString("hex")}.tmp`;
			const payload = {};
			for (const [id, session] of this.devices) payload[id] = session;
			writeFileSync(temp, JSON.stringify(payload), { mode: 384 });
			renameSync(temp, file);
			this.dirty = false;
			return true;
		} catch (error) {
			console.error("remote-web-ui: failed to persist paired devices", error);
			return false;
		}
	}
	/**
	* Persist a table change that REVOKES access (stop, per-device revoke, idle
	* eviction). A failed write would leave the revoked session on disk, and
	* {@link loadPersisted} restores that file verbatim on the next start — the
	* device's still-valid cookie would authorize again after an explicit
	* revocation. When the write cannot be made durable, the stale store is
	* removed instead (a missing file already loads as an empty table), so the
	* failure costs a re-pair rather than silently undoing the revocation.
	*/
	persistRevocation() {
		if (this.persist()) return;
		const file = this.config.devicesFile;
		if (file === void 0) return;
		try {
			if (this.fs.removeFile !== void 0) this.fs.removeFile(file);
			else rmSync(file, { force: true });
			console.error("remote-web-ui: the device revocation could not be persisted; removed the stale device store so a restart cannot restore it");
		} catch (error) {
			console.error("remote-web-ui: the device revocation could not be persisted and the stale device store could not be removed", error);
		}
	}
	/** The default LAN base URL (the first interface; undefined when not LAN-reachable). */
	get lanBaseUrl() {
		return this.lanBases.values().next().value;
	}
	/** The LAN base URL for one specific literal (undefined when not constructible). */
	lanBaseUrlFor(address) {
		return this.lanBases.get(address);
	}
	/** The LAN IP literals QR links can be built from (interface order). */
	get lanAddresses() {
		return [...this.lanBases.keys()];
	}
	/** Set the LAN base URLs once the server bind is known (interface order). */
	setLanBases(entries) {
		this.lanBases = new Map(entries.map((entry) => [entry.address, entry.base]));
		this.notify();
	}
	/** The configured public (tunneled) base URL, when present. */
	get publicBaseUrl() {
		return this.publicBase;
	}
	/**
	* Set or clear the public base URL (a tunnel in front of this server). The
	* value is canonicalized to its origin: a trailing slash (what a browser
	* address-bar copy produces) or a path would mint a dead `//pair-accept`
	* link, which WHATWG resolves as an authority rather than a path.
	*/
	setPublicBaseUrl(url) {
		this.publicBase = url === void 0 ? void 0 : canonicalBaseUrl(url);
		this.notify();
	}
	/** Set or clear the auto-tunnel status frame (undefined when the feature is off). */
	setTunnelStatus(status) {
		this.tunnelStatus = status;
		this.notify();
	}
	/** Set or clear the relay-registry status frame (undefined when not in play). */
	setRelayStatus(status) {
		this.relayStatus = status;
		this.notify();
	}
	/** Set the latest /api posture probe result (see posture.ts). */
	setPosture(snapshot) {
		this.posture = snapshot;
		this.notify();
	}
	/**
	* Issue a fresh token, replacing (invalidating) any previous one. A
	* stopped service re-arms through this call (the panel's refresh button).
	* @param workspaceId - optional workspace the QR link should land in.
	* @param address - optional LAN IP literal the QR must be built from; the
	* default is the public base (when configured) or the first interface.
	* Unknown addresses are refused.
	* @returns the token secret and its expiry.
	* @throws {Error} when no reachable base exists (no all-interfaces bind and
	* no public base) — callers surface this as the lan-required state instead
	* of minting an unusable QR.
	*/
	issue(workspaceId, address) {
		if (this.lanBases.size === 0 && this.publicBase === void 0) throw new Error("remote-web-ui: pairing requires a reachable bind (--host 0.0.0.0 or publicBaseUrl)");
		if (address !== void 0 && !this.lanBases.has(address)) throw new UnknownLanAddressError(address);
		const now = this.clock.now();
		const token = this.clock.randomToken();
		this.tokens.clear();
		this.stopped = false;
		this.tokenSerial += 1;
		this.tokens.set(token, {
			id: `t${this.tokenSerial}`,
			issuedAt: now,
			expiresAt: now + this.config.tokenTtlMs,
			...workspaceId !== void 0 ? { workspaceId } : {},
			...address !== void 0 ? { address } : {}
		});
		this.notify();
		return {
			token,
			expiresAt: now + this.config.tokenTtlMs
		};
	}
	/**
	* Redeem a token and bind a device session. The token is a bearer
	* credential for its whole window, not a single-use nonce: it is refused
	* only when unknown, past its expiry, or after stop(), and every successful
	* call — including a repeat within the same window — mints a fresh device
	* session (see the module doc for the mobile cookie-context rationale).
	* @param token - the token secret from the QR link.
	* @param userAgent - optional User-Agent header captured at accept.
	* @returns the new device id, or a refusal code.
	*/
	accept(token, userAgent) {
		const record = this.tokens.get(token);
		if (record === void 0 || this.stopped || this.clock.now() > record.expiresAt) return {
			ok: false,
			code: "invalid"
		};
		const deviceId = this.clock.randomToken();
		const now = this.clock.now();
		while (this.devices.size >= this.config.maxDevices) {
			let oldest;
			for (const [id, session] of this.devices) if (oldest === void 0 || session.createdAt < oldest.createdAt) oldest = {
				id,
				createdAt: session.createdAt
			};
			if (oldest === void 0) break;
			this.devices.delete(oldest.id);
		}
		const label = sanitizeUserAgent(userAgent);
		this.devices.set(deviceId, {
			createdAt: now,
			lastSeenAt: now,
			...label !== void 0 ? { userAgent: label } : {}
		});
		this.persist();
		this.notify();
		return {
			ok: true,
			deviceId
		};
	}
	/**
	* Stop remote control: revoke every device session and clear the token.
	* The phone's next gated /api request 403s; the panel falls back to
	* stopped until a fresh QR is issued.
	*/
	stop() {
		this.tokens.clear();
		this.devices.clear();
		this.persistRevocation();
		this.stopped = true;
		this.notify();
	}
	/**
	* Revoke one paired device. The next gated request from that cookie is
	* refused; other sessions stay live. Unknown ids are a no-op.
	* @param deviceId - the cookie value of the device to drop.
	* @returns true when a live session was removed.
	*/
	revoke(deviceId) {
		if (this.stopped) return false;
		if (!this.devices.delete(deviceId)) return false;
		this.persistRevocation();
		this.notify();
		return true;
	}
	/**
	* The api/gate path: record activity for a device id and report whether
	* the request may proceed. Unknown or revoked ids (including any device
	* after stop() or idle expiry) are refused.
	*
	* Presence refreshes are throttled on purpose: every gated request (and
	* the mobile SSE keepalive) lands here, so a broadcast per call would fan
	* a full snapshot out to every status stream on the hot path. The refresh
	* only updates lastSeenAt and marks the store dirty; the snapshot reaches
	* listeners at the next sweep() (structural changes notify immediately).
	* @param deviceId - the cookie value of the requesting device.
	* @returns true when the device session is live and was refreshed.
	*/
	touchDevice(deviceId) {
		const session = this.liveSession(deviceId);
		if (session === void 0) return false;
		session.lastSeenAt = this.clock.now();
		this.dirty = true;
		return true;
	}
	/** Explicit presence heartbeat (the phone's client sends these). */
	heartbeat(deviceId) {
		return this.touchDevice(deviceId);
	}
	/**
	* The deterministic session id a LAN allowlist entry stands for. Deriving it
	* from the peer address (instead of minting random ids) makes approval
	* idempotent and lets "remove from allowlist" revoke exactly one session.
	* @param address - peer address, in any of the socket's forms.
	* @returns the reserved device id (`lan:<address>`).
	*/
	lanDeviceId(address) {
		return `lan:${normalizeAddress(address)}`;
	}
	/**
	* Register (or refresh) the session an allowlisted LAN peer uses. Called
	* once per admitted request, before the channel gate runs, so a device the
	* desktop approved is a first-class session: it shows up in the panel's
	* device list, can be revoked on its own, and ages out like any other.
	* @param address - the peer address the allowlist admitted.
	* @param userAgent - optional User-Agent observed on the request.
	* @returns the device id to hand to the channel gate.
	*/
	ensureLanDevice(address, userAgent) {
		const deviceId = this.lanDeviceId(address);
		const now = this.clock.now();
		const label = sanitizeUserAgent(userAgent);
		const existing = this.liveSession(deviceId);
		if (existing !== void 0) {
			existing.lastSeenAt = now;
			if (label !== void 0) existing.userAgent = label;
			this.dirty = true;
			return deviceId;
		}
		while (this.devices.size >= this.config.maxDevices) {
			let oldest;
			for (const [id, session] of this.devices) if (oldest === void 0 || session.createdAt < oldest.createdAt) oldest = {
				id,
				createdAt: session.createdAt
			};
			if (oldest === void 0) break;
			this.devices.delete(oldest.id);
		}
		this.devices.set(deviceId, {
			createdAt: now,
			lastSeenAt: now,
			...label !== void 0 ? { userAgent: label } : {}
		});
		this.persist();
		this.notify();
		return deviceId;
	}
	/**
	* Drop the session behind one LAN approval (the allowlist entry is removed
	* by the caller; this is only the session half).
	* @param address - the peer address that lost its approval.
	* @returns true when a live session was removed.
	*/
	revokeLanDevice(address) {
		return this.devices.delete(this.lanDeviceId(address));
	}
	/**
	* Periodic sweep: drop idle sessions, flush a dirty lastSeenAt, and
	* re-evaluate the derived snapshot (a device aging past the offline
	* window flips the phase to disconnected). Emits only when the snapshot
	* actually changed.
	*/
	sweep() {
		if (this.evictIdle()) this.persistRevocation();
		else if (this.dirty) this.persist();
		this.notify();
	}
	/** The current snapshot (fresh object per call — stable between emits). */
	snapshot() {
		const now = this.clock.now();
		const devices = [...this.devices.entries()].sort((a, b) => a[1].createdAt - b[1].createdAt).map(([id, session]) => this.toDeviceSnapshot(id, session, now));
		const onlineCount = devices.filter((device) => device.online).length;
		const token = this.activeToken();
		return {
			phase: this.derivePhase(onlineCount, token !== void 0),
			lanAvailable: this.lanBases.size > 0,
			lanAddresses: [...this.lanBases.keys()],
			...this.publicBase !== void 0 ? { publicUrl: this.publicBase } : {},
			...this.tunnelStatus !== void 0 ? { tunnel: this.tunnelStatus } : {},
			...this.relayStatus !== void 0 ? { relay: this.relayStatus } : {},
			...this.posture !== void 0 ? { posture: this.posture } : {},
			...token !== void 0 ? {
				tokenId: token.record.id,
				tokenExpiresAt: token.record.expiresAt
			} : {},
			deviceCount: this.devices.size,
			onlineCount,
			devices
		};
	}
	/** Whether a cookie value names a currently live (non-idle) device session. */
	hasDevice(deviceId) {
		return this.liveSession(deviceId) !== void 0;
	}
	/**
	* Number of device sessions in the table, including idle ones whose idle
	* window has not been swept yet. Restore keeps every persisted session
	* (see `loadPersisted`), so this can exceed the configured cap until the
	* next `accept` trims the excess.
	*/
	deviceCount() {
		return this.devices.size;
	}
	/** Subscribe to snapshot changes (each emit passes a fresh snapshot). */
	onState(listener) {
		this.listeners.add(listener);
		return () => {
			this.listeners.delete(listener);
		};
	}
	activeToken() {
		for (const [token, record] of this.tokens) {
			if (this.stopped) return void 0;
			if (this.clock.now() > record.expiresAt) continue;
			return {
				token,
				record
			};
		}
	}
	/**
	* Return a live session, deleting it first when idle-expired. Side-effecting
	* so a stale cookie cannot pass the gate between sweeps.
	*/
	liveSession(deviceId) {
		if (this.stopped) return void 0;
		const session = this.devices.get(deviceId);
		if (session === void 0) return void 0;
		const limit = this.config.idleExpireMs ?? 2592e6;
		if (this.clock.now() - session.lastSeenAt > limit) {
			this.devices.delete(deviceId);
			this.persistRevocation();
			this.notify();
			return;
		}
		return session;
	}
	toDeviceSnapshot(id, session, now) {
		return {
			id,
			createdAt: session.createdAt,
			lastSeenAt: session.lastSeenAt,
			online: this.isOnlineAt(session, now),
			...session.userAgent !== void 0 ? { userAgent: session.userAgent } : {}
		};
	}
	derivePhase(onlineCount, hasToken) {
		if (this.lanBases.size === 0 && this.publicBase === void 0) return "lan-required";
		if (this.stopped) return "stopped";
		if (onlineCount > 0) return "connected";
		if (this.devices.size > 0) return "disconnected";
		if (hasToken) return "waiting";
		return "stopped";
	}
	isOnlineAt(session, now) {
		return now - session.lastSeenAt <= this.config.offlineAfterMs;
	}
	notify() {
		const snapshot = this.snapshot();
		if (this.lastEmitted !== void 0 && snapshotsEqual(this.lastEmitted, snapshot)) return;
		this.lastEmitted = snapshot;
		for (const listener of this.listeners) try {
			listener(snapshot);
		} catch (error) {
			console.error("remote-web-ui: pairing state listener failed", error);
		}
	}
};
/** Structural equality over the snapshot's wire fields. */
function snapshotsEqual(a, b) {
	return a.phase === b.phase && a.lanAvailable === b.lanAvailable && sameStrings(a.lanAddresses, b.lanAddresses) && a.publicUrl === b.publicUrl && tunnelEqual(a.tunnel, b.tunnel) && relayEqual(a.relay, b.relay) && postureEqual(a.posture, b.posture) && a.tokenId === b.tokenId && a.tokenExpiresAt === b.tokenExpiresAt && a.deviceCount === b.deviceCount && a.onlineCount === b.onlineCount && devicesEqual(a.devices, b.devices);
}
/** Per-device roster equality (order is pairing time). */
function devicesEqual(a, b) {
	return a.length === b.length && a.every((device, index) => {
		const other = b[index];
		return other !== void 0 && device.id === other.id && device.createdAt === other.createdAt && device.lastSeenAt === other.lastSeenAt && device.online === other.online && device.userAgent === other.userAgent;
	});
}
/** Tunnel frame equality (undefined equals undefined; fields compared shallowly). */
function tunnelEqual(a, b) {
	return a === b || a !== void 0 && b !== void 0 && a.state === b.state && a.url === b.url && a.error === b.error;
}
/** Relay frame equality (same shape as the tunnel frame). */
function relayEqual(a, b) {
	return a === b || a !== void 0 && b !== void 0 && a.state === b.state && a.url === b.url && a.error === b.error;
}
/**
* Posture equality. A probe round can change this frame while every other field
* stays put — the common case, since the probe re-runs on a settings change and
* on a tunnel reaching running, and a quick-tunnel restart churns the probed
* host set. Leaving the frame out of the comparison suppressed those emits, so
* the loopback SSE stream and the desktop panel could sit on a stale "exposed"
* (or stale "clean") verdict for as long as the phase and roster stayed put.
*/
function postureEqual(a, b) {
	if (a === b) return true;
	if (!isPostureFrame(a) || !isPostureFrame(b)) return false;
	return a.checkedAt === b.checkedAt && hostsEqual(a.hosts, b.hosts);
}
/** Whether a value has the shape a posture frame is compared on. */
function isPostureFrame(value) {
	return typeof value === "object" && value !== null;
}
/**
* Per-host posture equality (a round's verdicts, in probe order). Tolerates a
* frame that is not the expected shape: this runs inside the emit path, outside
* the listener error containment, so a malformed snapshot handed in by another
* host-fiber caller must degrade to "changed" instead of throwing out of the
* setter that produced it.
*/
function hostsEqual(a, b) {
	if (a === b) return true;
	if (!Array.isArray(a) || !Array.isArray(b)) return false;
	return a.length === b.length && a.every((host, index) => {
		const other = b[index];
		return isPostureHost(host) && isPostureHost(other) && host.host === other.host && host.exposed === other.exposed;
	});
}
/** Whether a value has the shape one probed host is compared on. */
function isPostureHost(value) {
	return typeof value === "object" && value !== null;
}
/** Element-wise string list equality (interface order is meaningful). */
function sameStrings(a, b) {
	return a.length === b.length && a.every((value, index) => value === b[index]);
}
/**
* Canonical origin of a public base URL. An unparsable value is returned
* verbatim so the caller's malformed-base warning stays the single owner of
* that case.
* @param url - the configured public base.
*/
function canonicalBaseUrl(url) {
	try {
		return new URL(url).origin;
	} catch {
		return url;
	}
}
/** Strip control characters and cap the User-Agent stored with a session. */
function sanitizeUserAgent(raw) {
	if (raw === void 0) return void 0;
	const cleaned = raw.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim();
	if (cleaned === "") return void 0;
	return cleaned.length <= MAX_USER_AGENT_CHARS ? cleaned : cleaned.slice(0, MAX_USER_AGENT_CHARS);
}
//#endregion
//#region src/dsh-home.ts
/**
* DSH_HOME resolution shared by the plugin family's Host halves: the
* environment override wins, the platform home fallback follows. Mirrors
* what dsh-pet and dsh-liangshen each used to implement locally.
*/
/** Expand a leading ~ (or ~user) in a path, platform-style. */
function expandHome(path, home = homedir()) {
	const j = home.startsWith("/") ? join$1 : join;
	if (path === "~") return home;
	if (path.startsWith("~/") || path.startsWith("~\\")) return j(home, path.slice(2));
	return path;
}
/**
* Resolve the DSH home directory.
* @param env - process environment to read DSH_HOME from.
* @param home - platform home directory fallback (test seam).
* @returns the absolute DSH home path.
*/
function resolveDshHome(env = process.env, home = homedir()) {
	const isPosix = home.startsWith("/");
	const j = isPosix ? join$1 : join;
	const isAbs = isPosix ? isAbsolute$1 : isAbsolute;
	const raw = env.DSH_HOME;
	if (raw !== void 0 && raw.trim() !== "") {
		const expanded = expandHome(raw.trim(), home);
		return isAbs(expanded) ? expanded : j(process.cwd(), expanded);
	}
	return j(home, ".dsh");
}
/** Resolve the DSH home directory from the live environment. */
function dshHome() {
	return resolveDshHome();
}
//#endregion
//#region src/loopback.ts
/** IPv4 127/8 predicate (four decimal octets, first == 127). */
function isIPv4Loopback(v4) {
	const parts = v4.split(".");
	return parts.length === 4 && parts[0] === "127" && parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255);
}
/** Whether a socket remote address names the loopback range (127/8, ::1, IPv4-mapped). */
function isLoopbackAddress(address) {
	if (address === void 0) return false;
	const normalized = address.toLowerCase();
	if (normalized === "::1") return true;
	if (normalized.startsWith("::ffff:")) return isIPv4Loopback(normalized.slice(7));
	return isIPv4Loopback(normalized);
}
/** Whether a normalized URL hostname names the loopback authority (localhost, [::1], 127/8). */
function isLoopbackHostname(hostname) {
	if (hostname === "localhost" || hostname === "[::1]") return true;
	return isIPv4Loopback(hostname);
}
//#endregion
//#region src/gate.ts
/**
* Loopback classification for the desktop client. The predicates now live in
* the shared synced copy (shared/host/loopback.ts, mirrored to ./loopback.ts
* by scripts/sync-shared.mjs): localhost, IPv6 loopback, and any IPv4 address
* in 127/8.
* @param hostname - WHATWG URL hostname (IPv6 literals retain brackets).
* @returns true for localhost, IPv6 loopback, or any IPv4 address in 127/8.
*/
/**
* Read one cookie value from a Cookie header.
* @param header - the raw Cookie header value (or undefined).
* @param name - the cookie name.
* @returns the value, or undefined when absent.
*/
function readCookie(header, name) {
	if (header === void 0) return void 0;
	for (const part of header.split(";")) {
		const eq = part.indexOf("=");
		if (eq < 0) continue;
		if (part.slice(0, eq).trim() === name) return part.slice(eq + 1).trim();
	}
}
/**
* The effective Host hostname of a request.
* @param request - node HTTP request.
* @returns the normalized hostname, or undefined when unparsable.
*/
function hostnameOf(request) {
	const host = request.headers.host;
	if (typeof host !== "string") return void 0;
	try {
		return new URL(`http://${host}`).hostname;
	} catch {
		return;
	}
}
/** Whether a request comes from the desktop loopback client (loopback socket AND loopback Host). */
function isLoopbackClient(request) {
	const hostname = hostnameOf(request);
	if (hostname === void 0 || !isLoopbackHostname(hostname)) return false;
	const socket = request.socket;
	return isLoopbackAddress(socket?.remoteAddress);
}
/**
* Build the api/gate listener for one pairing service.
* @param service - the pairing service.
* @param requirePairingForLan - when false, non-loopback requests pass
* without a device cookie (the feature then only manages tokens/status;
* revocation of paired devices still holds). A function is re-read per
* request, so a settings edit takes effect without a restart. Defaults to true.
* @param enabled - when false, every non-loopback request is vetoed while
* loopback stays available. A function is re-read per request so the fence
* stays mounted for the plugin lifetime and disabling the plugin cannot open
* a LAN-exposed /api. Defaults to true.
* @returns the cordis waterfall listener: call `next()` to delegate,
* return false (without calling it) to veto with 403.
*/
function makeGateListener(service, requirePairingForLan = true, enabled = true) {
	return (request, _method, next) => {
		if (isLoopbackClient(request)) return next();
		if (!(typeof enabled === "function" ? enabled() : enabled)) return false;
		if (!(typeof requirePairingForLan === "function" ? requirePairingForLan() : requirePairingForLan)) return next();
		return isPairedDeviceRequest(service, request) ? next() : false;
	};
}
/**
* Whether a request carries a live, non-revoked paired-device cookie for
* this service. Sibling host routes outside /api (the right-panel
* /sidebar/* routes, etc.) use the same check via the remoteWebUiPairing service.
* @param service - the pairing service that owns the device table.
* @param request - the incoming HTTP request.
* @returns true when the cookie names a live session (and lastSeenAt was refreshed).
*/
function isPairedDeviceRequest(service, request) {
	const deviceId = readCookie(request.headers.cookie, service.config.cookieName);
	if (deviceId === void 0) return false;
	return service.touchDevice(deviceId);
}
//#endregion
//#region src/pairing-access.ts
/** Named lookup key sibling plugins pass to ctx.get. */
const REMOTE_WEB_UI_PAIRING = "remoteWebUiPairing";
/**
* Pairing identity for one HTTP request. Structural: consumers must not
* import this class, only the method shape.
*/
var RemoteWebUiPairing = class extends Service {
	check;
	/**
	* @param ctx - host plugin context.
	* @param check - live cookie + session predicate (re-read per request).
	*/
	constructor(ctx, check) {
		super(ctx, REMOTE_WEB_UI_PAIRING);
		this.check = check;
	}
	/**
	* Whether the request carries a live paired-device cookie.
	* @param request - the incoming HTTP request.
	* @returns true when the session is live and was refreshed.
	*/
	isPairedDevice(request) {
		return this.check(request);
	}
};
//#endregion
//#region src/http.ts
/** Default body cap for readJsonBody: 64 KiB. */
const DEFAULT_JSON_BODY_MAX_BYTES = 64 * 1024;
/** Family-default JSON response headers; callers may append or override. */
const JSON_HEADERS = {
	"content-type": "application/json; charset=utf-8",
	"referrer-policy": "no-referrer"
};
/**
* Lenient bounded body reader: parse a request body as JSON, or null on an
* empty body, invalid JSON, or a body past maxBytes (default 64 KiB).
* Overflow destroys the request instead of draining the remainder (no drain
* call, matching the current repo-wide behavior); callers must not keep
* reading the request afterwards. With objectOnly, non-JSON-object payloads
* also yield null.
*/
async function readJsonBody(req, opts = {}) {
	const maxBytes = opts.maxBytes ?? DEFAULT_JSON_BODY_MAX_BYTES;
	const chunks = [];
	let size = 0;
	for await (const chunk of req) {
		const buffer = chunk;
		size += buffer.length;
		if (size > maxBytes) {
			req.destroy();
			return null;
		}
		chunks.push(buffer);
	}
	const text = Buffer.concat(chunks).toString("utf8");
	if (text === "") return null;
	try {
		const parsed = JSON.parse(text);
		if (opts.objectOnly && !isJsonObject(parsed)) return null;
		return parsed;
	} catch {
		return null;
	}
}
/** Whether a value is a JSON object: typeof object, not null, not an array. */
function isJsonObject(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
/**
* Request init that asks a remote origin for an uncompressed body.
*
* The DSH host boots `@deepseek-ai/dsh-http-proxy`, whose top-level import of
* the npm `undici` copy replaces the legacy `undici.globalDispatcher.1` slot
* Node's built-in `fetch()` reads. That cross-major wrapper drops the
* `content-encoding` header and automatic decompression, so a plain fetch
* resolves to raw gzip/brotli/zstd bytes — compressed noise no JSON or text
* consumer can read. Every host fetch that parses a remote body must request
* identity encoding. Caller headers survive; `accept-encoding` is forced to
* `identity` because a caller value has no decoder behind it in this host.
* @param init - the caller's request init (signal, headers, method, ...).
* @returns a copy with `accept-encoding: identity` merged in.
*/
function withIdentityEncoding(init = {}) {
	const headers = new Headers(init.headers);
	headers.set("accept-encoding", "identity");
	return {
		...init,
		headers
	};
}
/**
* Write one JSON response. Default headers are the family defaults
* (content-type and referrer-policy); caller headers are appended or
* override them.
*/
function writeJson(res, status, body, headers = {}) {
	const payload = JSON.stringify(body);
	res.writeHead(status, {
		...JSON_HEADERS,
		...headers
	});
	res.end(payload);
}
/**
* Build the grant table. Pure TypeScript with injected clock/randomness so the
* whole one-time semantics are unit-testable without a server.
*/
function createPairGrantStore(options = {}) {
	const ttlMs = options.ttlMs ?? 6e4;
	const now = options.now ?? (() => Date.now());
	const createGrant = options.createGrant ?? (() => randomBytes(32).toString("base64url"));
	const entries = /* @__PURE__ */ new Map();
	const purgeExpired = (at) => {
		for (const [grant, entry] of entries) if (entry.expiresAt <= at) entries.delete(grant);
	};
	return {
		issue(deviceId) {
			const issuedAt = now();
			purgeExpired(issuedAt);
			while (entries.size >= 256) {
				const oldest = entries.keys().next().value;
				if (oldest === void 0) break;
				entries.delete(oldest);
			}
			const grant = createGrant();
			const expiresAt = issuedAt + ttlMs;
			entries.set(grant, {
				deviceId,
				expiresAt
			});
			return {
				grant,
				expiresAt
			};
		},
		consume(grant) {
			if (grant === void 0 || grant === "") return void 0;
			const consumedAt = now();
			const entry = entries.get(grant);
			entries.delete(grant);
			purgeExpired(consumedAt);
			if (entry === void 0 || entry.expiresAt <= consumedAt) return void 0;
			return entry.deviceId;
		},
		peek(grant) {
			if (grant === void 0 || grant === "") return void 0;
			const at = now();
			const entry = entries.get(grant);
			if (entry === void 0) return void 0;
			if (entry.expiresAt <= at) {
				entries.delete(grant);
				return;
			}
			return entry.deviceId;
		},
		get size() {
			return entries.size;
		}
	};
}
//#endregion
//#region src/remote-methods.ts
/**
* Remote desktop channel constants — SDK-independent so tests and the
* client half can pin them without importing the host SDK graph.
*
* Access model on the 0.1.2-alpha.2 line: the host /api surface has no
* per-method privilege pin — the "configuration plane is local" behavior
* lives in the browser (client plugins branch on connection.isLoopback), and
* the paired remote desktop flips into host mode via the transport hook
* (ownsHost) while every call rides this gated channel as a loopback-shaped
* request. A paired device is therefore a full-control credential by
* design; the only paths that stay physically local are the control planes
* below (pairing control, self-update, plugin install/remove, host power).
*/
/** Gated mirror of same-origin fenced paths (`/remote` + original pathname). */
const REMOTE_PREFIX$1 = "/remote";
/** Connection-plugin method prefix under the gated channel. */
const REMOTE_API_PREFIX$1 = `${REMOTE_PREFIX$1}/api`;
/**
* Exact upgrade paths registered on webServer (the SDK matches upgrades by
* exact path, not prefix). Query strings ride on the request URL.
*/
const REMOTE_UPGRADE_PATHS = [
	{ mux: `${REMOTE_API_PREFIX$1}/remote.mux` }.mux,
	`${REMOTE_PREFIX$1}/sidebar/ws/terminal`,
	`${REMOTE_PREFIX$1}/sidebar/ws/agent-terminals`,
	`${REMOTE_PREFIX$1}/sidebar/ws/agent-opens`,
	`${REMOTE_API_PREFIX$1}/dsh-ssh/terminal`
];
/** Plugin-manager HTTP prefix: install/remove stay physically local. */
const PLUGIN_MANAGER_PATH = "/api/plugin-manager";
/**
* The cookieless device credential: the boot patch reads the device id from
* the /pair-app URL, keeps it in sessionStorage, and attaches it to every
* gated HTTP call as this header (and to WebSocket upgrades as the `device`
* query parameter - WS handshakes cannot carry headers from the Web API).
* The channel gate accepts it exactly like the device cookie, so the mobile
* flow works even with browser cookies fully blocked; the cookie remains the
* primary credential on normal browsers.
*/
const REMOTE_DEVICE_HEADER = "x-dsh-remote-device";
const REMOTE_DEVICE_QUERY = "device";
/**
* Path prefixes that stay physically local even for a paired device. A
* paired remote desktop may use the full host API (chat, sessions,
* settings, credentials, presets — it is a full-control credential), but it
* must not reach the machine-control planes: pairing control itself, the
* dsh-web self-update installer, and plugin install/remove.
*/
const LOCAL_ONLY_PREFIXES = [
	"/api/pair",
	"/api/update",
	PLUGIN_MANAGER_PATH
];
/**
* Whether a paired inner path must stay physically local.
* @param innerPath - the rewritten inner path (e.g. `/api/session.list`).
* @returns a denial message, or undefined when the path may be proxied.
*/
function localOnlyDenial(innerPath) {
	for (const prefix of LOCAL_ONLY_PREFIXES) if (innerPath === prefix || innerPath.startsWith(`${prefix}/`)) return `${prefix.slice(1)} stays physically local and stays unreachable from a paired remote desktop`;
}
//#endregion
//#region src/remote-channel-rules.ts
/**
* The remote-channel rewrite contract as pure data (issue #987): both the
* browser patch (client/remote-channel.ts) and the parse-time boot patch
* (remote-channel-boot.ts, inlined into index.html by the host) decide from
* these tables, so the two can never drift apart.
* @module @linxin666/dsh-remote-web-ui/remote-channel-rules
*/
/** The gated mirror prefix (must match src/remote-methods.ts). */
const REMOTE_PREFIX = "/remote";
/**
* The schemes that can deliver a page a remote party controls: the network
* transports, plus the documents a network page can mint. Every other scheme
* is registered and served by an application on this machine, so its page is
* the machine's own page whatever the application calls the scheme.
*
* The list is deliberately the *web* side rather than an allowlist of known
* desktop shells. The official DSH Desktop shell serves its Web GUI from
* `dsh-app://app/` (`location.hostname === 'app'`), which no hostname
* predicate can recognise; a scheme allowlist fixed that instance (#1682) but
* left the next shell — or a `file:` page — fenced behind a pairing page it
* can never complete, because a pairing link is reachable only over the
* network. Naming the web side instead makes an unknown application scheme
* local by construction.
*
* `blob:`, `data:`, `about:` and `filesystem:` stay on the web side: a
* network page mints those documents, so they must keep the fence.
*/
const WEB_PAGE_PROTOCOLS = [
	"http:",
	"https:",
	"blob:",
	"data:",
	"about:",
	"filesystem:"
];
/**
* The window global the device-gated app landing publishes to grant host mode.
* Set by the /pair-app capture script, read by the parse-time boot patch: the
* transport hook (ownsHost) is server-granted, not asserted from the origin.
*/
const REMOTE_HOST_GRANT_GLOBAL = "__DSH_REMOTE_HOST_GRANT__";
/** The live rule set. */
const REMOTE_CHANNEL_RULES = {
	remotePrefix: REMOTE_PREFIX,
	apiPrefix: "/api/",
	pairPrefix: "/api/pair/",
	updatePrefix: "/api/update/",
	settingsBridgePrefix: "/api/dsh-web-ui-settings",
	sidebarPrefix: "/sidebar/",
	gitPrefix: "/git/",
	petPrefix: "/pet/",
	wsPaths: [
		"/api/remote.mux",
		"/sidebar/ws/terminal",
		"/sidebar/ws/agent-terminals",
		"/sidebar/ws/agent-opens",
		"/api/dsh-ssh/terminal"
	],
	deviceHeader: REMOTE_DEVICE_HEADER,
	deviceKey: "dsh-remote-device",
	deviceQuery: REMOTE_DEVICE_QUERY,
	uploadPath: "/api/session/uploadFileBinary",
	uploadHookGlobal: "__DSH_FILE_UPLOAD__",
	webProtocols: WEB_PAGE_PROTOCOLS,
	hostGrantGlobal: REMOTE_HOST_GRANT_GLOBAL
};
/** The window global the boot patch publishes its seat under. */
const REMOTE_CHANNEL_BOOT_GLOBAL = "__DSH_REMOTE_CHANNEL_BOOT__";
//#endregion
//#region src/loopback-proxy.ts
/** WebSocket handshake headers forwarded to the loopback upstream. */
const WS_FORWARD_HEADERS = [
	"sec-websocket-key",
	"sec-websocket-version",
	"sec-websocket-extensions",
	"sec-websocket-protocol"
];
/** Response headers copied from the loopback upstream (no hop-by-hop). */
const HTTP_FORWARD_RESPONSE_HEADERS = [
	"content-type",
	"content-length",
	"content-disposition",
	"cache-control",
	"etag",
	"last-modified"
];
/**
* Pipe one HTTP request to loopback and stream the response back.
* @param req - the already-gated outer request.
* @param res - the outer response.
* @param port - local webServer port.
* @param upstreamPath - path + query on 127.0.0.1 (must start with `/`).
* @param auth - when given, the process's inner browser-auth credential is
*   attached so the connection plugin's /api route (fence + browser auth,
*   authority-bound cookie, no loopback exemption on this cohort) accepts
*   the re-issued request; a 401 answer invalidates the cached credential.
*/
function proxyLoopbackHttp(req, res, port, upstreamPath, auth) {
	Promise.resolve(auth?.ready()).catch(() => void 0).then((cookie) => {
		pipeLoopbackHttp(req, res, port, upstreamPath, auth, typeof cookie === "string" ? cookie : void 0);
	});
}
function pipeLoopbackHttp(req, res, port, upstreamPath, auth, cookie) {
	const headers = {
		host: `127.0.0.1:${String(port)}`,
		"sec-fetch-site": "same-origin"
	};
	const contentType = req.headers["content-type"];
	if (typeof contentType === "string") headers["content-type"] = contentType;
	const contentLength = req.headers["content-length"];
	if (typeof contentLength === "string") headers["content-length"] = contentLength;
	const accept = req.headers.accept;
	if (typeof accept === "string") headers.accept = accept;
	if (cookie !== void 0) headers.cookie = cookie;
	const upstream = request({
		host: "127.0.0.1",
		port,
		path: upstreamPath,
		method: req.method,
		headers
	}, (upstreamRes) => {
		if (upstreamRes.statusCode === 401 && cookie !== void 0) auth?.invalidate();
		const out = {};
		for (const name of HTTP_FORWARD_RESPONSE_HEADERS) {
			const value = upstreamRes.headers[name];
			if (value !== void 0) out[name] = value;
		}
		res.writeHead(upstreamRes.statusCode ?? 502, out);
		upstreamRes.pipe(res);
		upstreamRes.on("error", () => {
			res.destroy();
		});
		res.on("close", () => {
			if (!upstreamRes.readableEnded) upstream.destroy();
		});
	});
	upstream.on("error", () => {
		if (!res.headersSent) {
			writeJson(res, 502, {
				ok: false,
				error: {
					code: "upstream-failure",
					message: "upstream request failed"
				}
			});
			return;
		}
		res.destroy();
	});
	req.on("error", () => {
		upstream.destroy();
	});
	req.pipe(upstream);
}
/**
* Rebuild a WebSocket handshake as loopback-shaped and pipe both directions.
* @param req - the already-gated upgrade request.
* @param socket - the client duplex.
* @param head - bytes already read past the handshake.
* @param port - local webServer port.
* @param upstreamPath - path + query on 127.0.0.1.
* @param cookie - the inner browser-auth credential for the handshake, when
*   the upstream route enforces it (the gateway event-stream mux does).
*/
function proxyLoopbackUpgrade(req, socket, head, port, upstreamPath, cookie) {
	const lines = [
		`GET ${upstreamPath} HTTP/1.1`,
		`Host: 127.0.0.1:${String(port)}`,
		"Upgrade: websocket",
		"Connection: Upgrade"
	];
	if (cookie !== void 0) lines.push(`Cookie: ${cookie}`);
	for (const name of WS_FORWARD_HEADERS) {
		const value = req.headers[name];
		if (value === void 0) continue;
		lines.push(`${name}: ${Array.isArray(value) ? value.join(", ") : value}`);
	}
	const handshake = `${lines.join("\r\n")}\r\n\r\n`;
	const upstream = connect(port, "127.0.0.1");
	socket.setKeepAlive(true, 2e4);
	upstream.setKeepAlive(true, 2e4);
	const tearDown = () => {
		upstream.destroy();
		socket.destroy();
	};
	upstream.on("error", tearDown);
	socket.on("error", tearDown);
	upstream.on("close", () => {
		socket.destroy();
	});
	socket.on("close", () => {
		upstream.destroy();
	});
	upstream.on("connect", () => {
		upstream.write(handshake);
		if (head.length > 0) upstream.write(head);
		socket.pipe(upstream);
		upstream.pipe(socket);
	});
}
//#endregion
//#region src/remote-api.ts
const ALLOWED_METHODS = /* @__PURE__ */ new Set([
	"GET",
	"HEAD",
	"POST",
	"PUT",
	"PATCH",
	"DELETE"
]);
/** Reject traversal and empty segments; allow plugin file-path characters. */
function isSafeSegment(segment) {
	if (segment === "") return false;
	let decoded;
	try {
		decoded = decodeURIComponent(segment);
	} catch {
		return false;
	}
	return decoded !== "." && decoded !== ".." && !decoded.includes("/") && !decoded.includes("\\") && !decoded.includes("\0");
}
/** The normalized peer address of a request, or an empty string. */
function peerAddressOf(req) {
	return normalizeAddress(req.socket?.remoteAddress);
}
/** The User-Agent header of a request, or undefined. */
function userAgentOf(req) {
	const value = req.headers["user-agent"];
	return typeof value === "string" && value.length > 0 ? value : void 0;
}
/**
* Admit a peer that the desktop has already approved: the allowlist decides
* by address, and an admitted peer gets a deterministic LAN device session so
* the rest of the channel treats it like any paired device.
* @param req - the incoming request (its socket carries the peer address).
* @param deps - route dependencies (allowlist + pairing service).
* @returns the device id to use, or undefined when the peer is not admitted.
*/
function allowlistDeviceIdOf(req, deps) {
	const allowlist = deps.allowlist;
	if (allowlist === void 0 || !allowlist.enabled) return void 0;
	const address = peerAddressOf(req);
	if (address.length === 0) return void 0;
	if (allowlist.match(address) === void 0) return void 0;
	allowlist.touch(address);
	return deps.service.ensureLanDevice(address, userAgentOf(req));
}
/**
* Record a refused non-loopback peer so the desktop panel can offer a
* one-click approval. Loopback callers are never recorded (they are always
* admitted), and a disabled allowlist records nothing.
* @param req - the refused request.
* @param path - the path to show in the panel.
* @param deps - route dependencies.
*/
function noteRefusedPeer(req, path, deps) {
	const allowlist = deps.allowlist;
	if (allowlist === void 0 || !allowlist.enabled) return;
	const address = peerAddressOf(req);
	if (address.length === 0 || address === "127.0.0.1" || address === "::1") return;
	allowlist.note(address, {
		path,
		...userAgentOf(req) === void 0 ? {} : { userAgent: userAgentOf(req) }
	});
}
/** One SDK-shaped error envelope (keeps the desktop client's parse path intact). */
function envelopeError(res, status, rpcId, code, message) {
	writeJson(res, status, {
		type: "server-response",
		rpcId,
		result: {
			ok: false,
			error: {
				code,
				message,
				details: { issues: [] }
			}
		}
	});
}
/**
* Map `/remote/...` to the inner path, or undefined when the outer path is
* not a safe rewrite target.
*/
function innerPathOf(pathname) {
	if (pathname === "/remote" || pathname === `/remote/`) return void 0;
	if (!pathname.startsWith(`/remote/`)) return void 0;
	const rest = pathname.slice(7);
	if (!rest.startsWith("/")) return void 0;
	const segments = rest.slice(1).split("/");
	if (segments.length === 0 || segments.some((segment) => !isSafeSegment(segment))) return;
	return rest;
}
/**
* Whether a paired inner path must stay physically local (delegates to the
* shared LOCAL_ONLY_PREFIXES table).
* @returns a denial message, or undefined when the path may be proxied.
*/
function loopbackOnlyDenial(innerPath) {
	return localOnlyDenial(innerPath);
}
/**
* Resolve a live device credential for a gated HTTP request: the pairing
* cookie first, then the cookieless header the boot patch attaches. Unknown
* or revoked ids are a no-op - a stale id never re-arms a device.
* @returns the touched device id, or undefined when neither credential is live.
*/
function pairedDeviceIdOf(req, service) {
	const cookieDevice = readCookie(req.headers.cookie, service.config.cookieName);
	const headerDevice = typeof req.headers["x-dsh-remote-device"] === "string" ? req.headers[REMOTE_DEVICE_HEADER] : void 0;
	const id = cookieDevice ?? headerDevice;
	if (id === void 0) return void 0;
	return service.touchDevice(id) ? id : void 0;
}
/**
* Build the remote desktop channel HTTP routes.
* @param deps - pairing service + local port + inner credential.
* @returns the routes to register on webServer.
*/
function makeRemoteApiRoutes(deps) {
	const { service, port } = deps;
	const handler = (req, res) => {
		const requestPath = (() => {
			try {
				return new URL(req.url ?? "/", "http://127.0.0.1").pathname;
			} catch {
				return REMOTE_PREFIX$1;
			}
		})();
		if ((pairedDeviceIdOf(req, service) ?? allowlistDeviceIdOf(req, deps)) === void 0) {
			noteRefusedPeer(req, requestPath, deps);
			req.resume();
			envelopeError(res, 403, "invalid-request", "unpaired", "this device is not paired with the desktop");
			return;
		}
		const method = req.method ?? "GET";
		if (!ALLOWED_METHODS.has(method)) {
			req.resume();
			res.writeHead(405).end();
			return;
		}
		const url = new URL(req.url ?? "/", "http://127.0.0.1");
		const inner = innerPathOf(url.pathname);
		if (inner === void 0) {
			req.resume();
			res.writeHead(404).end();
			return;
		}
		const denied = loopbackOnlyDenial(inner);
		if (denied !== void 0) {
			req.resume();
			envelopeError(res, 403, "invalid-request", "forbidden", denied);
			return;
		}
		proxyLoopbackHttp(req, res, port, `${inner}${url.search}`, deps.auth);
	};
	return [{
		kind: "prefix",
		path: REMOTE_PREFIX$1,
		handler
	}];
}
/**
* Map one outer upgrade URL onto the loopback path, dropping the cookieless
* device credential on the way in.
*
* The outer handshake carries the device id as `?device=<id>` because WebSocket
* handshakes cannot carry headers from the Web API. That id is a live session
* credential — it opens the full host API through this same channel — and the
* inner leg is a request the rest of the loopback origin sees (on a WebSocket
* leg, a raw handshake request line written to a loopback socket), so forwarding
* it handed a working credential to every other observer of the local port for
* no benefit: the gate above has already authenticated the caller, and no
* upstream route reads the parameter (the gateway mux matches on path alone).
* The rest of the query rides through unchanged, so a caller's own parameters
* still reach the upstream.
*/
function upgradeInnerPath(reqUrl, fallbackPath) {
	if (reqUrl === void 0 || reqUrl === "") return fallbackPath;
	let url;
	try {
		url = new URL(reqUrl, "http://127.0.0.1");
	} catch {
		return fallbackPath;
	}
	const inner = innerPathOf(url.pathname);
	if (inner === void 0) return fallbackPath;
	url.searchParams.delete(REMOTE_DEVICE_QUERY);
	return `${inner}${url.search}`;
}
/**
* Build the WebSocket upgrade routes for the event streams and known plugin
* sockets. webServer matches upgrades by exact path.
* @param deps - pairing service + local port + live pairing policy.
* @returns the upgrade routes to register on webServer.
*/
function makeRemoteApiUpgradeRoutes(deps) {
	const { service, port } = deps;
	const handlerFor = (fallbackPath) => (req, socket, head) => {
		let queryDevice;
		try {
			queryDevice = new URL(req.url ?? "/", "http://127.0.0.1").searchParams.get("device") ?? void 0;
		} catch {}
		if ((pairedDeviceIdOf(req, service) ?? (queryDevice !== void 0 && service.touchDevice(queryDevice) ? queryDevice : void 0) ?? allowlistDeviceIdOf(req, deps)) === void 0) {
			noteRefusedPeer(req, `${REMOTE_PREFIX$1}${fallbackPath}`, deps);
			socket.write("HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n");
			socket.destroy();
			return;
		}
		const inner = upgradeInnerPath(req.url, fallbackPath);
		if (loopbackOnlyDenial(inner.split("?")[0] ?? inner) !== void 0) {
			socket.write("HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n");
			socket.destroy();
			return;
		}
		Promise.resolve(deps.auth?.ready()).catch(() => void 0).then((cookie) => {
			if (socket.destroyed) return;
			proxyLoopbackUpgrade(req, socket, head, port, inner, typeof cookie === "string" ? cookie : void 0);
		});
	};
	return REMOTE_UPGRADE_PATHS.map((path) => ({
		path,
		handler: handlerFor(path.slice(7))
	}));
}
//#endregion
//#region src/routes.ts
/**
* Browser-trust fence for the /api/pair routes, mirroring the connection
* package's internal fence semantics (Host/Origin based, DNS-rebinding and
* cross-site defense). The connection package no longer exports its trust
* predicate — the fence for the /api prefix lives inside the connection
* plugin — so the pairing routes, which must stay reachable from LAN phones
* ahead of the connection prefix route (exact routes match first), carry
* their own copy scoped to the literals the QR links advertise.
* @param request - the node HTTP request.
* @param trustedHosts - non-loopback authorities this surface serves: exact
* `host:port`, or port-less `host` matching any port.
* @returns true when the Host is ours (loopback or trusted) and any attached
* browser markers are same-origin.
*/
function isTrustedApiRequest(request, trustedHosts) {
	if (!isTrustedHost(request, trustedHosts)) return false;
	if (request.headers["sec-fetch-site"] === "cross-site") return false;
	const origin = request.headers.origin;
	if (origin === void 0) return true;
	try {
		return new URL(origin).host === new URL(`http://${request.headers.host ?? ""}`).host;
	} catch {
		return false;
	}
}
/**
* Whether the request's Host is an authority this surface serves: loopback, or
* a trusted entry (exact `host:port`, or port-less `host` matching any port).
* The browser-marker checks stay in {@link isTrustedApiRequest}: a pairing
* entry page is a navigation, and its authority is the token or device
* credential it carries, not who linked to it.
* @param request - the node HTTP request.
* @param trustedHosts - non-loopback authorities this surface serves.
* @returns true when the Host is ours.
*/
function isTrustedHost(request, trustedHosts) {
	const host = request.headers.host;
	if (typeof host !== "string") return false;
	let hostUrl;
	try {
		hostUrl = new URL(`http://${host}`);
	} catch {
		return false;
	}
	const hostname = hostUrl.hostname;
	return isLoopbackClient(request) || trustedHosts.some((entry) => {
		let entryUrl;
		try {
			entryUrl = new URL(`http://${entry}`);
		} catch {
			return false;
		}
		return entryUrl.port === "" ? entryUrl.hostname === hostname : entryUrl.host === hostUrl.host;
	});
}
/**
* Whether the request is a top-level document navigation — the shape every
* phone uses to open a pairing link. Browsers label it `Sec-Fetch-Mode:
* navigate` with `Sec-Fetch-Dest: document`; in-app browsers (WeChat, and
* anything else wrapping a WKWebView) additionally attach `Sec-Fetch-Site:
* cross-site` or an opaque `Origin: null`, which the API fence must keep
* refusing but which says nothing about a document navigation: the pairing
* token or the device id in the URL is what authorizes it.
* @param request - the node HTTP request.
* @returns true for a top-level document navigation.
*/
function isTopLevelDocumentNavigation(request) {
	return request.headers["sec-fetch-mode"] === "navigate" && request.headers["sec-fetch-dest"] === "document";
}
/**
* Test whether a hostname represents a private local-area network (RFC 1918 / ULA / mDNS / loopback).
* Supports pairing in container-bridged (Docker) or NAT-proxied topologies where the host
* machine's LAN IP or proxy domain differs from the container's internal sampled network interface.
*/
function isPrivateOrLocalHostname(hostname) {
	const normalized = hostname.toLowerCase().trim();
	if (normalized === "localhost" || normalized.endsWith(".local") || normalized.endsWith(".lan") || normalized.endsWith(".internal") || normalized.endsWith(".home.arpa")) return true;
	let ip = normalized;
	if (ip.startsWith("[") && ip.endsWith("]")) ip = ip.slice(1, -1);
	if (ip === "::1" || ip === "127.0.0.1") return true;
	if (ip.startsWith("fc") || ip.startsWith("fd") || ip.startsWith("fe80")) return true;
	const parts = ip.split(".").map(Number);
	if (parts.length === 4 && parts.every((n) => Number.isInteger(n) && n >= 0 && n <= 255)) {
		const [a, b] = parts;
		if (a === 10) return true;
		if (a === 127) return true;
		if (a === 169 && b === 254) return true;
		if (a === 172 && b >= 16 && b <= 31) return true;
		if (a === 192 && b === 168) return true;
	}
	return false;
}
/**
* Validates that an incoming request is non-cross-site (rejects cross-site fetch metadata
* and ensures Origin matches Host when present).
*/
function isNonCrossSite(request) {
	if (request.headers["sec-fetch-site"] === "cross-site") return false;
	const host = request.headers.host;
	if (typeof host !== "string") return false;
	const origin = request.headers.origin;
	if (origin === void 0) return true;
	try {
		const originUrl = new URL(origin);
		const hostUrl = new URL(`http://${host}`);
		return originUrl.host === hostUrl.host;
	} catch {
		return false;
	}
}
/**
* The private-LAN fallback authority of a request: its Host header when the
* hostname is private/local (RFC 1918 / ULA / mDNS / loopback) and the
* browser markers are non-cross-site, else undefined. The accept paths and
* the lanFence fallback use this to serve container-bridged and reverse-proxy
* topologies whose Host is not among the advertised or configured authorities.
*/
function privateLanHostOf(request, navigation = false) {
	const host = request.headers.host;
	if (typeof host !== "string") return void 0;
	let hostName = "";
	try {
		hostName = new URL(`http://${host}`).hostname;
	} catch {
		return;
	}
	if (hostName === "" || !isPrivateOrLocalHostname(hostName)) return void 0;
	if (!(navigation && isTopLevelDocumentNavigation(request)) && !isNonCrossSite(request)) return void 0;
	return host;
}
/** Cap on pairing request bodies (tokens and workspace ids are tiny). */
const MAX_BODY_BYTES = 4096;
/**
* The rate-limit bucket key for one accept attempt (pure; unit-tested).
* A forwarded hop separates buckets behind the auto-tunnel (every internet
* client arrives from 127.0.0.1 there) — but only for loopback peers, since a
* direct LAN client can rotate the header freely. The caller passes the hop it
* trusts (the edge-appended LAST one; see rateLimitAccept), and the hop is
* truncated so one oversized header cannot mint a huge key.
* @param socketIp - the socket peer address.
* @param forwarded - the trusted XFF hop, already trimmed, if any.
* @param bucket - page (GET /pair-accept) vs api (POST /api/pair/accept).
*/
function acceptLimitKey(socketIp, forwarded, bucket) {
	if (isLoopbackAddress(socketIp) && forwarded !== void 0 && forwarded !== "") return `${bucket}|${socketIp}|${forwarded.slice(0, MAX_FORWARDED_KEY_CHARS)}`;
	return `${bucket}|${socketIp}`;
}
/** Longest forwarded hop kept in a bucket key (the header is caller-sized). */
const MAX_FORWARDED_KEY_CHARS = 64;
/**
* Hard cap on live accept buckets. The key is caller-influenced (a forwarded
* hop), so a rotating flood must not grow the table without bound: past the
* cap the oldest bucket is evicted, the same FIFO stance as
* {@link addBounded}. A legitimate client that loses its bucket merely starts
* a fresh window.
*/
const MAX_ACCEPT_BUCKETS = 1024;
/**
* Reasons a phone-facing entry page refused a request, logged once per shape
* so a real device failure is diagnosable from the host console without a
* debug build. Keyed by `reason|host|path`; bounded by construction (a handful
* of reasons, and only the first occurrence of each is printed).
*/
const loggedEntryRefusals = /* @__PURE__ */ new Set();
/**
* Log one entry-page refusal (first occurrence per shape) and cap the set.
* @param request - the refused request.
* @param path - the entry path that refused it.
* @param reason - why the fence refused.
*/
function logEntryRefusal(request, path, reason) {
	const key = `${reason}|${request.headers.host ?? ""}|${path}`;
	if (loggedEntryRefusals.has(key) || loggedEntryRefusals.size >= 64) return;
	loggedEntryRefusals.add(key);
	const markers = [
		`sec-fetch-site=${request.headers["sec-fetch-site"] ?? "-"}`,
		`sec-fetch-mode=${request.headers["sec-fetch-mode"] ?? "-"}`,
		`sec-fetch-dest=${request.headers["sec-fetch-dest"] ?? "-"}`,
		`origin=${request.headers.origin ?? "-"}`
	].join(" ");
	console.log(`remote-web-ui: refused ${path} from host ${request.headers.host ?? "-"} (${reason}; ${markers})`);
}
/**
* FIFO-bounded Set insert: past `max` entries the oldest one is evicted
* (a Set iterates in insertion order). The dynamic trusted-host table is fed
* by caller-controlled Host headers, so it must stay bounded; an evicted
* legitimate host re-adds itself on that device's next gated request.
*/
function addBounded(set, value, max) {
	if (set.has(value)) return;
	if (set.size >= max) {
		const oldest = set.values().next().value;
		if (oldest !== void 0) set.delete(oldest);
	}
	set.add(value);
}
/**
* The host authority of a configured public base URL, e.g. `foo.trycloudflare.com`
* from `https://foo.trycloudflare.com`. Undefined when the URL does not parse —
* a malformed config then simply contributes no fence entry (and the panel
* falls back to LAN-only URLs).
* @param url - the configured public base URL (or undefined).
* @returns the `host[:port]` authority the fence should trust.
*/
function publicHostOf(url) {
	if (url === void 0) return void 0;
	try {
		return new URL(url).host;
	} catch {
		return;
	}
}
/** Cookie lifetime: one year; revoked sessions die at the gate regardless. */
const COOKIE_MAX_AGE_SEC = 365 * 24 * 60 * 60;
/**
* The cookieless device credential: pass the device id from the /pair-app
* URL into sessionStorage (and localStorage for tab reloads) before any app
* script runs - same key the boot patch and the channel gate read. The
* replaceState to '/' hides the credential URL from the address bar and
* leaves the SPA at its canonical root path. The reopen service worker is
* registered in the same breath: later navigations to '/' (history,
* bookmark, tab restore) must not fall through to the harness index gate,
* which the cookieless flow can never satisfy.
*/
const APP_DEVICE_STORAGE_KEY = "dsh-remote-device";
function appShellCaptureScript(deviceId) {
	const safeId = JSON.stringify(deviceId);
	const grantGlobal = JSON.stringify(REMOTE_HOST_GRANT_GLOBAL);
	const register = `try{if('serviceWorker' in navigator){navigator.serviceWorker.register(${JSON.stringify(PAIR_PATHS.appServiceWorker)},{scope:'/'}).catch(function(e){})}}catch(e){}`;
	return `<script>(function(){try{sessionStorage.setItem(${JSON.stringify(APP_DEVICE_STORAGE_KEY)},${safeId});}catch(e){}try{history.replaceState(null,'','/')}catch(e){}try{window[${grantGlobal}]=true}catch(e){}${register}})()<\/script>`;
}
/**
* Patch the official index document with the device-capture script. The script
* goes immediately after the opening <head> tag, ahead of the harness-injected
* parse-time channel boot patch: that patch installs the transport host-mode
* hook only when this server-served marker is already set (see
* remote-channel-boot.ts), so host mode is granted by the device-gated landing
* instead of being asserted from the origin.
*/
function patchAppShell(html, deviceId) {
	const script = appShellCaptureScript(deviceId);
	const head = /<head[^>]*>/i.exec(html);
	if (head === null) return script + html;
	const end = head.index + head[0].length;
	return html.slice(0, end) + script + html.slice(end);
}
/**
* The reopen service worker served at PAIR_PATHS.appServiceWorker. A paired
* phone comes back to `/` from history, bookmarks, or tab restore; the
* harness fallback seat answers that navigation with its browser-auth 401,
* and the cookieless mobile flow never holds a browser-auth cookie. The
* worker owns navigations to `/` instead: network-first through /pair-app
* (which validates the device cookie and refreshes its presence), the
* cached shell for offline opens, and a pass-through of the original
* request when the plugin no longer answers. Plain-HTTP LAN origins are not
* secure contexts, so the worker never registers there — the LAN reopen
* path stays "scan a fresh QR", which is cheap in-network.
*
* Kept as a plain string (same pattern as the capture script): it must load
* with no build step, run on every JS engine that ships service workers,
* and be assertable as source in tests. Bump SHELL_CACHE when the storage
* layout changes so old caches are pruned on activate.
*/
function appServiceWorkerScript() {
	return `'use strict';
var SHELL_CACHE = 'dsh-remote-shell-v1';
var SHELL_KEY = '/dsh-remote-shell';
var APP_URL = '/pair-app';
self.addEventListener('install', function (event) {
  event.waitUntil(refreshShell().then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (event) {
  event.waitUntil(self.caches.keys().then(function (names) {
    return Promise.all(names.map(function (name) {
      return name === SHELL_CACHE ? Promise.resolve() : self.caches.delete(name);
    }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (event) {
  var request = event.request;
  if (request.method !== 'GET' || request.mode !== 'navigate') return;
  var path;
  try { path = new URL(request.url).pathname; } catch (error) { return; }
  if (path !== '/') return;
  event.respondWith(reopen(event));
});
/* Network-first: a live pairing gets the current shell (the /pair-app check
   refreshes lastSeenAt, so every reopen also keeps the session alive); a
   refused shell passes the original navigation through for the harness's
   own response; an unreachable server falls back to the cached shell. */
function reopen(event) {
  var request = event.request;
  return fetch(APP_URL, { credentials: 'same-origin', cache: 'no-store' }).then(function (response) {
    if (!response.ok) return fetch(request);
    var copy = response.clone();
    event.waitUntil(self.caches.open(SHELL_CACHE).then(function (cache) {
      return cache.put(SHELL_KEY, copy);
    }));
    return response;
  }, function () {
    return self.caches.match(SHELL_KEY).then(function (cached) {
      return cached !== undefined ? cached : fetch(request);
    });
  });
}
/* Best-effort shell warm-up and refresh; never rejects. */
function refreshShell() {
  return fetch(APP_URL, { credentials: 'same-origin', cache: 'no-store' }).then(function (response) {
    if (!response.ok) return undefined;
    var copy = response.clone();
    return self.caches.open(SHELL_CACHE).then(function (cache) {
      return cache.put(SHELL_KEY, copy);
    });
  }, function () { return undefined; });
}`;
}
/**
* The dead-end guard for a failed /pair-accept and for a dead reopen (the
* reopen service worker serves this page at `/` when the pairing no longer
* passes): a device without a live pairing has no harness browser-auth
* cookie, so a redirect to bare `/` would land on the harness browser-auth
* 401 page ("authentication required"), which reads like a broken server.
* Serve a plain bilingual explanation instead; an already-paired device (live
* device cookie, browser credential redeemed during its first scan) keeps
* the old behavior and is sent on to the app.
*/
function pairingFailurePage() {
	return [
		"<!doctype html><html><head><meta charset=\"utf-8\">",
		"<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">",
		"<meta name=\"referrer\" content=\"no-referrer\">",
		"<title>Pairing link invalid</title></head>",
		"<body style=\"font-family:system-ui,sans-serif;padding:24px;max-width:32em;margin:0 auto;line-height:1.6\">",
		"<p><strong>配对已失效，或配对链接已过期。</strong></p>",
		"<p>请在桌面端打开远程控制面板，刷新二维码后重新扫码；重新配对后本机即可恢复访问。</p>",
		"<hr style=\"border:none;border-top:1px solid #ccc;margin:16px 0\">",
		"<p><strong>This pairing has expired or the link is no longer valid.</strong></p>",
		"<p>Open the remote panel on the desktop, refresh the QR code, and scan again — re-pairing restores access on this device.</p>",
		"</body></html>"
	].join("");
}
/**
* The dead-end a device reaches while its address is waiting for a decision:
* the refusal is already recorded for the desktop panel, so this page only has
* to say what to do next. It is deliberately a plain page without any script —
* an unapproved device must not load the app shell or its boot patch.
*/
function pendingApprovalPage() {
	return [
		"<!doctype html><html><head><meta charset=\"utf-8\">",
		"<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">",
		"<meta name=\"referrer\" content=\"no-referrer\">",
		"<title>Waiting for approval</title></head>",
		"<body style=\"font-family:system-ui,sans-serif;padding:24px;max-width:32em;margin:0 auto;line-height:1.6\">",
		"<p><strong>此设备尚未获准访问，连接请求已记录。</strong></p>",
		"<p>请在电脑上打开「远程访问」面板（侧边栏底部手机图标），在「等待批准的连接」里点击「批准」，然后回到本页刷新即可。</p>",
		"<hr style=\"border:none;border-top:1px solid #ccc;margin:16px 0\">",
		"<p><strong>This device is not approved yet; the connection was recorded.</strong></p>",
		"<p>Open the remote panel on the desktop (phone icon at the bottom of the sidebar), press Approve in “Waiting for approval”, then reload this page.</p>",
		"</body></html>"
	].join("");
}
/** Route paths (exact matches under /api). */
const PAIR_PATHS = {
	issue: "/api/pair/issue",
	accept: "/api/pair/accept",
	stop: "/api/pair/stop",
	revoke: "/api/pair/revoke",
	heartbeat: "/api/pair/heartbeat",
	status: "/api/pair/status",
	events: "/api/pair/events",
	lanBind: "/api/pair/lan-bind",
	/**
	* LAN allowlist management. All four are loopback-only: approving a peer is
	* a decision made on the desktop's own UI, never over the network.
	*/
	lanState: "/api/pair/lan",
	lanApprove: "/api/pair/lan/approve",
	lanRemove: "/api/pair/lan/remove",
	lanDismiss: "/api/pair/lan/dismiss",
	/** Top-level accept-and-redirect entry the QR link points at. */
	acceptPage: "/pair-accept",
	/** The cookieless app landing: serves the official shell for a paired device. */
	appPage: "/pair-app",
	/**
	* The reopen service worker (registered by the capture script). Root-level
	* path so its default script-directory scope already covers `/`.
	*/
	appServiceWorker: "/pair-app.sw.js"
};
/**
* /api/pair request payload contracts. Each POST endpoint validates its body
* against one of these instead of reaching into a hand-parsed object: the
* control-plane endpoints that carry no meaningful payload use the permissive
* pairActionPayloadSchema so their smoke calls keep working unchanged, while
* issue/accept enforce their optional/required fields. Unknown (extra) keys
* are tolerated exactly as the previous manual reads ignored them.
*/
const issuePayloadSchema = z$1.object({ address: z$1.string().min(1).optional() });
const acceptPayloadSchema = z$1.object({ token: z$1.string().default("") });
const revokePayloadSchema = z$1.object({ deviceId: z$1.string().min(1) });
/**
* LAN allowlist writes (approve / remove / dismiss) all address one peer by
* its normalized address: approving uses the address recorded in the pending
* table, so the client never has to echo a user agent back.
*/
const lanAddressPayloadSchema = z$1.object({ address: z$1.string().min(1) });
const pairActionPayloadSchema = z$1.object({}).passthrough();
/**
* Parse a pair request body through schema. A missing/empty, unparseable
* or non-object body (shared readJsonBody with objectOnly yields null for
* all of them) is treated as an empty object — the desktop stop/heartbeat
* send no body — and a value that fails the schema returns `undefined` so
* the caller can answer with the existing error shape.
*/
function parsePairPayload(schema, body) {
	const result = schema.safeParse(body ?? {});
	return result.success ? result.data : void 0;
}
/** The SSE fan-out for desktop panel status. */
var PairingEventsStream = class {
	streams = /* @__PURE__ */ new Set();
	/**
	* @param service - the pairing service whose snapshots are fanned out.
	*/
	constructor(service) {
		service.onState((snapshot) => {
			this.push(snapshot);
		});
	}
	/** Open one stream; the response is owned to completion. */
	open(req, res) {
		res.writeHead(200, {
			"content-type": "text/event-stream; charset=utf-8",
			"cache-control": "no-cache",
			connection: "keep-alive"
		});
		const stream = {
			res,
			closed: false
		};
		this.streams.add(stream);
		const close = () => {
			if (stream.closed) return;
			stream.closed = true;
			this.streams.delete(stream);
		};
		res.on("close", close);
		req.on("close", close);
	}
	/** Push one frame to every open stream (contained per stream). */
	push(snapshot) {
		const frame = `data: ${JSON.stringify({
			type: "state",
			...snapshot
		})}\n\n`;
		for (const stream of this.streams) try {
			stream.res.write(frame);
		} catch {
			stream.closed = true;
			this.streams.delete(stream);
		}
	}
	/** Stream count (tests/diagnostics). */
	get size() {
		return this.streams.size;
	}
};
/** The path of a request, for the refused-peer record (`/` when unreadable). */
function refusalPathOf(request) {
	try {
		return new URL(request.url ?? "/", "http://pair.invalid").pathname;
	} catch {
		return "/";
	}
}
/**
* Build the /api/pair route family.
* @param deps - service + fence inputs.
* @returns the exact routes to register on webServer.
*/
function makeRoutes(deps) {
	const { service, requirePairingForLan = true } = deps;
	const pairingRequired = () => typeof requirePairingForLan === "function" ? requirePairingForLan() : requirePairingForLan;
	const grants = deps.grants ?? createPairGrantStore();
	const events = new PairingEventsStream(service);
	const dynamicTrustedHosts = /* @__PURE__ */ new Set();
	/** Loopback-only fence: the desktop panel's control endpoints. */
	const loopbackFence = (req) => isTrustedApiRequest(req, []);
	/**
	* Phone-facing fence: loopback, the service's live LAN literals, configured
	* public host, extra trusted hosts, or dynamically paired hosts. `navigation`
	* relaxes the browser-marker checks for a top-level document navigation (the
	* pairing entry pages), never for an API or subresource request.
	*/
	const lanFence = (req, navigation = false) => {
		const publicHost = publicHostOf(service.publicBaseUrl);
		const bases = service.lanAddresses;
		const extraHosts = typeof deps.trustedHosts === "function" ? deps.trustedHosts() : deps.trustedHosts ?? [];
		const combined = [
			...bases,
			...publicHost !== void 0 ? [publicHost] : [],
			...extraHosts,
			...dynamicTrustedHosts
		];
		if (navigation && isTopLevelDocumentNavigation(req) ? isTrustedHost(req, combined) : isTrustedApiRequest(req, combined)) return true;
		const privateLanHost = privateLanHostOf(req, navigation);
		if (privateLanHost !== void 0) {
			const cookieDeviceId = readCookie(req.headers.cookie, service.config.cookieName);
			let queryDeviceId = null;
			let queryGrant;
			try {
				const params = new URL(req.url ?? "/", "http://pair.invalid").searchParams;
				queryDeviceId = params.get("device");
				queryGrant = params.get("grant") ?? void 0;
			} catch {}
			const granted = grants.peek(queryGrant);
			const deviceId = cookieDeviceId ?? queryDeviceId ?? granted ?? void 0;
			if (deviceId !== void 0 && service.hasDevice(deviceId)) {
				addBounded(dynamicTrustedHosts, privateLanHost, 64);
				return true;
			}
		}
		const allowlist = deps.allowlist;
		if (allowlist?.enabled === true) {
			const address = peerAddressOf(req);
			if (address.length > 0 && allowlist.match(address) !== void 0) {
				allowlist.touch(address);
				return true;
			}
		}
		noteRefusedPeer(req, refusalPathOf(req), deps);
		return false;
	};
	const requireMethod = (req, res, method) => {
		if (req.method === method) return true;
		res.writeHead(405);
		res.end();
		return false;
	};
	/** Per-source-IP accept rate limit (brute-force defense in depth). */
	const acceptAttempts = /* @__PURE__ */ new Map();
	const ACCEPT_MAX_ATTEMPTS = 10;
	const ACCEPT_WINDOW_MS = 3e4;
	/**
	* @param bucket - the POST /api/pair/accept and the GET /pair-accept flows
	*   count separately: a QR re-scan (page navigation) must not consume a
	*   brute-force budget that belongs to token guessing (and vice versa).
	*/
	/**
	* Drop expired buckets from the FRONT of the insertion-ordered table, then
	* FIFO-evict past the hard cap. The front always holds the oldest window
	* because a re-armed bucket is re-inserted at the tail, so this is amortized
	* O(1) per request: every iteration deletes an entry that was inserted once.
	* It replaces a full-table scan that ran on every pairing request once the
	* table passed 256 entries (and deleted nothing while all windows were
	* fresh).
	*/
	const pruneAcceptAttempts = (nowMs) => {
		while (acceptAttempts.size > 0) {
			const oldest = acceptAttempts.keys().next().value;
			if (oldest === void 0) break;
			const attempt = acceptAttempts.get(oldest);
			if (attempt !== void 0 && nowMs - attempt.windowStart <= ACCEPT_WINDOW_MS) break;
			acceptAttempts.delete(oldest);
		}
		while (acceptAttempts.size > MAX_ACCEPT_BUCKETS) {
			const oldest = acceptAttempts.keys().next().value;
			if (oldest === void 0) break;
			acceptAttempts.delete(oldest);
		}
	};
	const rateLimitAccept = (req, bucket) => {
		const socketIp = req.socket?.remoteAddress ?? "unknown";
		const hops = typeof req.headers["x-forwarded-for"] === "string" ? req.headers["x-forwarded-for"].split(",") : [];
		const ip = acceptLimitKey(socketIp, (hops[hops.length - 1] ?? "").trim(), bucket);
		const nowMs = Date.now();
		pruneAcceptAttempts(nowMs);
		const entry = acceptAttempts.get(ip);
		if (entry === void 0 || nowMs - entry.windowStart > ACCEPT_WINDOW_MS) {
			acceptAttempts.delete(ip);
			acceptAttempts.set(ip, {
				count: 1,
				windowStart: nowMs
			});
			return false;
		}
		entry.count += 1;
		return entry.count > ACCEPT_MAX_ATTEMPTS;
	};
	const handleIssue = async (req, res) => {
		if (!requireMethod(req, res, "POST")) return;
		if (!loopbackFence(req)) {
			writeJson(res, 403, {
				ok: false,
				code: "forbidden"
			});
			return;
		}
		const body = await readJsonBody(req, {
			maxBytes: MAX_BODY_BYTES,
			objectOnly: true
		});
		const payload = parsePairPayload(issuePayloadSchema, body);
		if (payload === void 0) {
			writeJson(res, 400, {
				ok: false,
				code: "bad-payload"
			});
			return;
		}
		const { address } = payload;
		try {
			const { token, expiresAt } = service.issue(void 0, address);
			const base = address === void 0 ? service.publicBaseUrl ?? service.lanBaseUrl : service.lanBaseUrlFor(address);
			if (base === void 0) throw new Error("remote-web-ui: base unavailable");
			writeJson(res, 200, {
				ok: true,
				url: `${base}/pair-accept?pair=${token}`,
				token,
				expiresAt,
				lanAddresses: service.lanAddresses,
				...service.publicBaseUrl !== void 0 ? { publicBaseUrl: service.publicBaseUrl } : {}
			});
		} catch (error) {
			const unknownAddress = error instanceof UnknownLanAddressError;
			writeJson(res, unknownAddress ? 400 : 409, {
				ok: false,
				code: unknownAddress ? "unknown-address" : "lan-required"
			});
		}
	};
	const handleAccept = async (req, res) => {
		if (!requireMethod(req, res, "POST")) return;
		const privateLanHost = privateLanHostOf(req);
		if (!lanFence(req) && privateLanHost === void 0) {
			writeJson(res, 403, {
				ok: false,
				code: "forbidden"
			});
			return;
		}
		if (rateLimitAccept(req, "api")) {
			writeJson(res, 429, {
				ok: false,
				code: "rate-limited"
			});
			return;
		}
		const body = await readJsonBody(req, {
			maxBytes: MAX_BODY_BYTES,
			objectOnly: true
		});
		const payload = parsePairPayload(acceptPayloadSchema, body);
		if (payload === void 0) {
			writeJson(res, 400, {
				ok: false,
				code: "bad-payload"
			});
			return;
		}
		const ua = req.headers["user-agent"];
		const result = service.accept(payload.token, typeof ua === "string" ? ua : void 0);
		if (!result.ok) {
			if (!lanFence(req)) {
				writeJson(res, 403, {
					ok: false,
					code: "forbidden"
				});
				return;
			}
			writeJson(res, 404, {
				ok: false,
				code: result.code
			});
			return;
		}
		if (privateLanHost !== void 0) addBounded(dynamicTrustedHosts, privateLanHost, 64);
		writeJson(res, 200, {
			ok: true,
			deviceId: result.deviceId
		}, { "set-cookie": [deviceCookie(req, service.config.cookieName, result.deviceId)] });
	};
	const handleStop = async (req, res) => {
		if (!requireMethod(req, res, "POST")) return;
		if (!loopbackFence(req)) {
			writeJson(res, 403, {
				ok: false,
				code: "forbidden"
			});
			return;
		}
		const body = await readJsonBody(req, {
			maxBytes: MAX_BODY_BYTES,
			objectOnly: true
		});
		if (parsePairPayload(pairActionPayloadSchema, body) === void 0) {
			writeJson(res, 400, {
				ok: false,
				code: "bad-payload"
			});
			return;
		}
		service.stop();
		writeJson(res, 200, { ok: true });
	};
	const handleRevoke = async (req, res) => {
		if (!requireMethod(req, res, "POST")) return;
		if (!loopbackFence(req)) {
			writeJson(res, 403, {
				ok: false,
				code: "forbidden"
			});
			return;
		}
		const body = await readJsonBody(req, {
			maxBytes: MAX_BODY_BYTES,
			objectOnly: true
		});
		const payload = parsePairPayload(revokePayloadSchema, body);
		if (payload === void 0) {
			writeJson(res, 400, {
				ok: false,
				code: "bad-payload"
			});
			return;
		}
		if (!service.revoke(payload.deviceId)) {
			writeJson(res, 404, {
				ok: false,
				code: "unknown-device"
			});
			return;
		}
		writeJson(res, 200, { ok: true });
	};
	const handleHeartbeat = async (req, res) => {
		if (!requireMethod(req, res, "POST")) return;
		if (!lanFence(req)) {
			writeJson(res, 403, {
				ok: false,
				code: "forbidden"
			});
			return;
		}
		const body = await readJsonBody(req, {
			maxBytes: MAX_BODY_BYTES,
			objectOnly: true
		});
		if (parsePairPayload(pairActionPayloadSchema, body) === void 0) {
			writeJson(res, 400, {
				ok: false,
				code: "bad-payload"
			});
			return;
		}
		const deviceId = readCookie(req.headers.cookie, service.config.cookieName);
		if (deviceId === void 0 || !service.heartbeat(deviceId)) {
			writeJson(res, 401, {
				ok: false,
				code: "unpaired"
			});
			return;
		}
		writeJson(res, 200, { ok: true });
	};
	const handleStatus = async (req, res) => {
		if (!requireMethod(req, res, "GET")) return;
		if (!lanFence(req)) {
			writeJson(res, 403, {
				ok: false,
				code: "forbidden"
			});
			return;
		}
		const deviceId = readCookie(req.headers.cookie, service.config.cookieName);
		const paired = deviceId !== void 0 && service.hasDevice(deviceId);
		const local = isLoopbackClient(req);
		const snapshot = service.snapshot();
		const { devices: _devices, ...rest } = snapshot;
		const visible = paired || local ? rest : {
			phase: snapshot.phase,
			lanAvailable: snapshot.lanAvailable
		};
		writeJson(res, 200, {
			ok: true,
			paired,
			requirePairingForLan: pairingRequired(),
			...visible
		});
	};
	const handleEvents = (req, res) => {
		if (!requireMethod(req, res, "GET")) return;
		if (!loopbackFence(req)) {
			writeJson(res, 403, {
				ok: false,
				code: "forbidden"
			});
			return;
		}
		events.open(req, res);
		events.push(service.snapshot());
	};
	/** LAN-bind facts for the settings card; loopback-only, read per request. */
	const handleLanBind = (req, res) => {
		if (!requireMethod(req, res, "GET")) return;
		if (!loopbackFence(req)) {
			writeJson(res, 403, {
				ok: false,
				code: "forbidden"
			});
			return;
		}
		writeJson(res, 200, {
			ok: true,
			...deps.lanBindStatus?.() ?? {}
		});
	};
	/**
	* The LAN approval list, as the desktop panel sees it: the switch, the
	* approved peers, and the peers that were refused and are waiting for a
	* decision. Loopback-only — the whole point is that the decision happens on
	* this machine, not on the device asking for access.
	*/
	const handleLanState = (req, res) => {
		if (!requireMethod(req, res, "GET")) return;
		if (!loopbackFence(req)) {
			writeJson(res, 403, {
				ok: false,
				code: "forbidden"
			});
			return;
		}
		const allowlist = deps.allowlist;
		if (allowlist === void 0) {
			writeJson(res, 200, {
				ok: true,
				enabled: false,
				available: false,
				entries: [],
				pending: []
			});
			return;
		}
		writeJson(res, 200, {
			ok: true,
			available: true,
			...allowlist.snapshot()
		});
	};
	/** Read the shared { address } body used by the three allowlist writes. */
	const readAddressBody = async (req, res) => {
		const body = await readJsonBody(req, {
			maxBytes: MAX_BODY_BYTES,
			objectOnly: true
		});
		const payload = parsePairPayload(lanAddressPayloadSchema, body);
		if (payload === void 0) {
			writeJson(res, 400, {
				ok: false,
				code: "bad-payload"
			});
			return;
		}
		return normalizeAddress(payload.address.trim());
	};
	/** Approve one refused peer: it joins the allowlist and its session is minted. */
	const handleLanApprove = async (req, res) => {
		if (!requireMethod(req, res, "POST")) return;
		if (!loopbackFence(req)) {
			writeJson(res, 403, {
				ok: false,
				code: "forbidden"
			});
			return;
		}
		const allowlist = deps.allowlist;
		if (allowlist === void 0) {
			writeJson(res, 409, {
				ok: false,
				code: "unavailable"
			});
			return;
		}
		const address = await readAddressBody(req, res);
		if (address === void 0) return;
		const pending = allowlist.pending().find((entry) => entry.address === address);
		allowlist.approve(address, { ...pending?.userAgent === void 0 ? {} : { userAgent: pending.userAgent } });
		writeJson(res, 200, {
			ok: true,
			address,
			deviceId: service.ensureLanDevice(address, pending?.userAgent),
			...allowlist.snapshot()
		});
	};
	/** Remove one entry and revoke the session it stood for. */
	const handleLanRemove = async (req, res) => {
		if (!requireMethod(req, res, "POST")) return;
		if (!loopbackFence(req)) {
			writeJson(res, 403, {
				ok: false,
				code: "forbidden"
			});
			return;
		}
		const allowlist = deps.allowlist;
		if (allowlist === void 0) {
			writeJson(res, 409, {
				ok: false,
				code: "unavailable"
			});
			return;
		}
		const address = await readAddressBody(req, res);
		if (address === void 0) return;
		const removed = allowlist.remove(address);
		service.revokeLanDevice(address);
		writeJson(res, 200, {
			ok: true,
			removed,
			...allowlist.snapshot()
		});
	};
	/** Forget a refused peer without granting it anything. */
	const handleLanDismiss = async (req, res) => {
		if (!requireMethod(req, res, "POST")) return;
		if (!loopbackFence(req)) {
			writeJson(res, 403, {
				ok: false,
				code: "forbidden"
			});
			return;
		}
		const allowlist = deps.allowlist;
		if (allowlist === void 0) {
			writeJson(res, 409, {
				ok: false,
				code: "unavailable"
			});
			return;
		}
		const address = await readAddressBody(req, res);
		if (address === void 0) return;
		allowlist.dismiss(address);
		writeJson(res, 200, {
			ok: true,
			...allowlist.snapshot()
		});
	};
	/**
	* The QR entry: navigate here with ?pair=<token>. Sets the device cookie,
	* then redirects to the authenticated home (the connection service's
	* launch-token URL), so a LAN device that has never seen this authority
	* clears the browser-auth gate and boots the paired official UI in one
	* chain: /pair-accept → /?token=<launch> → /. A device that is already
	* authenticated (or loopback) skips straight through the same way.
	*/
	const handleAcceptPage = async (req, res) => {
		if (!requireMethod(req, res, "GET")) return;
		const privateLanHost = privateLanHostOf(req, true);
		if (!lanFence(req, true) && privateLanHost === void 0) {
			logEntryRefusal(req, PAIR_PATHS.acceptPage, "untrusted-host");
			res.writeHead(403, { "content-type": "text/plain; charset=utf-8" });
			res.end("forbidden");
			return;
		}
		if (rateLimitAccept(req, "page")) {
			res.writeHead(429, { "content-type": "text/plain; charset=utf-8" });
			res.end("rate limited");
			return;
		}
		const token = new URL(req.url ?? "/", "http://pair.invalid").searchParams.get("pair") ?? "";
		const ua = req.headers["user-agent"];
		const result = token === "" ? {
			ok: false,
			code: "invalid"
		} : service.accept(token, typeof ua === "string" ? ua : void 0);
		if (!result.ok) {
			if (!lanFence(req, true)) {
				logEntryRefusal(req, PAIR_PATHS.acceptPage, "untrusted-host-after-invalid-token");
				res.writeHead(403, { "content-type": "text/plain; charset=utf-8" });
				res.end("forbidden");
				return;
			}
			const deviceId = readCookie(req.headers.cookie, service.config.cookieName);
			if (deviceId !== void 0 && service.hasDevice(deviceId)) {
				const { grant } = grants.issue(deviceId);
				res.writeHead(303, {
					location: `${appOrigin(req)}/pair-app?grant=${encodeURIComponent(grant)}`,
					"cache-control": "no-store",
					"referrer-policy": "no-referrer"
				});
				res.end();
				return;
			}
			res.writeHead(200, {
				"content-type": "text/html; charset=utf-8",
				"cache-control": "no-store",
				"referrer-policy": "no-referrer"
			});
			res.end(pairingFailurePage());
			return;
		}
		if (privateLanHost !== void 0) addBounded(dynamicTrustedHosts, privateLanHost, 64);
		const { grant } = grants.issue(result.deviceId);
		res.writeHead(303, {
			location: `${appOrigin(req)}/pair-app?grant=${encodeURIComponent(grant)}`,
			"cache-control": "no-store",
			"referrer-policy": "no-referrer",
			"set-cookie": [deviceCookie(req, service.config.cookieName, result.deviceId)]
		});
		res.end();
	};
	/**
	* The cookieless app landing. A paired device (a one-time grant minted by
	* /pair-accept, or a live pairing cookie on a reopen) receives the official
	* index shell patched with the device-capture script; the shell itself is
	* the official document and carries no data, so serving it needs only the
	* device credential.
	*/
	const handleAppPage = async (req, res) => {
		if (!requireMethod(req, res, "GET")) return;
		if (!lanFence(req, true)) {
			logEntryRefusal(req, PAIR_PATHS.appPage, "untrusted-host");
			const address = peerAddressOf(req);
			if (address.length > 0 && address !== "127.0.0.1" && address !== "::1" && deps.allowlist?.enabled === true) {
				res.writeHead(200, {
					"content-type": "text/html; charset=utf-8",
					"cache-control": "no-store",
					"referrer-policy": "no-referrer"
				});
				res.end(pendingApprovalPage());
				return;
			}
			res.writeHead(403, { "content-type": "text/plain; charset=utf-8" });
			res.end("forbidden");
			return;
		}
		if (rateLimitAccept(req, "page")) {
			res.writeHead(429, { "content-type": "text/plain; charset=utf-8" });
			res.end("rate limited");
			return;
		}
		const url = new URL(req.url ?? "/", "http://pair.invalid");
		const grantedDevice = grants.consume(url.searchParams.get("grant") ?? void 0);
		const cookieDevice = readCookie(req.headers.cookie, service.config.cookieName);
		const id = grantedDevice !== void 0 && service.touchDevice(grantedDevice) ? grantedDevice : cookieDevice !== void 0 && service.touchDevice(cookieDevice) ? cookieDevice : deps.allowlist?.enabled === true && deps.allowlist.match(peerAddressOf(req)) !== void 0 ? service.ensureLanDevice(peerAddressOf(req), typeof req.headers["user-agent"] === "string" ? req.headers["user-agent"] : void 0) : void 0;
		if (id === void 0) {
			res.writeHead(200, {
				"content-type": "text/html; charset=utf-8",
				"cache-control": "no-store",
				"referrer-policy": "no-referrer"
			});
			res.end(pairingFailurePage());
			return;
		}
		const html = await deps.indexDocument?.(id).catch(() => void 0);
		if (html === void 0) {
			res.writeHead(502, {
				"content-type": "text/plain; charset=utf-8",
				"cache-control": "no-store"
			});
			res.end("remote device app unavailable");
			return;
		}
		res.writeHead(200, {
			"content-type": "text/html; charset=utf-8",
			"cache-control": "no-store",
			"referrer-policy": "no-referrer",
			"set-cookie": [deviceCookie(req, service.config.cookieName, id)]
		});
		res.end(patchAppShell(html, id));
	};
	/**
	* The reopen service worker script. Same phone-facing fence as the app
	* page but no rate limit and no device check: the script is inert logic
	* (no secrets, no data), and browsers re-fetch it on navigations for
	* update checks, which must not trip a brute-force budget. no-store keeps
	* the update check meaningful across deploys.
	*/
	const handleAppServiceWorker = (req, res) => {
		if (!requireMethod(req, res, "GET")) return;
		if (!lanFence(req, true)) {
			res.writeHead(403, { "content-type": "text/plain; charset=utf-8" });
			res.end("forbidden");
			return;
		}
		res.writeHead(200, {
			"content-type": "text/javascript; charset=utf-8",
			"cache-control": "no-store",
			"service-worker-allowed": "/"
		});
		res.end(appServiceWorkerScript());
	};
	const routes = [
		{
			kind: "exact",
			path: PAIR_PATHS.issue,
			handler: handleIssue
		},
		{
			kind: "exact",
			path: PAIR_PATHS.accept,
			handler: handleAccept
		},
		{
			kind: "exact",
			path: PAIR_PATHS.stop,
			handler: handleStop
		},
		{
			kind: "exact",
			path: PAIR_PATHS.revoke,
			handler: handleRevoke
		},
		{
			kind: "exact",
			path: PAIR_PATHS.heartbeat,
			handler: handleHeartbeat
		},
		{
			kind: "exact",
			path: PAIR_PATHS.status,
			handler: handleStatus
		},
		{
			kind: "exact",
			path: PAIR_PATHS.events,
			handler: handleEvents
		}
	];
	if (deps.lanBindStatus !== void 0) routes.push({
		kind: "exact",
		path: PAIR_PATHS.lanBind,
		handler: handleLanBind
	});
	if (deps.allowlist !== void 0) {
		routes.push({
			kind: "exact",
			path: PAIR_PATHS.lanState,
			handler: handleLanState
		});
		routes.push({
			kind: "exact",
			path: PAIR_PATHS.lanApprove,
			handler: handleLanApprove
		});
		routes.push({
			kind: "exact",
			path: PAIR_PATHS.lanRemove,
			handler: handleLanRemove
		});
		routes.push({
			kind: "exact",
			path: PAIR_PATHS.lanDismiss,
			handler: handleLanDismiss
		});
	}
	routes.push({
		kind: "exact",
		path: PAIR_PATHS.acceptPage,
		handler: handleAcceptPage
	});
	if (deps.indexDocument !== void 0) {
		routes.push({
			kind: "exact",
			path: PAIR_PATHS.appPage,
			handler: handleAppPage
		});
		routes.push({
			kind: "exact",
			path: PAIR_PATHS.appServiceWorker,
			handler: handleAppServiceWorker
		});
	}
	return routes;
}
/**
* Whether the request reached this process over TLS. The harness itself serves
* plain HTTP; a tunnel edge terminates TLS and stamps `x-forwarded-proto`
* (the same signal {@link appOrigin} trusts when it rebuilds a redirect).
*/
function isHttpsRequest(req) {
	const forwarded = req.headers["x-forwarded-proto"];
	if (typeof forwarded === "string") {
		if (forwarded.split(",")[0]?.trim().toLowerCase() === "https") return true;
	}
	return req.socket.encrypted === true;
}
/**
* The device cookie for one request. `Secure` is added only when the request
* arrived over TLS: LAN pairing runs on plain HTTP, where a Secure cookie is
* simply dropped by the browser and the phone would silently lose its session.
*/
function deviceCookie(req, cookieName, deviceId) {
	const secure = isHttpsRequest(req) ? "; Secure" : "";
	return `${cookieName}=${deviceId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${String(COOKIE_MAX_AGE_SEC)}${secure}`;
}
/** The request origin (https when a tunnel edge says so). */
function appOrigin(req) {
	const origin = `http://${req.headers.host ?? "127.0.0.1"}`;
	return isHttpsRequest(req) ? origin.replace("http://", "https://") : origin;
}
//#endregion
//#region src/remote-presence-pet.ts
/** Default restore grace: the presence sweep flips a device offline after
* ~25 s, and a phone that was briefly backgrounded should not flicker the
* pet; 2 minutes keeps the restore stable. */
const DEFAULT_RESTORE_AFTER_MS = 12e4;
const nodeTimers = {
	setTimeout,
	clearTimeout
};
/**
* Start the presence link. Returns the disposer (withdraws the state
* subscription and cancels a pending restore).
* @param deps - pairing stream + pet seam (+ test seams).
*/
function startRemotePresencePet(deps) {
	const restoreAfterMs = deps.restoreAfterMs ?? DEFAULT_RESTORE_AFTER_MS;
	const timers = deps.timers ?? nodeTimers;
	let previousOnline = false;
	let hiddenByRemote = false;
	let restoreTimer;
	let disposed = false;
	const clearRestore = () => {
		if (restoreTimer !== void 0) {
			timers.clearTimeout(restoreTimer);
			restoreTimer = void 0;
		}
	};
	const scheduleRestore = () => {
		clearRestore();
		restoreTimer = timers.setTimeout(() => {
			restoreTimer = void 0;
			restoreAfterTick();
		}, restoreAfterMs);
	};
	const restoreAfterTick = () => {
		if (disposed || !hiddenByRemote) return;
		const pet = deps.pet();
		if (pet === void 0) return;
		hiddenByRemote = false;
		pet.setVisible(true).catch(() => {});
	};
	const hideForRemote = () => {
		if (hiddenByRemote) return;
		const pet = deps.pet();
		if (pet === void 0) return;
		pet.state().then((value) => {
			if (disposed || hiddenByRemote) return;
			if (value.display?.visible !== true) return;
			hiddenByRemote = true;
			return pet.setVisible(false).catch(() => {
				hiddenByRemote = false;
			});
		}, () => {});
	};
	const handle = (snapshot) => {
		const online = snapshot.phase === "connected" && snapshot.onlineCount > 0;
		if (online && !previousOnline) {
			cancelRestoreAndClear();
			hideForRemote();
		} else if (!online && previousOnline) scheduleRestore();
		previousOnline = online;
	};
	const cancelRestoreAndClear = () => {
		clearRestore();
	};
	const unsubscribe = deps.onState(handle);
	return () => {
		disposed = true;
		unsubscribe();
		clearRestore();
	};
}
//#endregion
//#region src/posture.ts
/**
* Build the forged Host values to probe: the public base authority (host or
* host:port as written in the URL) plus every LAN base literal.
* @param publicBaseUrl - the configured public base URL (or undefined).
* @param lanAddresses - the LAN interface addresses the QR advertises.
* @param port - the local webServer port (LAN hosts are probed as host:port).
* @returns Host header values, de-duplicated.
*/
function postureTargets(publicBaseUrl, lanAddresses, port) {
	const targets = [];
	if (publicBaseUrl !== void 0) try {
		const url = new URL(publicBaseUrl);
		const authority = url.port === "" ? url.hostname : `${url.hostname}:${url.port}`;
		if (authority !== "") targets.push(authority);
	} catch {}
	for (const address of lanAddresses) targets.push(`${address}:${String(port)}`);
	return [...new Set(targets)];
}
const defaultRequest = (options, onStatus) => {
	const request = http.request(options, (response) => {
		onStatus(response.statusCode ?? 0);
	});
	request.on("error", () => {
		onStatus(0);
	});
	return request;
};
/**
* Probe one forged Host against the local `/api` fence.
* @param port - the local webServer port.
* @param hostHeader - the Host header to forge.
* @param request - transport seam.
* @param timeoutMs - give up after this long (counts as not exposed; the
* fence being unreachable is not evidence it is open).
* @returns true when the probe got past the fence.
*/
async function probeHost(port, hostHeader, request, timeoutMs) {
	return await new Promise((resolve) => {
		let settled = false;
		const finish = (exposed) => {
			if (settled) return;
			settled = true;
			clearTimeout(timer);
			handle.destroy();
			resolve(exposed);
		};
		const handle = request({
			host: "127.0.0.1",
			port,
			method: "POST",
			path: "/api/session.list",
			headers: {
				host: hostHeader,
				"content-type": "application/json"
			},
			timeout: timeoutMs
		}, (status) => {
			finish(status !== 403 && status !== 401);
		});
		const timer = setTimeout(() => {
			finish(false);
		}, timeoutMs + 1e3);
		handle.on("error", () => {
			finish(false);
		});
		handle.end("{}");
	});
}
/**
* Run one posture probe round.
* @returns the snapshot for this round.
*/
async function probePosture(options) {
	const { port, targets } = options;
	const request = options.request ?? defaultRequest;
	const timeoutMs = options.timeoutMs ?? 3e3;
	const now = options.now ?? (() => Date.now());
	const hosts = [];
	for (const target of targets) hosts.push({
		host: target,
		exposed: await probeHost(port, target, request, timeoutMs)
	});
	return {
		checkedAt: now(),
		hosts
	};
}
/**
* Reserve an advertised-target key so a second trigger with the same set
* does not overlap an in-flight round. Pair with {@link releasePostureKey}
* on failure — otherwise that key never retries.
*/
function claimPostureKey(current, key) {
	if (current === key) return {
		run: false,
		next: current
	};
	return {
		run: true,
		next: key
	};
}
/**
* Drop a failed in-flight key so the next trigger re-probes the same targets.
* A newer key that started meanwhile is left alone.
*/
function releasePostureKey(current, attempted) {
	return current === attempted ? void 0 : current;
}
//#endregion
//#region src/lan.ts
/**
* LAN address derivation for the pairing URLs. Mirrors the dsh CLI's
* boot-time sampling (apps/cli/src/app-cli-entry.ts `resolveLanTrust`): the
* pairing links may only name addresses the /api trust fence was configured
* with, so the same non-internal IPv4 derivation applies here — an external
* plugin cannot read the CLI's sampled snapshot, but the fence accepts
* exactly these literals, which is the property that matters.
*/
/**
* Non-internal IPv4 interface addresses of this machine — the IP-literal
* authorities an all-interfaces bind is reachable by on the LAN.
* @returns the addresses in interface order (possibly empty).
*/
function lanIPv4Addresses() {
	return Object.values(networkInterfaces()).flat().filter((iface) => {
		return iface !== void 0 && iface.family === "IPv4" && !iface.internal;
	}).map((iface) => iface.address);
}
//#endregion
//#region src/firewall.ts
/**
* Host firewall management for the LAN bind toggle: while LAN access is on,
* keep one inbound allow rule for the bound port; when it turns off, remove
* the rule. Windows manages the Windows Defender Firewall rule via netsh;
* Linux uses the first available manager among firewalld / ufw / iptables.
* On every other platform (macOS included) the plugin reports the firewall
* as unmanaged: the port usually needs no rule there, and managing pf or the
* application firewall is out of scope for a distributable plugin.
*
* Ported from the dsh-LAN reference implementation (MIT), adapted to this
* package's structure and test seams.
*/
/** Rule name shared by every backend so re-runs recreate the same rule. */
const FIREWALL_RULE_NAME = "remote-web-ui (auto)";
/** Production runner: spawn without a shell, capture text, 20s timeout. */
const spawnRunner = (cmd, args) => {
	const result = spawnSync(cmd, args, {
		shell: false,
		encoding: "utf8",
		windowsHide: process.platform === "win32",
		timeout: 2e4
	});
	return {
		ok: result.status === 0,
		out: result.stdout ?? "",
		err: result.stderr ?? "",
		missing: result.error !== void 0
	};
};
function netshBackend(run) {
	const show = () => {
		const result = run("netsh", [
			"advfirewall",
			"firewall",
			"show",
			"rule",
			`name=${FIREWALL_RULE_NAME}`,
			"verbose"
		]);
		return result.ok && result.out.includes("remote-web-ui (auto)");
	};
	return {
		label: "netsh",
		ruleExists: show,
		addRule: (port) => run("netsh", [
			"advfirewall",
			"firewall",
			"add",
			"rule",
			`name=${FIREWALL_RULE_NAME}`,
			"dir=in",
			"action=allow",
			"protocol=TCP",
			`localport=${String(port)}`,
			"profile=private,domain"
		]).ok,
		removeRule: () => {
			if (!show()) return true;
			return run("netsh", [
				"advfirewall",
				"firewall",
				"delete",
				"rule",
				`name=${FIREWALL_RULE_NAME}`
			]).ok;
		}
	};
}
function firewalldBackend(run) {
	return {
		label: "firewalld",
		ruleExists: (port) => run("firewall-cmd", [
			"--permanent",
			"--query-port",
			`${String(port)}/tcp`
		]).ok,
		addRule: (port) => {
			const add = run("firewall-cmd", [
				"--permanent",
				"--add-port",
				`${String(port)}/tcp`
			]);
			const reload = run("firewall-cmd", ["--reload"]);
			return add.ok && reload.ok;
		},
		removeRule: (port) => {
			const del = run("firewall-cmd", [
				"--permanent",
				"--remove-port",
				`${String(port)}/tcp`
			]);
			const reload = run("firewall-cmd", ["--reload"]);
			return del.ok && reload.ok;
		}
	};
}
function ufwBackend(run) {
	return {
		label: "ufw",
		ruleExists: (port) => {
			const result = run("ufw", ["status"]);
			return result.ok && new RegExp(`(^|\\s)${String(port)}/tcp\\s+ALLOW`, "i").test(result.out);
		},
		addRule: (port) => run("ufw", ["allow", `${String(port)}/tcp`]).ok,
		removeRule: (port) => run("ufw", [
			"delete",
			"allow",
			`${String(port)}/tcp`
		]).ok
	};
}
function iptablesBackend(run) {
	const rule = (port) => [
		"INPUT",
		"-p",
		"tcp",
		"--dport",
		String(port),
		"-j",
		"ACCEPT"
	];
	return {
		label: "iptables",
		ruleExists: (port) => run("iptables", ["-C", ...rule(port)]).ok,
		addRule: (port) => run("iptables", ["-A", ...rule(port)]).ok,
		removeRule: (port) => run("iptables", ["-D", ...rule(port)]).ok
	};
}
function toolAvailable(run, cmd) {
	try {
		return run(cmd, ["--version"]).missing !== true;
	} catch {
		return false;
	}
}
/**
* Detect the platform firewall manager. Returns undefined when the platform
* has no supported manager (macOS, unknown Linux without tools): the port
* then usually needs no rule and the UI reports "unmanaged".
*/
function detectFirewallBackend(platform, run = spawnRunner) {
	if (platform === "win32") return netshBackend(run);
	if (platform !== "linux") return void 0;
	if (toolAvailable(run, "firewall-cmd")) {
		if (run("firewall-cmd", ["--state"]).ok) return firewalldBackend(run);
	}
	if (toolAvailable(run, "ufw")) return ufwBackend(run);
	if (toolAvailable(run, "iptables")) return iptablesBackend(run);
}
let cachedBackend;
/** Cached detection for the running platform (per process). */
function firewallBackend() {
	const platform = process.platform;
	if (cachedBackend === void 0 || cachedBackend.platform !== platform) cachedBackend = {
		platform,
		backend: detectFirewallBackend(platform)
	};
	return cachedBackend.backend;
}
/**
* Delete-and-add: recreating the rule is idempotent and locale-proof (netsh
* output is localized, so parsing the live rule's port is fragile; the Linux
* backends follow the same recreate pattern).
*/
function ensureFirewallRule(port) {
	invalidateFirewallSummary();
	const backend = firewallBackend();
	if (backend === void 0) return true;
	backend.removeRule(port);
	return backend.addRule(port);
}
function removeFirewallRule(port) {
	invalidateFirewallSummary();
	const backend = firewallBackend();
	if (backend === void 0) return true;
	return backend.removeRule(port);
}
/**
* Human-readable firewall state for the status endpoint. A missing backend
* means the platform has nothing to manage; detection stays at the call site
* so an explicit undefined cannot silently re-probe the real OS mid-test.
*/
function computeFirewallSummary(port, lanEnabled, backend) {
	if (backend === void 0) return {
		ok: true,
		managed: false
	};
	return {
		ok: lanEnabled ? backend.ruleExists(port) : !backend.ruleExists(port),
		managed: true,
		note: backend.label
	};
}
let summaryCache;
/** Forget the cached summary (rule mutations call this). */
function invalidateFirewallSummary() {
	summaryCache = void 0;
}
/**
* The settings card polls this every ten seconds; the probes are blocking
* spawnSync subprocesses on managed platforms, so short-TTL memoization
* keeps one poll from freezing the host event loop per request.
*/
function firewallSummary(port, lanEnabled) {
	const key = `${String(port)}|${lanEnabled ? "1" : "0"}`;
	const now = Date.now();
	if (summaryCache !== void 0 && summaryCache.key === key && now - summaryCache.at < 3e4) return summaryCache.value;
	const value = computeFirewallSummary(port, lanEnabled, firewallBackend());
	summaryCache = {
		key,
		at: now,
		value
	};
	return value;
}
//#endregion
//#region src/lan-bind.ts
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
/** Profile names safe to interpolate into the patch path: one path segment, no traversal. */
const PROFILE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const LAN_BIND_BLOCK_BEGIN = "# --- remote-web-ui lan-bind block (managed - do not edit) ---";
const LAN_BIND_BLOCK_END = "# --- end remote-web-ui lan-bind block ---";
/**
* The absolute path of the profile patch file this toggle manages. The value
* is config-controlled (and the runtime/environment fallbacks bypass schema
* validation entirely), so the path is guarded twice: the profile must be a
* single safe path segment, and the resolved file must stay under the
* profiles directory.
*/
function profilePatchFile(profile, home = dshHome()) {
	if (!PROFILE_PATTERN.test(profile)) throw new Error(`remote-web-ui: unsafe lan-bind profile ${JSON.stringify(profile)}`);
	const file = resolve(join(home, "profiles", profile, "cordis.patch.yml"));
	const root = resolve(join(home, "profiles")) + sep;
	if (!file.startsWith(root)) throw new Error(`remote-web-ui: lan-bind profile ${JSON.stringify(profile)} escapes the profiles directory`);
	return file;
}
function readPatchContent(file) {
	if (!existsSync(file)) return "";
	return readFileSync(file, "utf8");
}
/**
* Split a block-sequence region into its top-level items. Only a column-0 `-`
* starts an item: that is the shape every writer of this file produces - the
* managed block itself and the YAML document API's block-style re-emission.
* @param region - text between two line boundaries.
* @returns the items in source order; text outside them is not returned.
*/
function blockItems(region) {
	const items = [];
	let start = -1;
	let offset = 0;
	for (const line of region.split("\n")) {
		if (line.startsWith("- ") || line === "-") {
			if (start !== -1) items.push({
				start,
				end: offset,
				text: region.slice(start, offset)
			});
			start = offset;
		}
		offset += line.length + 1;
	}
	if (start !== -1) items.push({
		start,
		end: region.length,
		text: region.slice(start)
	});
	return items;
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
function isManagedWebserverItem(item) {
	return /^- id:\s*['"]?webserver['"]?[ \t]*(?:\r?\n|$)/.test(item);
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
function managedRegion(content, begin, end) {
	const newlineAfterBegin = content.indexOf("\n", begin);
	const innerStart = newlineAfterBegin === -1 ? content.length : newlineAfterBegin + 1;
	const endLineStart = end === -1 ? content.length : content.lastIndexOf("\n", end - 1) + 1;
	return content.slice(innerStart, Math.max(innerStart, endLineStart));
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
function stripManagedBlock(content) {
	let text = content;
	for (;;) {
		const begin = text.indexOf(LAN_BIND_BLOCK_BEGIN);
		if (begin === -1) return text;
		const end = text.indexOf(LAN_BIND_BLOCK_END, begin);
		const blockStart = text.lastIndexOf("\n", begin - 1) + 1;
		const newlineAfterEnd = end === -1 ? -1 : text.indexOf("\n", end);
		const resumeAt = end === -1 ? text.length : newlineAfterEnd === -1 ? text.length : newlineAfterEnd + 1;
		const region = managedRegion(text, begin, end);
		let kept = "";
		let cursor = 0;
		for (const item of blockItems(region)) {
			if (!isManagedWebserverItem(item.text)) continue;
			kept += region.slice(cursor, item.start);
			cursor = item.end;
		}
		kept += region.slice(cursor);
		text = text.slice(0, blockStart) + kept + text.slice(resumeAt);
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
function isFlowRoot(base) {
	return base.trimStart().startsWith("[");
}
/** Force one parsed collection (and its item collections) into block style. */
function toBlockStyle(node) {
	if (typeof node !== "object" || node === null) return;
	const collection = node;
	if (!Array.isArray(collection.items) && typeof collection.flow !== "boolean") return;
	collection.flow = false;
	for (const item of collection.items ?? []) toBlockStyle(item);
}
/**
* Produce the file text for one bind state. A flow-style base is re-emitted as
* a block sequence before the managed block is appended, so the file stays
* exactly one valid YAML document; concatenating the block onto a non-empty
* flow array produced two root documents and the profile failed to parse at
* `dsh web` startup (#1675). A base that cannot be parsed is refused with the
* file path rather than written half-valid.
*/
function mergePatchContent(base, block, file) {
	if (base.length === 0) return block;
	if (!isFlowRoot(base)) return `${base}\n\n${block}`;
	const doc = parseDocument(base, { uniqueKeys: false });
	if (doc.errors.length > 0 || doc.contents === null) throw new Error(`remote-web-ui: cannot update the lan-bind block in ${file}: ${doc.errors[0]?.message ?? "the patch file is not a YAML document"}`);
	if (!("items" in doc.contents)) throw new Error(`remote-web-ui: cannot update the lan-bind block in ${file}: the patch file is not a top-level patch list`);
	toBlockStyle(doc.contents);
	return `${doc.toString({ lineWidth: 0 }).trimEnd()}\n\n${block}`;
}
/**
* Render the managed block for one bind state. The values are static: the
* user patch layer has no reliable lazy service evaluation, and the plugin
* re-asserts the block at every boot so CLI flags (--port, --host) win by
* rewriting it before the next start.
*/
function managedBlock(host, port) {
	return [
		LAN_BIND_BLOCK_BEGIN,
		"- id: webserver",
		"  name: '@deepseek-ai/dsh-host-webserver'",
		"  config:",
		`    host: '${host}'`,
		`    port: ${String(port)}`,
		"    compression: gzip",
		"    compressionLevel: 1",
		"    compressionThresholdBytes: 1024",
		LAN_BIND_BLOCK_END,
		""
	].join("\n");
}
/**
* Parse the block's pinned bind out of patch content. A block whose values
* were hand-edited reports the literals as-is so the card can surface them
* instead of silently claiming one of the two known states.
*/
function managedBindOf(content) {
	const begin = content.indexOf(LAN_BIND_BLOCK_BEGIN);
	if (begin === -1) return void 0;
	const region = managedRegion(content, begin, content.indexOf(LAN_BIND_BLOCK_END, begin));
	const items = blockItems(region).filter((item) => isManagedWebserverItem(item.text));
	const scope = items.length > 0 ? items.map((item) => item.text).join("") : region;
	const hostMatch = /host:\s*'([^']+)'/.exec(scope);
	const portMatch = /port:\s*(\d+)/.exec(scope);
	return {
		host: hostMatch?.[1] ?? "",
		port: portMatch !== null ? Number(portMatch[1]) : void 0
	};
}
/** Full file-level state for the settings card and the boot re-assert. */
function lanBindState(profile, home = dshHome()) {
	const state = managedBindOf(readPatchContent(profilePatchFile(profile, home)));
	if (state === void 0) return { blockPresent: false };
	return {
		blockPresent: true,
		host: state.host,
		port: state.port
	};
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
function writeLanBind(host, port, profile, home = dshHome()) {
	const file = profilePatchFile(profile, home);
	const content = mergePatchContent(stripManagedBlock(readPatchContent(file)).trimEnd().replace(/\[\s*\]\s*$/, "").trimEnd(), managedBlock(host, port), file);
	const mode = existsSync(file) ? statSync(file).mode & 511 : 384;
	mkdirSync(dirname(file), { recursive: true });
	const temp = `${file}.remote-web-ui-tmp-${process.pid.toString(36)}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
	writeFileSync(temp, content, { mode });
	renameSync(temp, file);
}
//#endregion
//#region src/tunnel-plan.ts
/**
* Pure planner for the settings-sync tunnel branch: given the resolved
* settings slice, decide which tunnel mode runs and with what target. Kept
* free of cordis types so the precedence matrix is unit-testable without a
* host context.
*/
/** Whether a configured public base is a parseable http(s) URL with a host. */
function isHttpUrl(value) {
	try {
		const url = new URL(value);
		return (url.protocol === "http:" || url.protocol === "https:") && url.hostname !== "";
	} catch {
		return false;
	}
}
/**
* Decide the tunnel mode and target from one resolved settings value.
* Precedence: the quick tunnel wins when `autoTunnel` is on (anything else
* configured is reported as ignored); the named tunnel runs only with a
* token AND a valid public hostname (the token does not carry the hostname,
* so the QR base and the fence trust would have no source without it);
* otherwise no tunnel and the manual public base applies.
* @param value - the resolved settings slice that drives the tunnel.
* @param port - the local webServer port the tunnel forwards to.
*/
function tunnelPlanOf(value, port) {
	if (value.autoTunnel === true) {
		const ignored = [];
		if (value.tunnelToken !== void 0 && value.tunnelToken !== "") ignored.push("tunnelToken");
		if (value.publicBaseUrl !== void 0 && value.publicBaseUrl !== "") ignored.push("publicBaseUrl");
		return {
			mode: "quick",
			targetUrl: `http://127.0.0.1:${String(port)}`,
			ignored
		};
	}
	if (value.tunnelToken !== void 0 && value.tunnelToken !== "") {
		if (value.publicBaseUrl !== void 0 && isHttpUrl(value.publicBaseUrl)) return {
			mode: "named",
			token: value.tunnelToken,
			publicUrl: value.publicBaseUrl
		};
		return { mode: "off" };
	}
	return { mode: "off" };
}
const RELAY_UNREGISTER_URL = "https://dsh-market.com/api/relay/unregister";
/**
* The public origin template: one stable single-label subdomain per
* registration id. Single label on purpose — Universal SSL covers exactly
* one subdomain level, so a two-level hostname would get no certificate.
*/
const RELAY_BASE_SUFFIX = ".dsh-market.com";
const RELAY_ID_RE = /^[a-z0-9]{16}$/;
const RELAY_SECRET_RE = /^[A-Za-z0-9_-]{43}$/;
/** Registry storage layout: one file per profile under the relay directory. */
function relayIdentityFile(profile, home = dshHome()) {
	if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(profile)) throw new Error(`relay registry: profile ${JSON.stringify(profile)} is not a safe path segment`);
	return join(home, "remote-web-ui-registry", `${profile}.json`);
}
/** Generate one identity pair (id: 8-byte hex slug; secret: 32-byte base64url). */
function generateRelayIdentity(random = randomBytes) {
	return {
		id: random(8).toString("hex"),
		secret: random(32).toString("base64url"),
		fresh: true
	};
}
/**
* Load (or lazily mint) the per-profile relay identity. The file is written
* owner-only on first mint; a corrupt file is reminted (the phone then
* re-pairs once — the same cost as losing the devices file).
*/
function loadRelayIdentity(profile, home = dshHome(), random = randomBytes) {
	const file = relayIdentityFile(profile, home);
	try {
		if (existsSync(file)) {
			const parsed = JSON.parse(readFileSync(file, "utf8"));
			if (typeof parsed.id === "string" && RELAY_ID_RE.test(parsed.id) && typeof parsed.secret === "string" && RELAY_SECRET_RE.test(parsed.secret)) return {
				id: parsed.id,
				secret: parsed.secret
			};
			console.warn(`relay registry: ${file} is malformed — reminting the identity (paired devices must scan the QR once more)`);
		}
	} catch (error) {
		console.warn(`relay registry: could not read ${file} (${error instanceof Error ? error.message : String(error)}) — reminting`);
	}
	const identity = generateRelayIdentity(random);
	mkdirSync(dirname(file), { recursive: true });
	writeFileSync(file, JSON.stringify({
		id: identity.id,
		secret: identity.secret
	}, null, 2) + "\n", { mode: 384 });
	return identity;
}
/** Build the registration request body for one identity + tunnel target. */
function registrationBody(identity, target) {
	return JSON.stringify({
		id: identity.id,
		secret: identity.secret,
		new_secret: identity.fresh === true ? identity.secret : void 0,
		target
	});
}
/** Best-effort removal of the mapping (used on disable; errors are swallowed). */
async function unregisterRelay(identity, endpoint = RELAY_UNREGISTER_URL, fetchFn = fetch) {
	await fetchFn(endpoint, {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({
			id: identity.id,
			secret: identity.secret
		})
	});
}
/**
* The stable relay base for one identity — the origin the QR and the phone
* bookmark use while (or after) the registration is accepted.
*/
function relayBaseOf(identity) {
	return `https://${identity.id}${RELAY_BASE_SUFFIX}`;
}
/**
* Registration loop with capped exponential backoff. Re-registration happens
* on every tunnel start (the quick URL can change after a crash-restart);
* failures retry with backoff and surface the last error to the card.
*/
var RelayRegistrar = class {
	identity;
	setState;
	options;
	timer;
	attempts = 0;
	lastError;
	disposed = false;
	constructor(identity, setState, options = {}) {
		this.identity = identity;
		this.setState = setState;
		this.options = options;
	}
	/** The stable relay base for the QR while registered. */
	get baseUrl() {
		return relayBaseOf(this.identity);
	}
	/** The last registration failure detail (undefined while healthy). */
	get error() {
		return this.lastError;
	}
	/** Push one tunnel target; resolves the stable base once accepted. */
	async announce(target) {
		if (this.disposed) return void 0;
		if (this.timer !== void 0) {
			clearTimeout(this.timer);
			this.timer = void 0;
		}
		this.setState({ state: "registering" });
		try {
			const response = await (this.options.fetchFn ?? fetch)(this.options.registerUrl ?? "https://dsh-market.com/api/relay/register", {
				method: "PUT",
				headers: { "content-type": "application/json" },
				body: registrationBody(this.identity, target)
			});
			if (!response.ok) {
				const detail = await response.json().catch(() => void 0);
				const error = detail && typeof detail.error === "string" ? detail.error : `HTTP ${String(response.status)}`;
				throw new Error(error);
			}
			this.identity.fresh = false;
			this.attempts = 0;
			this.lastError = void 0;
			this.setState({
				state: "running",
				url: this.baseUrl
			});
			return this.baseUrl;
		} catch (error) {
			this.lastError = error instanceof Error ? error.message : String(error);
			if (this.lastError === "invalid-params" && this.identity.fresh !== true) this.identity.fresh = true;
			this.setState({
				state: "failed",
				error: this.lastError
			});
			this.scheduleRetry(target);
			return;
		}
	}
	/** Best-effort removal of the registry row (the relay toggle turned off). */
	async unregister() {
		await unregisterRelay(this.identity, this.options.unregisterUrl, this.options.fetchFn);
	}
	scheduleRetry(target) {
		if (this.disposed) return;
		const base = this.options.baseDelayMs ?? 5e3;
		const max = this.options.maxDelayMs ?? 6e4;
		const delay = Math.min(base * 2 ** this.attempts, max);
		this.attempts += 1;
		const timerFn = this.options.timerFn ?? ((fn, ms) => {
			const timer = setTimeout(fn, ms);
			timer.unref?.();
			return timer;
		});
		this.timer = timerFn(() => {
			this.timer = void 0;
			this.announce(target);
		}, delay);
	}
	/** Stop retrying and clear the card state (tunnel stopped or disabled). */
	dispose() {
		this.disposed = true;
		if (this.timer !== void 0) {
			clearTimeout(this.timer);
			this.timer = void 0;
		}
		this.setState({ state: "off" });
	}
};
//#endregion
//#region src/lan-bind-plan.ts
/**
* The bind host the managed block should pin: an explicit CLI --host wins,
* otherwise the toggle decides. CLI hosts outside the two managed literals
* (a pinned specific IP) are not a state the toggle manages — the toggle
* decides, and the card surfaces the divergence honestly.
* @param lanBind - the toggle value.
* @param startupHost - the CLI-provided bind host, when given.
* @returns the desired bind host literal.
*/
function desiredBindHost(lanBind, startupHost) {
	if (startupHost === "0.0.0.0" || startupHost === "127.0.0.1") return startupHost;
	return lanBind ? "0.0.0.0" : "127.0.0.1";
}
/**
* The port the managed block should pin: the CLI port when given, else the
* currently bound port. Undefined when neither is readable yet (the caller
* skips the write and reports why).
* @param startupPort - the CLI-provided port, when given.
* @param livePort - the currently bound port, when finite.
*/
function desiredBindPort(startupPort, livePort) {
	if (typeof startupPort === "number" && Number.isFinite(startupPort)) return startupPort;
	return typeof livePort === "number" && Number.isFinite(livePort) ? livePort : void 0;
}
/**
* Whether the running bind has not caught up with what the toggle (plus a
* possibly overriding CLI host) will pin. Compared against the effective
* desired host — not the raw toggle — so a flag-managed bind is not reported
* as pending forever.
* @param lanBind - the toggle value (undefined = untouched, never pending).
* @param desiredHost - the effective desired host, or undefined when untouched.
* @param liveHost - the currently bound host.
*/
function pendingRestartOf(lanBind, desiredHost, liveHost) {
	if (lanBind === void 0 || desiredHost === void 0) return false;
	return liveHost !== desiredHost;
}
/**
* The profile whose `cordis.patch.yml` the LAN bind toggle manages. An
* explicit `profile` config wins; otherwise the launched profile the Host
* publishes is authoritative, because the DSH Desktop client boots the
* `desktop` profile without exporting `DSH_PROFILE` — an environment-only
* fallback edited `profiles/web` there, so the toggle looked applied while
* the running host never followed the block.
* @param configured - the explicit `profile` plugin config, when set.
* @param launched - the launched profile name the Host published, when available.
* @param env - the DSH_PROFILE environment value, when set.
*/
function resolveManagedProfile(configured, launched, env) {
	return configured ?? launched ?? env ?? "web";
}
/**
* Whether the firewall rule must be (re)applied: only when the toggle or the
* bound port moved since the last application. Keeps unrelated settings
* saves from spawning netsh/firewall-cmd delete+add churn.
* @param previous - the state applied earlier by this process, if any.
* @param next - the state the settings now ask for, if derivable.
*/
function firewallActionNeeded(previous, next) {
	if (next === void 0) return false;
	if (previous === void 0) return true;
	return previous.enabled !== next.enabled || previous.port !== next.port;
}
//#endregion
//#region src/inner-auth.ts
/** The harness browser-auth cookie name prefix (see dsh-client-connection). */
const BROWSER_AUTH_COOKIE_PREFIX = "dsh-auth-";
/**
* Build the inner-auth handle.
* @param launchUrl - the launch-token URL for the inner loopback authority
*   (the connection service's authenticatedUrl of `http://127.0.0.1:<port>/`),
*   or undefined when the connection service or port is unavailable.
* @param fetchImpl - injectable fetch (tests).
*/
function createInnerAuth(launchUrl, fetchImpl = fetch) {
	let cached;
	let inflight;
	const redeem = async () => {
		const url = launchUrl();
		if (url === void 0) return void 0;
		try {
			const raw = (await fetchImpl(url, { redirect: "manual" })).headers.get("set-cookie");
			if (raw === null) return void 0;
			const entry = raw.split(",").map((part) => part.trim()).find((part) => part.startsWith(BROWSER_AUTH_COOKIE_PREFIX));
			if (entry === void 0) return void 0;
			const pair = entry.split(";")[0]?.trim();
			return pair !== void 0 && pair.includes("=") ? pair : void 0;
		} catch {
			return;
		}
	};
	return {
		ready() {
			if (cached !== void 0) return Promise.resolve(cached);
			inflight ??= redeem().then((value) => {
				if (value !== void 0) cached = value;
				inflight = void 0;
				return value;
			}, () => {
				inflight = void 0;
			});
			return inflight;
		},
		invalidate() {
			cached = void 0;
		}
	};
}
//#endregion
//#region src/tunnel.ts
/**
* Auto-tunnel manager: spawns a Cloudflare tunnel through the `cloudflared`
* npm package — its postinstall downloads the platform binary and the
* readiness policy below validates it and re-fetches when it cannot run (the
* desktop payload stages one tree for every shipped OS/arch), so no
* user-side tooling is involved — surfaces the public URL, and restarts the
* process after unexpected exits with exponential backoff. Two modes: the
* accountless quick tunnel (`https://xxx.trycloudflare.com`, hostname minted
* per start) and an account named tunnel (`cloudflared tunnel run --token`,
* fixed public hostname — the mode that lets a paired phone keep its
* bookmark and pairing cookie across restarts).
*
* The cloudflared package's Tunnel is a thin spawn wrapper; this manager
* owns the lifecycle policy (binary readiness, URL timeout, restart
* backoff, and the public-URL readiness watchdog) around it. All seams — the
* tunnel factory, binary readiness, the URL probe, timers — are injectable
* so the whole lifecycle is unit-testable without a real binary or network.
*
* 'running' is not a terminal state: the connector can lose its edge
* registration while the process keeps living, which leaves a hostname that
* no longer resolves. The watchdog below probes the public URL of a running
* tunnel and reuses the crash-restart path when it stops answering, so the
* relay is re-registered against a freshly minted URL instead of proxying a
* dead one (issue #1723).
*/
/** Compare two targets for the start idempotence check. */
function sameTarget(left, right) {
	if (left === void 0) return false;
	return JSON.stringify(left) === JSON.stringify(right);
}
/**
* Wrap a named-tunnel process so it fits the quick-tunnel handle shape: the
* fixed public URL is reported through the same `url` event once the first
* edge connection registers (cloudflared fires `connected` per connection,
* so only the first is taken), and exit/error pass through. The manager's
* URL timeout, crash-restart backoff, and stop semantics then stay fully
* mode-agnostic.
* @param inner - the running named-tunnel process.
* @param publicUrl - the fixed public hostname ingress maps to this server.
* @returns a handle emitting `url` once the tunnel is reachable.
*/
function namedTunnelHandle(inner, publicUrl) {
	const handle = new EventEmitter();
	let registered = false;
	const onConnected = () => {
		if (registered) return;
		registered = true;
		handle.emit("url", publicUrl);
	};
	const onExit = (code, signal) => {
		handle.emit("exit", code, signal);
	};
	const onError = (value) => {
		handle.emit("error", value);
	};
	inner.on("connected", onConnected);
	inner.on("exit", onExit);
	inner.on("error", onError);
	handle.stop = () => {
		inner.off("connected", onConnected);
		inner.off("exit", onExit);
		inner.off("error", onError);
		return inner.stop();
	};
	return handle;
}
/**
* Probe one public tunnel URL from the host. Resolves true when the URL is
* served (any HTTP answer below 500 — a harness without credentials answers
* 401/403, which is a healthy round trip), false for a DNS failure, a refused
* connection, a timeout, or a Cloudflare 5xx (530 "Origin DNS error" / 1033)
* — the shapes a tunnel that lost its edge registration produces.
*
* The probe must never reject: the watchdog reads a rejection as a dead
* tunnel and restarts on it, so a local programming error would otherwise
* recycle working tunnels forever.
* @param url - the tunnel's public URL.
* @param timeoutMs - how long one probe may take.
* @returns whether the URL answered as a live origin.
*/
async function probeTunnelUrl(url, timeoutMs) {
	const controller = new AbortController();
	const timer = setTimeout(() => {
		controller.abort();
	}, timeoutMs);
	try {
		const response = await fetch(url, {
			method: "GET",
			redirect: "manual",
			cache: "no-store",
			signal: controller.signal
		});
		await response.body?.cancel().catch(() => void 0);
		return response.status < 500;
	} catch {
		return false;
	} finally {
		clearTimeout(timer);
	}
}
/** Default probe: the real network round trip. */
async function defaultProbe(url, timeoutMs) {
	return await probeTunnelUrl(url, timeoutMs);
}
/** Time box for the `--version` probe that validates a staged binary. */
const BINARY_PROBE_TIMEOUT_MS = 1e4;
/**
* Probe whether the binary at `path` actually executes on this machine. The
* desktop payload stages one dependency tree for every shipped OS/arch, so a
* binary can exist with the wrong architecture (the arm64 darwin
* `bin/cloudflared` on an x64 mac); existence alone must not skip the
* reinstall.
*/
function binaryRuns(executable) {
	return new Promise((resolvePromise) => {
		const child = spawn(executable, ["--version"], { stdio: "ignore" });
		const timer = setTimeout(() => {
			child.kill("SIGKILL");
			resolvePromise(false);
		}, BINARY_PROBE_TIMEOUT_MS);
		child.once("error", () => {
			clearTimeout(timer);
			resolvePromise(false);
		});
		child.once("exit", (code) => {
			clearTimeout(timer);
			resolvePromise(code === 0);
		});
	});
}
/**
* Build the default readiness policy over a binary path: skip when the
* binary has already proven runnable in this process, validate an existing
* file before trusting it (a stale or wrong-arch binary must not disable
* the reinstall), and re-fetch the current platform binary otherwise.
*/
function createBinaryReadiness(executable, seams = {}) {
	const exists = seams.exists ?? existsSync;
	const runs = seams.runs ?? binaryRuns;
	const installBinary = seams.install ?? install;
	const validated = /* @__PURE__ */ new Set();
	let installs = 0;
	let lastFailure;
	return async () => {
		if (validated.has(executable)) return;
		if (installs >= 3 && lastFailure !== void 0) throw lastFailure;
		if (exists(executable) && await runs(executable)) {
			validated.add(executable);
			return;
		}
		installs += 1;
		try {
			await installBinary(executable);
			if (!await runs(executable)) throw new Error(`the cloudflared binary at ${executable} still does not run after the reinstall`);
		} catch (error) {
			lastFailure = error instanceof Error ? error : new Error(String(error));
			throw lastFailure;
		}
		validated.add(executable);
	};
}
/** The readiness policy the manager uses by default: the package's real binary path. */
const defaultBinaryReadiness = createBinaryReadiness(bin);
/** Default binary readiness: keep a working platform binary at `bin`. */
async function defaultEnsureBinary() {
	await defaultBinaryReadiness();
}
/** The flags every tunnel mode shares (see the quick factory comment). */
const SHARED_TUNNEL_FLAGS = {
	"--no-autoupdate": true,
	"--protocol": "http2"
};
/**
* Spawn flags for one quick target. `originHostHeader` stamps the Host the
* local webserver sees: the plugin's phone-facing fence trusts the configured
* public host (the stable relay origin, Host-bound) and the harness
* browser-auth binds cookies to the Host authority, while the Workers relay
* cannot control the origin-side Host at all (fetch forces it to the URL
* authority) — so the connector must restamp it with the stable origin.
*/
function quickTunnelFlags(originHostHeader) {
	return originHostHeader === void 0 ? { ...SHARED_TUNNEL_FLAGS } : {
		...SHARED_TUNNEL_FLAGS,
		"--http-host-header": originHostHeader
	};
}
/**
* Command-line arguments for a named tunnel. The account token is deliberately
* NOT part of the argv: `--token <t>` would expose an account credential to any
* local user through ps/proc for the whole tunnel lifetime, while the flag's own
* environment variable (TUNNEL_TOKEN, see cloudflared's tunnel run flags) is not
* readable that way. Note: `--no-autoupdate` and `--protocol` are flags for the
* `tunnel` command and must appear BEFORE the `run` subcommand. Putting them
* after `run` causes cloudflared to exit immediately with "flag provided but not
* defined: -no-autoupdate" (issues #1432, #1433).
*/
function namedTunnelArgs() {
	return [
		"tunnel",
		"--no-autoupdate",
		"--protocol",
		"http2",
		"run"
	];
}
/**
* Run one spawn call with TUNNEL_TOKEN set, restoring the previous value
* afterwards. The cloudflared package's Tunnel spawns with the inherited
* environment inside its constructor, so the variable only has to exist for
* that call; the child keeps its own copy of the environment.
* @param token - the named-tunnel token.
* @param spawnTunnel - the call that creates the child process.
* @returns whatever the spawn call returns.
*/
function withTunnelTokenEnv(token, spawnTunnel) {
	const previous = process.env.TUNNEL_TOKEN;
	process.env.TUNNEL_TOKEN = token;
	try {
		return spawnTunnel();
	} finally {
		if (previous === void 0) delete process.env.TUNNEL_TOKEN;
		else process.env.TUNNEL_TOKEN = previous;
	}
}
/** Spawn one named tunnel without putting its token in the child's argv. */
function spawnNamedTunnel(token) {
	return withTunnelTokenEnv(token, () => new Tunnel(namedTunnelArgs()));
}
/** Default factory: the cloudflared package's quick and named tunnels. */
function defaultFactory(target) {
	if (target.kind === "quick") return Tunnel.quick(target.targetUrl, quickTunnelFlags(target.originHostHeader));
	return namedTunnelHandle(spawnNamedTunnel(target.token), target.publicUrl);
}
/** Node timers. */
const nodeTimer = {
	setTimeout,
	clearTimeout
};
/**
* Own the lifecycle of one auto-tunnel: start/stop, URL surfacing, and
* crash-restart backoff.
*/
var TunnelManager = class {
	factory;
	ensureBinary;
	urlTimeoutMs;
	restartBaseMs;
	restartMaxMs;
	timer;
	probe;
	healthCheckIntervalMs;
	healthCheckFailures;
	probeTimeoutMs;
	phase = "stopped";
	url;
	error;
	target;
	handle;
	urlTimer;
	restartTimer;
	healthTimer;
	healthFailures = 0;
	attempts = 0;
	generation = 0;
	stopping = false;
	urlListeners = /* @__PURE__ */ new Set();
	phaseListeners = /* @__PURE__ */ new Set();
	/**
	* @param options - seams; defaults spawn the real quick tunnel.
	*/
	constructor(options = {}) {
		this.factory = options.factory ?? defaultFactory;
		this.ensureBinary = options.ensureBinary ?? defaultEnsureBinary;
		this.urlTimeoutMs = options.urlTimeoutMs ?? 3e4;
		this.restartBaseMs = options.restartBaseMs ?? 5e3;
		this.restartMaxMs = options.restartMaxMs ?? 6e4;
		this.timer = options.timer ?? nodeTimer;
		this.probe = options.probe ?? defaultProbe;
		this.healthCheckIntervalMs = options.healthCheckIntervalMs ?? 6e4;
		this.healthCheckFailures = options.healthCheckFailures ?? 2;
		this.probeTimeoutMs = options.probeTimeoutMs ?? 1e4;
	}
	/** The current status frame. */
	get info() {
		return {
			phase: this.phase,
			...this.url !== void 0 ? { url: this.url } : {},
			...this.error !== void 0 ? { error: this.error } : {}
		};
	}
	/**
	* Start (or keep) a tunnel toward `target`. Restarting with a different
	* target tears the old tunnel down first; restarting with the same target
	* while running is a no-op. A string is the quick mode's local target URL.
	*
	* In quick mode the URL surfaces when cloudflared mints the ephemeral
	* trycloudflare hostname; in named mode the fixed `publicUrl` surfaces
	* once the first edge connection registers (see {@link namedTunnelHandle}).
	* @param target - what to run (a string means quick toward that local URL).
	*/
	start(target) {
		const resolved = typeof target === "string" ? {
			kind: "quick",
			targetUrl: target
		} : target;
		if (sameTarget(this.target, resolved) && (this.phase === "starting" || this.phase === "running")) return;
		this.teardown();
		this.stopping = false;
		this.target = resolved;
		this.attempts = 0;
		this.generation += 1;
		this.attempt();
	}
	/** Stop the tunnel for good: no restarts, no state. */
	stop() {
		this.teardown();
		this.stopping = false;
		this.target = void 0;
		this.setPhase("stopped");
	}
	/** Alias of {@link stop} for plugin-effect disposal. */
	dispose() {
		this.stop();
	}
	/** Subscribe to minted tunnel URLs (fire-and-forget duplicates dropped). */
	onUrl(listener) {
		this.urlListeners.add(listener);
		return () => {
			this.urlListeners.delete(listener);
		};
	}
	/** Subscribe to every phase change. */
	onPhase(listener) {
		this.phaseListeners.add(listener);
		return () => {
			this.phaseListeners.delete(listener);
		};
	}
	attempt() {
		if (this.stopping || this.target === void 0) return;
		const gen = this.generation;
		this.setPhase("starting");
		this.handle = void 0;
		this.url = void 0;
		this.error = void 0;
		this.ensureBinary().then(() => {
			if (this.stopping || this.target === void 0 || gen !== this.generation) return;
			const handle = this.factory(this.target);
			this.handle = handle;
			this.urlTimer = this.timer.setTimeout(() => {
				this.fail("timed out waiting for the tunnel URL");
			}, this.urlTimeoutMs);
			handle.on("url", (value) => {
				if (this.handle !== handle) return;
				this.handleUrl(value);
			});
			handle.on("exit", () => {
				if (this.handle !== handle) return;
				this.handleExit();
			});
			handle.on("error", (value) => {
				if (this.handle !== handle || this.phase !== "starting") return;
				this.error = value instanceof Error ? value.message : String(value);
			});
		}).catch((value) => {
			if (this.stopping || this.target === void 0 || gen !== this.generation) return;
			const message = value instanceof Error ? value.message : String(value);
			this.fail(`could not obtain the cloudflared binary: ${message}`);
		});
	}
	handleUrl(value) {
		if (this.urlTimer !== void 0) {
			this.timer.clearTimeout(this.urlTimer);
			this.urlTimer = void 0;
		}
		this.url = value;
		this.error = void 0;
		this.attempts = 0;
		this.setPhase("running");
		this.startHealthWatch(value);
		for (const listener of this.urlListeners) try {
			listener(value);
		} catch {}
	}
	/**
	* Watch the readiness of a running tunnel. cloudflared can keep its process
	* (and its metrics port) alive while every edge connection is gone, leaving
	* a minted hostname that no longer resolves: the manager used to report
	* 'running' forever and the relay kept forwarding to that dead address, so
	* the phone hit Cloudflare 1016 instead of the relay's offline page
	* (issue #1723). A bounded number of consecutive probe failures ends the
	* attempt through the ordinary fail/backoff path, which mints a new URL and
	* re-announces the relay.
	*/
	startHealthWatch(url) {
		this.stopHealthWatch();
		if (this.stopping || this.phase !== "running") return;
		if (this.healthCheckIntervalMs <= 0 || this.healthCheckFailures <= 0) return;
		this.healthFailures = 0;
		const schedule = () => {
			this.healthTimer = this.timer.setTimeout(() => {
				this.healthTimer = void 0;
				this.healthCheck(url);
			}, this.healthCheckIntervalMs);
		};
		schedule();
	}
	/** One probe round of the running tunnel's public URL. */
	async healthCheck(url) {
		if (this.stopping || this.phase !== "running" || this.url !== url) return;
		let alive = false;
		try {
			alive = await this.probe(url, this.probeTimeoutMs);
		} catch {
			alive = false;
		}
		if (this.stopping || this.phase !== "running" || this.url !== url) return;
		if (alive) this.healthFailures = 0;
		else {
			this.healthFailures += 1;
			if (this.healthFailures >= this.healthCheckFailures) {
				this.fail("the tunnel stopped answering on its public URL");
				return;
			}
		}
		this.healthTimer = this.timer.setTimeout(() => {
			this.healthTimer = void 0;
			this.healthCheck(url);
		}, this.healthCheckIntervalMs);
	}
	/** Cancel the readiness watchdog (teardown, restart, stop). */
	stopHealthWatch() {
		if (this.healthTimer !== void 0) {
			this.timer.clearTimeout(this.healthTimer);
			this.healthTimer = void 0;
		}
		this.healthFailures = 0;
	}
	handleExit() {
		if (this.stopping) return;
		this.fail("the tunnel process exited unexpectedly");
	}
	fail(message) {
		if (this.stopping) return;
		this.url = void 0;
		this.error = message;
		if (this.handle !== void 0) {
			this.handle.stop();
			this.handle = void 0;
		}
		if (this.urlTimer !== void 0) {
			this.timer.clearTimeout(this.urlTimer);
			this.urlTimer = void 0;
		}
		this.stopHealthWatch();
		this.setPhase("failed");
		this.attempts += 1;
		const delay = Math.min(this.restartBaseMs * 2 ** (this.attempts - 1), this.restartMaxMs);
		this.restartTimer = this.timer.setTimeout(() => {
			this.restartTimer = void 0;
			this.attempt();
		}, delay);
	}
	/** Stop the current process and cancel every pending timer (no phase change). */
	teardown() {
		this.stopping = true;
		this.stopHealthWatch();
		if (this.urlTimer !== void 0) {
			this.timer.clearTimeout(this.urlTimer);
			this.urlTimer = void 0;
		}
		if (this.restartTimer !== void 0) {
			this.timer.clearTimeout(this.restartTimer);
			this.restartTimer = void 0;
		}
		if (this.handle !== void 0) {
			this.handle.stop();
			this.handle = void 0;
		}
	}
	setPhase(phase) {
		this.phase = phase;
		const info = this.info;
		for (const listener of this.phaseListeners) try {
			listener(info);
		} catch {}
	}
};
//#endregion
//#region src/public-base.ts
/**
* The public base the pairing fence trusts while a tunnel is not running
* (issue #1547).
*
* The fence reads exactly one public host: `service.publicBaseUrl`. Dropping
* it the instant the tunnel leaves `running` makes every public request from
* the address still printed in the QR code answer 403 — including
* `/api/pair/status`, which exists to be callable before pairing. Two of the
* three tunnel modes never lose their host: a named tunnel keeps its fixed
* dashboard hostname, and a registered relay keeps its stable subdomain. A
* quick tunnel does mint a new hostname on restart, so its previous host is
* kept only for a bounded grace window: Cloudflare's edge can still deliver a
* connection the phone already opened, and a mobile network reconnects
* constantly, so an instant drop turns the phone's retry into a silent 403.
* @module @linxin666/dsh-remote-web-ui/public-base
*/
/** How long a quick-tunnel host stays trusted after the tunnel stops running. */
const PUBLIC_BASE_GRACE_MS = 6e4;
/**
* Owns the trusted public base across tunnel and relay transitions.
*
* The keeper never decides on its own to widen trust: it only postpones
* dropping an address the operator (named/relay) or the tunnel (quick) had
* already published, and it forgets it once the tunnel comes back with the
* address that actually serves the QR.
*/
var PublicBaseKeeper = class {
	onChange;
	graceMs;
	mode = "off";
	tunnelUrl;
	relayUrl;
	graceTimer;
	/**
	* @param onChange - receives the base the fence should trust from now on.
	* @param graceMs - how long a quick-tunnel host outlives its tunnel.
	*/
	constructor(onChange, graceMs = PUBLIC_BASE_GRACE_MS) {
		this.onChange = onChange;
		this.graceMs = graceMs;
	}
	/** The base a fresh fence read should trust: the stable relay origin wins. */
	current() {
		return this.relayUrl ?? this.tunnelUrl;
	}
	/** The mode that currently owns the public base. */
	setMode(mode) {
		this.mode = mode;
	}
	/** The last quick-tunnel URL, for callers that must announce it downstream. */
	quickUrl() {
		return this.tunnelUrl;
	}
	/** A relay registration result; undefined withdraws the stable origin. */
	setRelay(url) {
		this.relayUrl = url;
		this.emit();
	}
	/** The tunnel reported a live URL: it supersedes any pending grace. */
	markRunning(url) {
		this.cancelGrace();
		this.tunnelUrl = url;
		this.emit();
	}
	/**
	* The tunnel left `running` (starting again, or failed). A named tunnel's
	* fixed hostname stays trusted; a quick tunnel's previous host stays
	* trusted for the grace window, then is dropped if nothing replaced it.
	*/
	markReconnecting() {
		if (this.mode === "named") return;
		this.startGrace();
	}
	/** Re-publish the current base after a branch change that did not move it. */
	refresh() {
		this.emit();
	}
	/** Forget everything (teardown, or a mode change that stops the tunnel). */
	reset() {
		this.cancelGrace();
		this.tunnelUrl = void 0;
		this.relayUrl = void 0;
		this.emit();
	}
	/** Cancel the pending grace timer; the keeper keeps its last base. */
	dispose() {
		this.cancelGrace();
	}
	startGrace() {
		if (this.tunnelUrl === void 0) return;
		if (this.graceTimer !== void 0) return;
		this.graceTimer = setTimeout(() => {
			this.graceTimer = void 0;
			this.tunnelUrl = void 0;
			this.emit();
		}, this.graceMs);
	}
	cancelGrace() {
		if (this.graceTimer === void 0) return;
		clearTimeout(this.graceTimer);
		this.graceTimer = void 0;
	}
	emit() {
		this.onChange(this.current());
	}
};
//#endregion
//#region src/mount-once.ts
/**
* Host single-instance guard shared by the plugin family. The family bundle
* (dsh-web-all / dsh-skins) namespaces every child row id (web-ui-*), so
* the loader accepts a standalone install of the same package side by side;
* without this guard the second instance would still re-register the same
* webserver routes, tools, settings namespaces, and system-prompt sections
* and fail the boot. mountOnce makes a mount of an already-mounted package a
* no-op for as long as the first instance lives (the browser half is already
* deduped by package name in the client module host).
*
* A no-op is only safe while the holder is ALIVE. The holder can be disposed
* long after the refused mount ran its course: the Host reloads a profile by
* creating the new loader entries before the old ones are torn down (a
* plugin-manager enable/disable/install write, a settings-driven row reload,
* HMR), so the new aggregate shell entry mounts its family plugin while the
* previous entry still owns the name. Dropping that refused mount lost the
* plugin for good - the previous entry then disposed its own mount, releasing
* the name with nobody left to take it, and the family row stayed listed as
* active while its host routes 404ed (the task-board panel showed
* "board.hostError.notMounted", no degraded record appeared, and only a Host
* restart recovered it).
*
* The refused mount is therefore QUEUED, not dropped, and replayed the moment
* the holder releases the name - if the waiting fiber is still alive then. The
* single-instance guarantee is unchanged: exactly one mount is live per
* package name, and the replay re-enters the guard so a later mount still
* dedupes against it.
*
* The registry rides a global symbol so two module instances of the same
* package (npm copy vs repository link) still share one verdict. That symbol
* is a CROSS-REPOSITORY contract, not this file's private state: the four
* satellite packages (dsh-skins / dsh-pet / dsh-presets /
* dsh-community-plugins) are separate repositories carrying their own copy of
* this guard, rebuilt on their own schedule, so the value under `MOUNTED`
* must keep the shape every published copy reads (a `Set` of package names
* with `has`/`add`/`delete`). The wait queues this guard added therefore live
* under their own additive key, and the registry reads back a `Set` even when
* some other build left a different value there. Changing `MOUNTED`'s shape
* in place broke that contract once: a satellite's legacy copy created a
* `Set`, the family's new copy read it as a `Map`, and every family row
* mounted after it failed with "claims.get is not a function".
*
* cordis `ctx.effect` runs its callback immediately and treats the callback's
* return value as the fiber disposer, so the unmarker is returned, not run.
*/
/** Published cross-repository contract: package names currently mounted. */
const MOUNTED = Symbol.for("dsh-web.mounted-plugins");
/** Additive key this guard owns: refused mounts waiting for the name. */
const WAITERS = Symbol.for("dsh-web.mounted-plugins.waiters");
/**
* The shared name registry, always a `Set` whatever another build stored here:
* a foreign value (an interim shape, a hand-written global) must not take every
* family plugin down with it.
* @returns the process-wide set of mounted package names.
*/
function mountedSet() {
	const registry = globalThis;
	const existing = registry[MOUNTED];
	if (existing instanceof Set) return existing;
	const created = /* @__PURE__ */ new Set();
	registry[MOUNTED] = created;
	return created;
}
/** Queue per package name for mounts refused while a holder was alive. */
function mountWaiters() {
	const registry = globalThis;
	return registry[WAITERS] ??= /* @__PURE__ */ new Map();
}
/**
* Wrap a cordis plugin apply so the package runs at most once per process.
* The first mount registers normally and releases the name when its fiber
* disposes; a mount refused while that name is held waits for the release and
* then runs, unless its own fiber disposes first.
* @param packageName - npm package identity shared by every install source.
* @param fn - the original plugin apply.
* @returns an apply of the same shape.
*/
function mountOnce(packageName, fn) {
	const mount = (...args) => {
		const mounted = mountedSet();
		const ctx = args[0];
		if (mounted.has(packageName)) {
			const waiters = mountWaiters();
			const queue = waiters.get(packageName) ?? [];
			let alive = true;
			const pending = { run: () => {
				if (alive) mount(...args);
			} };
			ctx?.effect?.(() => () => {
				alive = false;
				const index = queue.indexOf(pending);
				if (index >= 0) queue.splice(index, 1);
			});
			queue.push(pending);
			waiters.set(packageName, queue);
			return;
		}
		mounted.add(packageName);
		ctx?.effect?.(() => () => {
			mounted.delete(packageName);
			const waiters = mountWaiters();
			const queue = waiters.get(packageName);
			if (queue === void 0) return;
			waiters.delete(packageName);
			for (const waiter of queue.splice(0)) queueMicrotask(() => {
				waiter.run();
			});
		});
		return fn(...args);
	};
	return mount;
}
//#endregion
//#region src/detached-work.ts
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
/**
* The escape hatch, created at module scope on purpose: a resource built while
* a transaction is running would capture that transaction, so this single
* instance is the only one the module ever needs. It carries no context of its
* own, so every job run through it starts from the process's root context.
*/
const DETACHED = new AsyncResource("dsh-remote-web-ui:detached-work", { triggerAsyncId: 0 });
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
function runDetached(work) {
	return DETACHED.runInAsyncScope(work);
}
//#endregion
//#region src/remote-channel-boot.ts
/**
* Parse-time remote-channel boot patch (issue #987): the browser-half patch
* (client/remote-channel.ts) installs when this plugin's boot entry runs,
* but `dsh-client-connection` boots earlier and opens its event streams
* unrewritten — on a non-loopback origin the SDK fence rejects them and the
* workspace list never loads. The host therefore inlines this classic script
* right after the opening <head> tag (webserver/index-inject), so the
* fetch/WebSocket/EventSource/src rewrite is active before ANY boot entry
* executes. The plugin's client apply later adopts the installed seat
* (hooks + pending unpaired signal) instead of patching twice.
*
* The rewrite decisions are generated from REMOTE_CHANNEL_RULES, the same
* data the browser patch consumes — the two cannot drift apart. On this
* 0.1.2-alpha.2 line the "configuration plane is local" behavior lives in
* the browser (client plugins branch on connection.isLoopback), so the
* script also flips the official UI into host mode by installing the
* transport hook `__DSH_TRANSPORT__ = { ownsHost: true }` before the
* connection plugin reads it: the paired remote desktop gets the full
* settings/credentials/presets surface, and every call still rides the
* gated /remote channel. Host mode is server-granted, not origin-asserted:
* the hook is installed only when the device-gated app landing (/pair-app)
* published the grant marker (REMOTE_HOST_GRANT_GLOBAL) ahead of this
* script, so a shell served to an unpaired browser - a fence-open
* deployment - never presents itself as the machine owner. It finally
* publishes the official pre-Cordis
* upload hook (`__DSH_FILE_UPLOAD__`), because the background upload
* transport otherwise runs inside a Web Worker whose own globals the
* main-thread rewrite cannot reach (issue #1580). The script self-skips on
* loopback origins and never throws.
* @module @linxin666/dsh-remote-web-ui/remote-channel-boot
*/
/**
* Build the inline boot script. The result contains no `<\/script` sequence
* (the injection contract) and installs a {@link RemoteChannelBootSeat} on
* the window global.
*/
function buildRemoteChannelBootScript(rules = REMOTE_CHANNEL_RULES) {
	const json = JSON.stringify(rules);
	const seat = JSON.stringify(REMOTE_CHANNEL_BOOT_GLOBAL);
	return "(function(){try{var w=window,loc=w.location,h=loc.hostname;var R=" + json + ";if(h==='localhost'||h==='::1'||h==='[::1]'||/^127(\\.\\d{1,3}){3}$/.test(h))return;var pr=loc.protocol;if(typeof pr===\"string\"&&pr!==\"\"&&R.webProtocols.indexOf(pr)===-1)return;try{if(w.__DSH_TRANSPORT__&&w.__DSH_TRANSPORT__.ownsHost===true&&h.indexOf(\".\")===-1&&h.indexOf(\":\")===-1)return}catch(e){}try{if(w[R.hostGrantGlobal]===true){if(w.__DSH_TRANSPORT__===undefined)w.__DSH_TRANSPORT__={};w.__DSH_TRANSPORT__.ownsHost=true}}catch(e){}function rdv(){try{return w.sessionStorage.getItem(R.deviceKey)}catch(e){return null}}function att(init){var dv=rdv();if(dv===null)return init;var h=init&&init.headers;if(typeof Headers!==\"undefined\"&&h instanceof Headers){try{h.set(R.deviceHeader,dv)}catch(e){}return init}if(typeof h===\"object\"&&h!==null){var o={};for(var k in h)o[k]=h[k];o[R.deviceHeader]=dv;return Object.assign({},init,{headers:o})}return init}function sf(p){if(p.indexOf(R.pairPrefix)===0)return false;if(p.indexOf(R.updatePrefix)===0)return false;if(p===R.settingsBridgePrefix||p.indexOf(R.settingsBridgePrefix+\"/\")===0)return false;if(p.indexOf(R.apiPrefix)===0)return true;if(p.indexOf(R.sidebarPrefix)===0||p===\"/sidebar\")return true;if(p.indexOf(R.gitPrefix)===0||p===\"/git\")return true;if(p.indexOf(R.petPrefix)===0||p===\"/pet\")return true;return false}function sw(p){return R.wsPaths.indexOf(p)!==-1}function rp(p){return R.remotePrefix+p}function so(u){return u.origin===loc.origin}function rr(raw){var u;try{u=new URL(raw,loc.href)}catch(e){return raw}if(u.origin!==loc.origin)return raw;if(!sf(u.pathname))return raw;u.pathname=rp(u.pathname);if(raw.charAt(0)===\"/\"&&raw.charAt(1)!==\"/\")return u.pathname+u.search+u.hash;return u.href}function uc(v){if(typeof v!==\"object\"||v===null)return undefined;var n=v.result;if(typeof n===\"object\"&&n!==null){var e=n.error;if(typeof e===\"object\"&&e!==null&&typeof e.code===\"string\")return e.code}var t=v.error;if(typeof t===\"object\"&&t!==null&&typeof t.code===\"string\")return t.code;return undefined}var seat={onUnpaired:null,onPaired:null,pendingUnpaired:false,restore:function(){}};function denied(res){if(res.status!==403)return false;return res.clone().json().then(function(b){return uc(b)===\"unpaired\"}).catch(function(){return false})}function signal(unpaired){if(unpaired){if(seat.onUnpaired)seat.onUnpaired();else seat.pendingUnpaired=true}else{seat.pendingUnpaired=false;if(seat.onPaired)seat.onPaired()}}var of=w.fetch;w.fetch=function(input,init){var raw=typeof input===\"string\"||input instanceof URL?input.toString():input.url;var url=new URL(raw,loc.href);if(so(url)&&sf(url.pathname)){var next=new URL(url);next.pathname=rp(url.pathname);var target=typeof input===\"string\"||input instanceof URL?next.toString():new Request(next,input);return Promise.resolve(of.call(w,target,att(init))).then(function(res){void Promise.resolve(denied(res)).then(signal);return res})}return of.call(w,input,init)};var OW=w.WebSocket;w.WebSocket=function(url,protocols){var p=new URL(url.toString(),loc.href);var o=p.protocol===\"wss:\"?\"https://\"+p.host:p.protocol===\"ws:\"?\"http://\"+p.host:\"\";if(o!==\"\"&&o===loc.origin&&sw(p.pathname)){var nx=new URL(p);nx.pathname=rp(p.pathname);var dvv=rdv();if(dvv!==null)nx.searchParams.set(R.deviceQuery,dvv);return protocols!==undefined?new OW(nx,protocols):new OW(nx)}return protocols!==undefined?new OW(url,protocols):new OW(url)};w.WebSocket.prototype=OW.prototype;w.WebSocket.CONNECTING=OW.CONNECTING;w.WebSocket.OPEN=OW.OPEN;w.WebSocket.CLOSING=OW.CLOSING;w.WebSocket.CLOSED=OW.CLOSED;var OE=w.EventSource;if(OE!==undefined){w.EventSource=function(url,cfg){var p=new URL(url.toString(),loc.href);if(so(p)&&sf(p.pathname)){var nx=new URL(p);nx.pathname=rp(p.pathname);var dvv=rdv();if(dvv!==null)nx.searchParams.set(R.deviceQuery,dvv);return new OE(nx,cfg)}return new OE(url,cfg)};w.EventSource.prototype=OE.prototype}var restores=[];function patchSrc(C){if(C===undefined)return;var d=Object.getOwnPropertyDescriptor(C.prototype,\"src\");if(d===undefined||d.configurable===false||d.set===undefined)return;var os=d.set;Object.defineProperty(C.prototype,\"src\",{configurable:true,enumerable:d.enumerable!==false,get:d.get,set:function(v){os.call(this,rr(String(v)))}});restores.push(function(){Object.defineProperty(C.prototype,\"src\",d)})}patchSrc(w.HTMLImageElement);patchSrc(w.HTMLScriptElement);patchSrc(w.HTMLIFrameElement);function uf(u,init){var raw=typeof u===\"string\"?u:u.href;if(typeof raw!==\"string\")return of.call(w,u,init||{});var q=new URL(raw,loc.href);if(so(q)&&q.pathname===R.uploadPath)return w.fetch(raw,init||{});return of.call(w,u,init||{})}try{if(w[R.uploadHookGlobal]===undefined)w[R.uploadHookGlobal]={fetch:uf}}catch(e){}seat.restore=function(){w.fetch=of;w.WebSocket=OW;if(OE!==undefined)w.EventSource=OE;for(var i=0;i<restores.length;i++)restores[i]();try{delete w[" + seat + "]}catch(e){w[" + seat + "]=undefined}};w[" + seat + "]=seat" + buildBootWatchdogScript() + "}catch(e){}})();";
}
/** Boot-watchdog latch: one self-reload per session while the boot is broken. */
const BOOT_WATCHDOG_KEY = "dsh-remote-boot-reload";
/** Total wait for the app's first conversation surface before the reload. */
const BOOT_WATCHDOG_WAIT_MS = 15e3;
/** Watchdog poll cadence. */
const BOOT_WATCHDOG_POLL_MS = 1e3;
/**
* Build the boot-watchdog script fragment. A remote boot has no recovery
* path of its own: the SPA mounts nothing when a boot-critical request dies
* (a tunnel-edge 429 under burst, a dropped stream, a boot-order race), and
* the phone then shows a permanently blank shell. The watchdog polls for the
* app's conversation surface and reloads once when it never appears; the
* sessionStorage latch keeps a genuinely broken deployment from looping,
* and a successful boot clears the latch so a later failure can recover.
*/
function buildBootWatchdogScript(waitMs = BOOT_WATCHDOG_WAIT_MS, pollMs = BOOT_WATCHDOG_POLL_MS) {
	const key = JSON.stringify(BOOT_WATCHDOG_KEY);
	return ";function wBoot(){try{return !!(w.document&&w.document.querySelector&&(w.document.querySelector(\"[data-conversation-scroll]\")||w.document.querySelector(\"[data-slot=\\\"conversation\\\"]\")))}catch(e){return false}}function wTick(n){try{if(wBoot()){try{w.sessionStorage.removeItem(" + key + ")}catch(e){}return}if(n<" + waitMs + "){w.setTimeout(function(){wTick(n+" + pollMs + ")}," + pollMs + ");return}var done=false;try{done=w.sessionStorage.getItem(" + key + ")===\"1\"}catch(e){}if(done)return;try{w.sessionStorage.setItem(" + key + ",\"1\")}catch(e){}w.location.reload()}catch(e){}}if(typeof w.setTimeout===\"function\")w.setTimeout(function(){wTick(0)}," + pollMs + ");";
}
/** The script this plugin contributes; built once from the live rules. */
const REMOTE_CHANNEL_BOOT_SCRIPT = buildRemoteChannelBootScript();
//#endregion
//#region src/uuid-polyfill.ts
/**
* Polyfill for crypto.randomUUID for non-secure contexts (LAN HTTP)
* where the browser does not expose crypto.randomUUID.
*
* The script string is injected as an inline <script> in the desktop HTML
* head so the SDK's mintRpcId() sees a working randomUUID even on plain
* http:// origins (#1024).
*/
const UUID_POLYFILL_SCRIPT = [
	"(function(){",
	"var g=typeof globalThis!==\"undefined\"?globalThis:typeof window!==\"undefined\"?window:self;",
	"if(typeof g.crypto===\"undefined\"){g.crypto={};}",
	"if(typeof g.crypto.randomUUID!==\"function\"){",
	"g.crypto.randomUUID=function(){",
	"var a=new Uint8Array(16);",
	"if(g.crypto.getRandomValues){g.crypto.getRandomValues(a);}",
	"else{for(var j=0;j<16;j++){a[j]=Math.random()*256|0;}}",
	"a[6]=(a[6]&0x0f)|0x40;",
	"a[8]=(a[8]&0x3f)|0x80;",
	"var h=\"\",x=\"0123456789abcdef\";",
	"for(var i=0;i<16;i++){h+=x[a[i]>>4]+x[a[i]&0x0f];",
	"if(i===3||i===5||i===7||i===9)h+=\"-\";}",
	"return h;",
	"};",
	"}",
	"})();"
].join("");
//#endregion
//#region src/index.ts
/**
* Mobile remote control for the dsh web GUI — host half. Mounts the pairing
* service (one-time tokens, device sessions, revocation), the /api/pair
* route family (issue/accept/stop/heartbeat/status/events), the api/gate
* listener that enforces pairing on every other /api request from
* non-loopback hosts, and the presence sweep. The browser half (the
* `./client` entry) renders the sidebar entry, the pairing panel, and the
* phone-side pair/accept + deep-link flow.
*/
/** Stable cordis plugin name. */
const name = "remote-web-ui";
/** Services required before the pairing surfaces can mount. */
const inject = [
	"webServer",
	"typertGateway",
	"connection"
];
/**
* Settings namespace of the remote-control capability. Under the 0.1.7
* settings model the namespace IS the Host profile entry id, so this is also
* the id the browser half asks `ctx.configForms` for (the family binder
* resolves the same value to the owning entry). Spelled here rather than
* imported: the browser half spells the same value and must not depend on a
* Host package.
*/
const REMOTE_WEB_UI_SETTINGS_NAMESPACE = "remote-web-ui";
/**
* Plugin config schema. Under the 0.1.7 settings model this schema IS the
* entry's settings page: the Host derives one form per profile entry from it
* and serves that form only when at least one field is `volatile()`. The marker
* is also what admits a write and what keeps the edit on the live path — the
* Loader commits the new value into the field's reference and announces
* `loader/volatile-update` on this fiber instead of remounting the row, so the
* pairing service, its device sessions, the tunnel and the route registrations
* survive a settings save (see {@link applyImpl}'s sync).
*
* The schema is left to inference rather than annotated with `z<Config>`: a
* volatile field's parsed output is a live reference while its accepted input
* stays the plain value, so the two sides no longer share one shape and the
* annotation would reject the schema the Host must be given.
*
* The deployment-level fields (`trustedHosts`, `devicesFile`, `profile`) are
* deliberately NOT volatile: they belong in the profile patch, so the form
* leaves them to the operator instead of offering a card control that a
* document write could not honor.
*/
const Config = z.object({
	tokenTtlMs: z.number().step(1).min(6e4).default(10 * 6e4).volatile(),
	offlineAfterMs: z.number().step(1).min(5e3).default(25e3).volatile(),
	maxDevices: z.number().step(1).min(1).max(64).default(4).volatile(),
	idleExpireMs: z.number().step(1).min(6e4).default(DEFAULT_IDLE_EXPIRE_MS).volatile(),
	cookieName: z.string().min(1).default("dsh_pair").volatile(),
	requirePairingForLan: z.boolean().default(true).volatile(),
	publicBaseUrl: z.string().volatile(),
	trustedHosts: z.array(z.string()),
	devicesFile: z.string(),
	autoTunnel: z.boolean().default(false).volatile(),
	tunnelToken: z.string().role("secret").volatile(),
	relay: z.boolean().default(true).volatile(),
	lanBind: z.boolean().volatile(),
	/**
	* Seed for the LAN approval switch (see LanAllowlistOptions.enabled): it
	* only applies to a list that has never stored a switch of its own, so the
	* panel's toggle survives restarts.
	*/
	lanAllowlistEnabled: z.boolean().default(true).volatile(),
	/** The approval list store; defaults to `$DSH_HOME/remote-web-ui-lan.json`. */
	lanAllowlistFile: z.string(),
	profile: z.string().pattern(/^[A-Za-z0-9][A-Za-z0-9._-]*$/),
	enabled: z.boolean().default(true).volatile()
});
/** Presence sweep cadence (a stale device flips to disconnected within two sweeps). */
const SWEEP_INTERVAL_MS = 1e4;
/** Read one resolved config field, following the live reference the schema produces. */
function readConfigField(field, fallback) {
	if (field === void 0) return fallback;
	if (typeof field === "object" && field !== null && typeof field.get === "function") {
		const value = field.get();
		return value === void 0 ? fallback : value;
	}
	return field;
}
/**
* Read one optional resolved config field. A volatile reference is read at
* call time, so an unset field stays `undefined` rather than falling back to a
* schema default (the distinction the LAN toggle and the tunnel plan depend on).
*/
function readOptionalConfigField(field) {
	if (field === void 0) return void 0;
	if (typeof field === "object" && field !== null && typeof field.get === "function") return field.get();
	return field;
}
/**
* The single mapping from resolved plugin config to the pairing service
* config. Both the constructed service and every later apply of this row
* reuse it, so no field can be silently dropped.
*/
function pairingConfigOf(resolved) {
	return {
		tokenTtlMs: resolved.tokenTtlMs,
		offlineAfterMs: resolved.offlineAfterMs,
		maxDevices: resolved.maxDevices,
		idleExpireMs: resolved.idleExpireMs,
		cookieName: resolved.cookieName,
		devicesFile: resolved.devicesFile
	};
}
/** Default paired-session store: `$DSH_HOME/remote-web-ui-devices.json`. */
function defaultDevicesFile(home = dshHome()) {
	return join(home, "remote-web-ui-devices.json");
}
/** Default LAN approval store: `$DSH_HOME/remote-web-ui-lan.json`. */
function defaultLanAllowlistFile(home = dshHome()) {
	return join(home, "remote-web-ui-lan.json");
}
/** Schema defaults, re-read for hand-built test contexts (the loader applies them normally). */
const DEFAULTS = {
	tokenTtlMs: 10 * 6e4,
	offlineAfterMs: 25e3,
	maxDevices: 4,
	idleExpireMs: DEFAULT_IDLE_EXPIRE_MS,
	cookieName: "dsh_pair",
	requirePairingForLan: true,
	publicBaseUrl: void 0,
	trustedHosts: void 0,
	devicesFile: defaultDevicesFile(),
	autoTunnel: false,
	tunnelToken: void 0,
	relay: true,
	lanBind: void 0,
	lanAllowlistEnabled: true,
	lanAllowlistFile: defaultLanAllowlistFile(),
	profile: resolveManagedProfile(void 0, void 0, process.env.DSH_PROFILE),
	enabled: true
};
/**
* The launched profile the Host publishes on its `profileContext` service
* (`{ name, dir, patchPath, … }`). The Desktop client boots the "desktop"
* profile without exporting DSH_PROFILE, so the environment alone resolves
* the wrong profile there and the LAN bind toggle would edit a profile that
* is not running.
* @param ctx - host plugin context.
* @returns the profile name when the Host publishes one; undefined otherwise.
*/
function launchedProfileName(ctx) {
	const fact = ctx.get("profileContext");
	return typeof fact?.name === "string" && fact.name.length > 0 ? fact.name : void 0;
}
/**
* Mount the pairing service, routes, gate listener, and presence sweep.
* @param ctx - host plugin context carrying webServer.
* @param config - resolved plugin config (schema defaults applied by the loader).
*/
const apply = mountOnce("@linxin666/dsh-remote-web-ui", applyImpl);
function applyImpl(ctx, config) {
	const envPublicBase = process.env.DSH_REMOTE_PUBLIC_BASE_URL?.trim() || void 0;
	const resolve = () => ({
		tokenTtlMs: readConfigField(config?.tokenTtlMs, DEFAULTS.tokenTtlMs),
		offlineAfterMs: readConfigField(config?.offlineAfterMs, DEFAULTS.offlineAfterMs),
		maxDevices: readConfigField(config?.maxDevices, DEFAULTS.maxDevices),
		idleExpireMs: readConfigField(config?.idleExpireMs, DEFAULTS.idleExpireMs),
		cookieName: readConfigField(config?.cookieName, DEFAULTS.cookieName),
		requirePairingForLan: readConfigField(config?.requirePairingForLan, DEFAULTS.requirePairingForLan),
		publicBaseUrl: readOptionalConfigField(config?.publicBaseUrl) ?? envPublicBase,
		trustedHosts: readOptionalConfigField(config?.trustedHosts),
		devicesFile: readConfigField(config?.devicesFile, DEFAULTS.devicesFile),
		autoTunnel: readConfigField(config?.autoTunnel, DEFAULTS.autoTunnel),
		tunnelToken: readOptionalConfigField(config?.tunnelToken),
		relay: readConfigField(config?.relay, DEFAULTS.relay),
		lanBind: readOptionalConfigField(config?.lanBind),
		lanAllowlistEnabled: readConfigField(config?.lanAllowlistEnabled, DEFAULTS.lanAllowlistEnabled),
		lanAllowlistFile: readConfigField(config?.lanAllowlistFile, DEFAULTS.lanAllowlistFile),
		profile: resolveManagedProfile(readOptionalConfigField(config?.profile), launchedProfileName(ctx), process.env.DSH_PROFILE),
		enabled: readConfigField(config?.enabled, DEFAULTS.enabled)
	});
	const service = new PairingService(pairingConfigOf(resolve()));
	const tunnel = new TunnelManager();
	let relayRegistrar;
	/**
	* The public base the pairing fence trusts. A tunnel reconnect must not
	* strip the host the QR still shows: named and relay hosts never change,
	* and a quick tunnel's host survives a bounded grace window (issue #1547).
	*/
	const publicBase = new PublicBaseKeeper((base) => {
		service.setPublicBaseUrl(base);
	});
	/** The tunnel target the registrar last announced (dedupes sync re-runs). */
	let relayAnnouncedFor;
	const disposeRelayRegistrar = (unregister = false) => {
		const registrar = relayRegistrar;
		relayRegistrar = void 0;
		publicBase.setRelay(void 0);
		relayAnnouncedFor = void 0;
		if (registrar === void 0) return;
		if (unregister) registrar.unregister().catch(() => void 0);
		registrar.dispose();
	};
	const ensureRelayRegistrar = () => {
		if (resolve().relay === false) return void 0;
		if (relayRegistrar === void 0) try {
			relayRegistrar = new RelayRegistrar(loadRelayIdentity(resolve().profile), (state) => {
				service.setRelayStatus(state.state === "off" ? void 0 : state);
				if (state.state === "running") publicBase.setRelay(state.url);
				else if (state.state === "off") publicBase.setRelay(void 0);
				else if (state.state === "failed") console.warn(`remote-web-ui: relay registration failed (${state.error}) — the stable origin may serve its offline page until the retry lands`);
			});
		} catch (error) {
			console.warn(`remote-web-ui: relay registry unavailable (${error instanceof Error ? error.message : String(error)}) — the quick URL is the QR base`);
		}
		return relayRegistrar;
	};
	const announceRelay = (registrar, target) => {
		if (relayAnnouncedFor === target) return;
		relayAnnouncedFor = target;
		registrar.announce(target);
	};
	let tunnelMode = resolve().autoTunnel ? "quick" : "off";
	tunnel.onPhase((info) => {
		if (tunnelMode === "off") return;
		if (info.phase === "running" && info.url !== void 0) {
			publicBase.markRunning(info.url);
			service.setTunnelStatus({
				state: "running",
				url: info.url
			});
			const registrar = tunnelMode === "quick" ? ensureRelayRegistrar() : void 0;
			if (registrar !== void 0) announceRelay(registrar, info.url);
			runPostureProbe();
		} else if (info.phase === "starting") {
			publicBase.markReconnecting();
			service.setTunnelStatus({ state: "starting" });
		} else if (info.phase === "failed") {
			publicBase.markReconnecting();
			service.setTunnelStatus(info.error === void 0 ? { state: "failed" } : {
				state: "failed",
				error: info.error
			});
		}
	});
	ctx.effect(() => () => {
		disposeRelayRegistrar();
		publicBase.dispose();
		tunnel.dispose();
	}, "remote-web-ui: auto tunnel");
	if ((ctx.webServer.host === "0.0.0.0" || ctx.webServer.host === "127.0.0.1") && Number.isFinite(ctx.webServer.port)) {
		const lanBases = ctx.webServer.host === "0.0.0.0" ? lanIPv4Addresses().map((address) => ({
			address,
			base: `http://${address}:${String(ctx.webServer.port)}`
		})) : [];
		service.setLanBases(lanBases);
	}
	let disposeRoutes;
	let disposeSweep;
	let lastKnownPort;
	let lastFirewallApplied;
	const lanBindStatus = () => {
		const resolvedNow = resolve();
		let state;
		try {
			state = lanBindState(resolvedNow.profile);
		} catch {
			state = { blockPresent: false };
		}
		const lanOn = state.host === "0.0.0.0";
		const port = Number.isFinite(ctx.webServer.port) ? ctx.webServer.port : lastKnownPort;
		if (Number.isFinite(ctx.webServer.port)) lastKnownPort = ctx.webServer.port;
		const startup = ctx.get("webStartup");
		const desiredHost = resolvedNow.lanBind === void 0 ? void 0 : desiredBindHost(resolvedNow.lanBind === true, startup?.host);
		return {
			profile: resolvedNow.profile,
			setting: resolvedNow.lanBind ?? null,
			blockHost: state.host ?? null,
			bindHost: ctx.webServer.host,
			port,
			lanUrls: ctx.webServer.host === "0.0.0.0" && port !== void 0 ? lanIPv4Addresses().map((address) => `http://${address}:${String(port)}`) : [],
			firewall: port !== void 0 ? firewallSummary(port, lanOn) : {
				ok: true,
				managed: false
			},
			platform: process.platform,
			pendingRestart: pendingRestartOf(resolvedNow.lanBind, desiredHost, ctx.webServer.host)
		};
	};
	const innerAuth = createInnerAuth(() => {
		if (!Number.isFinite(ctx.webServer.port)) return void 0;
		try {
			return ctx.connection.authenticatedUrl?.(`http://127.0.0.1:${String(ctx.webServer.port)}/`);
		} catch {
			return;
		}
	});
	const APP_SHELL_TTL_MS = 3e4;
	let appShellCache;
	const fetchAppShell = async () => {
		if (!Number.isFinite(ctx.webServer.port)) return void 0;
		if (appShellCache !== void 0 && Date.now() - appShellCache.at < APP_SHELL_TTL_MS) return appShellCache.html;
		const cookie = await innerAuth.ready();
		try {
			const response = await fetch(`http://127.0.0.1:${String(ctx.webServer.port)}/`, withIdentityEncoding({ headers: cookie !== void 0 ? { cookie } : void 0 }));
			if (!response.ok) {
				if (response.status === 401 || response.status === 403) innerAuth.invalidate();
				return;
			}
			const html = await response.text();
			appShellCache = {
				at: Date.now(),
				html
			};
			return html;
		} catch {
			return;
		}
	};
	const allowlist = new LanAllowlist({
		file: resolve().lanAllowlistFile,
		enabled: resolve().lanAllowlistEnabled
	});
	const routes = [...makeRoutes({
		service,
		requirePairingForLan: () => resolve().requirePairingForLan,
		lanBindStatus,
		indexDocument: fetchAppShell,
		allowlist,
		trustedHosts: () => {
			const list = [];
			const envHosts = process.env.DSH_REMOTE_TRUSTED_HOSTS;
			if (typeof envHosts === "string" && envHosts.trim() !== "") for (const item of envHosts.split(",")) {
				const trimmed = item.trim();
				if (trimmed !== "") list.push(trimmed);
			}
			const cfgHosts = resolve().trustedHosts;
			if (Array.isArray(cfgHosts)) {
				for (const item of cfgHosts) if (typeof item === "string") {
					const trimmed = item.trim();
					if (trimmed !== "") list.push(trimmed);
				}
			}
			return list;
		}
	}), ...makeRemoteApiRoutes({
		service,
		port: ctx.webServer.port,
		auth: innerAuth,
		allowlist
	})];
	const upgrades = makeRemoteApiUpgradeRoutes({
		service,
		port: ctx.webServer.port,
		auth: innerAuth,
		allowlist
	});
	const gate = makeGateListener(service, () => resolve().requirePairingForLan, () => resolve().enabled);
	ctx.effect(() => ctx.on("api/gate", gate), "remote-web-ui: api gate");
	let postureKey;
	let postureWasExposed = false;
	const runPostureProbe = () => {
		if (!resolve().enabled) return;
		const targets = postureTargets(service.publicBaseUrl, service.lanAddresses, ctx.webServer.port);
		if (targets.length === 0) {
			postureKey = void 0;
			service.setPosture(void 0);
			return;
		}
		const key = targets.join("|");
		const claim = claimPostureKey(postureKey, key);
		if (!claim.run) return;
		postureKey = claim.next;
		probePosture({
			port: ctx.webServer.port,
			targets
		}).then((snapshot) => {
			service.setPosture(snapshot);
			const exposedHosts = snapshot.hosts.filter((host) => host.exposed).map((host) => host.host);
			const exposed = exposedHosts.length > 0;
			if (exposed && !postureWasExposed) console.error(`remote-web-ui: CRITICAL — the /api fence is OPEN for [${exposedHosts.join(", ")}]: unpaired clients reach the full host API. Remove --trusted-host for these hosts (pairing covers them) or bind loopback.`);
			else if (!exposed && postureWasExposed) console.log("remote-web-ui: the /api posture probe is clean again (every advertised origin refused with 403).");
			postureWasExposed = exposed;
		}).catch(() => {
			postureKey = releasePostureKey(postureKey, key);
		});
	};
	const initialPostureTimer = setTimeout$1(() => {
		runPostureProbe();
	}, 5e3);
	initialPostureTimer.unref();
	ctx.effect(() => () => {
		clearTimeout(initialPostureTimer);
	}, "remote-web-ui: posture probe boot");
	new RemoteWebUiPairing(ctx, (request) => {
		if (!resolve().enabled) return false;
		return isPairedDeviceRequest(service, request);
	});
	const presencePet = startRemotePresencePet({
		onState: (listener) => service.onState(listener),
		pet: () => {
			try {
				return ctx.get("pet");
			} catch {
				return;
			}
		}
	});
	ctx.effect(() => presencePet, "remote-web-ui: remote-presence pet visibility");
	if (service.lanAddresses.length > 0) {
		const urls = service.lanAddresses.map((ip) => `http://${ip}:${String(ctx.webServer.port)}`).join(" , ");
		console.log(`remote-web-ui: the paired Web GUI is reachable on LAN at ${urls}`);
	}
	if (ctx.webServer.host === "0.0.0.0") console.warn("remote-web-ui: LAN-exposed bind — pairing gates the /remote channel; direct /api stays under the harness fence + browser auth (stop() does not revoke an already-redeemed browser credential)");
	const applyLanBindWork = (value) => {
		if (value.lanBind !== void 0) {
			const startup = ctx.get("webStartup");
			const desiredHost = desiredBindHost(value.lanBind === true, startup?.host);
			const desiredPort = desiredBindPort(startup?.port, Number.isFinite(ctx.webServer.port) ? ctx.webServer.port : void 0);
			if (desiredPort === void 0) console.error("remote-web-ui: cannot assert the lan-bind block — the web server port is not known yet");
			else try {
				const current = lanBindState(value.profile);
				if (current.host !== desiredHost || current.port !== desiredPort) {
					writeLanBind(desiredHost, desiredPort, value.profile);
					console.log(`remote-web-ui: lan-bind block written for profile ${value.profile} (${desiredHost}:${String(desiredPort)}); it takes effect when the profile next applies (the card reports pendingRestart until the running bind follows)`);
				}
			} catch (error) {
				console.error(`remote-web-ui: failed to write the lan-bind block: ${error instanceof Error ? error.message : String(error)}`);
			}
			const livePort = Number.isFinite(ctx.webServer.port) ? ctx.webServer.port : void 0;
			if (livePort === void 0) console.error("remote-web-ui: cannot align the host firewall rule — the web server port is not known yet");
			else {
				const nextFirewall = {
					enabled: value.lanBind === true,
					port: livePort
				};
				if (firewallActionNeeded(lastFirewallApplied, nextFirewall)) if (nextFirewall.enabled ? ensureFirewallRule(nextFirewall.port) : removeFirewallRule(nextFirewall.port)) lastFirewallApplied = nextFirewall;
				else console.error("remote-web-ui: the host firewall rule could not be updated (admin rights required on managed platforms)");
			}
		}
	};
	let lanBindWorkPending = false;
	const scheduleLanBindWork = () => {
		if (lanBindWorkPending) return;
		lanBindWorkPending = true;
		runDetached(() => setImmediate(() => {
			lanBindWorkPending = false;
			try {
				applyLanBindWork(resolve());
			} catch (error) {
				console.error(`remote-web-ui: the deferred lan-bind assertion failed: ${error instanceof Error ? error.message : String(error)}`);
			}
		}));
	};
	ctx.effect(() => () => {
		lanBindWorkPending = false;
	}, "remote-web-ui: lan-bind work");
	const sync = () => {
		const value = resolve();
		service.config = pairingConfigOf(value);
		scheduleLanBindWork();
		const plan = tunnelPlanOf(value, ctx.webServer.port);
		tunnelMode = plan.mode;
		publicBase.setMode(plan.mode);
		const liveTunnelUrl = publicBase.quickUrl();
		if (plan.mode !== "quick") {
			disposeRelayRegistrar();
			if (plan.mode !== "named") publicBase.refresh();
		} else if (value.relay === false) {
			disposeRelayRegistrar(true);
			publicBase.refresh();
		} else if (liveTunnelUrl !== void 0) {
			const registrar = ensureRelayRegistrar();
			if (registrar !== void 0) announceRelay(registrar, liveTunnelUrl);
		}
		if (plan.mode === "quick") {
			for (const ignored of plan.ignored) console.warn(`remote-web-ui: autoTunnel is on — ignoring the configured ${ignored}`);
			const registrar = ensureRelayRegistrar();
			const originHostHeader = registrar === void 0 ? void 0 : new URL(registrar.baseUrl).host;
			tunnel.start(originHostHeader === void 0 ? plan.targetUrl : {
				kind: "quick",
				targetUrl: plan.targetUrl,
				originHostHeader
			});
		} else if (plan.mode === "named") {
			publicBase.markRunning(plan.publicUrl);
			tunnel.start({
				kind: "named",
				token: plan.token,
				publicUrl: plan.publicUrl
			});
		} else {
			tunnel.stop();
			if (value.tunnelToken !== void 0 && value.tunnelToken !== "") console.warn("remote-web-ui: tunnelToken is set but publicBaseUrl is missing or not a valid URL — fill the fixed public hostname of the named tunnel (e.g. https://dsh.example.com) to run it");
			if (value.publicBaseUrl !== void 0 && !isHttpUrl(value.publicBaseUrl)) {
				console.warn(`remote-web-ui: ignoring malformed publicBaseUrl ${JSON.stringify(value.publicBaseUrl)} (expected https://host[:port])`);
				service.setPublicBaseUrl(void 0);
			} else service.setPublicBaseUrl(value.publicBaseUrl);
		}
		const enabled = value.enabled;
		if (!enabled) {
			service.stop();
			tunnel.stop();
			disposeRelayRegistrar();
			publicBase.reset();
		}
		if (disposeRoutes === void 0 && enabled) disposeRoutes = ctx.effect(() => {
			const disposers = [...routes.map((route) => ctx.webServer.register(route)), ...upgrades.map((route) => ctx.webServer.registerUpgrade(route))];
			return () => {
				for (const dispose of disposers) dispose();
			};
		}, "remote-web-ui: pairing routes");
		else if (disposeRoutes !== void 0 && !enabled) {
			disposeRoutes();
			disposeRoutes = void 0;
		}
		if (disposeSweep === void 0 && enabled) disposeSweep = ctx.effect(() => {
			const timer = setInterval(() => {
				service.sweep();
			}, SWEEP_INTERVAL_MS);
			timer.unref();
			return () => {
				clearInterval(timer);
			};
		}, "remote-web-ui: presence sweep");
		else if (disposeSweep !== void 0 && !enabled) {
			disposeSweep();
			disposeSweep = void 0;
		}
		runPostureProbe();
	};
	ctx.effect(() => ctx.on("webserver/index-inject", (table) => {
		table.push({
			kind: "script",
			placement: "head",
			text: UUID_POLYFILL_SCRIPT
		});
	}), "remote-web-ui: uuid polyfill");
	ctx.effect(() => ctx.on("webserver/index-inject", (table) => {
		const value = resolve();
		if (!value.enabled || !value.requirePairingForLan) return;
		table.push({
			kind: "script",
			placement: "head",
			text: REMOTE_CHANNEL_BOOT_SCRIPT
		});
	}), "remote-web-ui: remote channel boot patch");
	ctx.on("loader/volatile-update", () => {
		sync();
	});
	sync();
}
//#endregion
export { Config, REMOTE_WEB_UI_SETTINGS_NAMESPACE, apply, defaultDevicesFile, defaultLanAllowlistFile, inject, name, pairingConfigOf };
