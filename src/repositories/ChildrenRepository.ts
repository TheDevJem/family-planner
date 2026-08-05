import type { Child, PointsHistoryEntry } from 'src/db/models';
import { BaseRepository } from './BaseRepository';

type ChildRow = Omit<Child, 'points_history'> & { points_history: string };

function parseChild(row: ChildRow): Child {
  return {
    ...row,
    points_history: JSON.parse(row.points_history || '[]') as PointsHistoryEntry[],
  };
}

export class ChildrenRepository extends BaseRepository {
  async list(): Promise<Child[]> {
    const db = await this.db();
    return this.rows<ChildRow>(db.exec('SELECT * FROM children ORDER BY name')).map(parseChild);
  }

  async find(id: number): Promise<Child | null> {
    const db = await this.db();
    const row = this.one<ChildRow>(db.exec('SELECT * FROM children WHERE id = ?', [id]));
    return row ? parseChild(row) : null;
  }

  async create(input: Omit<Child, 'id' | 'points_total' | 'points_history'>): Promise<Child> {
    const db = await this.db();
    db.run(
      `INSERT INTO children (name, age, birthday, avatar_url, points_total, points_history, updated_at)
       VALUES (?, ?, ?, ?, 0, '[]', CURRENT_TIMESTAMP)`,
      [input.name, input.age, input.birthday, input.avatar_url],
    );
    await this.persist();
    return (await this.find(await this.lastInsertId())) as Child;
  }

  async update(child: Child): Promise<void> {
    const db = await this.db();
    db.run(
      `UPDATE children
       SET name = ?, age = ?, birthday = ?, avatar_url = ?, points_total = ?,
           points_history = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        child.name,
        child.age,
        child.birthday,
        child.avatar_url,
        child.points_total,
        JSON.stringify(child.points_history),
        child.id,
      ],
    );
    await this.persist();
  }

  async remove(id: number): Promise<void> {
    const db = await this.db();
    db.run('DELETE FROM children WHERE id = ?', [id]);
    await this.persist();
  }

  async adjustPoints(childId: number, delta: number, reason: string): Promise<void> {
    const child = await this.find(childId);
    if (!child) return;

    child.points_total += delta;
    child.points_history.unshift({
      delta,
      reason,
      timestamp: new Date().toISOString(),
    });

    await this.update(child);
  }
}

export const childrenRepository = new ChildrenRepository();
