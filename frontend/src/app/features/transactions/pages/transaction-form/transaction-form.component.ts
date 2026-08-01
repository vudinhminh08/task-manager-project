import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ApiError } from '../../../../core/models/api-error';
import { TransactionPayload, TransactionType } from '../../transaction.models';
import { TransactionService } from '../../transaction.service';

function localIsoDate(date = new Date()): string {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 10);
}

function futureDate(control: AbstractControl<string>): ValidationErrors | null {
  return control.value && control.value > localIsoDate() ? { futureDate: true } : null;
}

@Component({
  selector: 'app-transaction-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './transaction-form.component.html',
  styleUrl: './transaction-form.component.css',
})
export class TransactionFormComponent implements OnInit {
  readonly today = localIsoDate();
  readonly form = new FormGroup({
    type: new FormControl<TransactionType>('EXPENSE', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    amount: new FormControl<number | null>(null, [Validators.required, Validators.min(0.01)]),
    category: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(50)],
    }),
    description: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(255)],
    }),
    transactionDate: new FormControl(this.today, {
      nonNullable: true,
      validators: [Validators.required, futureDate],
    }),
  });

  transactionId: number | null = null;
  loading = false;
  submitting = false;
  errorMessage = '';
  fieldErrors: Record<string, string> = {};

  constructor(
    private readonly transactionsApi: TransactionService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  get editMode(): boolean {
    return this.transactionId !== null;
  }

  ngOnInit(): void {
    const routeId = this.route.snapshot.paramMap.get('id');
    const id = Number(routeId);
    this.transactionId = routeId !== null && Number.isFinite(id) && id > 0 ? id : null;

    if (this.transactionId !== null) {
      this.loadTransaction(this.transactionId);
    }
  }

  submit(): void {
    if (this.form.invalid || this.submitting || this.loading) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const payload: TransactionPayload = {
      type: value.type,
      amount: value.amount!,
      category: value.category.trim(),
      description: value.description.trim() || null,
      transactionDate: value.transactionDate,
    };

    this.submitting = true;
    this.errorMessage = '';
    this.fieldErrors = {};
    const request =
      this.transactionId === null
        ? this.transactionsApi.create(payload)
        : this.transactionsApi.update(this.transactionId, payload);

    request.pipe(finalize(() => (this.submitting = false))).subscribe({
      next: () => void this.router.navigate(['/dashboard']),
      error: (error: HttpErrorResponse) => this.captureError(error, 'Không thể lưu giao dịch'),
    });
  }

  private loadTransaction(id: number): void {
    this.loading = true;
    this.errorMessage = '';
    this.transactionsApi
      .getById(id)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (transaction) => {
          this.form.setValue({
            type: transaction.type,
            amount: transaction.amount,
            category: transaction.category,
            description: transaction.description ?? '',
            transactionDate: transaction.transactionDate,
          });
        },
        error: (error: HttpErrorResponse) => this.captureError(error, 'Không thể tải giao dịch'),
      });
  }

  private captureError(error: HttpErrorResponse, fallback: string): void {
    const apiError = error.error as Partial<ApiError> | null;
    this.errorMessage = typeof apiError?.message === 'string' ? apiError.message : fallback;
    this.fieldErrors =
      apiError?.fieldErrors && typeof apiError.fieldErrors === 'object' ? apiError.fieldErrors : {};
  }
}
