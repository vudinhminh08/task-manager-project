import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ApiError } from '../../../../core/models/api-error';
import { TaskPayload, TaskPriority, TaskStatus } from '../../task.models';
import { TaskService } from '../../task.service';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './task-form.component.html',
  styleUrl: './task-form.component.css',
})
export class TaskFormComponent implements OnInit {
  readonly form = new FormGroup({
    title: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(120)],
    }),
    description: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(500)],
    }),
    status: new FormControl<TaskStatus>('TODO', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    priority: new FormControl<TaskPriority>('MEDIUM', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    category: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(50)],
    }),
    dueDate: new FormControl('', { nonNullable: true }),
  });

  taskId: number | null = null;
  invalidRoute = false;
  loading = false;
  submitting = false;
  errorMessage = '';
  fieldErrors: Record<string, string> = {};

  constructor(
    private readonly tasksApi: TaskService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  get editMode(): boolean {
    return this.taskId !== null;
  }

  ngOnInit(): void {
    const routeId = this.route.snapshot.paramMap.get('id');
    const id = Number(routeId);
    if (routeId !== null && (!Number.isInteger(id) || id <= 0)) {
      this.invalidRoute = true;
      void this.router.navigate(['/dashboard']);
      return;
    }
    this.taskId = routeId !== null ? id : null;
    if (this.taskId !== null) this.loadTask(this.taskId);
  }

  submit(): void {
    if (this.form.invalid || this.submitting || this.loading) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const payload: TaskPayload = {
      title: value.title.trim(),
      description: value.description.trim() || null,
      status: value.status,
      priority: value.priority,
      category: value.category.trim(),
      dueDate: value.dueDate || null,
    };
    this.submitting = true;
    this.errorMessage = '';
    this.fieldErrors = {};
    const request =
      this.taskId === null
        ? this.tasksApi.create(payload)
        : this.tasksApi.update(this.taskId, payload);
    request.pipe(finalize(() => (this.submitting = false))).subscribe({
      next: () => void this.router.navigate(['/dashboard']),
      error: (error: HttpErrorResponse) => this.captureError(error, 'Không thể lưu công việc'),
    });
  }

  private loadTask(id: number): void {
    this.loading = true;
    this.errorMessage = '';
    this.tasksApi
      .getById(id)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (task) =>
          this.form.setValue({
            title: task.title,
            description: task.description ?? '',
            status: task.status,
            priority: task.priority,
            category: task.category,
            dueDate: task.dueDate ?? '',
          }),
        error: (error: HttpErrorResponse) => this.captureError(error, 'Không thể tải công việc'),
      });
  }

  private captureError(error: HttpErrorResponse, fallback: string): void {
    const apiError = error.error as Partial<ApiError> | null;
    this.errorMessage = typeof apiError?.message === 'string' ? apiError.message : fallback;
    this.fieldErrors =
      apiError?.fieldErrors && typeof apiError.fieldErrors === 'object' ? apiError.fieldErrors : {};
  }
}
