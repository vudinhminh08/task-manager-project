export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Task {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  category: string;
  dueDate: string | null;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaskPayload {
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  category: string;
  dueDate: string | null;
}

export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  category?: string;
}

export interface TaskStatusPayload {
  status: TaskStatus;
}

export interface TaskPinPayload {
  pinned: boolean;
}
