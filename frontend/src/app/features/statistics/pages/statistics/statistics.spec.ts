import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Task } from '../../../tasks/task.models';
import { TaskService } from '../../../tasks/task.service';
import { calculateStatistics, getOverdueTasks, StatisticsKey } from './statistics';
import { StatisticsComponent } from './statistics.component';

function task(overrides: Partial<Task>): Task {
  return {
    id: 1,
    title: 'Đọc sách',
    description: null,
    status: 'TODO',
    priority: 'MEDIUM',
    category: 'Cá nhân',
    dueDate: null,
    pinned: false,
    createdAt: '2026-07-31T08:00:00Z',
    updatedAt: '2026-07-31T08:00:00Z',
    ...overrides,
  };
}

describe('statistics helpers', () => {
  it('calculates Department/Status metrics and excludes DONE from overdue', () => {
    const metrics = calculateStatistics(
      [
        task({ id: 1, status: 'TODO', dueDate: '2026-07-30' }),
        task({ id: 2, status: 'IN_PROGRESS', dueDate: '2026-07-31' }),
        task({ id: 3, status: 'DONE', dueDate: '2026-07-30' }),
      ],
      '2026-08-01',
    );
    expect(metrics.map((metric) => metric.key)).toEqual<StatisticsKey[]>([
      'TODO',
      'IN_PROGRESS',
      'DONE',
      'OVERDUE',
    ]);
    expect(metrics.map((metric) => metric.count)).toEqual([1, 1, 1, 2]);
    expect(metrics.map((metric) => metric.percentage)).toEqual([33, 33, 33, 67]);
  });

  it('sorts overdue tasks by oldest date, then high priority', () => {
    const overdue = getOverdueTasks(
      [
        task({ id: 1, dueDate: '2026-07-31', priority: 'LOW' }),
        task({ id: 2, dueDate: '2026-07-30', priority: 'MEDIUM' }),
        task({ id: 3, dueDate: '2026-07-30', priority: 'HIGH' }),
        task({ id: 4, dueDate: '2026-07-30', status: 'DONE', priority: 'HIGH' }),
      ],
      '2026-08-01',
    );

    expect(overdue.map((item) => item.id)).toEqual([3, 2, 1]);
  });

  it('returns zero-height bars for an empty list', () => {
    expect(calculateStatistics([], '2026-08-01')).toEqual([
      { key: 'TODO', label: 'Cần làm', count: 0, percentage: 0 },
      { key: 'IN_PROGRESS', label: 'Đang làm', count: 0, percentage: 0 },
      { key: 'DONE', label: 'Hoàn thành', count: 0, percentage: 0 },
      { key: 'OVERDUE', label: 'Quá hạn', count: 0, percentage: 0 },
    ]);
  });
});

describe('StatisticsComponent', () => {
  const service = { list: vi.fn(), updateStatus: vi.fn() };

  beforeEach(async () => {
    service.list.mockReset();
    service.updateStatus.mockReset();
    await TestBed.configureTestingModule({
      imports: [StatisticsComponent],
      providers: [provideRouter([]), { provide: TaskService, useValue: service }],
    }).compileComponents();
  });

  it('loads the unfiltered task list and exposes four cards', () => {
    service.list.mockReturnValue(of([task({ id: 1 })]));
    const fixture = TestBed.createComponent(StatisticsComponent);
    fixture.detectChanges();
    expect(service.list).toHaveBeenCalledWith();
    expect(fixture.componentInstance.metrics).toHaveLength(4);
    expect(fixture.nativeElement.querySelectorAll('.metric-card')).toHaveLength(4);
    expect(fixture.nativeElement.querySelectorAll('.bar-column')).toHaveLength(3);
    expect(fixture.nativeElement.textContent).not.toContain('tuần');
  });

  it('renders an empty overdue panel when there are no overdue tasks', () => {
    service.list.mockReturnValue(of([]));
    const fixture = TestBed.createComponent(StatisticsComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.metric-card')).toHaveLength(4);
    expect(fixture.nativeElement.querySelector('.bar-column')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.overdue-empty')).toBeTruthy();
  });

  it('reloads statistics after completing an overdue task', () => {
    const overdue = task({ id: 9, dueDate: '2026-07-31', status: 'TODO' });
    service.list.mockReturnValueOnce(of([overdue])).mockReturnValueOnce(of([]));
    service.updateStatus.mockReturnValue(of({ ...overdue, status: 'DONE' }));
    const fixture = TestBed.createComponent(StatisticsComponent);
    fixture.detectChanges();

    fixture.componentInstance.updateStatus(overdue, {
      target: { value: 'DONE' },
    } as unknown as Event);

    expect(service.updateStatus).toHaveBeenCalledWith(9, 'DONE');
    expect(service.list).toHaveBeenCalledTimes(2);
    expect(fixture.componentInstance.overdueTasks).toEqual([]);
  });

  it('exposes a retryable API error', () => {
    service.list.mockReturnValue(
      throwError(
        () => new HttpErrorResponse({ status: 500, error: { message: 'Không tải được số liệu' } }),
      ),
    );
    const fixture = TestBed.createComponent(StatisticsComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.errorMessage).toBe('Không tải được số liệu');
  });
});
