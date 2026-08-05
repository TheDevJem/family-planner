import { defineStore } from 'pinia';
import type { AssignmentView } from 'src/db/models';
import { assignmentsRepository } from 'src/repositories/AssignmentsRepository';
import { childrenRepository } from 'src/repositories/ChildrenRepository';
import { choresRepository } from 'src/repositories/ChoresRepository';
import { fromDateKey, toDateKey } from 'src/composables/useDateTools';

export const useAssignmentsStore = defineStore('assignments', {
  state: () => ({
    assignments: [] as AssignmentView[],
    loading: false,
  }),
  getters: {
    byDate: (state) => (dateKey: string) => state.assignments.filter((assignment) => assignment.due_date === dateKey),
    today: (state) => state.assignments.filter((assignment) => assignment.due_date === toDateKey(new Date())),
  },
  actions: {
    async loadBetween(start: string, end: string) {
      this.loading = true;
      try {
        this.assignments = await assignmentsRepository.listBetween(start, end);
      } finally {
        this.loading = false;
      }
    },
    async loadForChild(childId: number) {
      this.assignments = await assignmentsRepository.listForChild(childId);
    },
    async complete(id: number) {
      const assignment = await assignmentsRepository.completionInfo(id);
      if (!assignment || assignment.completed) return;
      const chore = await choresRepository.find(assignment.chore_id);
      const points = chore?.points ?? assignment.points_awarded;
      await assignmentsRepository.markComplete(id, points);
      await childrenRepository.adjustPoints(assignment.child_id, points, `Completed ${assignment.chore_name}`);
    },
    async undo(id: number) {
      const assignment = await assignmentsRepository.completionInfo(id);
      if (!assignment || !assignment.completed) return;
      await assignmentsRepository.undoComplete(id);
      if (assignment.points_awarded) {
        await childrenRepository.adjustPoints(assignment.child_id, -assignment.points_awarded, `Undo ${assignment.chore_name}`);
      }
    },
    async move(id: number, dueDate: string) {
      const assignment = await assignmentsRepository.completionInfo(id);
      if (!assignment) return;
      const future = fromDateKey(dueDate) > new Date();
      const reset = assignment.completed && future;
      if (reset && assignment.points_awarded) {
        await childrenRepository.adjustPoints(assignment.child_id, -assignment.points_awarded, `Moved ${assignment.chore_name}`);
      }
      await assignmentsRepository.move(id, dueDate, reset);
    },
  },
});
