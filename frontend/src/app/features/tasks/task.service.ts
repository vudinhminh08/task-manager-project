import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Task,
  TaskFilters,
  TaskPayload,
  TaskPinPayload,
  TaskStatus,
  TaskStatusPayload,
} from './task.models';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly url = `${environment.apiBaseUrl}/tasks`;

  constructor(private readonly http: HttpClient) {}

  list(filters: TaskFilters = {}): Observable<Task[]> {
    let params = new HttpParams();
    if (filters.status) params = params.set('status', filters.status);
    if (filters.priority) params = params.set('priority', filters.priority);
    if (filters.category?.trim()) params = params.set('category', filters.category.trim());
    return this.http.get<Task[]>(this.url, { params });
  }

  getById(id: number): Observable<Task> {
    return this.http.get<Task>(`${this.url}/${id}`);
  }

  create(payload: TaskPayload): Observable<Task> {
    return this.http.post<Task>(this.url, payload);
  }

  update(id: number, payload: TaskPayload): Observable<Task> {
    return this.http.put<Task>(`${this.url}/${id}`, payload);
  }

  updateStatus(id: number, status: TaskStatus): Observable<Task> {
    const payload: TaskStatusPayload = { status };
    return this.http.patch<Task>(`${this.url}/${id}/status`, payload);
  }

  updatePinned(id: number, pinned: boolean): Observable<Task> {
    const payload: TaskPinPayload = { pinned };
    return this.http.patch<Task>(`${this.url}/${id}/pin`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
