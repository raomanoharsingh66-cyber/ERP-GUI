import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from './sidebar.component';
import { NavbarComponent } from './navbar.component';
import { NotificationService } from '../core/services/notification.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent, NavbarComponent],
  template: `
    <div class="layout-container">
      <app-sidebar></app-sidebar>
      <div class="layout-main">
        <app-navbar></app-navbar>
        <main class="layout-content">
          <router-outlet></router-outlet>
        </main>
      </div>

      <!-- Toast Container -->
      <div class="toast-container">
        @for (toast of notificationService.toasts(); track toast.id) {
          <div class="toast-item animate-fade-in" [class]="'toast-' + toast.type">
            <div class="toast-body">
              <strong class="toast-title">{{ toast.title }}</strong>
              <p class="toast-message">{{ toast.message }}</p>
            </div>
            <button (click)="notificationService.remove(toast.id)" class="toast-close">&times;</button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .layout-container {
      display: flex;
      height: 100vh;
      overflow: hidden;
      background: var(--bg-main);
    }
    .layout-main {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .layout-content {
      flex: 1;
      padding: 1.75rem 2rem;
      overflow-y: auto;
      background: radial-gradient(circle at top right, rgba(99, 102, 241, 0.05), transparent 40%);
    }
    .toast-container {
      position: fixed;
      bottom: 1.5rem;
      right: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      z-index: 9999;
    }
    .toast-item {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      min-width: 320px;
      max-width: 420px;
      padding: 0.875rem 1rem;
      border-radius: 10px;
      background: var(--bg-surface-elevated);
      border: 1px solid var(--border-subtle);
      box-shadow: var(--shadow-lg);
    }
    .toast-success {
      border-left: 4px solid var(--accent-emerald);
    }
    .toast-error {
      border-left: 4px solid var(--accent-rose);
    }
    .toast-warning {
      border-left: 4px solid var(--accent-amber);
    }
    .toast-info {
      border-left: 4px solid var(--primary);
    }
    .toast-body {
      flex: 1;
    }
    .toast-title {
      display: block;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-primary);
    }
    .toast-message {
      font-size: 0.775rem;
      color: var(--text-secondary);
      margin-top: 0.15rem;
    }
    .toast-close {
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      font-size: 1.25rem;
      line-height: 1;
    }
  `]
})
export class MainLayoutComponent {
  notificationService = inject(NotificationService);
}
