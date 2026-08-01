import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ApiError } from '../../../../core/models/api-error';
import { AuthService } from '../../../auth/auth.service';
import { calculateSummary, TransactionSummary } from '../../transaction-summary';
import { Transaction, TransactionFilters, TransactionType } from '../../transaction.models';
import { TransactionService } from '../../transaction.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  transactions: Transaction[] = [];
  summary: TransactionSummary = { income: 0, expense: 0, balance: 0 };
  loading = false;
  errorMessage = '';
  deletingId: number | null = null;

  readonly filters = new FormGroup({
    type: new FormControl<TransactionType | ''>('', { nonNullable: true }),
    category: new FormControl('', { nonNullable: true }),
    month: new FormControl('', { nonNullable: true }),
  });

  constructor(
    private readonly transactionsApi: TransactionService,
    private readonly auth: AuthService,
    private readonly router: Router,
  ) {}

  get currentEmail(): string {
    return this.auth.currentUser()?.email ?? '';
  }

  ngOnInit(): void {
    this.load();
  }

  applyFilters(): void {
    this.load();
  }

  clearFilters(): void {
    this.filters.reset({ type: '', category: '', month: '' });
    this.load();
  }

  load(): void {
    this.loading = true;
    this.errorMessage = '';

    this.transactionsApi
      .list(this.activeFilters())
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (transactions) => {
          this.transactions = transactions;
          this.summary = calculateSummary(transactions);
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage = this.errorText(error, 'Không thể tải danh sách giao dịch');
        },
      });
  }

  deleteTransaction(id: number): void {
    if (!window.confirm('Xóa giao dịch này?')) {
      return;
    }

    this.deletingId = id;
    this.errorMessage = '';
    this.transactionsApi
      .delete(id)
      .pipe(finalize(() => (this.deletingId = null)))
      .subscribe({
        next: () => this.load(),
        error: (error: HttpErrorResponse) => {
          this.errorMessage = this.errorText(error, 'Không thể xóa giao dịch');
        },
      });
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigate(['/login']);
  }

  private activeFilters(): TransactionFilters {
    const value = this.filters.getRawValue();
    const filters: TransactionFilters = {};
    const category = value.category.trim();

    if (value.type) {
      filters.type = value.type;
    }
    if (category) {
      filters.category = category;
    }
    if (value.month) {
      filters.month = value.month;
    }
    return filters;
  }

  private errorText(error: HttpErrorResponse, fallback: string): string {
    const apiError = error.error as Partial<ApiError> | null;
    return typeof apiError?.message === 'string' ? apiError.message : fallback;
  }
}
