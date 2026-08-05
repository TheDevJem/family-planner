import type { Chore, Recurrence } from 'src/db/models';
import { BaseRepository } from './BaseRepository';

type ChoreRow = Omit<Chore, 'fixed_child_id'> & { fixed_child_id: number | null };

export class ChoresRepository extends BaseRepository {
  async list(minimumAge?: number): Promise<Chore[]> {
    const db = await this.db();
    const sql =
      minimumAge === undefined
        ? 'SELECT * FROM chores ORDER BY minimum_age, name'
        : 'SELECT * FROM chores WHERE minimum_age <= ? ORDER BY minimum_age, name';
    const result = minimumAge === undefined ? db.exec(sql) : db.exec(sql, [minimumAge]);
    return this.rows<ChoreRow>(result);
  }

  async find(id: number): Promise<Chore | null> {
    const db = await this.db();
    return this.one<ChoreRow>(db.exec('SELECT * FROM chores WHERE id = ?', [id]));
  }

  async create(input: Omit<Chore, 'id'>): Promise<Chore> {
    const db = await this.db();
    db.run(
      `INSERT INTO chores (name, minimum_age, points, recurrence, color, fixed_child_id, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [input.name, input.minimum_age, input.points, input.recurrence, input.color, input.fixed_child_id],
    );
    await this.persist();
    return (await this.find(await this.lastInsertId())) as Chore;
  }

  async update(chore: Chore): Promise<void> {
    const db = await this.db();
    db.run(
      `UPDATE chores
       SET name = ?, minimum_age = ?, points = ?, recurrence = ?, color = ?,
           fixed_child_id = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [chore.name, chore.minimum_age, chore.points, chore.recurrence, chore.color, chore.fixed_child_id, chore.id],
    );
    await this.persist();
  }

  async remove(id: number): Promise<void> {
    const db = await this.db();
    db.run('DELETE FROM chores WHERE id = ?', [id]);
    await this.persist();
  }

  recurrenceOptions(): Recurrence[] {
    return ['none', 'daily', 'weekly'];
  }
}

export const choresRepository = new ChoresRepository();
