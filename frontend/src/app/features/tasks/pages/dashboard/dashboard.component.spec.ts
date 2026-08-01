import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../../auth/auth.service';
import { Task } from '../../task.models';
import { TaskService } from '../../task.service';
import { DashboardComponent } from './dashboard.component';

const todo: Task = {
  id: 1,
  title: 'Đọc sách',
  description: null,
  status: 'TODO',
  priority: 'HIGH',
  category: 'Cá nhân',
  dueDate: '2026-07-30',
  pinned: false,
  createdAt: '2026-07-30T08:00:00Z',
  updatedAt: '2026-07-30T08:00:00Z',
};
const done: Task = { ...todo, id: 2, title: 'Đã xong', status: 'DONE', dueDate: null };

describe('Task DashboardComponent', () => {
  const service = {
    list: vi.fn(),
    delete: vi.fn(),
    updateStatus: vi.fn(),
    updatePinned: vi.fn(),
  };
  const auth = { currentUser: vi.fn(), logout: vi.fn() };

  beforeEach(async () => {
    service.list.mockReset();
    service.delete.mockReset();
    service.updateStatus.mockReset();
    service.updatePinned.mockReset();
    auth.currentUser.mockReset();
    auth.logout.mockReset();
    service.list.mockReturnValue(of([todo, done]));
    auth.currentUser.mockReturnValue({ id: 7, email: 'demo@example.com' });
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
        { provide: TaskService, useValue: service },
        { provide: AuthService, useValue: auth },
      ],
    }).compileComponents();
  });

  it('loads tasks, calculates status and overdue summary, and normalizes filters', () => {
    const component = TestBed.createComponent(DashboardComponent).componentInstance;
    component.filters.setValue({ status: 'TODO', priority: 'HIGH', category: ' Cá nhân ' });
    component.applyFilters();
    expect(service.list).toHaveBeenCalledWith({
      status: 'TODO',
      priority: 'HIGH',
      category: 'Cá nhân',
    });
    expect(component.summary.total).toBe(2);
    expect(component.summary.overdue).toBe(1);
  });

  it('clears filters and deletes only after confirmation', () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const component = TestBed.createComponent(DashboardComponent).componentInstance;
    component.deleteTask(1);
    expect(service.delete).not.toHaveBeenCalled();
    confirm.mockReturnValue(true);
    service.delete.mockReturnValue(of(undefined));
    component.deleteTask(1);
    expect(service.delete).toHaveBeenCalledWith(1);
    component.clearFilters();
    expect(component.filters.getRawValue()).toEqual({ status: '', priority: '', category: '' });
    confirm.mockRestore();
  });

  it('exposes retryable API errors and logout navigation', () => {
    service.list.mockReturnValue(
      throwError(
        () => new HttpErrorResponse({ status: 500, error: { message: 'Không tải được dữ liệu' } }),
      ),
    );
    const fixture = TestBed.createComponent(DashboardComponent);
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.detectChanges();
    expect(fixture.componentInstance.errorMessage).toBe('Không tải được dữ liệu');
    fixture.componentInstance.logout();
    expect(auth.logout).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });

  it('reloads with active filters after a status change', () => {
    const taskUnderTest = { ...todo, status: 'TODO' as const };
    service.list.mockReturnValueOnce(of([taskUnderTest])).mockReturnValueOnce(of([]));
    service.updateStatus.mockReturnValue(of({ ...taskUnderTest, status: 'DONE' }));
    const component = TestBed.createComponent(DashboardComponent).componentInstance;
    component.filters.patchValue({ status: 'TODO' });
    component.load();
    component.updateStatus(taskUnderTest, { target: { value: 'DONE' } } as unknown as Event);
    expect(service.updateStatus).toHaveBeenCalledWith(1, 'DONE');
    expect(service.list).toHaveBeenLastCalledWith({ status: 'TODO' });
    expect(component.tasks).toEqual([]);
  });

  it('toggles a pin and keeps pinned tasks independent from pagination', () => {
    service.updatePinned.mockReturnValue(of({ ...todo, pinned: true }));
    const component = TestBed.createComponent(DashboardComponent).componentInstance;
    component.tasks = Array.from({ length: 21 }, (_, index) => ({
      ...todo,
      id: index + 1,
      pinned: index === 0,
    }));
    component.currentPage = 3;
    expect(component.pagedTasks).toHaveLength(1);
    expect(component.pinnedTasks).toHaveLength(1);
    component.togglePin(component.tasks[1]);
    expect(service.updatePinned).toHaveBeenCalledWith(2, true);
    expect(component.pinnedTasks).toHaveLength(2);
    component.goToPage(99);
    expect(component.currentPage).toBe(3);
  });

  it('navigates to a new form with a task clone draft', () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const component = TestBed.createComponent(DashboardComponent).componentInstance;

    component.duplicateTask(todo);

    expect(navigate).toHaveBeenCalledTimes(1);
    const [commands, extras] = navigate.mock.calls[0] as [
      unknown[],
      { queryParams: Record<string, string>; state: { clone: unknown } },
    ];
    expect(commands).toEqual(['/tasks/new']);
    const expected = {
      title: 'Bản sao - Đọc sách',
      description: null,
      status: 'TODO',
      priority: 'HIGH',
      category: 'Cá nhân',
      dueDate: '2026-07-30',
    };
    expect(JSON.parse(extras.queryParams['clone'])).toEqual(expected);
    expect(extras.state.clone).toEqual(expected);
  });

  it('keeps the due date in its own column and actions in the final column', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();

    const headers = Array.from(
      fixture.nativeElement.querySelectorAll('thead th') as NodeListOf<HTMLElement>,
    ).map((header) => header.textContent?.trim());
    expect(headers).toEqual(['Tiêu đề', 'Trạng thái', 'Ưu tiên', 'Hạn', 'Thao tác']);

    const cells = fixture.nativeElement.querySelectorAll('tbody tr:first-child td');
    expect(cells[3].classList).toContain('task-due-cell');
    expect(cells[4].classList).toContain('actions-cell');
    expect(cells[4].querySelectorAll('.pin-button, .task-menu')).toHaveLength(2);
  });

  it('closes an open task menu when clicking outside the menu', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    const menu = fixture.nativeElement.querySelector('.task-menu') as HTMLDetailsElement;
    menu.open = true;

    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(menu.open).toBe(false);
  });
});
