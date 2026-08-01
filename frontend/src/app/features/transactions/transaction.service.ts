import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Transaction, TransactionFilters, TransactionPayload } from './transaction.models';

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private readonly url = `${environment.apiBaseUrl}/transactions`;

  constructor(private readonly http: HttpClient) {}

  list(filters: TransactionFilters): Observable<Transaction[]> {
    let params = new HttpParams();

    if (filters.type) {
      params = params.set('type', filters.type);
    }
    if (filters.category) {
      params = params.set('category', filters.category);
    }
    if (filters.month) {
      params = params.set('month', filters.month);
    }

    return this.http.get<Transaction[]>(this.url, { params });
  }

  getById(id: number): Observable<Transaction> {
    return this.http.get<Transaction>(`${this.url}/${id}`);
  }

  create(payload: TransactionPayload): Observable<Transaction> {
    return this.http.post<Transaction>(this.url, payload);
  }

  update(id: number, payload: TransactionPayload): Observable<Transaction> {
    return this.http.put<Transaction>(`${this.url}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
