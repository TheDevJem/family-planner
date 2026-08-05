import type { Assignment, Child, Chore } from 'src/db/models';
import { assignmentsRepository } from 'src/repositories/AssignmentsRepository';
import { childrenRepository } from 'src/repositories/ChildrenRepository';
import { choresRepository } from 'src/repositories/ChoresRepository';
import { settingsRepository } from 'src/repositories/SettingsRepository';
import { addDays, startOfWeek, toDateKey } from './useDateTools';

function assignmentCount(assignments: Assignment[], childId: number, choreId?: number): number {
  return assignments.filter((assignment) => {
    if (assignment.child_id !== childId) return false;
    return choreId === undefined || assignment.chore_id === choreId;
  }).length;
}

function eligibleChildren(chore: Chore, children: Child[]): Child[] {
  if (chore.fixed_child_id) {
    return children.filter((child) => child.id === chore.fixed_child_id && child.age >= chore.minimum_age);
  }
  return children.filter((child) => child.age >= chore.minimum_age);
}

function chooseChild(chore: Chore, children: Child[], assignments: Assignment[]): Child | null {
  const eligible = eligibleChildren(chore, children);
  if (eligible.length === 0) return null;

  return [...eligible].sort((a, b) => {
    const choreDelta = assignmentCount(assignments, a.id, chore.id) - assignmentCount(assignments, b.id, chore.id);
    if (choreDelta !== 0) return choreDelta;
    const totalDelta = assignmentCount(assignments, a.id) - assignmentCount(assignments, b.id);
    if (totalDelta !== 0) return totalDelta;
    return a.age - b.age;
  })[0];
}

export function useChoreRotation() {
  async function runWeeklyRotation(anchor = new Date()): Promise<void> {
    const weekStart = startOfWeek(anchor);
    const weekKey = toDateKey(weekStart);
    const lastRotation = await settingsRepository.get('last_rotation_week');

    if (lastRotation === weekKey) return;

    const children = await childrenRepository.list();
    const chores = await choresRepository.list();
    const assignments = await assignmentsRepository.listAll();

    for (const chore of chores) {
      const days =
        chore.recurrence === 'daily'
          ? Array.from({ length: 7 }, (_, index) => toDateKey(addDays(weekStart, index)))
          : [weekKey];

      for (const dueDate of days) {
        const child = chooseChild(chore, children, assignments);
        if (!child) continue;

        const assignment: Omit<Assignment, 'id'> = {
          child_id: child.id,
          chore_id: chore.id,
          due_date: dueDate,
          completed: false,
          completion_timestamp: null,
          points_awarded: 0,
        };
        await assignmentsRepository.create(assignment);
        assignments.push({ ...assignment, id: -assignments.length - 1 });
      }
    }

    await settingsRepository.set('last_rotation_week', weekKey);
  }

  async function runIfSundayMidnightWindow(now = new Date()): Promise<void> {
    if (now.getDay() !== 0 || now.getHours() !== 0) return;
    await runWeeklyRotation(now);
  }

  return {
    runWeeklyRotation,
    runIfSundayMidnightWindow,
  };
}
