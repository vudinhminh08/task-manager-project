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
  category: 'Cá nhân',
  dueDate: null,
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

  it('uses exact task URLs and omits absent filters', () => {
    service.list({ status: 'TODO', priority: undefined, category: '' }).subscribe();
    const request = http.expectOne((candidate) => candidate.url === url);
    expect(request.request.method).toBe('GET');
    expect(request.request.params.keys()).toEqual(['status']);
    expect(request.request.params.get('status')).toBe('TODO');
    request.flush([fixture]);

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

    service.delete(4).subscribe();
    const remove = http.expectOne(`${url}/4`);
    expect(remove.request.method).toBe('DELETE');
    remove.flush(null);
  });
});
