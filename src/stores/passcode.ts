import { defineStore } from 'pinia';
import { usePasscode } from 'src/composables/usePasscode';

const SESSION_TIMEOUT_MS = 60_000;

export const usePasscodeStore = defineStore('passcode', {
  state: () => ({
    unlockedUntil: 0,
    hasCode: false,
  }),
  getters: {
    isUnlocked: (state) => Date.now() < state.unlockedUntil,
  },
  actions: {
    async load() {
      this.hasCode = await usePasscode().hasPasscode();
      if (!this.hasCode) this.lock();
    },
    touch() {
      this.unlockedUntil = Date.now() + SESSION_TIMEOUT_MS;
    },
    lock() {
      this.unlockedUntil = 0;
    },
    async setPasscode(passcode: string) {
      const api = usePasscode();
      if (!api.isValidFormat(passcode)) throw new Error('Passcode must be 4 to 6 digits.');
      await api.setPasscode(passcode);
      this.hasCode = true;
      this.touch();
    },
    async resetPasscode() {
      await usePasscode().resetPasscode();
      this.hasCode = false;
      this.lock();
    },
    async unlock(passcode: string): Promise<boolean> {
      const api = usePasscode();
      if (!api.isValidFormat(passcode)) return false;
      const ok = await api.verify(passcode);
      if (ok) this.touch();
      return ok;
    },
    recordActivity() {
      if (this.isUnlocked) this.touch();
    },
  },
});
