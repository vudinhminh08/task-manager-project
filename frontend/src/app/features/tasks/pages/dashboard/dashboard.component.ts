import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, HostListener, OnInit, Optional } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ApiError } from '../../../../core/models/api-error';
import { AuthService } from '../../../auth/auth.service';
import { TASK_CATEGORY_OPTIONS, taskCategoryCode, taskCategoryLabel } from '../../task-categories';
import { TaskPriority, TaskStatus, Task, TaskFilters, TaskPayload } from '../../task.models';
import { calculateTaskSummary, isTaskOverdue, TaskSummary } from '../../task-summary';
import { TaskService } from '../../task.service';
import { ToastService } from '../../../../core/toast/toast.service';

function localIsoDate(date = new Date()): string {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 10);
}

@Component({
  selector: 'app-task-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  readonly categoryOptions = TASK_CATEGORY_OPTIONS;
  readonly categoryLabel = taskCategoryLabel;

  readonly today = localIsoDate();
  readonly filters = new FormGroup({
    status: new FormControl<TaskStatus | ''>('', { nonNullable: true }),
    priority: new FormControl<TaskPriority | ''>('', { nonNullable: true }),
    category: new FormControl('', { nonNullable: true }),
  });
  tasks: Task[] = [];
  summary: TaskSummary = { total: 0, todo: 0, inProgress: 0, done: 0, overdue: 0 };
  loading = false;
  errorMessage = '';
  deletingId: number | null = null;
  statusUpdatingId: number | null = null;
  pinUpdatingId: number | null = null;
  currentPage = 1;
  readonly pageSize = 10;
  pinnedOpen = typeof window === 'undefined' || window.innerWidth > 620;

  constructor(
    private readonly tasksApi: TaskService,
    private readonly auth: AuthService,
    private readonly router: Router,
    @Optional() private readonly toast: ToastService | null,
  ) {}

  get pagedTasks(): Task[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.tasks.slice(start, start + this.pageSize);
  }

  get pinnedTasks(): Task[] {
    return this.tasks.filter((task) => task.pinned);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.tasks.length / this.pageSize));
  }

  get showPagination(): boolean {
    return this.tasks.length > this.pageSize;
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, index) => index + 1);
  }

  get currentEmail(): string {
    return this.auth.currentUser()?.email ?? '';
  }

  get userName(): string {
    const email = this.currentEmail;
    if (!email) return 'Bạn';
    const storedName = localStorage.getItem('user_name_' + email);
    if (storedName) return storedName;

    const prefix = email.split('@')[0];
    if (!prefix) return email;
    return prefix.charAt(0).toUpperCase() + prefix.slice(1);
  }

  isOverdue(task: Task): boolean {
    return isTaskOverdue(task, this.today);
  }

  statusClass(status: TaskStatus): string {
    switch (status) {
      case 'TODO':
        return 'todo';
      case 'IN_PROGRESS':
        return 'progress';
      case 'DONE':
        return 'done';
    }
  }

  priorityClass(priority: TaskPriority): string {
    return priority.toLowerCase();
  }

  get emailInitial(): string {
    return (this.currentEmail?.charAt(0) ?? '').toUpperCase();
  }

  ngOnInit(): void {
    this.load();
  }

  @HostListener('document:click', ['$event'])
  closeTaskMenus(event: MouseEvent): void {
    const target = event.target;
    if (target instanceof Element && target.closest('.task-menu')) return;

    document.querySelectorAll<HTMLDetailsElement>('.task-menu[open]').forEach((menu) => {
      menu.removeAttribute('open');
    });
  }

  applyFilters(): void {
    this.load();
  }
  clearFilters(): void {
    this.filters.reset({ status: '', priority: '', category: '' });
    this.load();
  }

  togglePinned(): void {
    this.pinnedOpen = !this.pinnedOpen;
  }

  goToPage(page: number): void {
    this.currentPage = Math.min(Math.max(1, page), this.totalPages);
  }

  load(): void {
    this.currentPage = 1;
    this.loading = true;
    this.errorMessage = '';
    this.tasksApi
      .list(this.activeFilters())
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (tasks) => {
          this.tasks = tasks;
          this.summary = calculateTaskSummary(tasks, this.today);
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage = this.errorText(error, 'Không thể tải danh sách công việc');
        },
      });
  }

  updateStatus(task: Task, event: Event): void {
    const select = event.target as HTMLSelectElement | null;
    const status = select?.value as TaskStatus | undefined;
    if (!status || status === task.status) return;

    const previousStatus = task.status;
    this.statusUpdatingId = task.id;
    this.errorMessage = '';
    this.tasksApi
      .updateStatus(task.id, status)
      .pipe(finalize(() => (this.statusUpdatingId = null)))
      .subscribe({
        next: (updated) => {
          task.status = updated.status;
          this.toast?.success('Đã cập nhật trạng thái công việc');
          this.load();
        },
        error: (error: HttpErrorResponse) => {
          task.status = previousStatus;
          this.toast?.error(this.errorText(error, 'Không thể cập nhật trạng thái'));
        },
      });
  }

  togglePin(task: Task): void {
    const pinned = !task.pinned;
    this.pinUpdatingId = task.id;
    this.errorMessage = '';
    this.tasksApi
      .updatePinned(task.id, pinned)
      .pipe(finalize(() => (this.pinUpdatingId = null)))
      .subscribe({
        next: (updated) => {
          task.pinned = updated.pinned;
          this.toast?.success(updated.pinned ? 'Đã ghim công việc' : 'Đã bỏ ghim công việc');
        },
        error: (error: HttpErrorResponse) => {
          this.toast?.error(this.errorText(error, 'Không thể cập nhật ghim công việc'));
        },
      });
  }

  deleteTask(id: number): void {
    if (!window.confirm('Xóa công việc này?')) return;
    this.deletingId = id;
    this.errorMessage = '';
    this.tasksApi
      .delete(id)
      .pipe(finalize(() => (this.deletingId = null)))
      .subscribe({
        next: () => this.load(),
        error: (error: HttpErrorResponse) => {
          this.errorMessage = this.errorText(error, 'Không thể xóa công việc');
        },
      });
  }

  duplicateTask(task: Task): void {
    const clone: TaskPayload = {
      title: `Bản sao - ${task.title}`,
      description: task.description,
      status: task.status,
      priority: task.priority,
      category: taskCategoryCode(task.category),
      dueDate: task.dueDate,
    };
    void this.router.navigate(['/tasks/new'], {
      queryParams: { clone: JSON.stringify(clone) },
      state: { clone },
    });
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigate(['/login']);
  }

  private activeFilters(): TaskFilters {
    const value = this.filters.getRawValue();
    const filters: TaskFilters = {};
    if (value.status) filters.status = value.status;
    if (value.priority) filters.priority = value.priority;
    if (value.category.trim()) filters.category = taskCategoryCode(value.category);
    return filters;
  }

  private errorText(error: HttpErrorResponse, fallback: string): string {
    const apiError = error.error as Partial<ApiError> | null;
    return typeof apiError?.message === 'string' ? apiError.message : fallback;
  }
}
