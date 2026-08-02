import {
  TASK_CATEGORIES,
  TASK_CATEGORY_OPTIONS,
  taskCategoryCode,
  taskCategoryLabel,
} from './task-categories';

describe('Task categories', () => {
  it('keeps exactly 12 predefined codes including OTHER', () => {
    expect(TASK_CATEGORIES).toEqual([
      'STUDY',
      'WORK',
      'PERSONAL',
      'FAMILY',
      'HEALTH',
      'FINANCE',
      'SHOPPING',
      'PROJECT',
      'PLANNING',
      'HOME',
      'ENTERTAINMENT',
      'OTHER',
    ]);
  });

  it('keeps Vietnamese labels in the frontend only', () => {
    expect(TASK_CATEGORY_OPTIONS[0]).toEqual({ value: 'STUDY', label: 'Học tập' });
    expect(taskCategoryLabel('STUDY')).toBe('Học tập');
    expect(taskCategoryCode('Học tập')).toBe('STUDY');
  });
});
