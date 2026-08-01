import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ApiError } from '../../../../core/models/api-error';
import { AuthService } from '../../auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: '../auth-page.css',
})
export class RegisterComponent {
  readonly form = new FormGroup({
    fullName: new FormControl('', { nonNullable: true }),
    phone: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(30)] }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email, Validators.maxLength(254)],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8), Validators.maxLength(72)],
    }),
  });

  submitting = false;
  errorMessage = '';
  fieldErrors: Record<string, string> = {};

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router,
  ) {}

  submit(): void {
    if (this.form.invalid || this.submitting) {
      this.form.markAllAsTouched();
      return;
    }

    const rawValue = this.form.getRawValue();
    const request = {
      email: rawValue.email.trim(),
      password: rawValue.password,
      ...(rawValue.fullName.trim() ? { fullName: rawValue.fullName.trim() } : {}),
      ...(rawValue.phone.trim() ? { phone: rawValue.phone.trim() } : {}),
    };

    this.submitting = true;
    this.errorMessage = '';
    this.fieldErrors = {};

    this.auth
      .register(request)
      .pipe(finalize(() => (this.submitting = false)))
      .subscribe({
        next: () => void this.router.navigate(['/dashboard']),
        error: (error: HttpErrorResponse) => {
          const apiError = error.error as Partial<ApiError> | null;
          this.errorMessage =
            typeof apiError?.message === 'string' ? apiError.message : 'Không thể đăng ký';
          this.fieldErrors =
            typeof apiError?.fieldErrors === 'object' &&
            apiError.fieldErrors !== null &&
            !Array.isArray(apiError.fieldErrors)
              ? apiError.fieldErrors
              : {};
        },
      });
  }
}
