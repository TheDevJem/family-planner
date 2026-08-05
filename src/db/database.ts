import initSqlJs, { type Database } from 'sql.js';
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import { loadDatabaseFile, saveDatabaseFile } from './indexedDb';
import { runMigrations } from './migrations';
import { seedDatabase } from './seed';

class DatabaseService {
  private db: Database | null = null;
  private readyPromise: Promise<Database> | null = null;

  async ready(): Promise<Database> {
    if (this.db) return this.db;
    if (this.readyPromise) return this.readyPromise;

    this.readyPromise = this.open();
    this.db = await this.readyPromise;
    return this.db;
  }

  async persist(): Promise<void> {
    const db = await this.ready();
    await saveDatabaseFile(db.export());
  }

  private async open(): Promise<Database> {
    const SQL = await initSqlJs({ locateFile: () => wasmUrl });
    const file = await loadDatabaseFile();
    const db = file ? new SQL.Database(file) : new SQL.Database();

    db.run('PRAGMA foreign_keys = ON');
    runMigrations(db);
    seedDatabase(db);
    await saveDatabaseFile(db.export());

    return db;
  }
}

export const databaseService = new DatabaseService();
