import { defineStore } from 'pinia';
import type { CalendarEvent, CalendarSubscription } from 'src/db/models';
import { calendarRepository } from 'src/repositories/CalendarRepository';
import { syncSubscription } from 'src/services/calendarIntegrationService';

export const useCalendarStore = defineStore('calendar', {
  state: () => ({
    subscriptions: [] as CalendarSubscription[],
    events: [] as CalendarEvent[],
    syncing: false,
  }),
  actions: {
    async loadSubscriptions() {
      this.subscriptions = await calendarRepository.subscriptions();
    },
    async loadEvents(start: string, end: string) {
      this.events = await calendarRepository.eventsBetween(start, end);
    },
    async createSubscription(input: Omit<CalendarSubscription, 'id' | 'last_synced_at'>) {
      await calendarRepository.createSubscription(input);
      await this.loadSubscriptions();
    },
    async updateSubscription(subscription: CalendarSubscription) {
      await calendarRepository.updateSubscription(subscription);
      await this.loadSubscriptions();
    },
    async removeSubscription(id: number) {
      await calendarRepository.removeSubscription(id);
      await this.loadSubscriptions();
    },
    async syncAll() {
      this.syncing = true;
      try {
        await this.loadSubscriptions();
        for (const subscription of this.subscriptions.filter((item) => item.enabled)) {
          const events = await syncSubscription(subscription);
          await calendarRepository.cacheEvents(subscription.id, events);
        }
      } finally {
        this.syncing = false;
      }
    },
  },
});
