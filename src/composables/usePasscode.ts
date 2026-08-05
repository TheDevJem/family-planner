import { settingsRepository } from 'src/repositories/SettingsRepository';

const encoder = new TextEncoder();

function toBase64(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

async function digest(passcode: string, salt: string): Promise<string> {
  const bytes = encoder.encode(`${salt}:${passcode}`);
  return toBase64(await crypto.subtle.digest('SHA-256', bytes));
}

function randomSalt(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function usePasscode() {
  async function hasPasscode(): Promise<boolean> {
    return Boolean(await settingsRepository.passcode());
  }

  async function setPasscode(passcode: string): Promise<void> {
    const salt = randomSalt();
    await settingsRepository.setPasscode({
      salt,
      hash: await digest(passcode, salt),
    });
  }

  async function resetPasscode(): Promise<void> {
    await settingsRepository.clearPasscode();
  }

  async function verify(passcode: string): Promise<boolean> {
    const record = await settingsRepository.passcode();
    if (!record) return true;
    return (await digest(passcode, record.salt)) === record.hash;
  }

  function isValidFormat(passcode: string): boolean {
    return /^\d{4,6}$/.test(passcode);
  }

  return {
    hasPasscode,
    setPasscode,
    resetPasscode,
    verify,
    isValidFormat,
  };
}
