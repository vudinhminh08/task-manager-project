import { HttpErrorResponse } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localeVi from '@angular/common/locales/vi';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../../auth/auth.service';
import { Transaction } from '../../transaction.models';
import { TransactionService } from '../../transaction.service';
import { DashboardComponent } from './dashboard.component';

const income: Transaction = {
  id: 1,
  type: 'INCOME',
  amount: 1000000,
  category: 'Lương',
  description: null,
  transactionDate: '2026-07-31',
  createdAt: '2026-07-31T08:00:00Z',
  updatedAt: '2026-07-31T08:00:00Z',
};

const expense: Transaction = {
  ...income,
  id: 2,
  type: 'EXPENSE',
  amount: 125000,
  category: 'Ăn uống',
};

describe('DashboardComponent', () => {
  const transactionService = {
    list: vi.fn(),
    delete: vi.fn(),
  };
  const authService = {
    currentUser: vi.fn(),
    logout: vi.fn(),
  };

  beforeAll(() => registerLocaleData(localeVi));

  beforeEach(async () => {
    transactionService.list.mockReset();
    transactionService.delete.mockReset();
    authService.currentUser.mockReset();
    authService.logout.mockReset();
    transactionService.list.mockReturnValue(of([income, expense]));
    authService.currentUser.mockReturnValue({ id: 7, email: 'demo@example.com' });

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
        { provide: TransactionService, useValue: transactionService },
        { provide: AuthService, useValue: authService },
      ],
    }).compileComponents();
  });

  it('loads transactions and calculates summary on init', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();

    expect(transactionService.list).toHaveBeenCalledWith({});
    expect(fixture.componentInstance.transactions).toEqual([income, expense]);
    expect(fixture.componentInstance.summary).toEqual({
      income: 1000000,
      expense: 125000,
      balance: 875000,
    });
  });

  it('loads with non-empty type, category, and month filters', () => {
    const component = TestBed.createComponent(DashboardComponent).componentInstance;
    component.filters.setValue({
      type: 'EXPENSE',
      category: ' Ăn uống ',
      month: '2026-07',
    });

    component.applyFilters();

    expect(transactionService.list).toHaveBeenCalledWith({
      type: 'EXPENSE',
      category: 'Ăn uống',
      month: '2026-07',
    });
  });

  it('reloads after a confirmed delete', () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    transactionService.delete.mockReturnValue(of(undefined));
    const component = TestBed.createComponent(DashboardComponent).componentInstance;

    component.deleteTransaction(2);

    expect(confirm).toHaveBeenCalledWith('Xóa giao dịch này?');
    expect(transactionService.delete).toHaveBeenCalledWith(2);
    expect(transactionService.list).toHaveBeenCalledWith({});
    confirm.mockRestore();
  });

  it('does not delete when confirmation is rejected', () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const component = TestBed.createComponent(DashboardComponent).componentInstance;

    component.deleteTransaction(2);

    expect(transactionService.delete).not.toHaveBeenCalled();
    confirm.mockRestore();
  });

  it('shows API errors and logs out to login', async () => {
    transactionService.list.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 500,
            error: { message: 'Không tải được dữ liệu' },
          }),
      ),
    );
    const fixture = TestBed.createComponent(DashboardComponent);
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.detectChanges();

    expect(fixture.componentInstance.errorMessage).toBe('Không tải được dữ liệu');
    expect(fixture.componentInstance.loading).toBe(false);
    expect(fixture.componentInstance.currentEmail).toBe('demo@example.com');

    fixture.componentInstance.logout();
    expect(authService.logout).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });
});
