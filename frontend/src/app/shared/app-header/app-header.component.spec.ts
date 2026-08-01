import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../features/auth/auth.service';
import { AppHeaderComponent } from './app-header.component';

describe('AppHeaderComponent', () => {
  const auth = {
    currentUser: vi.fn(),
    user$: of({ id: 7, email: 'demo@example.com', fullName: 'Tài khoản demo', phone: null }),
    logout: vi.fn(),
  };

  beforeEach(async () => {
    auth.currentUser.mockReset();
    auth.logout.mockReset();
    auth.currentUser.mockReturnValue({
      id: 7,
      email: 'demo@example.com',
      fullName: 'Tài khoản demo',
      phone: null,
    });
    await TestBed.configureTestingModule({
      imports: [AppHeaderComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: auth }],
    }).compileComponents();
  });

  it('keeps brand, navigation, and account controls in the desktop header row', () => {
    const fixture = TestBed.createComponent(AppHeaderComponent);
    fixture.detectChanges();

    const headerMain = fixture.nativeElement.querySelector('.header-main') as HTMLElement;
    const tabs = fixture.nativeElement.querySelectorAll(
      '.primary-tabs a',
    ) as NodeListOf<HTMLElement>;
    expect(headerMain.querySelector('.brand')).toBeTruthy();
    expect(headerMain.querySelector('.primary-tabs')).toBeTruthy();
    expect(headerMain.querySelector('.account')).toBeTruthy();
    expect(tabs).toHaveLength(2);
    expect(Array.from(tabs).map((tab) => tab.textContent?.trim())).toEqual([
      'Dashboard',
      'Thống kê',
    ]);
  });

  it('closes the account popup when clicking outside the account control', () => {
    const fixture = TestBed.createComponent(AppHeaderComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.menuOpen = true;
    fixture.detectChanges();

    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(component.menuOpen).toBe(false);
  });
});
