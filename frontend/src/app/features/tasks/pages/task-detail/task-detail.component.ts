import { CommonModule, Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ApiError } from '../../../../core/models/api-error';
import { Task, TaskPriority, TaskStatus } from '../../task.models';
import { isTaskOverdue } from '../../task-summary';
import { TaskService } from '../../task.service';
import { taskCategoryLabel } from '../../task-categories';

function localIsoDate(date = new Date()): string {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 10);
}

@Component({
  selector: 'app-task-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './task-detail.component.html',
  styleUrl: './task-detail.component.css',
})
export class TaskDetailComponent implements OnInit {
  readonly categoryLabel = taskCategoryLabel;
  task: Task | null = null;
  loading = false;
  errorMessage = '';
  deleting = false;
  readonly today = localIsoDate();

  constructor(
    private readonly tasksApi: TaskService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly location: Location,
  ) {}
  get overdue(): boolean {
    return this.task !== null && isTaskOverdue(this.task, this.today);
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

  ngOnInit(): void {
    this.load();
  }

  goBack(): void {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      this.location.back();
      return;
    }
    void this.router.navigate(['/dashboard']);
  }

  load(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isInteger(id) || id <= 0) {
      this.errorMessage = 'Mã công việc không hợp lệ';
      return;
    }
    this.loading = true;
    this.errorMessage = '';
    this.tasksApi
      .getById(id)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (task) => (this.task = task),
        error: (error: HttpErrorResponse) => {
          this.task = null;
          const apiError = error.error as Partial<ApiError> | null;
          this.errorMessage =
            typeof apiError?.message === 'string'
              ? apiError.message
              : 'Không thể tải chi tiết công việc';
        },
      });
  }

  /* Fix #9: delete task from detail page */
  deleteTask(): void {
    if (!this.task || !window.confirm('Xóa công việc này?')) return;
    this.deleting = true;
    this.errorMessage = '';
    this.tasksApi
      .delete(this.task.id)
      .pipe(finalize(() => (this.deleting = false)))
      .subscribe({
        next: () => void this.router.navigate(['/dashboard']),
        error: (error: HttpErrorResponse) => {
          const apiError = error.error as Partial<ApiError> | null;
          this.errorMessage =
            typeof apiError?.message === 'string' ? apiError.message : 'Không thể xóa công việc';
        },
      });
  }
}
