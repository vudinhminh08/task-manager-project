import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, Optional } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ApiError } from '../../../../core/models/api-error';
import { ToastService } from '../../../../core/toast/toast.service';
import { Task, TaskPriority, TaskStatus } from '../../../tasks/task.models';
import { TaskService } from '../../../tasks/task.service';
import { calculateStatistics, getOverdueTasks, TaskStatistic } from './statistics';

function localIsoDate(date = new Date()): string {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 10);
}

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './statistics.component.html',
  styleUrl: './statistics.component.css',
})
export class StatisticsComponent implements OnInit {
  readonly today = localIsoDate();
  tasks: Task[] = [];
  metrics: TaskStatistic[] = [];
  loading = false;
  errorMessage = '';
  statusUpdatingId: number | null = null;

  constructor(
    private readonly tasksApi: TaskService,
    @Optional() private readonly toast: ToastService | null,
  ) {}

  get overdueTasks(): Task[] {
    return getOverdueTasks(this.tasks, this.today);
  }

  get statusMetrics(): TaskStatistic[] {
    return this.metrics.filter((metric) => metric.key !== 'OVERDUE');
  }

  barHeight(metric: TaskStatistic): number {
    const maximum = Math.max(...this.statusMetrics.map((item) => item.count), 0);
    return maximum === 0 ? 0 : Math.round((metric.count / maximum) * 100);
  }

  statusLabel(status: TaskStatus): string {
    return status === 'TODO' ? 'Cần làm' : status === 'IN_PROGRESS' ? 'Đang làm' : 'Hoàn thành';
  }

  statusClass(status: TaskStatus): string {
    return status === 'IN_PROGRESS' ? 'progress' : status.toLowerCase();
  }

  priorityLabel(priority: TaskPriority): string {
    return priority === 'HIGH' ? 'Cao' : priority === 'LOW' ? 'Thấp' : 'Trung bình';
  }

  priorityClass(priority: TaskPriority): string {
    return priority.toLowerCase();
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.errorMessage = '';
    this.tasksApi
      .list()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (tasks) => {
          this.tasks = tasks;
          this.metrics = calculateStatistics(tasks, this.today);
        },
        error: (error: HttpErrorResponse) => {
          const apiError = error.error as Partial<ApiError> | null;
          this.errorMessage =
            typeof apiError?.message === 'string'
              ? apiError.message
              : 'Không thể tải số liệu công việc';
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
        next: () => {
          this.toast?.success('Đã cập nhật trạng thái công việc');
          this.load();
        },
        error: (error: HttpErrorResponse) => {
          task.status = previousStatus;
          if (select) select.value = previousStatus;
          const apiError = error.error as Partial<ApiError> | null;
          this.toast?.error(
            typeof apiError?.message === 'string'
              ? apiError.message
              : 'Không thể cập nhật trạng thái',
          );
        },
      });
  }
}
