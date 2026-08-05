import { defineStore } from 'pinia';

export const useAppStore = defineStore('app', {
  state: () => ({
    kidMode: false,
  }),
  actions: {
    setKidMode(value: boolean) {
      this.kidMode = value;
    },
  },
});
