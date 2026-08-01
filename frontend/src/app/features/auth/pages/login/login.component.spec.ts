import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import { ApiError } from '../../../../core/models/api-error';
import { AuthResponse } from '../../auth.models';
import { AuthService } from '../../auth.service';
import { LoginComponent } from './login.component';

const authResponse: AuthResponse = {
  accessToken: 'signed-token',
  tokenType: 'Bearer',
  expiresIn: 7200,
  user: { id: 1, email: 'demo.expense@example.com' },
};

const invalidCredentialsError: ApiError = {
  timestamp: '2026-07-31T07:00:00Z',
  status: 401,
  code: 'INVALID_CREDENTIALS',
  message: 'Email hoặc mật khẩu không đúng',
  path: '/api/auth/login',
  fieldErrors: {},
};

describe('LoginComponent', () => {
  const authService = {
    login: vi.fn(),
  };

  let component: LoginComponent;
  let router: Router;

  beforeEach(async () => {
    authService.login.mockReset();

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: authService }],
    }).compileComponents();

    const fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
  });

  it('requires a valid email and a password from 8 to 72 characters', () => {
    component.form.setValue({ email: 'bad-email', password: 'short' });
    expect(component.form.invalid).toBe(true);

    component.form.setValue({
      email: 'demo.expense@example.com',
      password: 'Demo@2026',
    });
    expect(component.form.valid).toBe(true);

    component.form.controls.password.setValue('x'.repeat(73));
    expect(component.form.invalid).toBe(true);
  });

  it('marks fields as touched and does not log in when the form is invalid', () => {
    component.submit();

    expect(component.form.controls.email.touched).toBe(true);
    expect(component.form.controls.password.touched).toBe(true);
    expect(authService.login).not.toHaveBeenCalled();
  });

  it('logs in with the form values and navigates to the dashboard', () => {
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    authService.login.mockReturnValue(of(authResponse));
    component.form.setValue({
      email: 'demo.expense@example.com',
      password: 'Demo@2026',
    });

    component.submit();

    expect(authService.login).toHaveBeenCalledWith({
      email: 'demo.expense@example.com',
      password: 'Demo@2026',
    });
    expect(navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('shows the backend error message', () => {
    authService.login.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            error: invalidCredentialsError,
            status: 401,
            statusText: 'Unauthorized',
            url: '/api/auth/login',
          }),
      ),
    );
    component.form.setValue({
      email: 'demo.expense@example.com',
      password: 'Demo@2026',
    });

    component.submit();

    expect(component.errorMessage).toBe('Email hoặc mật khẩu không đúng');
    expect(component.submitting).toBe(false);
  });

  it('blocks repeated submissions while the login request is pending', () => {
    const request = new Subject<AuthResponse>();
    authService.login.mockReturnValue(request);
    component.form.setValue({
      email: 'demo.expense@example.com',
      password: 'Demo@2026',
    });

    component.submit();
    component.submit();

    expect(component.submitting).toBe(true);
    expect(authService.login).toHaveBeenCalledTimes(1);

    request.complete();
    expect(component.submitting).toBe(false);
  });

  it('renders validation, API error, loading state, and the registration link', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    const renderedComponent = fixture.componentInstance;
    renderedComponent.submit();
    renderedComponent.errorMessage = 'Không thể đăng nhập lúc này';
    renderedComponent.submitting = true;
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const emailInput = element.querySelector<HTMLInputElement>('#email');
    const passwordInput = element.querySelector<HTMLInputElement>('#password');
    const submitButton = element.querySelector<HTMLButtonElement>('button[type="submit"]');
    const registrationLink = element.querySelector<HTMLAnchorElement>('a');
    const form = element.querySelector<HTMLFormElement>('form');

    expect(element.textContent).toContain('Nhập email hợp lệ.');
    expect(element.textContent).toContain('Mật khẩu phải có từ 8 đến 72 ký tự.');
    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      'Không thể đăng nhập lúc này',
    );
    expect(element.querySelector('#login-email-error')).not.toBeNull();
    expect(element.querySelector('#login-password-error')).not.toBeNull();
    expect(emailInput?.required).toBe(true);
    expect(emailInput?.maxLength).toBe(254);
    expect(emailInput?.getAttribute('aria-invalid')).toBe('true');
    expect(emailInput?.getAttribute('aria-describedby')).toBe('login-email-error');
    expect(passwordInput?.required).toBe(true);
    expect(passwordInput?.minLength).toBe(8);
    expect(passwordInput?.maxLength).toBe(72);
    expect(passwordInput?.getAttribute('aria-invalid')).toBe('true');
    expect(passwordInput?.getAttribute('aria-describedby')).toBe('login-password-error');
    expect(emailInput?.getAttribute('autocomplete')).toBe('email');
    expect(passwordInput?.getAttribute('autocomplete')).toBe('current-password');
    expect(form?.getAttribute('aria-describedby')).toBe('login-form-error');
    expect(element.querySelector('#login-form-error')?.getAttribute('role')).toBe('alert');
    expect(submitButton?.disabled).toBe(true);
    expect(submitButton?.textContent).toContain('Đang đăng nhập...');
    expect(registrationLink?.getAttribute('href')).toBe('/register');
  });
});
