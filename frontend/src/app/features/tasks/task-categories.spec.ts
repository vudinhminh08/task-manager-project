import { TASK_CATEGORIES } from './task-categories';

describe('Task categories', () => {
  it('keeps exactly 12 predefined labels including Khác', () => {
    expect(TASK_CATEGORIES).toEqual([
      'Học tập',
      'Công việc',
      'Cá nhân',
      'Gia đình',
      'Sức khỏe',
      'Tài chính',
      'Mua sắm',
      'Dự án',
      'Kế hoạch',
      'Việc nhà',
      'Giải trí',
      'Khác',
    ]);
  });
});
