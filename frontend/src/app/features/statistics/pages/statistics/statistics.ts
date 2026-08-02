import { Task, TaskPriority, TaskStatus, TaskStatisticsResponse } from '../../../tasks/task.models';
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
  return calculateStatisticsFromCounts({
    todo: counts.TODO,
    inProgress: counts.IN_PROGRESS,
    done: counts.DONE,
    overdue: counts.OVERDUE,
  });
}

export function calculateStatisticsFromCounts(
  counts: Pick<TaskStatisticsResponse, 'todo' | 'inProgress' | 'done' | 'overdue'>,
): TaskStatistic[] {
  const total = counts.todo + counts.inProgress + counts.done;
  const labels: Record<StatisticsKey, string> = {
    TODO: 'Cần làm',
    IN_PROGRESS: 'Đang làm',
    DONE: 'Hoàn thành',
    OVERDUE: 'Quá hạn',
  };

  const values: Record<StatisticsKey, number> = {
    TODO: counts.todo,
    IN_PROGRESS: counts.inProgress,
    DONE: counts.done,
    OVERDUE: counts.overdue,
  };
  return (Object.keys(values) as StatisticsKey[]).map((key) => ({
    key,
    label: labels[key],
    count: values[key],
    percentage: total === 0 ? 0 : Math.round((values[key] / total) * 100),
  }));
}
