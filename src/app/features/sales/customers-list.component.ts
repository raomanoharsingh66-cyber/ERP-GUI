import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SalesService } from '../../core/services/sales.service';
import { Customer, CreateCustomerRequest } from '../../core/models/sales.models';
import { NotificationService } from '../../core/services/notification.service';
import { HasPermissionDirective } from '../../core/directives/has-permission.directive';

@Component({
  selector: 'app-customers-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HasPermissionDirective],
  template: `
    <div class="sales-page animate-fade-in">
      <!-- Page Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Customer Accounts & Receivables</h1>
          <p class="page-subtitle">Manage customer directory, commercial credit limits, billing profiles, and GST identifiers.</p>
        </div>

        <div class="header-actions">
          <a routerLink="/sales/invoices" class="btn btn-secondary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Invoices & Billing
          </a>
          <button *hasPermission="'Customers.Create'" (click)="openCreateModal()" class="btn btn-primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Add New Customer
          </button>
        </div>
      </div>

      <!-- KPI Summary Strip -->
      <div class="kpi-strip">
        <div class="glass-panel kpi-card">
          <span class="kpi-label">Total Customers</span>
          <span class="kpi-val text-indigo">{{ customers().length }}</span>
        </div>
        <div class="glass-panel kpi-card">
          <span class="kpi-label">Active Clients</span>
          <span class="kpi-val text-emerald">{{ activeCustomersCount() }}</span>
        </div>
        <div class="glass-panel kpi-card">
          <span class="kpi-label">Total Outstanding Receivables</span>
          <span class="kpi-val text-amber">₹{{ totalReceivables() | number:'1.2-2' }}</span>
        </div>
      </div>

      <!-- Search & Filter Controls -->
      <div class="glass-panel filter-bar">
        <div class="search-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4 text-muted">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            [(ngModel)]="searchTerm"
            (ngModelChange)="onSearch()"
            placeholder="Search by name, code, GSTIN, phone, or email..."
            class="search-input"
          />
        </div>

        <div class="filter-actions">
          <select [(ngModel)]="selectedStatus" (ngModelChange)="loadCustomers()" class="filter-select">
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
          <button (click)="loadCustomers()" class="btn btn-secondary btn-icon" title="Refresh">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Customer Data Table -->
      <div class="glass-panel table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Contact Info</th>
              <th>GSTIN / State</th>
              <th class="text-right">Credit Limit</th>
              <th class="text-right">Outstanding</th>
              <th class="text-center">Status</th>
              <th class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            @if (isLoading()) {
              <tr>
                <td colspan="7" class="text-center py-8">
                  <div class="spinner"></div>
                  <span class="text-muted text-sm mt-2 block">Loading customer accounts...</span>
                </td>
              </tr>
            } @else if (customers().length === 0) {
              <tr>
                <td colspan="7" class="text-center py-8 text-muted">
                  No customer records found matching the query.
                </td>
              </tr>
            } @else {
              @for (c of customers(); track c.id) {
                <tr class="table-row">
                  <td>
                    <div class="customer-info">
                      <span class="customer-name font-medium">{{ c.name }}</span>
                      <span class="customer-code">{{ c.customerCode }}</span>
                    </div>
                  </td>
                  <td>
                    <div class="contact-info">
                      <span class="text-sm">{{ c.email || '—' }}</span>
                      <span class="text-xs text-muted">{{ c.phone || 'No phone' }}</span>
                    </div>
                  </td>
                  <td>
                    <div class="tax-info">
                      <span class="badge badge-slate text-xs font-mono">{{ c.gstin || 'UNREGISTERED' }}</span>
                      <span class="text-xs text-muted block mt-1">{{ c.billingCity ? c.billingCity + ', ' + c.billingState : (c.billingState || '—') }}</span>
                    </div>
                  </td>
                  <td class="text-right font-mono font-medium">
                    ₹{{ c.creditLimit | number:'1.2-2' }}
                  </td>
                  <td class="text-right font-mono font-semibold">
                    <span [class.text-amber]="c.outstandingBalance > 0" [class.text-muted]="c.outstandingBalance === 0">
                      ₹{{ c.outstandingBalance | number:'1.2-2' }}
                    </span>
                  </td>
                  <td class="text-center">
                    <span class="badge" [ngClass]="c.isActive ? 'badge-emerald' : 'badge-rose'">
                      {{ c.isActive ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                  <td class="text-right">
                    <div class="action-btn-group">
                      <button (click)="openEditModal(c)" class="btn-icon-subtle" title="Edit Customer">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4 text-indigo">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              }
            }
          </tbody>
        </table>
      </div>

      <!-- Add/Edit Customer Modal -->
      @if (showModal()) {
        <div class="modal-overlay animate-fade-in" (click)="closeModal()">
          <div class="modal-dialog glass-panel" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2 class="modal-title">{{ isEditing() ? 'Edit Customer' : 'Add New Customer' }}</h2>
              <button (click)="closeModal()" class="close-btn">&times;</button>
            </div>

            <form (ngSubmit)="saveCustomer()" class="modal-form">
              <div class="form-grid">
                <!-- Name -->
                <div class="form-group col-span-2">
                  <label class="form-label">Customer / Company Name <span class="required">*</span></label>
                  <input type="text" [(ngModel)]="formModel.name" name="name" required class="form-control" placeholder="e.g. Apex Industrial Supplies Pvt Ltd" />
                </div>

                <!-- Customer Code -->
                <div class="form-group">
                  <label class="form-label">Customer Code</label>
                  <input type="text" [(ngModel)]="formModel.customerCode" name="customerCode" class="form-control" placeholder="Auto-generated if blank" />
                </div>

                <!-- Credit Limit -->
                <div class="form-group">
                  <label class="form-label">Credit Limit (₹)</label>
                  <input type="number" [(ngModel)]="formModel.creditLimit" name="creditLimit" min="0" step="1000" class="form-control" placeholder="0.00" />
                </div>

                <!-- Email -->
                <div class="form-group">
                  <label class="form-label">Email Address</label>
                  <input type="email" [(ngModel)]="formModel.email" name="email" class="form-control" placeholder="billing@client.com" />
                </div>

                <!-- Phone -->
                <div class="form-group">
                  <label class="form-label">Phone Number</label>
                  <input type="text" [(ngModel)]="formModel.phone" name="phone" class="form-control" placeholder="+91 98765 43210" />
                </div>

                <!-- GSTIN -->
                <div class="form-group">
                  <label class="form-label">GSTIN (India)</label>
                  <input type="text" [(ngModel)]="formModel.gstin" name="gstin" class="form-control font-mono uppercase" placeholder="27AAACA1234A1Z5" />
                </div>

                <!-- PAN -->
                <div class="form-group">
                  <label class="form-label">PAN Number</label>
                  <input type="text" [(ngModel)]="formModel.pan" name="pan" class="form-control font-mono uppercase" placeholder="AAACA1234A" />
                </div>

                <!-- Billing Address -->
                <div class="form-group col-span-2">
                  <label class="form-label">Billing Address</label>
                  <input type="text" [(ngModel)]="formModel.billingAddress" name="billingAddress" class="form-control" placeholder="Street / Industrial Estate" />
                </div>

                <!-- City -->
                <div class="form-group">
                  <label class="form-label">City</label>
                  <input type="text" [(ngModel)]="formModel.billingCity" name="billingCity" class="form-control" placeholder="e.g. Mumbai" />
                </div>

                <!-- State -->
                <div class="form-group">
                  <label class="form-label">State</label>
                  <input type="text" [(ngModel)]="formModel.billingState" name="billingState" class="form-control" placeholder="e.g. Maharashtra" />
                </div>

                <!-- Postal Code -->
                <div class="form-group">
                  <label class="form-label">Postal / PIN Code</label>
                  <input type="text" [(ngModel)]="formModel.billingPostalCode" name="billingPostalCode" class="form-control" placeholder="400093" />
                </div>

                <!-- Country -->
                <div class="form-group">
                  <label class="form-label">Country</label>
                  <input type="text" [(ngModel)]="formModel.billingCountry" name="billingCountry" class="form-control" placeholder="India" />
                </div>

                <!-- Notes -->
                <div class="form-group col-span-2">
                  <label class="form-label">Commercial Notes & Payment Terms</label>
                  <textarea [(ngModel)]="formModel.notes" name="notes" rows="2" class="form-control" placeholder="e.g. 30 days credit terms, preferred transporter..."></textarea>
                </div>
              </div>

              <div class="modal-actions">
                <button type="button" (click)="closeModal()" class="btn btn-secondary">Cancel</button>
                <button type="submit" [disabled]="isSaving()" class="btn btn-primary">
                  {{ isSaving() ? 'Saving...' : (isEditing() ? 'Save Changes' : 'Create Customer') }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .sales-page {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
    }
    .page-title {
      font-family: var(--font-heading);
      font-size: 1.75rem;
      font-weight: 700;
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
    }
    .kpi-strip {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem;
    }
    .kpi-card {
      padding: 1.25rem;
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .kpi-label {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
    }
    .kpi-val {
      font-family: var(--font-heading);
      font-size: 1.625rem;
      font-weight: 700;
    }
    .text-indigo { color: #818cf8; }
    .text-emerald { color: #34d399; }
    .text-amber { color: #fbbf24; }
    .text-rose { color: #f87171; }

    .filter-bar {
      padding: 1rem 1.25rem;
      border-radius: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
    }
    .search-box {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      flex: 1;
      max-width: 420px;
      background: var(--bg-surface-elevated);
      padding: 0.5rem 0.875rem;
      border-radius: 8px;
      border: 1px solid var(--border-subtle);
    }
    .search-input {
      background: transparent;
      border: none;
      outline: none;
      color: var(--text-primary);
      font-size: 0.875rem;
      width: 100%;
    }
    .filter-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .filter-select {
      background: var(--bg-surface-elevated);
      color: var(--text-primary);
      border: 1px solid var(--border-subtle);
      padding: 0.5rem 0.75rem;
      border-radius: 8px;
      font-size: 0.875rem;
      outline: none;
    }

    .table-container {
      border-radius: 12px;
      overflow-x: auto;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }
    .data-table th {
      padding: 0.875rem 1rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid var(--border-subtle);
    }
    .data-table td {
      padding: 1rem;
      font-size: 0.875rem;
      border-bottom: 1px solid var(--border-subtle);
    }
    .table-row:hover {
      background: rgba(255, 255, 255, 0.02);
    }
    .customer-info {
      display: flex;
      flex-direction: column;
    }
    .customer-name {
      color: var(--text-primary);
    }
    .customer-code {
      font-size: 0.75rem;
      color: var(--text-muted);
      font-family: monospace;
    }
    .contact-info {
      display: flex;
      flex-direction: column;
    }
    .action-btn-group {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
    }
    .btn-icon-subtle {
      background: transparent;
      border: none;
      padding: 0.35rem;
      border-radius: 6px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: background var(--transition-fast);
    }
    .btn-icon-subtle:hover {
      background: rgba(255, 255, 255, 0.08);
    }

    /* Modal styles */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1.5rem;
    }
    .modal-dialog {
      width: 100%;
      max-width: 680px;
      max-height: 90vh;
      overflow-y: auto;
      background: var(--bg-surface);
      border-radius: 16px;
      padding: 1.75rem;
      border: 1px solid var(--border-active);
      box-shadow: var(--shadow-lg);
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid var(--border-subtle);
    }
    .modal-title {
      font-family: var(--font-heading);
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text-primary);
    }
    .close-btn {
      background: transparent;
      border: none;
      font-size: 1.5rem;
      color: var(--text-muted);
      cursor: pointer;
    }
    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    .col-span-2 {
      grid-column: span 2;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    .form-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-secondary);
    }
    .form-control {
      background: var(--bg-surface-elevated);
      border: 1px solid var(--border-subtle);
      border-radius: 8px;
      padding: 0.625rem 0.875rem;
      color: var(--text-primary);
      font-size: 0.875rem;
      outline: none;
      transition: border-color var(--transition-fast);
    }
    .form-control:focus {
      border-color: var(--primary);
    }
    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1.5rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border-subtle);
    }
    .spinner {
      width: 24px;
      height: 24px;
      border: 2px solid rgba(255, 255, 255, 0.1);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .required { color: var(--accent-rose); }
  `]
})
export class CustomersListComponent implements OnInit {
  private salesService = inject(SalesService);
  private notify = inject(NotificationService);

  customers = signal<Customer[]>([]);
  isLoading = signal<boolean>(false);
  isSaving = signal<boolean>(false);
  showModal = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  editingCustomerId: string | null = null;

  searchTerm = '';
  selectedStatus = 'all';

  formModel: CreateCustomerRequest = {
    name: '',
    customerCode: '',
    email: '',
    phone: '',
    gstin: '',
    pan: '',
    billingAddress: '',
    billingCity: '',
    billingState: '',
    billingPostalCode: '',
    billingCountry: 'India',
    creditLimit: 0,
    notes: ''
  };

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.isLoading.set(true);
    const activeFilter = this.selectedStatus === 'all' ? undefined : this.selectedStatus === 'active';
    this.salesService.getCustomers(this.searchTerm, activeFilter).subscribe({
      next: res => {
        if (res.success && res.data) {
          this.customers.set(res.data.items);
        }
        this.isLoading.set(false);
      },
      error: err => {
        this.notify.error(err?.error?.message || 'Failed to fetch customers.');
        this.isLoading.set(false);
      }
    });
  }

  onSearch(): void {
    this.loadCustomers();
  }

  activeCustomersCount(): number {
    return this.customers().filter(c => c.isActive).length;
  }

  totalReceivables(): number {
    return this.customers().reduce((sum, c) => sum + (c.outstandingBalance || 0), 0);
  }

  openCreateModal(): void {
    this.isEditing.set(false);
    this.editingCustomerId = null;
    this.formModel = {
      name: '',
      customerCode: '',
      email: '',
      phone: '',
      gstin: '',
      pan: '',
      billingAddress: '',
      billingCity: '',
      billingState: '',
      billingPostalCode: '',
      billingCountry: 'India',
      creditLimit: 0,
      notes: ''
    };
    this.showModal.set(true);
  }

  openEditModal(c: Customer): void {
    this.isEditing.set(true);
    this.editingCustomerId = c.id;
    this.formModel = {
      name: c.name,
      customerCode: c.customerCode,
      email: c.email || '',
      phone: c.phone || '',
      gstin: c.gstin || '',
      pan: c.pan || '',
      billingAddress: c.billingAddress || '',
      billingCity: c.billingCity || '',
      billingState: c.billingState || '',
      billingPostalCode: c.billingPostalCode || '',
      billingCountry: c.billingCountry || 'India',
      creditLimit: c.creditLimit,
      notes: c.notes || ''
    };
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  saveCustomer(): void {
    if (!this.formModel.name.trim()) {
      this.notify.warning('Customer name is required.');
      return;
    }

    this.isSaving.set(true);

    if (this.isEditing() && this.editingCustomerId) {
      this.salesService.updateCustomer(this.editingCustomerId, { ...this.formModel, isActive: true }).subscribe({
        next: res => {
          this.notify.success('Customer updated successfully.');
          this.isSaving.set(false);
          this.closeModal();
          this.loadCustomers();
        },
        error: err => {
          this.notify.error(err?.error?.message || 'Failed to update customer.');
          this.isSaving.set(false);
        }
      });
    } else {
      this.salesService.createCustomer(this.formModel).subscribe({
        next: res => {
          this.notify.success('Customer registered successfully.');
          this.isSaving.set(false);
          this.closeModal();
          this.loadCustomers();
        },
        error: err => {
          this.notify.error(err?.error?.message || 'Failed to create customer.');
          this.isSaving.set(false);
        }
      });
    }
  }
}
