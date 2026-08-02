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
  category: 'PERSONAL',
  dueDate: '2026-07-30',
  pinned: false,
  createdAt: '2026-07-30T08:00:00Z',
  updatedAt: '2026-07-30T08:00:00Z',
};
const done: Task = { ...todo, id: 2, title: 'Đã xong', status: 'DONE', dueDate: null };

function page(items: Task[], currentPage = 1, totalItems = items.length, totalPages = 1) {
  return { items, page: currentPage, size: 10, totalItems, totalPages };
}

describe('Task DashboardComponent', () => {
  const service = {
    list: vi.fn(),
    pinned: vi.fn(),
    delete: vi.fn(),
    updateStatus: vi.fn(),
    updatePinned: vi.fn(),
  };
  const auth = { currentUser: vi.fn(), logout: vi.fn() };

  beforeEach(async () => {
    service.list.mockReset();
    service.pinned.mockReset();
    service.delete.mockReset();
    service.updateStatus.mockReset();
    service.updatePinned.mockReset();
    auth.currentUser.mockReset();
    auth.logout.mockReset();
    service.list.mockReturnValue(of(page([todo, done])));
    service.pinned.mockReturnValue(of([]));
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
    component.filters.setValue({ status: 'TODO', priority: 'HIGH', category: ' PERSONAL ' });
    component.applyFilters();
    expect(service.list).toHaveBeenCalledWith(
      {
        status: 'TODO',
        priority: 'HIGH',
        category: 'PERSONAL',
      },
      1,
      10,
    );
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
    service.list.mockReturnValueOnce(of(page([taskUnderTest]))).mockReturnValueOnce(of(page([])));
    service.updateStatus.mockReturnValue(of({ ...taskUnderTest, status: 'DONE' }));
    const component = TestBed.createComponent(DashboardComponent).componentInstance;
    component.filters.patchValue({ status: 'TODO' });
    component.load();
    component.updateStatus(taskUnderTest, { target: { value: 'DONE' } } as unknown as Event);
    expect(service.updateStatus).toHaveBeenCalledWith(1, 'DONE');
    expect(service.list).toHaveBeenLastCalledWith({ status: 'TODO' }, 1, 10);
    expect(component.tasks).toEqual([]);
  });

  it('toggles a pin and keeps pinned tasks independent from pagination', () => {
    service.updatePinned.mockReturnValue(of({ ...todo, id: 2, pinned: true }));
    const component = TestBed.createComponent(DashboardComponent).componentInstance;
    component.tasks = [{ ...todo, id: 2, pinned: false }];
    component.pinnedTasks = [{ ...todo, id: 1, pinned: true }];
    component.currentPage = 3;
    component.totalItems = 21;
    expect(component.pagedTasks).toHaveLength(1);
    expect(component.pinnedTasks).toHaveLength(1);
    component.togglePin(component.tasks[0]);
    expect(service.updatePinned).toHaveBeenCalledWith(2, true);
    expect(component.pinnedTasks).toHaveLength(2);
    expect(component.totalItems).toBe(21);
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
      category: 'PERSONAL',
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
    expect(cells[4].querySelectorAll('.task-action-button')).toHaveLength(2);
  });

  it('closes an open task menu when clicking outside the menu', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    const menu = fixture.nativeElement.querySelector('.task-menu') as HTMLDetailsElement;
    menu.open = true;

    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(menu.open).toBe(false);
  });

  it('starts the important-work section collapsed on mobile and can expand it', () => {
    const innerWidth = vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(390);
    service.list.mockReturnValue(of(page([{ ...todo, pinned: true }, done])));
    service.pinned.mockReturnValue(of([{ ...todo, pinned: true }]));
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();

    expect(
      (fixture.componentInstance as DashboardComponent & { pinnedOpen?: boolean }).pinnedOpen,
    ).toBe(false);
    expect(fixture.nativeElement.querySelector('.pinned-grid')).toBeNull();

    (fixture.componentInstance as DashboardComponent & { togglePinned: () => void }).togglePinned();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.pinned-grid')).toBeTruthy();
    const pinnedCard = fixture.nativeElement.querySelector('.pinned-card') as HTMLElement;
    expect(pinnedCard.querySelector('.pin-mark')).toBeTruthy();
    expect(pinnedCard.querySelector('.pinned-title')).toBeTruthy();
    expect(pinnedCard.querySelector('.pinned-due')).toBeTruthy();
    innerWidth.mockRestore();
  });

  it('uses a compact mobile card with one status control and condensed metadata', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();

    const card = fixture.nativeElement.querySelector('.task-card') as HTMLElement;
    expect(card.querySelector('.card-info')).toBeTruthy();
    expect(card.querySelector('.card-info .card-category')).toBeTruthy();
    expect(card.querySelector('.card-info .card-due')).toBeTruthy();
    expect(card.textContent).toContain('Cá nhân');
    expect(card.querySelector('.card-info .priority')).toBeNull();
    expect(card.querySelector('.card-header-actions .priority')).toBeTruthy();
    expect(card.querySelector('.card-heading .badge')).toBeNull();
    expect(card.querySelector('.card-actions .mobile-status')).toBeTruthy();
    expect(card.querySelectorAll('.task-action-button')).toHaveLength(2);
  });

  it('keeps the pinned section heading concise with an arrow-only toggle', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();

    const panel = fixture.nativeElement.querySelector('.pinned-panel') as HTMLElement;
    const toggle = panel.querySelector('.pinned-toggle') as HTMLButtonElement;
    expect(panel.querySelector('.eyebrow')).toBeNull();
    expect(toggle.querySelector('.pinned-toggle-icon')).toBeTruthy();
    expect(toggle.querySelector('.pinned-toggle-label')).toBeNull();
  });

  it('uses visual row states for overdue, TODO, and DONE tasks without an overdue label', () => {
    service.list.mockReturnValue(
      of(
        page([
          todo,
          { ...todo, id: 3, title: 'Đang làm', status: 'IN_PROGRESS', dueDate: null },
          done,
        ]),
      ),
    );
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(rows[0].classList).toContain('task-todo');
    expect(rows[0].classList).toContain('task-overdue');
    expect(rows[0].querySelector('.task-due-overdue')).toBeTruthy();
    expect(rows[1].classList).toContain('task-in-progress');
    expect(rows[2].classList).toContain('task-done');
    expect(fixture.nativeElement.querySelectorAll('.overdue-label')).toHaveLength(0);

    const cards = fixture.nativeElement.querySelectorAll('.task-card');
    expect(cards[0].classList).toContain('task-todo');
    expect(cards[0].classList).toContain('task-overdue');
    expect(cards[0].querySelector('.task-due-overdue')).toBeTruthy();
    expect(cards[1].classList).toContain('task-in-progress');
    expect(cards[2].classList).toContain('task-done');
  });
});
