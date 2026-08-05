import ICAL from 'ical.js';
import type { CalendarEvent, CalendarSubscription } from 'src/db/models';

export async function syncIcsSubscription(subscription: CalendarSubscription): Promise<CalendarEvent[]> {
  if (!subscription.enabled || !subscription.url) return [];
  const response = await fetch(subscription.url);
  const text = await response.text();
  const jcal = ICAL.parse(text);
  const component = new ICAL.Component(jcal);
  const events = component.getAllSubcomponents('vevent');

  return events.map((event: any, index: number) => {
    const vevent = new ICAL.Event(event);
    const start = vevent.startDate?.toJSDate?.() ?? new Date();
    const end = vevent.endDate?.toJSDate?.() ?? start;
    return {
      id: `ics:${subscription.id}:${vevent.uid || index}`,
      source: 'ics',
      subscription_id: subscription.id,
      title: vevent.summary || 'Calendar event',
      start: start.toISOString(),
      end: end.toISOString(),
      all_day: Boolean(vevent.startDate?.isDate),
      color: subscription.color,
    } satisfies CalendarEvent;
  });
}

export async function syncGoogleCalendarStub(subscription: CalendarSubscription): Promise<CalendarEvent[]> {
  console.info('Google Calendar OAuth stub. Configure VITE_GOOGLE_CLIENT_ID/GOOGLE_CLIENT_ID and GIS flow.', subscription);
  return [];
}

export async function syncSubscription(subscription: CalendarSubscription): Promise<CalendarEvent[]> {
  if (subscription.type === 'ics') {
    return syncIcsSubscription(subscription);
  }

  return syncGoogleCalendarStub(subscription);
}
