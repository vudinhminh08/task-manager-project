import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthRequest, AuthResponse, AuthUser } from './auth.models';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isAuthResponse(value: unknown): value is AuthResponse {
  if (!isRecord(value) || !isRecord(value['user'])) {
    return false;
  }

  const user = value['user'];
  const accessToken = value['accessToken'];
  const expiresIn = value['expiresIn'];
  const userId = user['id'];
  const email = user['email'];

  return (
    typeof accessToken === 'string' &&
    accessToken.trim().length > 0 &&
    value['tokenType'] === 'Bearer' &&
    typeof expiresIn === 'number' &&
    Number.isFinite(expiresIn) &&
    expiresIn > 0 &&
    typeof userId === 'number' &&
    Number.isInteger(userId) &&
    userId > 0 &&
    typeof email === 'string' &&
    email.trim().length > 0
  );
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly storageKey = 'task-manager.auth';

  constructor(private readonly http: HttpClient) {}

  register(request: AuthRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiBaseUrl}/auth/register`, request)
      .pipe(tap((response) => this.save(response)));
  }

  login(request: AuthRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiBaseUrl}/auth/login`, request)
      .pipe(tap((response) => this.save(response)));
  }

  logout(): void {
    localStorage.removeItem(this.storageKey);
  }

  token(): string | null {
    return this.read()?.accessToken ?? null;
  }

  currentUser(): AuthUser | null {
    return this.read()?.user ?? null;
  }

  isAuthenticated(): boolean {
    return this.token() !== null;
  }

  private save(response: AuthResponse): void {
    localStorage.setItem(this.storageKey, JSON.stringify(response));
  }

  private read(): AuthResponse | null {
    const value = localStorage.getItem(this.storageKey);
    if (!value) {
      return null;
    }

    try {
      const parsed: unknown = JSON.parse(value);
      if (isAuthResponse(parsed)) {
        return parsed;
      }
    } catch {
      // Invalid persisted JSON is handled the same as an invalid response shape.
    }

    this.logout();
    return null;
  }
}
