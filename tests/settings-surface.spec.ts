/**
 * Settings surface contract (issue #1717). Under the 0.1.7 settings model the
 * plugin's own Config schema IS this row's settings page, and the Host serves a
 * form only for an entry that declares at least one `volatile()` field
 * (`SettingsForms.describe` skips every other entry, and a write to a
 * non-volatile path is refused). Without the marker the card rendered as an
 * editable form whose every save was rejected with no reason shown.
 *
 * The marker is also what keeps an edit on the live path, so the fields the
 * settings card edits must be volatile while the deployment-level ones stay in
 * the profile patch.
 */
import { describe, expect, it } from 'vitest'
import { Config } from '../src/index.ts'

/** The fields the settings card edits. */
const CARD_FIELDS = [
  'enabled',
  'tokenTtlMs',
  'offlineAfterMs',
  'maxDevices',
  'idleExpireMs',
  'cookieName',
  'requirePairingForLan',
  'publicBaseUrl',
  'autoTunnel',
  'tunnelToken',
  'relay',
  'lanBind',
] as const

/** Deployment-level fields the profile patch carries instead of the settings page. */
const DEPLOYMENT_FIELDS = ['trustedHosts', 'devicesFile', 'profile'] as const

/**
 * The schema node one Config field declares, as the Host reads it when it
 * decides which fields the settings page may hold and write.
 * @param field - field name inside the Config object schema.
 * @returns the field's schema node, or undefined when the schema has no such field.
 */
function configField(field: string): { meta?: { volatile?: boolean } } | undefined {
  const dict: Record<string, { meta?: { volatile?: boolean } }> = (Config as unknown as { dict?: Record<string, { meta?: { volatile?: boolean } }> }).dict ?? {}
  return dict[field]
}

describe('remote-web-ui settings surface (issue #1717)', () => {
  it('operator gets every card control served as a writable settings field', () => {
    // Given the Config schema the Host serves as this profile entry's settings page
    // When each field the settings card edits is inspected
    // Then it is volatile, which is what puts the entry on the settings surface
    // at all and what admits a write to that path
    for (const field of CARD_FIELDS) {
      expect(configField(field)?.meta?.volatile, field).toBe(true)
    }
  })

  it('operator gets the deployment-level fields left to the profile patch', () => {
    // Given the same schema
    // When the fields that belong in cordis.patch.yml are inspected
    // Then they carry no volatile marker, so the form offers no control a
    // live write could not honor
    for (const field of DEPLOYMENT_FIELDS) {
      expect(configField(field)?.meta?.volatile, field).toBeUndefined()
    }
  })
})
