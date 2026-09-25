import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { CurrentUser, LoginResponse, LoginRequest } from '../models/auth.model';
import { ApiResponse } from '../models/api-response.model';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'bizflow_access_token';
  private readonly REFRESH_KEY = 'bizflow_refresh_token';
  private readonly USER_KEY = 'bizflow_current_user';

  private router = inject(Router);
  private api = inject(ApiService);

  private currentUserSignal = signal<CurrentUser | null>(this.loadUserFromStorage());

  currentUser = computed(() => this.currentUserSignal());
  isAuthenticated = computed(() => !!this.currentUserSignal() && !!this.getToken());
  isSuperAdmin = computed(() => !!this.currentUserSignal()?.isSuperAdmin);

  login(credentials: LoginRequest): Observable<ApiResponse<LoginResponse>> {
    return this.api.post<LoginResponse>('auth/login', credentials).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.loginSuccess(res.data);
        }
      })
    );
  }

  registerBusiness(dto: any): Observable<ApiResponse<LoginResponse>> {
    return this.api.post<LoginResponse>('auth/register-business', dto).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.loginSuccess(res.data);
        }
      })
    );
  }

  loginSuccess(response: LoginResponse): void {
    localStorage.setItem(this.TOKEN_KEY, response.accessToken);
    if (response.refreshToken) {
      localStorage.setItem(this.REFRESH_KEY, response.refreshToken);
    }
    localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));
    this.currentUserSignal.set(response.user);
  }

  logout(): void {
    const token = this.getRefreshToken();
    if (token) {
      this.api.post('auth/revoke-token', token).subscribe();
    }
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSignal.set(null);
    this.router.navigate(['/auth/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_KEY);
  }

  hasPermission(permissionCode: string): boolean {
    const user = this.currentUserSignal();
    if (!user) return false;
    if (user.isSuperAdmin) return true;
    return user.permissions?.includes(permissionCode) ?? false;
  }

  private loadUserFromStorage(): CurrentUser | null {
    try {
      const stored = localStorage.getItem(this.USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }
}
