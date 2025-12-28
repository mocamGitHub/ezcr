import { describe, it, expect, beforeEach } from 'vitest'
import {
  SearchIndex,
  bookingToSearchable,
  eventTypeToSearchable,
  templateToSearchable,
  type SearchableItem,
} from '@/lib/search/searchIndex'

describe('SearchIndex', () => {
  let index: SearchIndex

  beforeEach(() => {
    index = new SearchIndex()
    index.clear()
  })

  describe('addItems', () => {
    it('should add items to the index', () => {
      const items: SearchableItem[] = [
        { id: '1', type: 'booking', title: 'Meeting with John' },
        { id: '2', type: 'booking', title: 'Call with Jane' },
      ]

      index.addItems(items)

      expect(index.count).toBe(2)
    })

    it('should replace existing items with same ID', () => {
      index.addItems([{ id: '1', type: 'booking', title: 'Original' }])
      index.addItems([{ id: '1', type: 'booking', title: 'Updated' }])

      expect(index.count).toBe(1)
      const results = index.search('Updated')
      expect(results).toHaveLength(1)
      expect(results[0].item.title).toBe('Updated')
    })
  })

  describe('removeItems', () => {
    it('should remove items by ID', () => {
      index.addItems([
        { id: '1', type: 'booking', title: 'Keep' },
        { id: '2', type: 'booking', title: 'Remove' },
      ])

      index.removeItems(['2'])

      expect(index.count).toBe(1)
    })
  })

  describe('search', () => {
    beforeEach(() => {
      index.addItems([
        { id: '1', type: 'booking', title: 'Team Meeting', subtitle: 'scheduled' },
        { id: '2', type: 'booking', title: 'Client Call', subtitle: 'pending' },
        { id: '3', type: 'event_type', title: 'consultation', subtitle: 'Cal.com' },
        { id: '4', type: 'template', title: 'Booking Confirmation', subtitle: 'email' },
      ])
    })

    it('should find items by title', () => {
      const results = index.search('meeting')
      expect(results.length).toBeGreaterThan(0)
      expect(results[0].item.title).toContain('Meeting')
    })

    it('should find items by subtitle', () => {
      const results = index.search('pending')
      expect(results.length).toBeGreaterThan(0)
    })

    it('should filter by type', () => {
      const results = index.search('booking', { type: 'template' })
      expect(results.length).toBe(1)
      expect(results[0].item.type).toBe('template')
    })

    it('should limit results', () => {
      const results = index.search('', { limit: 2 })
      expect(results.length).toBeLessThanOrEqual(2)
    })

    it('should return empty for no matches', () => {
      const results = index.search('xyznonexistent')
      expect(results).toHaveLength(0)
    })

    it('should return empty for empty query', () => {
      const results = index.search('')
      expect(results).toHaveLength(0)
    })
  })

  describe('getItemsByType', () => {
    it('should return only items of specified type', () => {
      index.addItems([
        { id: '1', type: 'booking', title: 'Booking 1' },
        { id: '2', type: 'event_type', title: 'Event Type 1' },
        { id: '3', type: 'booking', title: 'Booking 2' },
      ])

      const bookings = index.getItemsByType('booking')
      expect(bookings).toHaveLength(2)
      expect(bookings.every(b => b.type === 'booking')).toBe(true)
    })
  })

  describe('clear', () => {
    it('should remove all items', () => {
      index.addItems([
        { id: '1', type: 'booking', title: 'Test' },
      ])
      expect(index.count).toBe(1)

      index.clear()
      expect(index.count).toBe(0)
    })
  })
})

describe('Converters', () => {
  describe('bookingToSearchable', () => {
    it('should convert booking to searchable item', () => {
      const booking = {
        id: 'b1',
        title: 'Team Sync',
        attendee_email: 'john@example.com',
        start_at: '2025-12-28T10:00:00Z',
        status: 'scheduled',
      }

      const item = bookingToSearchable(booking)

      expect(item.id).toBe('booking:b1')
      expect(item.type).toBe('booking')
      expect(item.title).toBe('Team Sync')
      expect(item.subtitle).toBe('scheduled')
    })

    it('should use email as title when title is empty', () => {
      const booking = {
        id: 'b1',
        attendee_email: 'john@example.com',
        start_at: '2025-12-28T10:00:00Z',
        status: 'scheduled',
      }

      const item = bookingToSearchable(booking)
      expect(item.title).toBe('john@example.com')
    })
  })

  describe('eventTypeToSearchable', () => {
    it('should convert event type to searchable item', () => {
      const eventType = {
        id: 'et1',
        purpose: 'intro_call',
        cal_event_type_id: 12345,
      }

      const item = eventTypeToSearchable(eventType)

      expect(item.id).toBe('event_type:et1')
      expect(item.type).toBe('event_type')
      expect(item.title).toBe('intro_call')
      expect(item.subtitle).toContain('12345')
    })
  })

  describe('templateToSearchable', () => {
    it('should convert template to searchable item', () => {
      const template = {
        id: 't1',
        name: 'Booking Confirmation',
        event_type: 'booking_created',
        channel: 'email',
      }

      const item = templateToSearchable(template)

      expect(item.id).toBe('template:t1')
      expect(item.type).toBe('template')
      expect(item.title).toBe('Booking Confirmation')
      expect(item.subtitle).toContain('email')
    })
  })
})
