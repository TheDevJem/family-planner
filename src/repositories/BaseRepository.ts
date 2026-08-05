import type { Database } from 'sql.js';
import { databaseService } from 'src/db/database';

export abstract class BaseRepository {
  protected async db(): Promise<Database> {
    return databaseService.ready();
  }

  protected async persist(): Promise<void> {
    await databaseService.persist();
  }

  protected rows<T>(result: { columns: string[]; values: unknown[][] }[] | undefined): T[] {
    const table = result?.[0];
    if (!table) return [];

    return table.values.map((values) =>
      table.columns.reduce<Record<string, unknown>>((row, column, index) => {
        row[column] = values[index];
        return row;
      }, {}) as T,
    );
  }

  protected one<T>(result: { columns: string[]; values: unknown[][] }[] | undefined): T | null {
    return this.rows<T>(result)[0] ?? null;
  }

  protected async lastInsertId(): Promise<number> {
    const db = await this.db();
    return Number(db.exec('SELECT last_insert_rowid() AS id')[0]?.values[0]?.[0] ?? 0);
  }
}
