/**
 * Wide sidebar foot row. The shell owns the foot's container classes and gives
 * the seat (`sidebar.footer.action`, whose own slot host is `display: contents`)
 * a box of its own, so this plugin's rules decide how the family trigger and
 * the shell's own settings trigger share the bottom line.
 *
 * Two contracts are pinned here:
 * - the wide row puts the settings trigger and the family trigger on one line,
 *   while every other foot child keeps a full row above them;
 * - the seat itself carries no box (issue #1710). It is a SHARED container: the
 *   moment a third party registers into it, a seat box turns into a tall column
 *   and squeezes the settings trigger, which this plugin does not own.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync(new URL('../src/client/remote.module.css', import.meta.url), 'utf8')

/** Extract one rule block body by its full selector. */
function ruleBody(selector: string): string {
  const start = css.indexOf(selector)
  if (start < 0) throw new Error(selector + ' rule not found in remote.module.css')
  const open = css.indexOf('{', start)
  const close = css.indexOf('}', open)
  return css.slice(open + 1, close)
}

/** Every wide-foot rule is scoped to the uncollapsed frame. */
const WIDE = ":global([data-dsh-frame]:not([data-sidebar-collapsed])) "
/** The rail rule is scoped to the collapsed frame and anchored on a rail occupant. */
const RAIL = ":global([data-dsh-frame][data-sidebar-collapsed]) "
/** The seat's own slot host, which is `display: contents`. */
const SEAT_SLOT = "[class*='footerActions'] > [data-slot='sidebar.footer.action']"
/** The seat element itself, as the shell renders it inside the foot. */
const SEAT = "[class*='footArea'] > [class*='footerActions']"

describe('wide sidebar foot row', () => {
  it('user gets the settings trigger and the footer actions on one line', () => {
    // Given the wide foot container
    const foot = ruleBody(WIDE + "[class*='footArea']")
    // When the wide layout applies
    // Then it lays the foot out as a wrapping row
    expect(foot).toContain('flex-direction: row')
    expect(foot).toContain('flex-wrap: wrap')

    // And the settings trigger takes the line's remaining width
    const settings = ruleBody(WIDE + "[class*='settingsArea']")
    expect(settings).toContain('flex: 1 1 auto')
    expect(settings).toContain('order: 3')
  })

  it('user keeps every other foot child on a full row of its own', () => {
    // Given a foot child that is neither the settings trigger nor the actions
    const other = ruleBody(WIDE + "[class*='footArea'] > :not([class*='settingsArea']):not([class*='footerActions'])")
    // When the row wraps
    // Then the child claims the whole line
    expect(other).toContain('flex: 1 1 100%')
  })

  // #1710: the seat is a shared container. Keeping a box on it made the whole
  // seat a tall column as soon as a third party registered a tall block, which
  // squeezed the shell's settings trigger to 102px and centred it vertically
  // inside that column (y534 = 351 + (417-50)/2 in the report).
  it('operator with a third-party occupant does not get the settings trigger squeezed', () => {
    // Given the seat element the shell renders
    const seat = ruleBody(WIDE + SEAT)
    // When the wide layout applies
    // Then the seat carries no box, so its occupants answer to the foot's own
    // wrapping layout and no seat height can compress the settings trigger
    expect(seat).toContain('display: contents')
    expect(seat).not.toContain('flex: none')
    expect(seat).not.toContain('align-items')
  })

  it('operator gets a tall third-party occupant on its own full row', () => {
    // Given a seat occupant that is not a family footer entry
    const foreign = ruleBody(WIDE + SEAT_SLOT + " > :not([data-dsh-part='entry']):not([class*='entryRow'])")
    // When the wide layout applies
    // Then it claims a whole line above the bottom row, so it cannot push the
    // settings trigger or the family trigger out of place
    expect(foreign).toContain('flex: 1 1 100%')
    expect(foreign).toContain('order: 1')
  })

  it('operator gets the family footer trigger on the settings line at its own size', () => {
    // Given the family's own footer entries (the update and session-id
    // triggers mark `data-dsh-part="entry"`; this plugin marks its own row)
    const entry = ruleBody(WIDE + SEAT_SLOT + " > [data-dsh-part='entry']")
    // When the wide layout applies
    // Then the trigger keeps its intrinsic width and closes the bottom row
    expect(entry).toContain('flex: 0 0 auto')
    expect(entry).toContain('order: 4')
  })

  it('user in the collapsed rail keeps the shell stacked foot', () => {
    // Given the frame's collapsed-frame rail marker
    // When the wide rules are read
    // Then each one is scoped off the collapsed frame
    for (const selector of ["[class*='footArea']", "[class*='settingsArea']", "[class*='footerActions']"]) {
      expect(() => ruleBody(WIDE + selector)).not.toThrow()
    }
  })

  // #1678: the shell renders sidebar.footer.action as a centered horizontal
  // row in the rail too, so a second registrar makes the seat 78px wide and
  // the outer circles spill past the 56px column. The plugin pins its own
  // seat to a column whenever a rail occupant sits inside it.
  it('user in the collapsed rail gets the action seat stacked in the icon column', () => {
    // Given the collapsed frame's action seat holding a rail-marked occupant
    const seat = ruleBody(RAIL + "[class*='footerActions']:has([data-rail='rail'])")
    // When the rail layout applies
    // Then the occupants stack and stay centered on the 36px icon column
    expect(seat).toContain('flex-direction: column')
    expect(seat).toContain('align-items: center')
    expect(seat).toContain('gap: 4px')
  })
})
