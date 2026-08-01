import { HttpErrorResponse } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localeVi from '@angular/common/locales/vi';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Task } from '../../task.models';
import { TaskService } from '../../task.service';
import { TaskDetailComponent } from './task-detail.component';

const task: Task = {
  id: 9,
  title: 'Nộp báo cáo',
  description: null,
  status: 'IN_PROGRESS',
  priority: 'HIGH',
  category: 'Công việc',
  dueDate: '2026-07-30',
  createdAt: '2026-07-29T08:00:00Z',
  updatedAt: '2026-07-30T08:00:00Z',
};

describe('TaskDetailComponent', () => {
  const service = { getById: vi.fn() };
  beforeAll(() => registerLocaleData(localeVi));
  beforeEach(async () => {
    service.getById.mockReset();
    await TestBed.configureTestingModule({
      imports: [TaskDetailComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '9' } } } },
        { provide: TaskService, useValue: service },
      ],
    }).compileComponents();
  });

  it('loads all task details, labels null values, and marks overdue', () => {
    service.getById.mockReturnValue(of(task));
    const fixture = TestBed.createComponent(TaskDetailComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.task).toEqual(task);
    expect(fixture.componentInstance.overdue).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Nộp báo cáo');
    expect(fixture.nativeElement.textContent).toContain('Chưa có mô tả');
  });

  it('shows loading and retryable API error', () => {
    service.getById.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({ status: 404, error: { message: 'Không tìm thấy công việc' } }),
      ),
    );
    const fixture = TestBed.createComponent(TaskDetailComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.errorMessage).toBe('Không tìm thấy công việc');
    expect(fixture.componentInstance.loading).toBe(false);
  });
});
