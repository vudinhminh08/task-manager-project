import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../../auth/auth.service';
import { Task } from '../../task.models';
import { TaskService } from '../../task.service';
import { DashboardComponent } from './dashboard.component';

const todo: Task = { id: 1, title: 'Đọc sách', description: null, status: 'TODO', priority: 'HIGH', category: 'Cá nhân', dueDate: '2026-07-30', createdAt: '2026-07-30T08:00:00Z', updatedAt: '2026-07-30T08:00:00Z' };
const done: Task = { ...todo, id: 2, title: 'Đã xong', status: 'DONE', dueDate: null };

describe('Task DashboardComponent', () => {
  const service = { list: vi.fn(), delete: vi.fn() };
  const auth = { currentUser: vi.fn(), logout: vi.fn() };

  beforeEach(async () => {
    service.list.mockReset(); service.delete.mockReset(); auth.currentUser.mockReset(); auth.logout.mockReset();
    service.list.mockReturnValue(of([todo, done])); auth.currentUser.mockReturnValue({ id: 7, email: 'demo@example.com' });
    await TestBed.configureTestingModule({ imports: [DashboardComponent], providers: [provideRouter([]), { provide: TaskService, useValue: service }, { provide: AuthService, useValue: auth }] }).compileComponents();
  });

  it('loads tasks, calculates status and overdue summary, and normalizes filters', () => {
    const component = TestBed.createComponent(DashboardComponent).componentInstance;
    component.filters.setValue({ status: 'TODO', priority: 'HIGH', category: ' Cá nhân ' });
    component.applyFilters();
    expect(service.list).toHaveBeenCalledWith({ status: 'TODO', priority: 'HIGH', category: 'Cá nhân' });
    expect(component.summary.total).toBe(2);
    expect(component.summary.overdue).toBe(1);
  });

  it('clears filters and deletes only after confirmation', () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const component = TestBed.createComponent(DashboardComponent).componentInstance;
    component.deleteTask(1);
    expect(service.delete).not.toHaveBeenCalled();
    confirm.mockReturnValue(true); service.delete.mockReturnValue(of(undefined)); component.deleteTask(1);
    expect(service.delete).toHaveBeenCalledWith(1);
    component.clearFilters();
    expect(component.filters.getRawValue()).toEqual({ status: '', priority: '', category: '' });
    confirm.mockRestore();
  });

  it('exposes retryable API errors and logout navigation', () => {
    service.list.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500, error: { message: 'Không tải được dữ liệu' } })));
    const fixture = TestBed.createComponent(DashboardComponent); const router = TestBed.inject(Router); const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.detectChanges();
    expect(fixture.componentInstance.errorMessage).toBe('Không tải được dữ liệu');
    fixture.componentInstance.logout();
    expect(auth.logout).toHaveBeenCalled(); expect(navigate).toHaveBeenCalledWith(['/login']);
  });
});
