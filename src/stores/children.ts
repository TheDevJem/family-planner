import { defineStore } from 'pinia';
import type { Child } from 'src/db/models';
import { childrenRepository } from 'src/repositories/ChildrenRepository';

export const useChildrenStore = defineStore('children', {
  state: () => ({
    children: [] as Child[],
    loading: false,
  }),
  getters: {
    byId: (state) => (id: number) => state.children.find((child) => child.id === id) ?? null,
  },
  actions: {
    async load() {
      this.loading = true;
      try {
        this.children = await childrenRepository.list();
      } finally {
        this.loading = false;
      }
    },
    async create(input: Omit<Child, 'id' | 'points_total' | 'points_history'>) {
      await childrenRepository.create(input);
      await this.load();
    },
    async update(child: Child) {
      await childrenRepository.update(child);
      await this.load();
    },
    async remove(id: number) {
      await childrenRepository.remove(id);
      await this.load();
    },
    async adjustPoints(childId: number, delta: number, reason: string) {
      await childrenRepository.adjustPoints(childId, delta, reason);
      await this.load();
    },
  },
});
