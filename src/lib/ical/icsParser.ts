/**
 * ICS/iCal Parser - Parses ICS calendar files into structured events
 * Uses ical.js for robust parsing
 */

import ICAL from 'ical.js'

export interface ParsedEvent {
  uid: string
  title: string
  description: string | null
  startAt: Date
  endAt: Date | null
  allDay: boolean
  location: string | null
  rawIcal: string
}

export interface ParseResult {
  success: boolean
  events: ParsedEvent[]
  errors: string[]
  calendarName: string | null
}

/**
 * Parse ICS content into structured events
 */
export function parseICS(icsContent: string): ParseResult {
  const errors: string[] = []
  const events: ParsedEvent[] = []
  let calendarName: string | null = null

  try {
    const jcalData = ICAL.parse(icsContent)
    const vcalendar = new ICAL.Component(jcalData)

    // Get calendar name if available
    const xWrCalname = vcalendar.getFirstPropertyValue('x-wr-calname')
    if (xWrCalname) {
      calendarName = String(xWrCalname)
    }

    // Get all VEVENT components
    const vevents = vcalendar.getAllSubcomponents('vevent')

    for (const vevent of vevents) {
      try {
        const event = new ICAL.Event(vevent)

        // Skip events without required fields
        if (!event.uid || !event.startDate) {
          errors.push(`Skipped event without UID or start date`)
          continue
        }

        const startDate = event.startDate.toJSDate()
        const endDate = event.endDate ? event.endDate.toJSDate() : null

        // Determine if all-day event
        const isAllDay = event.startDate.isDate

        events.push({
          uid: event.uid,
          title: event.summary || 'Untitled Event',
          description: event.description || null,
          startAt: startDate,
          endAt: endDate,
          allDay: isAllDay,
          location: event.location || null,
          rawIcal: vevent.toString(),
        })
      } catch (eventError) {
        errors.push(`Failed to parse event: ${eventError instanceof Error ? eventError.message : 'Unknown error'}`)
      }
    }

    return {
      success: true,
      events,
      errors,
      calendarName,
    }
  } catch (parseError) {
    return {
      success: false,
      events: [],
      errors: [`Failed to parse ICS: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`],
      calendarName: null,
    }
  }
}

/**
 * Validate ICS content without fully parsing
 */
export function validateICS(icsContent: string): { valid: boolean; error?: string } {
  try {
    if (!icsContent.includes('BEGIN:VCALENDAR')) {
      return { valid: false, error: 'Missing VCALENDAR header' }
    }
    if (!icsContent.includes('END:VCALENDAR')) {
      return { valid: false, error: 'Missing VCALENDAR footer' }
    }

    // Try parsing
    const jcalData = ICAL.parse(icsContent)
    const vcalendar = new ICAL.Component(jcalData)

    if (vcalendar.name !== 'vcalendar') {
      return { valid: false, error: 'Invalid VCALENDAR structure' }
    }

    return { valid: true }
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : 'Parse error' }
  }
}

/**
 * Fetch ICS content from a webcal/http URL
 */
export async function fetchICS(url: string): Promise<{ content: string | null; error?: string }> {
  try {
    // Convert webcal:// to https://
    const httpUrl = url.replace(/^webcal:\/\//i, 'https://')

    const response = await fetch(httpUrl, {
      headers: {
        'Accept': 'text/calendar, application/ics, */*',
        'User-Agent': 'NexCyte-Scheduler/1.0',
      },
    })

    if (!response.ok) {
      return { content: null, error: `HTTP ${response.status}: ${response.statusText}` }
    }

    const content = await response.text()

    // Validate content
    const validation = validateICS(content)
    if (!validation.valid) {
      return { content: null, error: validation.error }
    }

    return { content }
  } catch (error) {
    return { content: null, error: error instanceof Error ? error.message : 'Fetch failed' }
  }
}

/**
 * Diff two sets of events to find additions, updates, and deletions
 */
export function diffEvents(
  oldEvents: ParsedEvent[],
  newEvents: ParsedEvent[]
): {
  added: ParsedEvent[]
  updated: ParsedEvent[]
  deleted: ParsedEvent[]
} {
  const oldMap = new Map(oldEvents.map(e => [e.uid, e]))
  const newMap = new Map(newEvents.map(e => [e.uid, e]))

  const added: ParsedEvent[] = []
  const updated: ParsedEvent[] = []
  const deleted: ParsedEvent[] = []

  // Find added and updated
  for (const [uid, newEvent] of newMap) {
    const oldEvent = oldMap.get(uid)
    if (!oldEvent) {
      added.push(newEvent)
    } else if (hasEventChanged(oldEvent, newEvent)) {
      updated.push(newEvent)
    }
  }

  // Find deleted
  for (const [uid, oldEvent] of oldMap) {
    if (!newMap.has(uid)) {
      deleted.push(oldEvent)
    }
  }

  return { added, updated, deleted }
}

/**
 * Check if an event has changed
 */
function hasEventChanged(old: ParsedEvent, newE: ParsedEvent): boolean {
  return (
    old.title !== newE.title ||
    old.description !== newE.description ||
    old.startAt.getTime() !== newE.startAt.getTime() ||
    (old.endAt?.getTime() ?? 0) !== (newE.endAt?.getTime() ?? 0) ||
    old.allDay !== newE.allDay ||
    old.location !== newE.location
  )
}
