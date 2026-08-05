import { defineStore } from 'pinia';
import type { Chore } from 'src/db/models';
import { choresRepository } from 'src/repositories/ChoresRepository';

export const useChoresStore = defineStore('chores', {
  state: () => ({
    chores: [] as Chore[],
    minimumAgeFilter: null as number | null,
    loading: false,
  }),
  getters: {
    filtered: (state) =>
      state.minimumAgeFilter === null
        ? state.chores
        : state.chores.filter((chore) => chore.minimum_age <= Number(state.minimumAgeFilter)),
  },
  actions: {
    async load() {
      this.loading = true;
      try {
        this.chores = await choresRepository.list();
      } finally {
        this.loading = false;
      }
    },
    async create(chore: Omit<Chore, 'id'>) {
      await choresRepository.create(chore);
      await this.load();
    },
    async update(chore: Chore) {
      await choresRepository.update(chore);
      await this.load();
    },
    async remove(id: number) {
      await choresRepository.remove(id);
      await this.load();
    },
  },
});
