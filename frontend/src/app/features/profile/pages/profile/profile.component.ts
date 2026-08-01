import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ApiError } from '../../../../core/models/api-error';
import { ToastService } from '../../../../core/toast/toast.service';
import { AuthService } from '../../../auth/auth.service';
import { AuthUser } from '../../../auth/auth.models';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent implements OnInit {
  readonly form = new FormGroup({
    fullName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(100)],
    }),
    email: new FormControl({ value: '', disabled: true }, { nonNullable: true }),
    phone: new FormControl({ value: '', disabled: true }, { nonNullable: true }),
  });
  loading = false;
  saving = false;
  errorMessage = '';
  fieldErrors: Record<string, string> = {};

  constructor(
    private readonly auth: AuthService,
    private readonly toast: ToastService,
    private readonly router: Router,
  ) {}
  ngOnInit(): void {
    this.load();
  }
  load(): void {
    this.loading = true;
    this.errorMessage = '';
    this.auth
      .getProfile()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (user) => this.setUser(user),
        error: (error: HttpErrorResponse) => {
          const current = this.auth.currentUser();
          if (current) this.setUser(current);
          this.captureError(error, 'Không thể tải hồ sơ');
        },
      });
  }
  submit(): void {
    if (this.form.invalid || this.saving || this.loading) {
      this.form.controls.fullName.markAsTouched();
      return;
    }
    this.saving = true;
    this.errorMessage = '';
    this.fieldErrors = {};
    this.auth
      .updateProfile({ fullName: this.form.controls.fullName.value.trim() })
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: (user) => {
          this.setUser(user);
          this.toast.success('Đã cập nhật hồ sơ');
        },
        error: (error: HttpErrorResponse) => {
          this.captureError(error, 'Không thể cập nhật hồ sơ');
          this.toast.error(this.errorMessage);
        },
      });
  }
  cancel(): void {
    void this.router.navigate(['/dashboard']);
  }
  private setUser(user: AuthUser): void {
    this.form.setValue({
      fullName: user.fullName ?? '',
      email: user.email,
      phone: user.phone ?? '',
    });
  }
  private captureError(error: HttpErrorResponse, fallback: string): void {
    const apiError = error.error as Partial<ApiError> | null;
    this.errorMessage = typeof apiError?.message === 'string' ? apiError.message : fallback;
    this.fieldErrors =
      apiError?.fieldErrors && typeof apiError.fieldErrors === 'object' ? apiError.fieldErrors : {};
  }
}
