import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ApiError } from '../../../../core/models/api-error';
import { AuthService } from '../../../auth/auth.service';
import { TaskPriority, TaskStatus, Task, TaskFilters } from '../../task.models';
import { calculateTaskSummary, isTaskOverdue, TaskSummary } from '../../task-summary';
import { TaskService } from '../../task.service';

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

  constructor(
    private readonly tasksApi: TaskService,
    private readonly auth: AuthService,
    private readonly router: Router,
  ) {}

  get currentEmail(): string { return this.auth.currentUser()?.email ?? ''; }
  isOverdue(task: Task): boolean { return isTaskOverdue(task, this.today); }

  ngOnInit(): void { this.load(); }
  applyFilters(): void { this.load(); }
  clearFilters(): void { this.filters.reset({ status: '', priority: '', category: '' }); this.load(); }

  load(): void {
    this.loading = true;
    this.errorMessage = '';
    this.tasksApi.list(this.activeFilters()).pipe(finalize(() => (this.loading = false))).subscribe({
      next: (tasks) => { this.tasks = tasks; this.summary = calculateTaskSummary(tasks, this.today); },
      error: (error: HttpErrorResponse) => { this.errorMessage = this.errorText(error, 'Không thể tải danh sách công việc'); },
    });
  }

  deleteTask(id: number): void {
    if (!window.confirm('Xóa công việc này?')) return;
    this.deletingId = id;
    this.errorMessage = '';
    this.tasksApi.delete(id).pipe(finalize(() => (this.deletingId = null))).subscribe({
      next: () => this.load(),
      error: (error: HttpErrorResponse) => { this.errorMessage = this.errorText(error, 'Không thể xóa công việc'); },
    });
  }

  logout(): void { this.auth.logout(); void this.router.navigate(['/login']); }

  private activeFilters(): TaskFilters {
    const value = this.filters.getRawValue();
    const filters: TaskFilters = {};
    if (value.status) filters.status = value.status;
    if (value.priority) filters.priority = value.priority;
    if (value.category.trim()) filters.category = value.category.trim();
    return filters;
  }

  private errorText(error: HttpErrorResponse, fallback: string): string {
    const apiError = error.error as Partial<ApiError> | null;
    return typeof apiError?.message === 'string' ? apiError.message : fallback;
  }
}
