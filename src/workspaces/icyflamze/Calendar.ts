import { globalEventBus } from '../../kernel/events/EventBus.js';
import { globalNodeRegistry } from '../../knowledge/NodeRegistry.js';
import { globalEdgeRegistry } from '../../knowledge/EdgeRegistry.js';

export interface CalendarEvent {
  id: string;
  title: string;
  type: 'Release' | 'Content' | 'Show' | 'Deadline';
  date: string;
  status: 'pending' | 'completed';
}

export class CalendarManager {
  private events: CalendarEvent[] = [
    { id: 'cal-1', title: 'Content release: Rise of the Street Scholar Trailer', type: 'Content', date: '2026-07-20', status: 'pending' },
    { id: 'cal-2', title: 'EP Release: Rise of the Street Scholar', type: 'Release', date: '2026-07-25', status: 'pending' },
    { id: 'cal-3', title: 'How I Built My Own AI OS for Music (Video Post)', type: 'Content', date: '2026-07-28', status: 'pending' },
    { id: 'cal-4', title: 'Submit Blue Gold Flame Single distributor package', type: 'Deadline', date: '2026-08-01', status: 'pending' },
    { id: 'cal-5', title: 'Lagos Scholars Live Showcase Performance', type: 'Show', date: '2026-08-10', status: 'pending' }
  ];

  public getEvents(): CalendarEvent[] {
    return [...this.events];
  }

  public addEvent(eventData: Omit<CalendarEvent, 'id'>): CalendarEvent {
    const event: CalendarEvent = {
      id: `cal-${Date.now()}`,
      ...eventData
    };
    this.events.push(event);

    globalNodeRegistry.registerNode(event.id, 'Workflow', {
      title: event.title,
      type: 'CalendarEvent',
      eventType: event.type,
      date: event.date
    });
    globalEdgeRegistry.registerEdge(event.id, 'system-core', 'RELATED_TO');

    globalEventBus.publish('IcyflamzeCalendarEventAdded', { eventId: event.id, title: event.title });

    return event;
  }

  public updateEvent(id: string, status: CalendarEvent['status']): void {
    const event = this.events.find(e => e.id === id);
    if (event) {
      event.status = status;
      globalEventBus.publish('IcyflamzeCalendarEventUpdated', { eventId: id, status });
    }
  }
}

export const globalCalendarManager = new CalendarManager();
