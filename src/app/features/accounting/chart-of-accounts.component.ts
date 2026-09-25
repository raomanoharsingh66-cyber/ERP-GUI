import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AccountingService } from '../../core/services/accounting.service';
import { Account, AccountType, CreateAccountRequest } from '../../core/models/accounting.models';
import { NotificationService } from '../../core/services/notification.service';
import { HasPermissionDirective } from '../../core/directives/has-permission.directive';

@Component({
  selector: 'app-chart-of-accounts',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HasPermissionDirective],
  template: `
    <div class="accounting-page animate-fade-in">
      <!-- Page Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Chart of Accounts (CoA)</h1>
          <p class="page-subtitle">Configure general ledger accounts, classify financial assets, liabilities, and track real-time ledger balances.</p>
        </div>

        <div class="header-actions">
          <a routerLink="/accounts/journals" class="btn btn-secondary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Journal Vouchers
          </a>
          <a routerLink="/accounts/reports" class="btn btn-secondary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Financial Reports
          </a>
          <button *hasPermission="'Accounting.CreateEntry'" (click)="openCreateModal()" class="btn btn-primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Account
          </button>
        </div>
      </div>

      <!-- Financial Category Balance Cards -->
      <div class="kpi-grid">
        <div class="kpi-card kpi-assets" (click)="filterByType(AccountType.Asset)">
          <div class="kpi-icon-wrap">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" class="w-6 h-6 text-emerald-400">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
          </div>
          <div class="kpi-content">
            <span class="kpi-label">Total Assets</span>
            <span class="kpi-value text-emerald-400">₹{{ totalAssets() | number:'1.2-2' }}</span>
            <span class="kpi-meta">{{ assetCount() }} Active Accounts</span>
          </div>
        </div>

        <div class="kpi-card kpi-liabilities" (click)="filterByType(AccountType.Liability)">
          <div class="kpi-icon-wrap">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" class="w-6 h-6 text-rose-400">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
            </svg>
          </div>
          <div class="kpi-content">
            <span class="kpi-label">Total Liabilities</span>
            <span class="kpi-value text-rose-400">₹{{ totalLiabilities() | number:'1.2-2' }}</span>
            <span class="kpi-meta">{{ liabilityCount() }} Active Accounts</span>
          </div>
        </div>

        <div class="kpi-card kpi-equity" (click)="filterByType(AccountType.Equity)">
          <div class="kpi-icon-wrap">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" class="w-6 h-6 text-indigo-400">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div class="kpi-content">
            <span class="kpi-label">Total Equity</span>
            <span class="kpi-value text-indigo-400">₹{{ totalEquity() | number:'1.2-2' }}</span>
            <span class="kpi-meta">{{ equityCount() }} Active Accounts</span>
          </div>
        </div>

        <div class="kpi-card kpi-revenue" (click)="filterByType(AccountType.Revenue)">
          <div class="kpi-icon-wrap">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" class="w-6 h-6 text-amber-400">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div class="kpi-content">
            <span class="kpi-label">Revenue YTD</span>
            <span class="kpi-value text-amber-400">₹{{ totalRevenue() | number:'1.2-2' }}</span>
            <span class="kpi-meta">{{ revenueCount() }} Active Accounts</span>
          </div>
        </div>

        <div class="kpi-card kpi-expenses" (click)="filterByType(AccountType.Expense)">
          <div class="kpi-icon-wrap">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" class="w-6 h-6 text-purple-400">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
            </svg>
          </div>
          <div class="kpi-content">
            <span class="kpi-label">Expenses YTD</span>
            <span class="kpi-value text-purple-400">₹{{ totalExpenses() | number:'1.2-2' }}</span>
            <span class="kpi-meta">{{ expenseCount() }} Active Accounts</span>
          </div>
        </div>
      </div>

      <!-- Filter Tabs & Search Bar -->
      <div class="filters-card">
        <div class="type-tabs">
          <button (click)="filterByType(null)" [class.active]="selectedType() === null" class="tab-btn">
            All Accounts ({{ accounts().length }})
          </button>
          <button (click)="filterByType(AccountType.Asset)" [class.active]="selectedType() === AccountType.Asset" class="tab-btn">
            Assets
          </button>
          <button (click)="filterByType(AccountType.Liability)" [class.active]="selectedType() === AccountType.Liability" class="tab-btn">
            Liabilities
          </button>
          <button (click)="filterByType(AccountType.Equity)" [class.active]="selectedType() === AccountType.Equity" class="tab-btn">
            Equity
          </button>
          <button (click)="filterByType(AccountType.Revenue)" [class.active]="selectedType() === AccountType.Revenue" class="tab-btn">
            Revenue
          </button>
          <button (click)="filterByType(AccountType.Expense)" [class.active]="selectedType() === AccountType.Expense" class="tab-btn">
            Expenses
          </button>
        </div>

        <div class="search-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4 search-icon">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            placeholder="Search accounts by code or name..."
            class="search-input"
          />
        </div>
      </div>

      <!-- Accounts Table -->
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Account Code</th>
              <th>Account Name</th>
              <th>Type</th>
              <th>Subtype</th>
              <th class="text-right">Current Balance</th>
              <th>Classification</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            @if (loading()) {
              <tr>
                <td colspan="7" class="empty-cell">
                  <div class="spinner"></div>
                  <span>Loading Chart of Accounts...</span>
                </td>
              </tr>
            } @else if (filteredAccounts().length === 0) {
              <tr>
                <td colspan="7" class="empty-cell">
                  <div class="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-12 h-12 text-muted">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <p class="empty-title">No Accounts Found</p>
                    <p class="empty-desc">No accounts match the selected category or search filter.</p>
                  </div>
                </td>
              </tr>
            } @else {
              @for (acc of filteredAccounts(); track acc.id) {
                <tr class="table-row">
                  <td class="font-mono font-bold text-accent">{{ acc.accountCode }}</td>
                  <td>
                    <div class="font-semibold text-primary">{{ acc.accountName }}</div>
                    @if (acc.description) {
                      <div class="text-xs text-muted">{{ acc.description }}</div>
                    }
                  </td>
                  <td>
                    <span class="type-pill" [ngClass]="getTypeBadgeClass(acc.type)">
                      {{ acc.typeName }}
                    </span>
                  </td>
                  <td class="text-secondary text-sm">{{ acc.subtype || '—' }}</td>
                  <td class="text-right font-mono font-bold text-primary">
                    ₹{{ acc.currentBalance | number:'1.2-2' }}
                  </td>
                  <td>
                    @if (acc.isSystemAccount) {
                      <span class="system-badge">System Core</span>
                    } @else {
                      <span class="custom-badge">User Custom</span>
                    }
                  </td>
                  <td>
                    <span class="status-dot" [class.active]="acc.isActive"></span>
                    <span class="text-xs font-semibold">{{ acc.isActive ? 'Active' : 'Inactive' }}</span>
                  </td>
                </tr>
              }
            }
          </tbody>
        </table>
      </div>

      <!-- Create Account Modal -->
      @if (showCreateModal()) {
        <div class="modal-backdrop animate-fade-in" (click)="closeCreateModal()">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div>
                <h3 class="modal-title">Create General Ledger Account</h3>
                <p class="modal-subtitle">Add a new account to your business's Chart of Accounts.</p>
              </div>
              <button class="btn-icon" (click)="closeCreateModal()">✕</button>
            </div>

            <form (ngSubmit)="saveAccount()" class="modal-body">
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Account Code *</label>
                  <input
                    type="text"
                    [(ngModel)]="newAccount.accountCode"
                    name="accountCode"
                    placeholder="e.g. 1060 or 6040"
                    required
                    class="form-input font-mono"
                  />
                  <span class="form-hint">Standard: 1000s (Asset), 2000s (Liab), 3000s (Eq), 4000s (Rev), 5000s/6000s (Exp)</span>
                </div>

                <div class="form-group">
                  <label class="form-label">Account Name *</label>
                  <input
                    type="text"
                    [(ngModel)]="newAccount.accountName"
                    name="accountName"
                    placeholder="e.g. ICICI Corporate Current A/c"
                    required
                    class="form-input"
                  />
                </div>

                <div class="form-group">
                  <label class="form-label">Account Type *</label>
                  <select
                    [(ngModel)]="newAccount.type"
                    name="type"
                    required
                    class="form-select"
                  >
                    <option [ngValue]="AccountType.Asset">Asset (Debit balance)</option>
                    <option [ngValue]="AccountType.Liability">Liability (Credit balance)</option>
                    <option [ngValue]="AccountType.Equity">Equity (Credit balance)</option>
                    <option [ngValue]="AccountType.Revenue">Revenue (Credit balance)</option>
                    <option [ngValue]="AccountType.Expense">Expense (Debit balance)</option>
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label">Subtype / Subcategory</label>
                  <input
                    type="text"
                    [(ngModel)]="newAccount.subtype"
                    name="subtype"
                    placeholder="e.g. Bank, Current Asset, Fixed Asset, COGS"
                    class="form-input"
                  />
                </div>

                <div class="form-group">
                  <label class="form-label">Initial Opening Balance (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    [(ngModel)]="newAccount.initialBalance"
                    name="initialBalance"
                    placeholder="0.00"
                    class="form-input font-mono"
                  />
                </div>

                <div class="form-group">
                  <label class="form-label">Description / Purpose</label>
                  <input
                    type="text"
                    [(ngModel)]="newAccount.description"
                    name="description"
                    placeholder="Notes for accounting team"
                    class="form-input"
                  />
                </div>
              </div>

              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="closeCreateModal()">Cancel</button>
                <button type="submit" class="btn btn-primary" [disabled]="submitting()">
                  {{ submitting() ? 'Creating Account...' : 'Create Account' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .accounting-page {
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
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
      gap: 1rem;
    }
    .kpi-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: 12px;
      padding: 1.25rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .kpi-card:hover {
      transform: translateY(-2px);
      border-color: rgba(99, 102, 241, 0.4);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    }
    .kpi-icon-wrap {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.04);
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid rgba(255, 255, 255, 0.08);
    }
    .kpi-content {
      display: flex;
      flex-direction: column;
    }
    .kpi-label {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-secondary);
    }
    .kpi-value {
      font-size: 1.25rem;
      font-weight: 800;
      font-family: var(--font-mono);
      margin-top: 0.15rem;
    }
    .kpi-meta {
      font-size: 0.7rem;
      color: var(--text-muted);
      margin-top: 0.15rem;
    }
    .filters-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: 12px;
      padding: 0.75rem 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .type-tabs {
      display: flex;
      gap: 0.5rem;
      overflow-x: auto;
    }
    .tab-btn {
      padding: 0.4rem 0.85rem;
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 600;
      background: transparent;
      color: var(--text-secondary);
      border: 1px solid transparent;
      cursor: pointer;
      transition: all 0.15s ease;
      white-space: nowrap;
    }
    .tab-btn:hover {
      color: var(--text-primary);
      background: rgba(255, 255, 255, 0.04);
    }
    .tab-btn.active {
      background: rgba(99, 102, 241, 0.15);
      color: #818cf8;
      border-color: rgba(99, 102, 241, 0.3);
    }
    .search-wrap {
      position: relative;
      min-width: 260px;
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
    .search-input:focus {
      border-color: #6366f1;
      outline: none;
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
      font-size: 0.875rem;
    }
    .table-row:hover {
      background: rgba(255, 255, 255, 0.02);
    }
    .type-pill {
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
      text-transform: uppercase;
    }
    .pill-asset {
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }
    .pill-liability {
      background: rgba(244, 63, 94, 0.15);
      color: #fb7185;
      border: 1px solid rgba(244, 63, 94, 0.3);
    }
    .pill-equity {
      background: rgba(99, 102, 241, 0.15);
      color: #818cf8;
      border: 1px solid rgba(99, 102, 241, 0.3);
    }
    .pill-revenue {
      background: rgba(245, 158, 11, 0.15);
      color: #fbbf24;
      border: 1px solid rgba(245, 158, 11, 0.3);
    }
    .pill-expense {
      background: rgba(168, 85, 247, 0.15);
      color: #c084fc;
      border: 1px solid rgba(168, 85, 247, 0.3);
    }
    .system-badge {
      font-size: 0.65rem;
      font-weight: 700;
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
      background: rgba(59, 130, 246, 0.15);
      color: #60a5fa;
      border: 1px solid rgba(59, 130, 246, 0.3);
    }
    .custom-badge {
      font-size: 0.65rem;
      font-weight: 600;
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
      background: rgba(255, 255, 255, 0.05);
      color: var(--text-secondary);
    }
    .status-dot {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--text-muted);
      margin-right: 0.4rem;
    }
    .status-dot.active {
      background: #10b981;
      box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
    }
    .text-right { text-align: right; }
    .text-muted { color: var(--text-muted); }
    .text-accent { color: #818cf8; }
    .empty-cell {
      padding: 3rem 1rem !important;
      text-align: center;
    }
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }
    .empty-title {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--text-primary);
    }
    .empty-desc {
      font-size: 0.85rem;
      color: var(--text-secondary);
    }
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
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
      max-width: 600px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
      overflow: hidden;
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--border-subtle);
    }
    .modal-title {
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--text-primary);
    }
    .modal-subtitle {
      font-size: 0.8rem;
      color: var(--text-secondary);
    }
    .modal-body {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    .form-label {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-secondary);
    }
    .form-input, .form-select {
      padding: 0.6rem 0.85rem;
      background: var(--bg-surface-elevated);
      border: 1px solid var(--border-subtle);
      border-radius: 8px;
      color: var(--text-primary);
      font-size: 0.875rem;
    }
    .form-input:focus, .form-select:focus {
      border-color: #6366f1;
      outline: none;
    }
    .form-hint {
      font-size: 0.7rem;
      color: var(--text-muted);
    }
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border-subtle);
    }
    .btn-icon {
      background: transparent;
      border: none;
      color: var(--text-secondary);
      cursor: pointer;
      font-size: 1.1rem;
    }
  `]
})
export class ChartOfAccountsComponent implements OnInit {
  private accountingService = inject(AccountingService);
  private notification = inject(NotificationService);

  AccountType = AccountType;
  accounts = signal<Account[]>([]);
  loading = signal(false);
  submitting = signal(false);
  selectedType = signal<AccountType | null>(null);
  searchQuery = '';

  // Modal
  showCreateModal = signal(false);
  newAccount: CreateAccountRequest = {
    accountCode: '',
    accountName: '',
    type: AccountType.Asset,
    subtype: '',
    description: '',
    initialBalance: 0
  };

  // KPI Computations
  totalAssets = signal(0);
  assetCount = signal(0);
  totalLiabilities = signal(0);
  liabilityCount = signal(0);
  totalEquity = signal(0);
  equityCount = signal(0);
  totalRevenue = signal(0);
  revenueCount = signal(0);
  totalExpenses = signal(0);
  expenseCount = signal(0);

  ngOnInit(): void {
    this.loadAccounts();
  }

  loadAccounts(): void {
    this.loading.set(true);
    this.accountingService.getAccounts().subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.isSuccess && res.data) {
          this.accounts.set(res.data);
          this.computeKpis(res.data);
        }
      },
      error: () => {
        this.loading.set(false);
        this.notification.error('Failed to load Chart of Accounts.');
      }
    });
  }

  computeKpis(list: Account[]): void {
    let assets = 0, aCount = 0;
    let liabs = 0, lCount = 0;
    let eq = 0, eqCount = 0;
    let rev = 0, rCount = 0;
    let exp = 0, expCount = 0;

    for (const a of list) {
      if (!a.isActive) continue;
      switch (a.type) {
        case AccountType.Asset:
          assets += a.currentBalance;
          aCount++;
          break;
        case AccountType.Liability:
          liabs += a.currentBalance;
          lCount++;
          break;
        case AccountType.Equity:
          eq += a.currentBalance;
          eqCount++;
          break;
        case AccountType.Revenue:
          rev += a.currentBalance;
          rCount++;
          break;
        case AccountType.Expense:
          exp += a.currentBalance;
          expCount++;
          break;
      }
    }

    this.totalAssets.set(assets);
    this.assetCount.set(aCount);
    this.totalLiabilities.set(liabs);
    this.liabilityCount.set(lCount);
    this.totalEquity.set(eq);
    this.equityCount.set(eqCount);
    this.totalRevenue.set(rev);
    this.revenueCount.set(rCount);
    this.totalExpenses.set(exp);
    this.expenseCount.set(expCount);
  }

  filterByType(type: AccountType | null): void {
    this.selectedType.set(type);
  }

  filteredAccounts(): Account[] {
    let list = this.accounts();
    if (this.selectedType() !== null) {
      list = list.filter(a => a.type === this.selectedType());
    }
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      list = list.filter(a =>
        a.accountCode.toLowerCase().includes(q) ||
        a.accountName.toLowerCase().includes(q) ||
        (a.subtype && a.subtype.toLowerCase().includes(q))
      );
    }
    return list;
  }

  getTypeBadgeClass(type: AccountType): string {
    switch (type) {
      case AccountType.Asset: return 'pill-asset';
      case AccountType.Liability: return 'pill-liability';
      case AccountType.Equity: return 'pill-equity';
      case AccountType.Revenue: return 'pill-revenue';
      case AccountType.Expense: return 'pill-expense';
      default: return '';
    }
  }

  openCreateModal(): void {
    this.newAccount = {
      accountCode: '',
      accountName: '',
      type: AccountType.Asset,
      subtype: '',
      description: '',
      initialBalance: 0
    };
    this.showCreateModal.set(true);
  }

  closeCreateModal(): void {
    this.showCreateModal.set(false);
  }

  saveAccount(): void {
    if (!this.newAccount.accountCode || !this.newAccount.accountName) {
      this.notification.warning('Account code and account name are required.');
      return;
    }

    this.submitting.set(true);
    this.accountingService.createAccount(this.newAccount).subscribe({
      next: (res) => {
        this.submitting.set(false);
        if (res.isSuccess) {
          this.notification.success(`Account ${this.newAccount.accountCode} created successfully.`);
          this.closeCreateModal();
          this.loadAccounts();
        } else {
          this.notification.error(res.message || 'Failed to create account.');
        }
      },
      error: (err) => {
        this.submitting.set(false);
        this.notification.error(err.error?.message || 'Error occurred while creating account.');
      }
    });
  }
}
