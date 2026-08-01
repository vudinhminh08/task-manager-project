import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ApiError } from '../../../../core/models/api-error';
import { Task } from '../../task.models';
import { isTaskOverdue } from '../../task-summary';
import { TaskService } from '../../task.service';

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
  task: Task | null = null;
  loading = false;
  errorMessage = '';
  readonly today = localIsoDate();

  constructor(
    private readonly tasksApi: TaskService,
    private readonly route: ActivatedRoute,
  ) {}
  get overdue(): boolean {
    return this.task !== null && isTaskOverdue(this.task, this.today);
  }
  ngOnInit(): void {
    this.load();
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
}
