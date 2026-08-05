import type { Database } from 'sql.js';
import { defaultAvatarUrl } from 'src/services/avatarService';

export function seedDatabase(db: Database): void {
  const childCount = Number(db.exec('SELECT COUNT(*) AS count FROM children')[0]?.values[0]?.[0] ?? 0);
  if (childCount > 0) return;

  const children = [
    ['Avery', 8, '2018-04-12'],
    ['Milo', 11, '2015-09-03'],
    ['Riley', 6, '2020-01-22'],
  ];

  children.forEach(([name, age, birthday]) => {
    db.run(
      `INSERT INTO children (name, age, birthday, points_total, avatar_url, points_history)
       VALUES (?, ?, ?, 0, ?, '[]')`,
      [name, age, birthday, defaultAvatarUrl(String(name))],
    );
  });

  const chores = [
    ['Feed pet', 6, 3, 'daily', '#43a047', null],
    ['Set table', 5, 2, 'daily', '#fb8c00', null],
    ['Take out recycling', 10, 5, 'weekly', '#5e35b1', null],
    ['Clean own room', 4, 6, 'weekly', '#039be5', 1],
    ['Fold towels', 7, 4, 'weekly', '#d81b60', null],
    ['Water plants', 6, 2, 'weekly', '#00897b', null],
  ];

  chores.forEach((chore) => {
    db.run(
      `INSERT INTO chores (name, minimum_age, points, recurrence, color, fixed_child_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      chore,
    );
  });

  db.run(
    `INSERT INTO calendar_subscriptions (name, type, url, color, enabled)
     VALUES ('School Calendar', 'ics', 'https://example.com/school.ics', '#546e7a', 0)`,
  );
}
