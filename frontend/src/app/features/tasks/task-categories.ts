export const TASK_CATEGORY_OPTIONS = [
  { value: 'STUDY', label: 'Học tập' },
  { value: 'WORK', label: 'Công việc' },
  { value: 'PERSONAL', label: 'Cá nhân' },
  { value: 'FAMILY', label: 'Gia đình' },
  { value: 'HEALTH', label: 'Sức khỏe' },
  { value: 'FINANCE', label: 'Tài chính' },
  { value: 'SHOPPING', label: 'Mua sắm' },
  { value: 'PROJECT', label: 'Dự án' },
  { value: 'PLANNING', label: 'Kế hoạch' },
  { value: 'HOME', label: 'Việc nhà' },
  { value: 'ENTERTAINMENT', label: 'Giải trí' },
  { value: 'OTHER', label: 'Khác' },
] as const;

export type TaskCategory = (typeof TASK_CATEGORY_OPTIONS)[number]['value'];

export const TASK_CATEGORIES: readonly TaskCategory[] = TASK_CATEGORY_OPTIONS.map(
  (option) => option.value,
);

export const TASK_CATEGORY_LABELS: Record<TaskCategory, string> = {
  STUDY: 'Học tập',
  WORK: 'Công việc',
  PERSONAL: 'Cá nhân',
  FAMILY: 'Gia đình',
  HEALTH: 'Sức khỏe',
  FINANCE: 'Tài chính',
  SHOPPING: 'Mua sắm',
  PROJECT: 'Dự án',
  PLANNING: 'Kế hoạch',
  HOME: 'Việc nhà',
  ENTERTAINMENT: 'Giải trí',
  OTHER: 'Khác',
};

const LEGACY_TASK_CATEGORY_CODES: Record<string, TaskCategory> = {
  'Học tập': 'STUDY',
  'Công việc': 'WORK',
  'Cá nhân': 'PERSONAL',
  'Gia đình': 'FAMILY',
  'Sức khỏe': 'HEALTH',
  'Tài chính': 'FINANCE',
  'Mua sắm': 'SHOPPING',
  'Dự án': 'PROJECT',
  'Kế hoạch': 'PLANNING',
  'Việc nhà': 'HOME',
  'Giải trí': 'ENTERTAINMENT',
  Khác: 'OTHER',
};

export function isTaskCategory(value: string): value is TaskCategory {
  return TASK_CATEGORIES.includes(value as TaskCategory);
}

export function taskCategoryCode(value: string): string {
  const normalized = value.trim();
  return LEGACY_TASK_CATEGORY_CODES[normalized] ?? normalized;
}

export function taskCategoryLabel(value: string): string {
  const code = taskCategoryCode(value);
  return isTaskCategory(code) ? TASK_CATEGORY_LABELS[code] : value;
}
