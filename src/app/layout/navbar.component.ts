import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../core/services/auth.service';
import { ApiService } from '../core/services/api.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="navbar-header glass-panel">
      <!-- Search Input -->
      <div class="search-box">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="search-icon">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input type="text" placeholder="Search orders, invoices, products, customers... (Ctrl + K)" class="search-input" />
      </div>

      <!-- Right Actions -->
      <div class="navbar-actions">
        <!-- API Heartbeat indicator -->
        <div class="api-status-pill" [class.connected]="isApiConnected()">
          <span class="status-dot"></span>
          <span class="status-label">{{ isApiConnected() ? 'API Live (net9.0)' : 'Connecting...' }}</span>
        </div>

        <!-- Business Currency Indicator -->
        <div class="currency-badge">
          <span>Currency: <strong>INR (₹)</strong></span>
        </div>

        <!-- Notifications -->
        <button class="icon-btn" title="Notifications">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span class="badge-dot"></span>
        </button>

        <!-- User Profile Pill -->
        <div class="user-pill">
          <div class="user-avatar">
            {{ userInitials() }}
          </div>
          <div class="user-details">
            <span class="user-name">{{ userName() }}</span>
            <span class="user-email">{{ userEmail() }}</span>
          </div>
          <button (click)="logout()" class="logout-btn" title="Logout">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .navbar-header {
      height: 64px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 1.5rem;
      border-radius: 0;
      border-top: none;
      border-left: none;
      border-right: none;
      position: sticky;
      top: 0;
      z-index: 40;
    }
    .search-box {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: var(--bg-surface-elevated);
      padding: 0.5rem 0.875rem;
      border-radius: 8px;
      border: 1px solid var(--border-subtle);
      width: 400px;
    }
    .search-icon {
      width: 18px;
      height: 18px;
      color: var(--text-muted);
    }
    .search-input {
      background: transparent;
      border: none;
      outline: none;
      color: var(--text-primary);
      font-size: 0.825rem;
      width: 100%;
    }
    .search-input::placeholder {
      color: var(--text-muted);
    }
    .navbar-actions {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .api-status-pill {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.35rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      background: rgba(244, 63, 94, 0.1);
      color: #fb7185;
      border: 1px solid rgba(244, 63, 94, 0.3);
    }
    .api-status-pill.connected {
      background: rgba(16, 185, 129, 0.1);
      color: #34d399;
      border-color: rgba(16, 185, 129, 0.3);
    }
    .status-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: currentColor;
    }
    .currency-badge {
      font-size: 0.75rem;
      padding: 0.35rem 0.65rem;
      border-radius: 6px;
      background: var(--bg-surface-elevated);
      border: 1px solid var(--border-subtle);
      color: var(--text-secondary);
    }
    .currency-badge strong {
      color: #f59e0b;
    }
    .icon-btn {
      background: var(--bg-surface-elevated);
      border: 1px solid var(--border-subtle);
      color: var(--text-secondary);
      width: 36px;
      height: 36px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      position: relative;
      transition: all var(--transition-fast);
    }
    .icon-btn:hover {
      color: var(--text-primary);
      border-color: var(--primary);
    }
    .badge-dot {
      position: absolute;
      top: 6px;
      right: 6px;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--accent-rose);
      border: 2px solid var(--bg-surface-elevated);
    }
    .user-pill {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      padding: 0.25rem 0.5rem 0.25rem 0.25rem;
      background: var(--bg-surface-elevated);
      border-radius: 9999px;
      border: 1px solid var(--border-subtle);
    }
    .user-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--primary-gradient);
      color: #fff;
      font-weight: 700;
      font-size: 0.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .user-details {
      display: flex;
      flex-direction: column;
      line-height: 1.2;
    }
    .user-name {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-primary);
    }
    .user-email {
      font-size: 0.65rem;
      color: var(--text-muted);
    }
    .logout-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      padding: 0.25rem;
      display: flex;
      align-items: center;
      transition: color var(--transition-fast);
    }
    .logout-btn:hover {
      color: var(--accent-rose);
    }
    .w-4 { width: 1rem; }
    .h-4 { height: 1rem; }
    .w-5 { width: 1.25rem; }
    .h-5 { height: 1.25rem; }
  `]
})
export class NavbarComponent implements OnInit {
  private authService = inject(AuthService);
  private apiService = inject(ApiService);

  isApiConnected = signal<boolean>(false);

  userInitials = signal<string>('MS');
  userName = signal<string>('Manohar Singh');
  userEmail = signal<string>('admin@bizflow.local');

  ngOnInit(): void {
    this.checkHealth();
  }

  checkHealth(): void {
    this.apiService.get('system/health').subscribe({
      next: (res) => {
        if (res.success) {
          this.isApiConnected.set(true);
        }
      },
      error: () => {
        // Fallback demo indicator
        this.isApiConnected.set(false);
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
