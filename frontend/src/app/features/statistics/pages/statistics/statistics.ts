import { Task, TaskPriority, TaskStatus } from '../../../tasks/task.models';
import { isTaskOverdue } from '../../../tasks/task-summary';

export type StatisticsKey = TaskStatus | 'OVERDUE';

export interface TaskStatistic {
  key: StatisticsKey;
  label: string;
  count: number;
  percentage: number;
}

const overduePriorityOrder: Record<TaskPriority, number> = {
  HIGH: 0,
  MEDIUM: 1,
  LOW: 2,
};

/** Returns overdue, incomplete tasks ordered from oldest deadline to newest. */
export function getOverdueTasks(tasks: readonly Task[], today: string): Task[] {
  return tasks
    .filter((task) => isTaskOverdue(task, today))
    .sort(
      (left, right) =>
        (left.dueDate ?? '').localeCompare(right.dueDate ?? '') ||
        overduePriorityOrder[left.priority] - overduePriorityOrder[right.priority],
    );
}

export function calculateStatistics(tasks: readonly Task[], today: string): TaskStatistic[] {
  const counts: Record<StatisticsKey, number> = {
    TODO: tasks.filter((task) => task.status === 'TODO').length,
    IN_PROGRESS: tasks.filter((task) => task.status === 'IN_PROGRESS').length,
    DONE: tasks.filter((task) => task.status === 'DONE').length,
    OVERDUE: tasks.filter((task) => isTaskOverdue(task, today)).length,
  };
  const total = tasks.length;
  const labels: Record<StatisticsKey, string> = {
    TODO: 'Cần làm',
    IN_PROGRESS: 'Đang làm',
    DONE: 'Hoàn thành',
    OVERDUE: 'Quá hạn',
  };

  return (Object.keys(counts) as StatisticsKey[]).map((key) => ({
    key,
    label: labels[key],
    count: counts[key],
    percentage: total === 0 ? 0 : Math.round((counts[key] / total) * 100),
  }));
}
