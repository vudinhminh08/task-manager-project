import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../features/auth/auth.service';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpTestingController;
  let authService: {
    token: ReturnType<typeof vi.fn>;
    logout: ReturnType<typeof vi.fn>;
  };
  let router: {
    navigateByUrl: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    authService = {
      token: vi.fn(),
      logout: vi.fn(),
    };
    router = {
      navigateByUrl: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
      ],
    });

    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('adds a bearer authorization header when a token exists', async () => {
    authService.token.mockReturnValue('signed-token');
    const client = TestBed.inject(HttpClient);

    const response = firstValueFrom(client.get('/api/tasks'));

    const request = http.expectOne('/api/tasks');
    expect(request.request.headers.get('Authorization')).toBe('Bearer signed-token');
    request.flush([]);
    await response;
  });

  it('leaves the authorization header unset when no token exists', async () => {
    authService.token.mockReturnValue(null);
    const client = TestBed.inject(HttpClient);

    const response = firstValueFrom(client.get('/api/tasks'));

    const request = http.expectOne('/api/tasks');
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush([]);
    await response;
  });

  it('logs out, redirects to login, and propagates a 401 response', async () => {
    authService.token.mockReturnValue('expired-token');
    const client = TestBed.inject(HttpClient);
    const response = firstValueFrom(client.get('/api/tasks'));

    const request = http.expectOne('/api/tasks');
    request.flush(null, { status: 401, statusText: 'Unauthorized' });

    await expect(response).rejects.toMatchObject({ status: 401 });
    expect(authService.logout).toHaveBeenCalledOnce();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
  });
});
