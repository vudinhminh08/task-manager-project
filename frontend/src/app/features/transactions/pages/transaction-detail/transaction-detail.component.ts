import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ApiError } from '../../../../core/models/api-error';
import { Transaction } from '../../transaction.models';
import { TransactionService } from '../../transaction.service';

@Component({
  selector: 'app-transaction-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './transaction-detail.component.html',
  styleUrl: './transaction-detail.component.css',
})
export class TransactionDetailComponent implements OnInit {
  transaction: Transaction | null = null;
  loading = false;
  errorMessage = '';

  constructor(
    private readonly transactionsApi: TransactionService,
    private readonly route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isFinite(id) || id <= 0) {
      this.errorMessage = 'Mã giao dịch không hợp lệ';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.transactionsApi
      .getById(id)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (transaction) => (this.transaction = transaction),
        error: (error: HttpErrorResponse) => {
          this.transaction = null;
          const apiError = error.error as Partial<ApiError> | null;
          this.errorMessage =
            typeof apiError?.message === 'string'
              ? apiError.message
              : 'Không thể tải chi tiết giao dịch';
        },
      });
  }
}
