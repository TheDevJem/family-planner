import type { PasscodeRecord } from 'src/db/models';
import { BaseRepository } from './BaseRepository';

export class SettingsRepository extends BaseRepository {
  async get(key: string): Promise<string | null> {
    const db = await this.db();
    const result = db.exec('SELECT value FROM settings WHERE key = ?', [key]);
    return (result[0]?.values[0]?.[0] as string | undefined) ?? null;
  }

  async set(key: string, value: string): Promise<void> {
    const db = await this.db();
    db.run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, value]);
    await this.persist();
  }

  async remove(key: string): Promise<void> {
    const db = await this.db();
    db.run('DELETE FROM settings WHERE key = ?', [key]);
    await this.persist();
  }

  async passcode(): Promise<PasscodeRecord | null> {
    const value = await this.get('passcode');
    return value ? (JSON.parse(value) as PasscodeRecord) : null;
  }

  async setPasscode(record: PasscodeRecord): Promise<void> {
    await this.set('passcode', JSON.stringify(record));
  }

  async clearPasscode(): Promise<void> {
    await this.remove('passcode');
  }
}

export const settingsRepository = new SettingsRepository();
