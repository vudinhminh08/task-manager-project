import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import { Task } from '../../task.models';
import { TaskService } from '../../task.service';
import { TaskFormComponent } from './task-form.component';

const existing: Task = {
  id: 18,
  title: 'Chuẩn bị bài',
  description: null,
  status: 'IN_PROGRESS',
  priority: 'HIGH',
  category: 'Công việc',
  dueDate: '2026-08-02',
  createdAt: '2026-07-30T08:00:00Z',
  updatedAt: '2026-07-30T08:00:00Z',
};

describe('TaskFormComponent', () => {
  const service = { getById: vi.fn(), create: vi.fn(), update: vi.fn() };
  let routeId: string | null;

  beforeEach(async () => {
    routeId = null;
    service.getById.mockReset();
    service.create.mockReset();
    service.update.mockReset();
    await TestBed.configureTestingModule({
      imports: [TaskFormComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => routeId } } } },
        { provide: TaskService, useValue: service },
      ],
    }).compileComponents();
  });

  function valid(component: TaskFormComponent): void {
    component.form.setValue({
      title: '  Chuẩn bị bài  ',
      description: '  Ghi chú  ',
      status: 'TODO',
      priority: 'MEDIUM',
      category: '  Công việc  ',
      dueDate: '',
    });
  }

  it('requires title and category and enforces their limits', () => {
    const component = TestBed.createComponent(TaskFormComponent).componentInstance;
    component.form.patchValue({ title: '', category: '' });
    expect(component.form.invalid).toBe(true);
    component.form.controls.title.setValue('x'.repeat(121));
    component.form.controls.category.setValue('x'.repeat(51));
    expect(component.form.controls.title.hasError('maxlength')).toBe(true);
    expect(component.form.controls.category.hasError('maxlength')).toBe(true);
  });

  it('normalizes blank optional values and navigates after create', () => {
    const component = TestBed.createComponent(TaskFormComponent).componentInstance;
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    service.create.mockReturnValue(of(existing));
    valid(component);
    component.form.controls.description.setValue('');
    component.submit();
    expect(service.create).toHaveBeenCalledWith({
      title: 'Chuẩn bị bài', description: null, status: 'TODO', priority: 'MEDIUM', category: 'Công việc', dueDate: null,
    });
    expect(navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('loads edit data and captures backend field errors', () => {
    routeId = '18';
    service.getById.mockReturnValue(of(existing));
    service.update.mockReturnValue(throwError(() => new HttpErrorResponse({
      status: 400, error: { message: 'Dữ liệu không hợp lệ', fieldErrors: { title: 'Tiêu đề đã tồn tại' } },
    })));
    const component = TestBed.createComponent(TaskFormComponent).componentInstance;
    component.ngOnInit();
    expect(component.form.getRawValue()).toEqual({ title: existing.title, description: '', status: existing.status, priority: existing.priority, category: existing.category, dueDate: existing.dueDate });
    component.submit();
    expect(component.errorMessage).toBe('Dữ liệu không hợp lệ');
    expect(component.fieldErrors['title']).toBe('Tiêu đề đã tồn tại');
  });

  it('blocks double submission while pending', () => {
    const request = new Subject<Task>();
    service.create.mockReturnValue(request);
    const component = TestBed.createComponent(TaskFormComponent).componentInstance;
    valid(component);
    component.submit();
    component.submit();
    expect(service.create).toHaveBeenCalledTimes(1);
    expect(component.submitting).toBe(true);
    request.complete();
    expect(component.submitting).toBe(false);
  });

  it('redirects malformed edit routes instead of creating a task', () => {
    routeId = 'foo';
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const component = TestBed.createComponent(TaskFormComponent).componentInstance;
    component.ngOnInit();

    expect(component.invalidRoute).toBe(true);
    expect(service.getById).not.toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/dashboard']);
  });
});
