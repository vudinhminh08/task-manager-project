import { HttpErrorResponse } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localeVi from '@angular/common/locales/vi';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import { Transaction } from '../../transaction.models';
import { TransactionService } from '../../transaction.service';
import { TransactionDetailComponent } from './transaction-detail.component';

const transaction: Transaction = {
  id: 18,
  type: 'EXPENSE',
  amount: 125000,
  category: 'Ăn uống',
  description: null,
  transactionDate: '2026-07-31',
  createdAt: '2026-07-31T08:00:00Z',
  updatedAt: '2026-07-31T09:00:00Z',
};

describe('TransactionDetailComponent', () => {
  const transactionService = { getById: vi.fn() };

  beforeAll(() => registerLocaleData(localeVi));

  beforeEach(async () => {
    transactionService.getById.mockReset();

    await TestBed.configureTestingModule({
      imports: [TransactionDetailComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => '18' } } },
        },
        { provide: TransactionService, useValue: transactionService },
      ],
    }).compileComponents();
  });

  it('loads and displays all transaction details', () => {
    transactionService.getById.mockReturnValue(of(transaction));
    const fixture = TestBed.createComponent(TransactionDetailComponent);
    fixture.detectChanges();

    expect(transactionService.getById).toHaveBeenCalledWith(18);
    expect(fixture.componentInstance.transaction).toEqual(transaction);
    expect(fixture.nativeElement.textContent).toContain('Ăn uống');
    expect(fixture.nativeElement.textContent).toContain('Không có mô tả');
  });

  it('shows loading and API error states', () => {
    const pending = new Subject<Transaction>();
    transactionService.getById.mockReturnValue(pending);
    const fixture = TestBed.createComponent(TransactionDetailComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.loading).toBe(true);

    transactionService.getById.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 404,
            error: { message: 'Không tìm thấy giao dịch' },
          }),
      ),
    );
    fixture.componentInstance.load();

    expect(fixture.componentInstance.loading).toBe(false);
    expect(fixture.componentInstance.errorMessage).toBe('Không tìm thấy giao dịch');
  });
});
