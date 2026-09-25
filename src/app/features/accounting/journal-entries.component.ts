import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AccountingService } from '../../core/services/accounting.service';
import {
  JournalEntry,
  JournalEntryType,
  Account,
  CreateJournalEntryRequest
} from '../../core/models/accounting.models';
import { NotificationService } from '../../core/services/notification.service';
import { HasPermissionDirective } from '../../core/directives/has-permission.directive';

interface FormJournalLine {
  accountId: string;
  debit: number;
  credit: number;
  description: string;
}

@Component({
  selector: 'app-journal-entries',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HasPermissionDirective],
  template: `
    <div class="journals-page animate-fade-in">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">General Ledger & Journal Vouchers</h1>
          <p class="page-subtitle">Record and audit double-entry transactions, view historical ledger journals, and reconcile adjustments.</p>
        </div>

        <div class="header-actions">
          <a routerLink="/accounts/chart" class="btn btn-secondary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            Chart of Accounts
          </a>
          <a routerLink="/accounts/reports" class="btn btn-secondary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Financial Reports
          </a>
          <button *hasPermission="'Accounting.CreateEntry'" (click)="openCreateModal()" class="btn btn-primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Journal Voucher
          </button>
        </div>
      </div>

      <!-- Filters & Search -->
      <div class="filters-card">
        <div class="filter-group">
          <label class="filter-label">Search</label>
          <div class="search-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4 search-icon">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              [(ngModel)]="searchQuery"
              (keyup.enter)="loadEntries()"
              placeholder="Search voucher #, narration, ref..."
              class="search-input"
            />
          </div>
        </div>

        <div class="filter-group">
          <label class="filter-label">Voucher Type</label>
          <select [(ngModel)]="selectedType" (change)="loadEntries()" class="filter-select">
            <option [ngValue]="null">All Types</option>
            <option [ngValue]="JournalEntryType.Manual">Manual Journal</option>
            <option [ngValue]="JournalEntryType.Sales">Sales</option>
            <option [ngValue]="JournalEntryType.Purchase">Purchase</option>
            <option [ngValue]="JournalEntryType.Payment">Payment</option>
            <option [ngValue]="JournalEntryType.Inventory">Inventory</option>
            <option [ngValue]="JournalEntryType.Closing">Closing</option>
          </select>
        </div>

        <button class="btn btn-secondary mt-auto" (click)="loadEntries()">
          Apply Filters
        </button>
      </div>

      <!-- Vouchers Table -->
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Voucher #</th>
              <th>Date</th>
              <th>Reference</th>
              <th>Type</th>
              <th>Narration</th>
              <th class="text-right">Debit (₹)</th>
              <th class="text-right">Credit (₹)</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            @if (loading()) {
              <tr>
                <td colspan="9" class="empty-cell">
                  <div class="spinner"></div>
                  <span>Loading Journal Entries...</span>
                </td>
              </tr>
            } @else if (entries().length === 0) {
              <tr>
                <td colspan="9" class="empty-cell">
                  <div class="empty-state">
                    <p class="empty-title">No Journal Vouchers Found</p>
                    <p class="empty-desc">Create your first double-entry journal voucher to record transactions.</p>
                  </div>
                </td>
              </tr>
            } @else {
              @for (entry of entries(); track entry.id) {
                <tr class="table-row">
                  <td class="font-mono font-bold text-accent">{{ entry.entryNumber }}</td>
                  <td class="text-secondary text-sm">{{ entry.entryDate | date:'dd MMM yyyy' }}</td>
                  <td class="font-mono text-sm text-secondary">{{ entry.reference || '—' }}</td>
                  <td>
                    <span class="type-badge">{{ entry.entryTypeName }}</span>
                  </td>
                  <td class="narration-cell">
                    <span class="font-semibold text-primary">{{ entry.narration }}</span>
                    <span class="text-xs text-muted block">{{ entry.lines.length }} leg(s)</span>
                  </td>
                  <td class="text-right font-mono font-bold text-emerald-400">
                    ₹{{ entry.totalDebit | number:'1.2-2' }}
                  </td>
                  <td class="text-right font-mono font-bold text-emerald-400">
                    ₹{{ entry.totalCredit | number:'1.2-2' }}
                  </td>
                  <td>
                    <span class="posted-badge">Posted</span>
                  </td>
                  <td>
                    <button class="btn-link" (click)="viewVoucher(entry)">Inspect</button>
                  </td>
                </tr>
              }
            }
          </tbody>
        </table>
      </div>

      <!-- Create Voucher Modal (with Double-Entry Validator) -->
      @if (showCreateModal()) {
        <div class="modal-backdrop animate-fade-in" (click)="closeCreateModal()">
          <div class="modal-card modal-large" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div>
                <h3 class="modal-title">New Journal Voucher (Double-Entry)</h3>
                <p class="modal-subtitle">Post a balanced general ledger voucher. Total Debits must equal Total Credits.</p>
              </div>
              <button class="btn-icon" (click)="closeCreateModal()">✕</button>
            </div>

            <div class="modal-body">
              <!-- Voucher Header -->
              <div class="form-grid-3">
                <div class="form-group">
                  <label class="form-label">Voucher Date *</label>
                  <input type="date" [(ngModel)]="voucherDate" class="form-input" />
                </div>
                <div class="form-group">
                  <label class="form-label">Reference #</label>
                  <input type="text" [(ngModel)]="voucherRef" placeholder="e.g. JV-FACILITY-01" class="form-input" />
                </div>
                <div class="form-group">
                  <label class="form-label">Voucher Type</label>
                  <select [(ngModel)]="voucherType" class="form-select">
                    <option [ngValue]="JournalEntryType.Manual">Manual Adjustment</option>
                    <option [ngValue]="JournalEntryType.Closing">Period Closing</option>
                    <option [ngValue]="JournalEntryType.Inventory">Stock Revaluation</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Narration / Description *</label>
                <input
                  type="text"
                  [(ngModel)]="voucherNarration"
                  placeholder="e.g. Accrued monthly depreciation on machinery assets"
                  class="form-input"
                />
              </div>

              <!-- Lines Table -->
              <div class="lines-section">
                <div class="section-header">
                  <span class="section-title">Journal Legs / Line Items</span>
                  <button type="button" class="btn btn-secondary btn-sm" (click)="addLine()">
                    + Add Leg
                  </button>
                </div>

                <div class="table-responsive">
                  <table class="lines-table">
                    <thead>
                      <tr>
                        <th style="width: 35%;">Account</th>
                        <th style="width: 20%;">Debit (₹)</th>
                        <th style="width: 20%;">Credit (₹)</th>
                        <th style="width: 20%;">Description</th>
                        <th style="width: 5%;"></th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (line of lines; track $index) {
                        <tr>
                          <td>
                            <select [(ngModel)]="line.accountId" class="form-select form-select-sm">
                              <option value="" disabled>Select Account</option>
                              @for (acc of accounts(); track acc.id) {
                                <option [value]="acc.id">
                                  {{ acc.accountCode }} - {{ acc.accountName }} ({{ acc.typeName }})
                                </option>
                              }
                            </select>
                          </td>
                          <td>
                            <input
                              type="number"
                              step="0.01"
                              [(ngModel)]="line.debit"
                              (input)="onDebitChange(line)"
                              placeholder="0.00"
                              class="form-input form-input-sm font-mono text-right"
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              step="0.01"
                              [(ngModel)]="line.credit"
                              (input)="onCreditChange(line)"
                              placeholder="0.00"
                              class="form-input form-input-sm font-mono text-right"
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              [(ngModel)]="line.description"
                              placeholder="Optional line memo"
                              class="form-input form-input-sm"
                            />
                          </td>
                          <td class="text-center">
                            @if (lines.length > 2) {
                              <button type="button" class="btn-del" (click)="removeLine($index)">✕</button>
                            }
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Real-time Double-Entry Balance Strip -->
              <div class="balance-strip" [class.strip-balanced]="isBalanced()" [class.strip-imbalanced]="!isBalanced()">
                <div class="strip-item">
                  <span class="strip-label">Total Debits:</span>
                  <span class="strip-val font-mono">₹{{ sumDebits() | number:'1.2-2' }}</span>
                </div>
                <div class="strip-item">
                  <span class="strip-label">Total Credits:</span>
                  <span class="strip-val font-mono">₹{{ sumCredits() | number:'1.2-2' }}</span>
                </div>
                <div class="strip-item">
                  <span class="strip-label">Difference:</span>
                  <span class="strip-val font-mono">₹{{ Math.abs(sumDebits() - sumCredits()) | number:'1.2-2' }}</span>
                </div>
                <div class="strip-status">
                  @if (isBalanced()) {
                    <span class="balance-pill balanced">✓ Strictly Balanced</span>
                  } @else {
                    <span class="balance-pill imbalanced">⚠ Out of Balance</span>
                  }
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closeCreateModal()">Cancel</button>
              <button
                type="button"
                class="btn btn-primary"
                [disabled]="!isBalanced() || submitting()"
                (click)="saveVoucher()"
              >
                {{ submitting() ? 'Posting Voucher...' : 'Post Journal Voucher' }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Inspect Voucher Modal -->
      @if (selectedVoucher()) {
        <div class="modal-backdrop animate-fade-in" (click)="closeInspectModal()">
          <div class="modal-card modal-large" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div>
                <h3 class="modal-title">Journal Voucher: {{ selectedVoucher()!.entryNumber }}</h3>
                <p class="modal-subtitle">Posted on {{ selectedVoucher()!.entryDate | date:'dd MMM yyyy' }} | Ref: {{ selectedVoucher()!.reference || 'None' }}</p>
              </div>
              <button class="btn-icon" (click)="closeInspectModal()">✕</button>
            </div>

            <div class="modal-body">
              <div class="memo-card">
                <span class="memo-label">Narration:</span>
                <p class="memo-text">{{ selectedVoucher()!.narration }}</p>
              </div>

              <div class="table-responsive mt-3">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Account Code</th>
                      <th>Account Name</th>
                      <th>Description</th>
                      <th class="text-right">Debit (₹)</th>
                      <th class="text-right">Credit (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (l of selectedVoucher()!.lines; track l.id) {
                      <tr>
                        <td class="font-mono text-accent">{{ l.accountCode }}</td>
                        <td class="font-semibold text-primary">{{ l.accountName }}</td>
                        <td class="text-sm text-secondary">{{ l.description || '—' }}</td>
                        <td class="text-right font-mono font-semibold text-emerald-400">
                          {{ l.debit > 0 ? ('₹' + (l.debit | number:'1.2-2')) : '—' }}
                        </td>
                        <td class="text-right font-mono font-semibold text-emerald-400">
                          {{ l.credit > 0 ? ('₹' + (l.credit | number:'1.2-2')) : '—' }}
                        </td>
                      </tr>
                    }
                  </tbody>
                  <tfoot>
                    <tr class="font-bold border-top">
                      <td colspan="3" class="text-right uppercase">Total:</td>
                      <td class="text-right font-mono text-emerald-400">₹{{ selectedVoucher()!.totalDebit | number:'1.2-2' }}</td>
                      <td class="text-right font-mono text-emerald-400">₹{{ selectedVoucher()!.totalCredit | number:'1.2-2' }}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="closeInspectModal()">Close</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .journals-page {
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
      padding: 1rem;
      display: flex;
      align-items: flex-end;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    .filter-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
    }
    .search-wrap {
      position: relative;
      min-width: 280px;
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
      padding: 0.5rem 0.85rem 0.5rem 2.25rem;
      background: var(--bg-surface-elevated);
      border: 1px solid var(--border-subtle);
      border-radius: 8px;
      color: var(--text-primary);
      font-size: 0.85rem;
    }
    .search-input:focus, .filter-select:focus {
      border-color: #6366f1;
      outline: none;
    }
    .filter-select {
      padding: 0.5rem 0.85rem;
      background: var(--bg-surface-elevated);
      border: 1px solid var(--border-subtle);
      border-radius: 8px;
      color: var(--text-primary);
      font-size: 0.85rem;
      min-width: 180px;
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
    .narration-cell {
      max-width: 260px;
    }
    .type-badge {
      font-size: 0.7rem;
      font-weight: 600;
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
      background: rgba(99, 102, 241, 0.15);
      color: #818cf8;
      border: 1px solid rgba(99, 102, 241, 0.3);
    }
    .posted-badge {
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }
    .btn-link {
      background: transparent;
      border: none;
      color: #818cf8;
      font-weight: 600;
      font-size: 0.85rem;
      cursor: pointer;
      text-decoration: underline;
    }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
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
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
      overflow: hidden;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
    }
    .modal-large {
      max-width: 860px;
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--border-subtle);
    }
    .modal-title {
      font-size: 1.2rem;
      font-weight: 700;
      color: var(--text-primary);
    }
    .modal-subtitle {
      font-size: 0.8rem;
      color: var(--text-secondary);
    }
    .modal-body {
      padding: 1.5rem;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .form-grid-3 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
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
      padding: 0.55rem 0.85rem;
      background: var(--bg-surface-elevated);
      border: 1px solid var(--border-subtle);
      border-radius: 8px;
      color: var(--text-primary);
      font-size: 0.875rem;
    }
    .form-input-sm, .form-select-sm {
      padding: 0.4rem 0.6rem;
      font-size: 0.8rem;
    }
    .lines-section {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .section-title {
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--text-primary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .lines-table {
      width: 100%;
      border-collapse: collapse;
    }
    .lines-table th {
      font-size: 0.75rem;
      color: var(--text-secondary);
      font-weight: 600;
      text-align: left;
      padding: 0.4rem;
    }
    .lines-table td {
      padding: 0.4rem;
    }
    .btn-del {
      background: transparent;
      border: none;
      color: #f43f5e;
      cursor: pointer;
      font-weight: bold;
    }
    .balance-strip {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.85rem 1.25rem;
      border-radius: 10px;
      border: 1px solid var(--border-subtle);
      background: rgba(0, 0, 0, 0.3);
    }
    .strip-balanced {
      border-color: rgba(16, 185, 129, 0.4);
      background: rgba(16, 185, 129, 0.05);
    }
    .strip-imbalanced {
      border-color: rgba(244, 63, 94, 0.4);
      background: rgba(244, 63, 94, 0.05);
    }
    .strip-item {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }
    .strip-label {
      font-size: 0.8rem;
      color: var(--text-secondary);
    }
    .strip-val {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--text-primary);
    }
    .balance-pill {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.25rem 0.6rem;
      border-radius: 6px;
    }
    .balance-pill.balanced {
      background: rgba(16, 185, 129, 0.2);
      color: #34d399;
    }
    .balance-pill.imbalanced {
      background: rgba(244, 63, 94, 0.2);
      color: #fb7185;
    }
    .memo-card {
      padding: 0.85rem 1rem;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid var(--border-subtle);
      border-radius: 8px;
    }
    .memo-label {
      font-size: 0.75rem;
      color: var(--text-muted);
      text-transform: uppercase;
      font-weight: 700;
    }
    .memo-text {
      margin-top: 0.25rem;
      font-size: 0.95rem;
      color: var(--text-primary);
    }
    .border-top {
      border-top: 2px solid var(--border-subtle);
    }
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding: 1rem 1.5rem;
      border-top: 1px solid var(--border-subtle);
    }
    .btn-icon {
      background: transparent;
      border: none;
      color: var(--text-secondary);
      font-size: 1.1rem;
      cursor: pointer;
    }
    .mt-auto { margin-top: auto; }
    .mt-3 { margin-top: 0.75rem; }
  `]
})
export class JournalEntriesComponent implements OnInit {
  private accountingService = inject(AccountingService);
  private notification = inject(NotificationService);

  JournalEntryType = JournalEntryType;
  Math = Math;

  entries = signal<JournalEntry[]>([]);
  accounts = signal<Account[]>([]);
  loading = signal(false);
  submitting = signal(false);

  // Filters
  searchQuery = '';
  selectedType: JournalEntryType | null = null;

  // Create Modal State
  showCreateModal = signal(false);
  voucherDate = new Date().toISOString().substring(0, 10);
  voucherRef = '';
  voucherNarration = '';
  voucherType: JournalEntryType = JournalEntryType.Manual;
  lines: FormJournalLine[] = [];

  // Inspect Modal State
  selectedVoucher = signal<JournalEntry | null>(null);

  ngOnInit(): void {
    this.loadEntries();
    this.loadAccounts();
  }

  loadAccounts(): void {
    this.accountingService.getAccounts().subscribe({
      next: (res) => {
        if (res.isSuccess && res.data) {
          this.accounts.set(res.data.filter(a => a.isActive));
        }
      }
    });
  }

  loadEntries(): void {
    this.loading.set(true);
    this.accountingService.getJournalEntries({
      search: this.searchQuery,
      entryType: this.selectedType !== null ? this.selectedType : undefined
    }).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.isSuccess && res.data) {
          this.entries.set(res.data.items);
        }
      },
      error: () => {
        this.loading.set(false);
        this.notification.error('Failed to load journal entries.');
      }
    });
  }

  openCreateModal(): void {
    this.voucherDate = new Date().toISOString().substring(0, 10);
    this.voucherRef = '';
    this.voucherNarration = '';
    this.voucherType = JournalEntryType.Manual;
    this.lines = [
      { accountId: '', debit: 0, credit: 0, description: '' },
      { accountId: '', debit: 0, credit: 0, description: '' }
    ];
    this.showCreateModal.set(true);
  }

  closeCreateModal(): void {
    this.showCreateModal.set(false);
  }

  addLine(): void {
    this.lines.push({ accountId: '', debit: 0, credit: 0, description: '' });
  }

  removeLine(index: number): void {
    if (this.lines.length > 2) {
      this.lines.splice(index, 1);
    }
  }

  onDebitChange(line: FormJournalLine): void {
    if (line.debit > 0) {
      line.credit = 0;
    }
  }

  onCreditChange(line: FormJournalLine): void {
    if (line.credit > 0) {
      line.debit = 0;
    }
  }

  sumDebits(): number {
    return this.lines.reduce((acc, l) => acc + (Number(l.debit) || 0), 0);
  }

  sumCredits(): number {
    return this.lines.reduce((acc, l) => acc + (Number(l.credit) || 0), 0);
  }

  isBalanced(): boolean {
    const deb = this.sumDebits();
    const cred = this.sumCredits();
    return deb > 0 && Math.abs(deb - cred) < 0.01;
  }

  saveVoucher(): void {
    if (!this.voucherNarration.trim()) {
      this.notification.warning('Please enter a narration for this journal voucher.');
      return;
    }

    if (!this.isBalanced()) {
      this.notification.error('Total Debits must equal Total Credits before posting.');
      return;
    }

    const invalidAccount = this.lines.some(l => !l.accountId);
    if (invalidAccount) {
      this.notification.warning('Please select an account for each line item.');
      return;
    }

    const req: CreateJournalEntryRequest = {
      entryDate: this.voucherDate,
      reference: this.voucherRef,
      narration: this.voucherNarration,
      entryType: this.voucherType,
      lines: this.lines.map(l => ({
        accountId: l.accountId,
        debit: Number(l.debit) || 0,
        credit: Number(l.credit) || 0,
        description: l.description
      }))
    };

    this.submitting.set(true);
    this.accountingService.createJournalEntry(req).subscribe({
      next: (res) => {
        this.submitting.set(false);
        if (res.isSuccess) {
          this.notification.success(`Journal Voucher ${res.data?.entryNumber} posted successfully.`);
          this.closeCreateModal();
          this.loadEntries();
        } else {
          this.notification.error(res.message || 'Failed to post voucher.');
        }
      },
      error: (err) => {
        this.submitting.set(false);
        this.notification.error(err.error?.message || 'Error occurred while posting voucher.');
      }
    });
  }

  viewVoucher(entry: JournalEntry): void {
    this.selectedVoucher.set(entry);
  }

  closeInspectModal(): void {
    this.selectedVoucher.set(null);
  }
}
