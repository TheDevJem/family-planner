import type { CalendarEvent, CalendarSubscription } from 'src/db/models';
import { BaseRepository } from './BaseRepository';

type SubscriptionRow = Omit<CalendarSubscription, 'enabled'> & { enabled: number };
type EventRow = Omit<CalendarEvent, 'all_day'> & { all_day: number };

export class CalendarRepository extends BaseRepository {
  async subscriptions(): Promise<CalendarSubscription[]> {
    const db = await this.db();
    return this.rows<SubscriptionRow>(db.exec('SELECT * FROM calendar_subscriptions ORDER BY name')).map((row) => ({
      ...row,
      enabled: Boolean(row.enabled),
    }));
  }

  async createSubscription(input: Omit<CalendarSubscription, 'id' | 'last_synced_at'>): Promise<void> {
    const db = await this.db();
    db.run(
      `INSERT INTO calendar_subscriptions (name, type, url, color, enabled, updated_at)
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [input.name, input.type, input.url, input.color, input.enabled ? 1 : 0],
    );
    await this.persist();
  }

  async updateSubscription(subscription: CalendarSubscription): Promise<void> {
    const db = await this.db();
    db.run(
      `UPDATE calendar_subscriptions
       SET name = ?, type = ?, url = ?, color = ?, enabled = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        subscription.name,
        subscription.type,
        subscription.url,
        subscription.color,
        subscription.enabled ? 1 : 0,
        subscription.id,
      ],
    );
    await this.persist();
  }

  async removeSubscription(id: number): Promise<void> {
    const db = await this.db();
    db.run('DELETE FROM calendar_subscriptions WHERE id = ?', [id]);
    await this.persist();
  }

  async cacheEvents(subscriptionId: number, events: CalendarEvent[]): Promise<void> {
    const db = await this.db();
    db.run('DELETE FROM calendar_event_cache WHERE subscription_id = ?', [subscriptionId]);
    events.forEach((event) => {
      db.run(
        `INSERT OR REPLACE INTO calendar_event_cache
          (id, source, subscription_id, title, start, end, all_day, color)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [event.id, event.source, subscriptionId, event.title, event.start, event.end, event.all_day ? 1 : 0, event.color],
      );
    });
    db.run('UPDATE calendar_subscriptions SET last_synced_at = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [
      new Date().toISOString(),
      subscriptionId,
    ]);
    await this.persist();
  }

  async eventsBetween(start: string, end: string): Promise<CalendarEvent[]> {
    const db = await this.db();
    return this.rows<EventRow>(
      db.exec(
        `SELECT * FROM calendar_event_cache
         WHERE start <= ? AND end >= ?
         ORDER BY start`,
        [end, start],
      ),
    ).map((row) => ({ ...row, all_day: Boolean(row.all_day) }));
  }
}

export const calendarRepository = new CalendarRepository();
