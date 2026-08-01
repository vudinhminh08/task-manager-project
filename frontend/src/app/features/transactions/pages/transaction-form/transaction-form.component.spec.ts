import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import { Transaction } from '../../transaction.models';
import { TransactionService } from '../../transaction.service';
import { TransactionFormComponent } from './transaction-form.component';

const existing: Transaction = {
  id: 18,
  type: 'EXPENSE',
  amount: 125000,
  category: 'Ăn uống',
  description: 'Bữa trưa',
  transactionDate: '2026-07-30',
  createdAt: '2026-07-30T08:00:00Z',
  updatedAt: '2026-07-30T08:00:00Z',
};

describe('TransactionFormComponent', () => {
  const transactionService = {
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  };
  let routeId: string | null;

  beforeEach(async () => {
    routeId = null;
    transactionService.getById.mockReset();
    transactionService.create.mockReset();
    transactionService.update.mockReset();

    await TestBed.configureTestingModule({
      imports: [TransactionFormComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: () => routeId,
              },
            },
          },
        },
        { provide: TransactionService, useValue: transactionService },
      ],
    }).compileComponents();
  });

  function validForm(component: TransactionFormComponent): void {
    component.form.setValue({
      type: 'EXPENSE',
      amount: 125000,
      category: ' Ăn uống ',
      description: ' Bữa trưa ',
      transactionDate: component.today,
    });
  }

  it('rejects zero amount, empty category, and a future date', () => {
    const component = TestBed.createComponent(TransactionFormComponent).componentInstance;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    component.form.patchValue({
      amount: 0,
      category: '',
      transactionDate: tomorrow.toISOString().slice(0, 10),
    });

    expect(component.form.controls.amount.invalid).toBe(true);
    expect(component.form.controls.category.invalid).toBe(true);
    expect(component.form.controls.transactionDate.hasError('futureDate')).toBe(true);
  });

  it('creates a normalized payload and navigates to dashboard', () => {
    const component = TestBed.createComponent(TransactionFormComponent).componentInstance;
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    transactionService.create.mockReturnValue(of(existing));
    validForm(component);

    component.submit();

    expect(transactionService.create).toHaveBeenCalledWith({
      type: 'EXPENSE',
      amount: 125000,
      category: 'Ăn uống',
      description: 'Bữa trưa',
      transactionDate: component.today,
    });
    expect(navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('loads an edit route and updates the transaction', () => {
    routeId = '18';
    transactionService.getById.mockReturnValue(of(existing));
    transactionService.update.mockReturnValue(of(existing));
    const fixture = TestBed.createComponent(TransactionFormComponent);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    fixture.detectChanges();
    expect(transactionService.getById).toHaveBeenCalledWith(18);
    expect(fixture.componentInstance.form.getRawValue()).toEqual({
      type: 'EXPENSE',
      amount: 125000,
      category: 'Ăn uống',
      description: 'Bữa trưa',
      transactionDate: '2026-07-30',
    });

    fixture.componentInstance.submit();
    expect(transactionService.update).toHaveBeenCalledWith(18, {
      type: 'EXPENSE',
      amount: 125000,
      category: 'Ăn uống',
      description: 'Bữa trưa',
      transactionDate: '2026-07-30',
    });
    expect(navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('captures backend field errors', () => {
    transactionService.create.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            error: {
              message: 'Dữ liệu không hợp lệ',
              fieldErrors: { amount: 'Số tiền phải lớn hơn 0' },
            },
          }),
      ),
    );
    const component = TestBed.createComponent(TransactionFormComponent).componentInstance;
    validForm(component);

    component.submit();

    expect(component.errorMessage).toBe('Dữ liệu không hợp lệ');
    expect(component.fieldErrors['amount']).toBe('Số tiền phải lớn hơn 0');
  });

  it('blocks double submission while a request is pending', () => {
    const request = new Subject<Transaction>();
    transactionService.create.mockReturnValue(request);
    const component = TestBed.createComponent(TransactionFormComponent).componentInstance;
    validForm(component);

    component.submit();
    component.submit();

    expect(transactionService.create).toHaveBeenCalledTimes(1);
    expect(component.submitting).toBe(true);
    request.complete();
    expect(component.submitting).toBe(false);
  });
});
