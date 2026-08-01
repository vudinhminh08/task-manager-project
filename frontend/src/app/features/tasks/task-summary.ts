import { Task } from './task.models';

export interface TaskSummary {
  total: number;
  todo: number;
  inProgress: number;
  done: number;
  overdue: number;
}

export function isTaskOverdue(task: Task, today: string): boolean {
  return task.dueDate !== null && task.dueDate < today && task.status !== 'DONE';
}

export function calculateTaskSummary(tasks: readonly Task[], today: string): TaskSummary {
  return {
    total: tasks.length,
    todo: tasks.filter((task) => task.status === 'TODO').length,
    inProgress: tasks.filter((task) => task.status === 'IN_PROGRESS').length,
    done: tasks.filter((task) => task.status === 'DONE').length,
    overdue: tasks.filter((task) => isTaskOverdue(task, today)).length,
  };
}
