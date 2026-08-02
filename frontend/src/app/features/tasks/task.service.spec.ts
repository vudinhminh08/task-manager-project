import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { Task, TaskPayload } from './task.models';
import { TaskService } from './task.service';

const fixture: Task = {
  id: 4,
  title: 'Đọc sách',
  description: null,
  status: 'TODO',
  priority: 'MEDIUM',
  category: 'PERSONAL',
  dueDate: null,
  pinned: false,
  createdAt: '2026-07-31T08:00:00Z',
  updatedAt: '2026-07-31T08:00:00Z',
};
const payload: TaskPayload = {
  title: fixture.title,
  description: null,
  status: fixture.status,
  priority: fixture.priority,
  category: fixture.category,
  dueDate: null,
};

describe('TaskService', () => {
  let service: TaskService;
  let http: HttpTestingController;
  const url = `${environment.apiBaseUrl}/tasks`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TaskService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TaskService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('uses page metadata and omits absent filters', () => {
    service.list({ status: 'TODO', priority: undefined, category: '' }, 2, 10).subscribe();
    const request = http.expectOne((candidate) => candidate.url === url);
    expect(request.request.method).toBe('GET');
    expect(request.request.params.keys()).toEqual(['page', 'size', 'status']);
    expect(request.request.params.get('page')).toBe('2');
    expect(request.request.params.get('size')).toBe('10');
    expect(request.request.params.get('status')).toBe('TODO');
    request.flush({ items: [fixture], page: 2, size: 10, totalItems: 11, totalPages: 2 });

    service.pinned().subscribe();
    const pinned = http.expectOne(`${url}/pinned`);
    expect(pinned.request.method).toBe('GET');
    pinned.flush([fixture]);

    service.statistics().subscribe();
    const statistics = http.expectOne(`${url}/statistics`);
    expect(statistics.request.method).toBe('GET');
    statistics.flush({ todo: 1, inProgress: 0, done: 0, overdue: 1, overdueTasks: [fixture] });

    service.getById(4).subscribe();
    expect(http.expectOne(`${url}/4`).request.method).toBe('GET');

    service.create(payload).subscribe();
    const create = http.expectOne(url);
    expect(create.request.method).toBe('POST');
    expect(create.request.body).toEqual(payload);
    create.flush(fixture);

    service.update(4, payload).subscribe();
    const update = http.expectOne(`${url}/4`);
    expect(update.request.method).toBe('PUT');
    update.flush(fixture);

    service.updateStatus(4, 'DONE').subscribe();
    const status = http.expectOne(`${url}/4/status`);
    expect(status.request.method).toBe('PATCH');
    expect(status.request.body).toEqual({ status: 'DONE' });
    status.flush({ ...fixture, status: 'DONE' });

    service.updatePinned(4, true).subscribe();
    const pin = http.expectOne(`${url}/4/pin`);
    expect(pin.request.method).toBe('PATCH');
    expect(pin.request.body).toEqual({ pinned: true });
    pin.flush({ ...fixture, pinned: true });

    service.delete(4).subscribe();
    const remove = http.expectOne(`${url}/4`);
    expect(remove.request.method).toBe('DELETE');
    remove.flush(null);
  });
});
