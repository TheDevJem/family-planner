import type { Assignment, AssignmentView } from 'src/db/models';
import { BaseRepository } from './BaseRepository';

type AssignmentRow = Omit<Assignment, 'completed'> & { completed: number };
type AssignmentViewRow = Omit<AssignmentView, 'completed'> & { completed: number };

const mapAssignment = <T extends AssignmentRow | AssignmentViewRow>(row: T): T & { completed: boolean } => ({
  ...row,
  completed: Boolean(row.completed),
});

export class AssignmentsRepository extends BaseRepository {
  async listBetween(start: string, end: string): Promise<AssignmentView[]> {
    const db = await this.db();
    return this.rows<AssignmentViewRow>(
      db.exec(
        `SELECT a.*, c.name AS chore_name, c.color AS chore_color, ch.name AS child_name, ch.avatar_url
         FROM child_chore_assignments a
         JOIN chores c ON c.id = a.chore_id
         JOIN children ch ON ch.id = a.child_id
         WHERE a.due_date BETWEEN ? AND ?
         ORDER BY a.due_date, c.name`,
        [start, end],
      ),
    ).map((row) => mapAssignment(row) as AssignmentView);
  }

  async listForChild(childId: number): Promise<AssignmentView[]> {
    const db = await this.db();
    return this.rows<AssignmentViewRow>(
      db.exec(
        `SELECT a.*, c.name AS chore_name, c.color AS chore_color, ch.name AS child_name, ch.avatar_url
         FROM child_chore_assignments a
         JOIN chores c ON c.id = a.chore_id
         JOIN children ch ON ch.id = a.child_id
         WHERE a.child_id = ?
         ORDER BY a.due_date DESC`,
        [childId],
      ),
    ).map((row) => mapAssignment(row) as AssignmentView);
  }

  async listAll(): Promise<Assignment[]> {
    const db = await this.db();
    return this.rows<AssignmentRow>(db.exec('SELECT * FROM child_chore_assignments')).map(
      (row) => mapAssignment(row) as Assignment,
    );
  }

  async create(input: Omit<Assignment, 'id'>): Promise<void> {
    const db = await this.db();
    db.run(
      `INSERT OR IGNORE INTO child_chore_assignments
        (child_id, chore_id, due_date, completed, completion_timestamp, points_awarded, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        input.child_id,
        input.chore_id,
        input.due_date,
        input.completed ? 1 : 0,
        input.completion_timestamp,
        input.points_awarded,
      ],
    );
    await this.persist();
  }

  async markComplete(id: number, points: number): Promise<void> {
    const db = await this.db();
    db.run(
      `UPDATE child_chore_assignments
       SET completed = 1, completion_timestamp = ?, points_awarded = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND completed = 0`,
      [new Date().toISOString(), points, id],
    );
    await this.persist();
  }

  async undoComplete(id: number): Promise<void> {
    const db = await this.db();
    db.run(
      `UPDATE child_chore_assignments
       SET completed = 0, completion_timestamp = NULL, points_awarded = 0, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [id],
    );
    await this.persist();
  }

  async move(id: number, dueDate: string, resetCompletion: boolean): Promise<void> {
    const db = await this.db();
    db.run(
      `UPDATE child_chore_assignments
       SET due_date = ?,
           completed = CASE WHEN ? THEN 0 ELSE completed END,
           completion_timestamp = CASE WHEN ? THEN NULL ELSE completion_timestamp END,
           points_awarded = CASE WHEN ? THEN 0 ELSE points_awarded END,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [dueDate, resetCompletion ? 1 : 0, resetCompletion ? 1 : 0, resetCompletion ? 1 : 0, id],
    );
    await this.persist();
  }

  async completionInfo(id: number): Promise<AssignmentView | null> {
    const db = await this.db();
    const row = this.one<AssignmentViewRow>(
      db.exec(
        `SELECT a.*, c.name AS chore_name, c.color AS chore_color, ch.name AS child_name, ch.avatar_url
         FROM child_chore_assignments a
         JOIN chores c ON c.id = a.chore_id
         JOIN children ch ON ch.id = a.child_id
         WHERE a.id = ?`,
        [id],
      ),
    );
    return row ? (mapAssignment(row) as AssignmentView) : null;
  }
}

export const assignmentsRepository = new AssignmentsRepository();
