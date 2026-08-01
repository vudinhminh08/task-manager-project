import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../../auth/auth.service';
import { ToastService } from '../../../../core/toast/toast.service';
import { ProfileComponent } from './profile.component';

describe('ProfileComponent', () => {
  const auth = { currentUser: vi.fn(), getProfile: vi.fn(), updateProfile: vi.fn() };
  const toast = { success: vi.fn(), error: vi.fn(), info: vi.fn() };

  beforeEach(async () => {
    auth.currentUser.mockReset();
    auth.getProfile.mockReset();
    auth.updateProfile.mockReset();
    toast.success.mockReset();
    toast.error.mockReset();
    auth.currentUser.mockReturnValue({
      id: 7,
      email: 'demo@example.com',
      fullName: 'Nguyễn Văn A',
      phone: '0900000000',
    });
    auth.getProfile.mockReturnValue(
      of({ id: 7, email: 'demo@example.com', fullName: 'Nguyễn Văn A', phone: '0900000000' }),
    );
    await TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: auth },
        { provide: ToastService, useValue: toast },
      ],
    }).compileComponents();
  });

  it('loads the profile with read-only email and phone controls', () => {
    const fixture = TestBed.createComponent(ProfileComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.form.getRawValue()).toEqual({
      fullName: 'Nguyễn Văn A',
      email: 'demo@example.com',
      phone: '0900000000',
    });
    expect(fixture.componentInstance.form.controls.email.disabled).toBe(true);
    expect(fixture.componentInstance.form.controls.phone.disabled).toBe(true);
  });

  it('updates full name, persists it through auth, and shows success toast', () => {
    auth.updateProfile.mockReturnValue(
      of({ id: 7, email: 'demo@example.com', fullName: 'Trần B', phone: null }),
    );
    const fixture = TestBed.createComponent(ProfileComponent);
    fixture.detectChanges();
    fixture.componentInstance.form.controls.fullName.setValue(' Trần B ');
    fixture.componentInstance.submit();
    expect(auth.updateProfile).toHaveBeenCalledWith({ fullName: 'Trần B' });
    expect(toast.success).toHaveBeenCalledWith('Đã cập nhật hồ sơ');
  });

  it('shows API errors without changing read-only fields', () => {
    auth.updateProfile.mockReturnValue(
      throwError(
        () => new HttpErrorResponse({ status: 400, error: { message: 'Tên không hợp lệ' } }),
      ),
    );
    const fixture = TestBed.createComponent(ProfileComponent);
    fixture.detectChanges();
    fixture.componentInstance.submit();
    expect(fixture.componentInstance.errorMessage).toBe('Tên không hợp lệ');
    expect(toast.error).toHaveBeenCalledWith('Tên không hợp lệ');
    expect(fixture.componentInstance.form.controls.email.disabled).toBe(true);
  });
});
