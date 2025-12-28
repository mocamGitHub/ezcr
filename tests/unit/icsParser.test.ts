import { describe, it, expect } from 'vitest'
import { parseICS, validateICS, diffEvents, type ParsedEvent } from '@/lib/ical/icsParser'

const SAMPLE_ICS = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//Test//EN
X-WR-CALNAME:Test Calendar
BEGIN:VEVENT
UID:test-event-1@example.com
DTSTART:20251228T100000Z
DTEND:20251228T110000Z
SUMMARY:Team Meeting
DESCRIPTION:Weekly team sync
LOCATION:Conference Room A
END:VEVENT
BEGIN:VEVENT
UID:test-event-2@example.com
DTSTART:20251229T140000Z
DTEND:20251229T150000Z
SUMMARY:Client Call
END:VEVENT
END:VCALENDAR`

const INVALID_ICS = `This is not a valid ICS file`

const MISSING_VCALENDAR = `BEGIN:VEVENT
UID:test@example.com
DTSTART:20251228T100000Z
SUMMARY:Event
END:VEVENT`

describe('icsParser', () => {
  describe('validateICS', () => {
    it('should validate a correct ICS file', () => {
      const result = validateICS(SAMPLE_ICS)
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should reject invalid content', () => {
      const result = validateICS(INVALID_ICS)
      expect(result.valid).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should reject missing VCALENDAR', () => {
      const result = validateICS(MISSING_VCALENDAR)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('VCALENDAR')
    })
  })

  describe('parseICS', () => {
    it('should parse events from valid ICS', () => {
      const result = parseICS(SAMPLE_ICS)

      expect(result.success).toBe(true)
      expect(result.events).toHaveLength(2)
      expect(result.calendarName).toBe('Test Calendar')
    })

    it('should extract event details correctly', () => {
      const result = parseICS(SAMPLE_ICS)
      const event = result.events.find(e => e.uid === 'test-event-1@example.com')

      expect(event).toBeDefined()
      expect(event?.title).toBe('Team Meeting')
      expect(event?.description).toBe('Weekly team sync')
      expect(event?.location).toBe('Conference Room A')
      expect(event?.startAt).toBeInstanceOf(Date)
      expect(event?.endAt).toBeInstanceOf(Date)
    })

    it('should handle events without optional fields', () => {
      const result = parseICS(SAMPLE_ICS)
      const event = result.events.find(e => e.uid === 'test-event-2@example.com')

      expect(event).toBeDefined()
      expect(event?.title).toBe('Client Call')
      expect(event?.description).toBeNull()
      expect(event?.location).toBeNull()
    })

    it('should return errors for invalid content', () => {
      const result = parseICS(INVALID_ICS)

      expect(result.success).toBe(false)
      expect(result.events).toHaveLength(0)
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })

  describe('diffEvents', () => {
    it('should detect added events', () => {
      const oldEvents: ParsedEvent[] = []
      const newEvents: ParsedEvent[] = [
        {
          uid: 'new-1',
          title: 'New Event',
          description: null,
          startAt: new Date('2025-12-28T10:00:00Z'),
          endAt: new Date('2025-12-28T11:00:00Z'),
          allDay: false,
          location: null,
          rawIcal: '',
        },
      ]

      const diff = diffEvents(oldEvents, newEvents)

      expect(diff.added).toHaveLength(1)
      expect(diff.updated).toHaveLength(0)
      expect(diff.deleted).toHaveLength(0)
      expect(diff.added[0].uid).toBe('new-1')
    })

    it('should detect deleted events', () => {
      const oldEvents: ParsedEvent[] = [
        {
          uid: 'old-1',
          title: 'Old Event',
          description: null,
          startAt: new Date('2025-12-28T10:00:00Z'),
          endAt: new Date('2025-12-28T11:00:00Z'),
          allDay: false,
          location: null,
          rawIcal: '',
        },
      ]
      const newEvents: ParsedEvent[] = []

      const diff = diffEvents(oldEvents, newEvents)

      expect(diff.added).toHaveLength(0)
      expect(diff.updated).toHaveLength(0)
      expect(diff.deleted).toHaveLength(1)
      expect(diff.deleted[0].uid).toBe('old-1')
    })

    it('should detect updated events', () => {
      const oldEvents: ParsedEvent[] = [
        {
          uid: 'event-1',
          title: 'Original Title',
          description: null,
          startAt: new Date('2025-12-28T10:00:00Z'),
          endAt: new Date('2025-12-28T11:00:00Z'),
          allDay: false,
          location: null,
          rawIcal: '',
        },
      ]
      const newEvents: ParsedEvent[] = [
        {
          uid: 'event-1',
          title: 'Updated Title',
          description: null,
          startAt: new Date('2025-12-28T10:00:00Z'),
          endAt: new Date('2025-12-28T11:00:00Z'),
          allDay: false,
          location: null,
          rawIcal: '',
        },
      ]

      const diff = diffEvents(oldEvents, newEvents)

      expect(diff.added).toHaveLength(0)
      expect(diff.updated).toHaveLength(1)
      expect(diff.deleted).toHaveLength(0)
      expect(diff.updated[0].title).toBe('Updated Title')
    })

    it('should not flag unchanged events', () => {
      const event: ParsedEvent = {
        uid: 'event-1',
        title: 'Unchanged',
        description: null,
        startAt: new Date('2025-12-28T10:00:00Z'),
        endAt: new Date('2025-12-28T11:00:00Z'),
        allDay: false,
        location: null,
        rawIcal: '',
      }

      const diff = diffEvents([event], [{ ...event }])

      expect(diff.added).toHaveLength(0)
      expect(diff.updated).toHaveLength(0)
      expect(diff.deleted).toHaveLength(0)
    })
  })
})
