import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DashboardService } from '../../../core/services/dashboard.service';
import { AuditLog } from '../../../core/models/dashboard.models';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-audit-logs-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="audit-page animate-fade-in">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">System Audit Trail & Activity Log</h1>
          <p class="page-subtitle">Immutable chronological ledger of system operations, user changes, and security events.</p>
        </div>

        <div class="header-actions">
          <a routerLink="/settings/users" class="btn btn-secondary">Staff Accounts</a>
          <a routerLink="/settings/roles" class="btn btn-secondary">Roles & RBAC</a>
          <a routerLink="/settings/business" class="btn btn-secondary">Business Profile</a>
          <button (click)="loadLogs()" class="btn btn-primary">Refresh Logs</button>
        </div>
      </div>

      <!-- Filters Card -->
      <div class="filters-card">
        <div class="search-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4 search-icon">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            (keyup.enter)="loadLogs()"
            placeholder="Search by action, entity, user or IP..."
            class="search-input"
          />
        </div>
        <button class="btn btn-secondary" (click)="loadLogs()">Filter</button>
      </div>

      <!-- Table Container -->
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>User</th>
              <th>Action</th>
              <th>Entity</th>
              <th>Entity ID</th>
              <th>IP Address</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            @if (loading()) {
              <tr>
                <td colspan="7" class="empty-cell">
                  <div class="spinner"></div>
                  <span>Loading audit logs...</span>
                </td>
              </tr>
            } @else if (logs().length === 0) {
              <tr>
                <td colspan="7" class="empty-cell">
                  <div class="empty-state">
                    <p class="empty-title">No Audit Logs Recorded</p>
                    <p class="empty-desc">Operational changes will automatically appear here.</p>
                  </div>
                </td>
              </tr>
            } @else {
              @for (log of logs(); track log.id) {
                <tr class="table-row">
                  <td class="text-xs font-mono text-secondary">
                    {{ log.timestamp | date:'dd MMM yyyy, HH:mm:ss' }}
                  </td>
                  <td class="font-semibold text-primary text-sm">{{ log.userEmail || 'System Admin' }}</td>
                  <td>
                    <span class="action-pill" [ngClass]="getActionClass(log.action)">
                      {{ log.action }}
                    </span>
                  </td>
                  <td class="font-semibold text-accent text-sm">{{ log.entity }}</td>
                  <td class="font-mono text-xs text-muted">{{ log.entityId }}</td>
                  <td class="font-mono text-xs text-secondary">{{ log.ipAddress || '127.0.0.1' }}</td>
                  <td>
                    @if (log.newValue || log.oldValue) {
                      <button class="btn-link" (click)="inspectLog(log)">View Diff</button>
                    } @else {
                      <span class="text-xs text-muted">—</span>
                    }
                  </td>
                </tr>
              }
            }
          </tbody>
        </table>
      </div>

      <!-- Diff Modal -->
      @if (selectedLog()) {
        <div class="modal-backdrop animate-fade-in" (click)="closeModal()">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div>
                <h3 class="modal-title">Audit Record #{{ selectedLog()!.id }}</h3>
                <p class="modal-subtitle">{{ selectedLog()!.action }} on {{ selectedLog()!.entity }}</p>
              </div>
              <button class="btn-icon" (click)="closeModal()">✕</button>
            </div>
            <div class="modal-body">
              @if (selectedLog()!.oldValue) {
                <div class="diff-block">
                  <span class="diff-label">Old Value:</span>
                  <pre class="diff-content">{{ selectedLog()!.oldValue }}</pre>
                </div>
              }
              @if (selectedLog()!.newValue) {
                <div class="diff-block">
                  <span class="diff-label">New Value:</span>
                  <pre class="diff-content new">{{ selectedLog()!.newValue }}</pre>
                </div>
              }
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="closeModal()">Close</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .audit-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .page-title {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--text-primary);
      letter-spacing: -0.02em;
    }
    .page-subtitle {
      font-size: 0.875rem;
      color: var(--text-secondary);
      margin-top: 0.25rem;
    }
    .header-actions {
      display: flex;
      gap: 0.75rem;
      align-items: center;
    }
    .filters-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: 12px;
      padding: 0.75rem 1rem;
      display: flex;
      gap: 1rem;
      align-items: center;
    }
    .search-wrap {
      position: relative;
      flex: 1;
      max-width: 400px;
    }
    .search-icon {
      position: absolute;
      left: 0.85rem;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-muted);
    }
    .search-input {
      width: 100%;
      padding: 0.45rem 0.85rem 0.45rem 2.25rem;
      background: var(--bg-surface-elevated);
      border: 1px solid var(--border-subtle);
      border-radius: 8px;
      color: var(--text-primary);
      font-size: 0.85rem;
    }
    .table-container {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: 12px;
      overflow-x: auto;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }
    .data-table th {
      padding: 0.85rem 1rem;
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid var(--border-subtle);
      background: rgba(255, 255, 255, 0.02);
    }
    .data-table td {
      padding: 0.85rem 1rem;
      border-bottom: 1px solid var(--border-subtle);
    }
    .action-pill {
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
      text-transform: uppercase;
    }
    .pill-create { background: rgba(16, 185, 129, 0.15); color: #34d399; }
    .pill-update { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }
    .pill-delete { background: rgba(244, 63, 94, 0.15); color: #fb7185; }
    .btn-link {
      background: transparent;
      border: none;
      color: #818cf8;
      font-weight: 600;
      font-size: 0.8rem;
      cursor: pointer;
      text-decoration: underline;
    }
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 50;
      padding: 1rem;
    }
    .modal-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: 16px;
      width: 100%;
      max-width: 650px;
      overflow: hidden;
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--border-subtle);
    }
    .modal-title { font-size: 1.15rem; font-weight: 700; color: var(--text-primary); }
    .modal-subtitle { font-size: 0.8rem; color: var(--text-secondary); }
    .modal-body {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      max-height: 60vh;
      overflow-y: auto;
    }
    .diff-block {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .diff-label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); }
    .diff-content {
      background: rgba(0, 0, 0, 0.4);
      padding: 0.75rem;
      border-radius: 8px;
      font-size: 0.8rem;
      color: #fb7185;
      white-space: pre-wrap;
      word-break: break-all;
    }
    .diff-content.new { color: #34d399; }
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      padding: 1rem 1.5rem;
      border-top: 1px solid var(--border-subtle);
    }
    .btn-icon { background: transparent; border: none; color: var(--text-secondary); font-size: 1.1rem; cursor: pointer; }
    .text-accent { color: #818cf8; }
    .text-muted { color: var(--text-muted); }
    .empty-cell { padding: 3rem 1rem !important; text-align: center; }
  `]
})
export class AuditLogsListComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private notification = inject(NotificationService);

  logs = signal<AuditLog[]>([]);
  loading = signal(false);
  searchQuery = '';
  selectedLog = signal<AuditLog | null>(null);

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(): void {
    this.loading.set(true);
    this.dashboardService.getAuditLogs({ search: this.searchQuery }).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.isSuccess && res.data) {
          this.logs.set(res.data.items);
        }
      },
      error: () => {
        this.loading.set(false);
        this.notification.error('Failed to load audit logs.');
      }
    });
  }

  getActionClass(action: string): string {
    switch (action?.toLowerCase()) {
      case 'created':
      case 'create':
        return 'pill-create';
      case 'updated':
      case 'update':
        return 'pill-update';
      case 'deleted':
      case 'delete':
        return 'pill-delete';
      default:
        return 'pill-update';
    }
  }

  inspectLog(log: AuditLog): void {
    this.selectedLog.set(log);
  }

  closeModal(): void {
    this.selectedLog.set(null);
  }
}
