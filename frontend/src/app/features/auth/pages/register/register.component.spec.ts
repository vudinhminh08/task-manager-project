import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import { ApiError } from '../../../../core/models/api-error';
import { AuthResponse } from '../../auth.models';
import { AuthService } from '../../auth.service';
import { RegisterComponent } from './register.component';

const authResponse: AuthResponse = {
  accessToken: 'registered-token',
  tokenType: 'Bearer',
  expiresIn: 7200,
  user: { id: 2, email: 'new.expense@example.com' },
};

const duplicateEmailError: ApiError = {
  timestamp: '2026-07-31T07:00:00Z',
  status: 409,
  code: 'EMAIL_ALREADY_EXISTS',
  message: 'Email đã được sử dụng',
  path: '/api/auth/register',
  fieldErrors: {},
};

const validationError: ApiError = {
  timestamp: '2026-07-31T07:00:00Z',
  status: 400,
  code: 'VALIDATION_ERROR',
  message: 'Dữ liệu đăng ký không hợp lệ',
  path: '/api/auth/register',
  fieldErrors: {
    email: 'Email không được phép sử dụng',
  },
};

describe('RegisterComponent', () => {
  const authService = {
    register: vi.fn(),
    login: vi.fn(),
  };

  let component: RegisterComponent;
  let router: Router;

  beforeEach(async () => {
    authService.register.mockReset();
    authService.login.mockReset();

    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: authService }],
    }).compileComponents();

    const fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
  });

  it('requires a valid email and a password from 8 to 72 characters', () => {
    component.form.setValue({ email: '', password: 'short' });
    expect(component.form.invalid).toBe(true);

    component.form.setValue({
      email: 'new.expense@example.com',
      password: 'Demo@2026',
    });
    expect(component.form.valid).toBe(true);

    component.form.controls.password.setValue('x'.repeat(73));
    expect(component.form.invalid).toBe(true);
  });

  it('does not register when the form is invalid', () => {
    component.submit();

    expect(component.form.controls.email.touched).toBe(true);
    expect(component.form.controls.password.touched).toBe(true);
    expect(authService.register).not.toHaveBeenCalled();
  });

  it('registers without a second login call and navigates to the dashboard', () => {
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    authService.register.mockReturnValue(of(authResponse));
    component.form.setValue({
      email: 'new.expense@example.com',
      password: 'Demo@2026',
    });

    component.submit();

    expect(authService.register).toHaveBeenCalledWith({
      email: 'new.expense@example.com',
      password: 'Demo@2026',
    });
    expect(authService.login).not.toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('shows the duplicate-email API message without inventing a field error', () => {
    authService.register.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            error: duplicateEmailError,
            status: 409,
            statusText: 'Conflict',
            url: '/api/auth/register',
          }),
      ),
    );
    component.form.setValue({
      email: 'existing@example.com',
      password: 'Demo@2026',
    });

    component.submit();

    expect(component.errorMessage).toBe('Email đã được sử dụng');
    expect(component.fieldErrors).toEqual({});
    expect(component.submitting).toBe(false);
  });

  it('shows and associates backend validation field errors', () => {
    authService.register.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            error: validationError,
            status: 400,
            statusText: 'Bad Request',
            url: '/api/auth/register',
          }),
      ),
    );
    const fixture = TestBed.createComponent(RegisterComponent);
    const renderedComponent = fixture.componentInstance;
    renderedComponent.form.setValue({
      email: 'blocked@example.com',
      password: 'Demo@2026',
    });

    renderedComponent.submit();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const emailInput = element.querySelector<HTMLInputElement>('#email');
    expect(renderedComponent.fieldErrors['email']).toBe('Email không được phép sử dụng');
    expect(renderedComponent.submitting).toBe(false);
    expect(emailInput?.getAttribute('aria-invalid')).toBe('true');
    expect(emailInput?.getAttribute('aria-describedby')).toBe('register-email-error');
    expect(element.querySelector('#register-email-error')?.textContent).toContain(
      'Email không được phép sử dụng',
    );
  });

  it('blocks repeated submissions while the registration request is pending', () => {
    const request = new Subject<AuthResponse>();
    authService.register.mockReturnValue(request);
    component.form.setValue({
      email: 'new.expense@example.com',
      password: 'Demo@2026',
    });

    component.submit();
    component.submit();

    expect(component.submitting).toBe(true);
    expect(authService.register).toHaveBeenCalledTimes(1);

    request.complete();
    expect(component.submitting).toBe(false);
  });

  it('renders field/API errors, loading state, and the login link', () => {
    const fixture = TestBed.createComponent(RegisterComponent);
    const renderedComponent = fixture.componentInstance;
    renderedComponent.submit();
    renderedComponent.fieldErrors = { email: 'Email đã được sử dụng' };
    renderedComponent.errorMessage = 'Không thể đăng ký lúc này';
    renderedComponent.submitting = true;
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const emailInput = element.querySelector<HTMLInputElement>('#email');
    const passwordInput = element.querySelector<HTMLInputElement>('#password');
    const submitButton = element.querySelector<HTMLButtonElement>('button[type="submit"]');
    const loginLink = element.querySelector<HTMLAnchorElement>('a');
    const form = element.querySelector<HTMLFormElement>('form');

    expect(element.textContent).toContain('Email đã được sử dụng');
    expect(element.textContent).toContain('Mật khẩu phải có từ 8 đến 72 ký tự.');
    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      'Không thể đăng ký lúc này',
    );
    expect(element.querySelector('#register-email-error')).not.toBeNull();
    expect(element.querySelector('#register-password-error')).not.toBeNull();
    expect(emailInput?.required).toBe(true);
    expect(emailInput?.maxLength).toBe(254);
    expect(emailInput?.getAttribute('aria-invalid')).toBe('true');
    expect(emailInput?.getAttribute('aria-describedby')).toBe('register-email-error');
    expect(passwordInput?.required).toBe(true);
    expect(passwordInput?.minLength).toBe(8);
    expect(passwordInput?.maxLength).toBe(72);
    expect(passwordInput?.getAttribute('aria-invalid')).toBe('true');
    expect(passwordInput?.getAttribute('aria-describedby')).toBe('register-password-error');
    expect(emailInput?.getAttribute('autocomplete')).toBe('email');
    expect(passwordInput?.getAttribute('autocomplete')).toBe('new-password');
    expect(form?.getAttribute('aria-describedby')).toBe('register-form-error');
    expect(element.querySelector('#register-form-error')?.getAttribute('role')).toBe('alert');
    expect(submitButton?.disabled).toBe(true);
    expect(submitButton?.textContent).toContain('Đang đăng ký...');
    expect(loginLink?.getAttribute('href')).toBe('/login');
  });
});
