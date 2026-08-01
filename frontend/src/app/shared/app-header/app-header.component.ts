import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../features/auth/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './app-header.component.html',
  styleUrl: './app-header.component.css',
})
export class AppHeaderComponent {
  readonly visible = signal(true);
  menuOpen = false;
  user: ReturnType<AuthService['currentUser']>;

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router,
  ) {
    this.visible.set(!['/login', '/register'].includes(this.router.url));
    this.user = this.auth.currentUser();
    this.auth.user$.subscribe((user) => (this.user = user));
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.visible.set(
          !['/login', '/register'].includes((event as NavigationEnd).urlAfterRedirects),
        );
        this.user = this.auth.currentUser();
        this.menuOpen = false;
      });
  }

  get displayName(): string {
    const fullName = this.user?.fullName?.trim();
    if (fullName) return fullName;
    const email = this.user?.email ?? '';
    const prefix = email.split('@')[0] ?? '';
    return prefix ? prefix.charAt(0).toUpperCase() + prefix.slice(1) : 'Bạn';
  }

  get initials(): string {
    const parts = this.displayName.split(/\s+/).filter(Boolean);
    return parts.length > 1
      ? `${parts[0]![0]}${parts.at(-1)![0]}`.toUpperCase()
      : (parts[0]?.[0] ?? 'B').toUpperCase();
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }
  closeMenu(): void {
    this.menuOpen = false;
  }
  logout(): void {
    this.auth.logout();
    this.menuOpen = false;
    void this.router.navigate(['/login']);
  }
}
