import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthRequest, AuthResponse } from './auth.models';
import { AuthService } from './auth.service';

const storedAuthFixture: AuthResponse = {
  accessToken: 'signed-token',
  tokenType: 'Bearer',
  expiresIn: 7200,
  user: { id: 1, email: 'demo@example.com' },
};

const invalidStoredAuthCases = [
  {
    name: 'a blank access token',
    value: JSON.stringify({ ...storedAuthFixture, accessToken: '   ' }),
  },
  {
    name: 'a zero expiration duration',
    value: JSON.stringify({ ...storedAuthFixture, expiresIn: 0 }),
  },
  {
    name: 'a negative expiration duration',
    value: JSON.stringify({ ...storedAuthFixture, expiresIn: -1 }),
  },
  {
    name: 'a non-finite expiration duration',
    value:
      '{"accessToken":"signed-token","tokenType":"Bearer","expiresIn":1e309,"user":{"id":1,"email":"demo@example.com"}}',
  },
  {
    name: 'a zero user id',
    value: JSON.stringify({
      ...storedAuthFixture,
      user: { ...storedAuthFixture.user, id: 0 },
    }),
  },
  {
    name: 'a non-integer user id',
    value: JSON.stringify({
      ...storedAuthFixture,
      user: { ...storedAuthFixture.user, id: 1.5 },
    }),
  },
  {
    name: 'a blank user email',
    value: JSON.stringify({
      ...storedAuthFixture,
      user: { ...storedAuthFixture.user, email: '   ' },
    }),
  },
] as const;

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [AuthService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('stores authentication after login', () => {
    const loginRequest: AuthRequest = {
      email: 'demo@example.com',
      password: 'Demo@2026',
    };
    const authResponse: AuthResponse = {
      accessToken: 'signed-token',
      tokenType: 'Bearer',
      expiresIn: 7200,
      user: { id: 1, email: 'demo@example.com' },
    };

    service.login(loginRequest).subscribe();

    const request = http.expectOne('/api/auth/login');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(loginRequest);
    request.flush(authResponse);

    expect(localStorage.getItem('task-manager.auth')).toBe(JSON.stringify(authResponse));
    expect(service.token()).toBe('signed-token');
    expect(service.currentUser()).toEqual(authResponse.user);
    expect(service.isAuthenticated()).toBe(true);
  });

  it('registers and stores authentication', () => {
    const registerRequest: AuthRequest = {
      email: 'new@example.com',
      password: 'Demo@2026',
    };
    const authResponse: AuthResponse = {
      accessToken: 'registered-token',
      tokenType: 'Bearer',
      expiresIn: 7200,
      user: { id: 2, email: 'new@example.com' },
    };

    service.register(registerRequest).subscribe();

    const request = http.expectOne('/api/auth/register');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(registerRequest);
    request.flush(authResponse);

    expect(localStorage.getItem('task-manager.auth')).toBe(JSON.stringify(authResponse));
    expect(service.token()).toBe('registered-token');
  });

  it('clears authentication on logout', () => {
    const authResponse: AuthResponse = {
      accessToken: 'signed-token',
      tokenType: 'Bearer',
      expiresIn: 7200,
      user: { id: 1, email: 'demo@example.com' },
    };
    localStorage.setItem('task-manager.auth', JSON.stringify(authResponse));

    service.logout();

    expect(localStorage.getItem('task-manager.auth')).toBeNull();
    expect(service.token()).toBeNull();
    expect(service.currentUser()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('clears malformed stored authentication', () => {
    localStorage.setItem('task-manager.auth', '{not-json');

    expect(service.token()).toBeNull();
    expect(localStorage.getItem('task-manager.auth')).toBeNull();
  });

  for (const testCase of invalidStoredAuthCases) {
    it(`clears stored authentication with ${testCase.name}`, () => {
      localStorage.setItem('task-manager.auth', testCase.value);

      expect(service.isAuthenticated()).toBe(false);
      expect(localStorage.getItem('task-manager.auth')).toBeNull();
    });
  }

  it('clears stored authentication with an invalid response shape', () => {
    localStorage.setItem(
      'task-manager.auth',
      JSON.stringify({
        accessToken: 123,
        tokenType: 'Bearer',
        expiresIn: 7200,
        user: { id: 1, email: 'demo@example.com' },
      }),
    );

    expect(service.token()).toBeNull();
    expect(localStorage.getItem('task-manager.auth')).toBeNull();
  });
});
