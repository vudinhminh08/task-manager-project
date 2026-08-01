import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { Transaction, TransactionPayload } from './transaction.models';
import { TransactionService } from './transaction.service';

const transactionFixture: Transaction = {
  id: 18,
  type: 'EXPENSE',
  amount: 125000,
  category: 'Ăn uống',
  description: null,
  transactionDate: '2026-07-31',
  createdAt: '2026-07-31T08:00:00Z',
  updatedAt: '2026-07-31T08:00:00Z',
};

const payloadFixture: TransactionPayload = {
  type: 'EXPENSE',
  amount: 125000,
  category: 'Ăn uống',
  description: null,
  transactionDate: '2026-07-31',
};

describe('TransactionService', () => {
  let service: TransactionService;
  let http: HttpTestingController;
  const transactionsUrl = `${environment.apiBaseUrl}/transactions`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TransactionService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TransactionService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lists transactions with non-empty filters', () => {
    let response: Transaction[] | undefined;

    service
      .list({
        type: 'EXPENSE',
        category: 'Ăn uống',
        month: '2026-07',
      })
      .subscribe((transactions) => (response = transactions));

    const request = http.expectOne(
      (candidate) =>
        candidate.url === transactionsUrl &&
        candidate.params.get('type') === 'EXPENSE' &&
        candidate.params.get('category') === 'Ăn uống' &&
        candidate.params.get('month') === '2026-07',
    );
    expect(request.request.method).toBe('GET');
    expect(request.request.params.keys()).toEqual(['type', 'category', 'month']);
    request.flush([transactionFixture]);

    expect(response).toEqual([transactionFixture]);
  });

  it('omits empty optional filters', () => {
    service.list({ category: '', month: '' }).subscribe();

    const request = http.expectOne(transactionsUrl);
    expect(request.request.method).toBe('GET');
    expect(request.request.params.keys()).toEqual([]);
    request.flush([]);
  });

  it('gets a transaction by id', () => {
    let response: Transaction | undefined;

    service.getById(18).subscribe((transaction) => (response = transaction));

    const request = http.expectOne(`${transactionsUrl}/18`);
    expect(request.request.method).toBe('GET');
    expect(request.request.body).toBeNull();
    request.flush(transactionFixture);

    expect(response).toEqual(transactionFixture);
  });

  it('creates a transaction', () => {
    let response: Transaction | undefined;

    service.create(payloadFixture).subscribe((transaction) => (response = transaction));

    const request = http.expectOne(transactionsUrl);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(payloadFixture);
    request.flush(transactionFixture);

    expect(response).toEqual(transactionFixture);
  });

  it('updates a transaction', () => {
    let response: Transaction | undefined;

    service.update(18, payloadFixture).subscribe((transaction) => (response = transaction));

    const request = http.expectOne(`${transactionsUrl}/18`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual(payloadFixture);
    request.flush(transactionFixture);

    expect(response).toEqual(transactionFixture);
  });

  it('deletes a transaction', () => {
    let completed = false;

    service.delete(18).subscribe({ complete: () => (completed = true) });

    const request = http.expectOne(`${transactionsUrl}/18`);
    expect(request.request.method).toBe('DELETE');
    expect(request.request.body).toBeNull();
    request.flush(null);

    expect(completed).toBe(true);
  });
});
