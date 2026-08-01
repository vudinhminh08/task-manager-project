import { Task } from './task.models';
import { calculateTaskSummary, isTaskOverdue } from './task-summary';

function task(overrides: Partial<Task>): Task {
  return {
    id: 1,
    title: 'Đọc sách',
    description: null,
    status: 'TODO',
    priority: 'MEDIUM',
    category: 'Cá nhân',
    dueDate: null,
    createdAt: '2026-07-31T08:00:00Z',
    updatedAt: '2026-07-31T08:00:00Z',
    ...overrides,
  };
}

describe('task summary', () => {
  it('counts statuses and overdue tasks without changing input', () => {
    const tasks = [
      task({ id: 1, dueDate: '2026-07-30' }),
      task({ id: 2, status: 'IN_PROGRESS', dueDate: '2026-08-01' }),
      task({ id: 3, status: 'DONE', dueDate: '2026-07-30' }),
    ];
    const before = [...tasks];

    expect(calculateTaskSummary(tasks, '2026-07-31')).toEqual({
      total: 3,
      todo: 1,
      inProgress: 1,
      done: 1,
      overdue: 1,
    });
    expect(tasks).toEqual(before);
  });

  it('considers only unfinished tasks with a date before today overdue', () => {
    expect(isTaskOverdue(task({ dueDate: '2026-07-30' }), '2026-07-31')).toBe(true);
    expect(isTaskOverdue(task({ dueDate: '2026-07-31' }), '2026-07-31')).toBe(false);
    expect(isTaskOverdue(task({ status: 'DONE', dueDate: '2026-07-30' }), '2026-07-31')).toBe(
      false,
    );
    expect(isTaskOverdue(task({ dueDate: null }), '2026-07-31')).toBe(false);
  });
});
