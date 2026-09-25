import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PurchasesService } from '../../core/services/purchases.service';
import { Supplier, CreateSupplierRequest } from '../../core/models/purchases.models';
import { NotificationService } from '../../core/services/notification.service';
import { HasPermissionDirective } from '../../core/directives/has-permission.directive';

@Component({
  selector: 'app-suppliers-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HasPermissionDirective],
  template: `
    <div class="purchases-page animate-fade-in">
      <!-- Page Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Vendor & Supplier Directory</h1>
          <p class="page-subtitle">Manage raw material suppliers, payment credit terms, vendor GST compliance, and payables.</p>
        </div>

        <div class="header-actions">
          <a routerLink="/purchases/orders" class="btn btn-secondary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Purchase Orders
          </a>
          <button *hasPermission="'Purchases.Create'" (click)="openCreateModal()" class="btn btn-primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Add New Vendor
          </button>
        </div>
      </div>

      <!-- KPI Summary Strip -->
      <div class="kpi-strip">
        <div class="glass-panel kpi-card">
          <span class="kpi-label">Active Vendors</span>
          <span class="kpi-val text-indigo">{{ suppliers().length }}</span>
        </div>
        <div class="glass-panel kpi-card">
          <span class="kpi-label">Total Outstanding Payables</span>
          <span class="kpi-val text-rose">₹{{ totalPayables() | number:'1.2-2' }}</span>
        </div>
        <div class="glass-panel kpi-card">
          <span class="kpi-label">Avg Payment Credit Period</span>
          <span class="kpi-val text-amber">32 Days</span>
        </div>
      </div>

      <!-- Filter Bar -->
      <div class="glass-panel filter-bar">
        <div class="search-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4 text-muted">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            [(ngModel)]="searchTerm"
            (ngModelChange)="onSearch()"
            placeholder="Search vendor name, code, contact person, or GSTIN..."
            class="search-input"
          />
        </div>

        <button (click)="loadSuppliers()" class="btn btn-secondary btn-icon" title="Refresh">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      <!-- Suppliers Table -->
      <div class="glass-panel table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Vendor Name</th>
              <th>Contact Person</th>
              <th>GSTIN / Location</th>
              <th class="text-center">Credit Terms</th>
              <th class="text-right">Outstanding Payable</th>
              <th class="text-center">Status</th>
              <th class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            @if (isLoading()) {
              <tr>
                <td colspan="7" class="text-center py-8">
                  <div class="spinner"></div>
                  <span class="text-muted text-sm mt-2 block">Loading vendors...</span>
                </td>
              </tr>
            } @else if (suppliers().length === 0) {
              <tr>
                <td colspan="7" class="text-center py-8 text-muted">
                  No vendor accounts found.
                </td>
              </tr>
            } @else {
              @for (s of suppliers(); track s.id) {
                <tr class="table-row">
                  <td>
                    <div class="vendor-info">
                      <span class="font-medium text-primary">{{ s.name }}</span>
                      <span class="font-mono text-xs text-muted">{{ s.supplierCode }}</span>
                    </div>
                  </td>
                  <td>
                    <div class="contact-info">
                      <span class="text-sm">{{ s.contactPerson || '—' }}</span>
                      <span class="text-xs text-muted">{{ s.email || s.phone || 'No direct phone' }}</span>
                    </div>
                  </td>
                  <td>
                    <div class="tax-info">
                      <span class="badge badge-slate text-xs font-mono">{{ s.gstin || 'UNREGISTERED' }}</span>
                      <span class="text-xs text-muted block mt-1">{{ s.city ? s.city + ', ' + s.state : (s.state || '—') }}</span>
                    </div>
                  </td>
                  <td class="text-center">
                    <span class="badge badge-indigo text-xs">{{ s.paymentTermsDays }} Days Net</span>
                  </td>
                  <td class="text-right font-mono font-semibold">
                    <span [class.text-rose]="s.outstandingPayable > 0" [class.text-muted]="s.outstandingPayable === 0">
                      ₹{{ s.outstandingPayable | number:'1.2-2' }}
                    </span>
                  </td>
                  <td class="text-center">
                    <span class="badge" [ngClass]="s.isActive ? 'badge-emerald' : 'badge-rose'">
                      {{ s.isActive ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                  <td class="text-right">
                    <button (click)="openEditModal(s)" class="btn-icon-subtle text-indigo" title="Edit Vendor">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </td>
                </tr>
              }
            }
          </tbody>
        </table>
      </div>

      <!-- Add/Edit Vendor Modal -->
      @if (showModal()) {
        <div class="modal-overlay animate-fade-in" (click)="closeModal()">
          <div class="modal-dialog glass-panel" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2 class="modal-title">{{ isEditing() ? 'Edit Vendor Profile' : 'Register New Vendor' }}</h2>
              <button (click)="closeModal()" class="close-btn">&times;</button>
            </div>

            <form (ngSubmit)="saveSupplier()" class="modal-form">
              <div class="form-grid">
                <div class="form-group col-span-2">
                  <label class="form-label">Vendor / Company Name <span class="required">*</span></label>
                  <input type="text" [(ngModel)]="formModel.name" name="name" required class="form-control" placeholder="e.g. Bharat Heavy Metals Corp" />
                </div>

                <div class="form-group">
                  <label class="form-label">Supplier Code</label>
                  <input type="text" [(ngModel)]="formModel.supplierCode" name="supplierCode" class="form-control" placeholder="Auto-generated if empty" />
                </div>

                <div class="form-group">
                  <label class="form-label">Contact Person</label>
                  <input type="text" [(ngModel)]="formModel.contactPerson" name="contact" class="form-control" placeholder="e.g. Rajesh Sharma" />
                </div>

                <div class="form-group">
                  <label class="form-label">Email Address</label>
                  <input type="email" [(ngModel)]="formModel.email" name="email" class="form-control" placeholder="orders@supplier.in" />
                </div>

                <div class="form-group">
                  <label class="form-label">Phone Number</label>
                  <input type="text" [(ngModel)]="formModel.phone" name="phone" class="form-control" placeholder="+91 20 2711 8899" />
                </div>

                <div class="form-group">
                  <label class="form-label">GSTIN (15 Digits)</label>
                  <input type="text" [(ngModel)]="formModel.gstin" name="gstin" class="form-control font-mono uppercase" placeholder="27AAACB5678C1Z8" />
                </div>

                <div class="form-group">
                  <label class="form-label">PAN Number</label>
                  <input type="text" [(ngModel)]="formModel.pan" name="pan" class="form-control font-mono uppercase" placeholder="AAACB5678C" />
                </div>

                <div class="form-group col-span-2">
                  <label class="form-label">Billing Address</label>
                  <input type="text" [(ngModel)]="formModel.billingAddress" name="addr" class="form-control" placeholder="Industrial Estate / Sector" />
                </div>

                <div class="form-group">
                  <label class="form-label">City</label>
                  <input type="text" [(ngModel)]="formModel.city" name="city" class="form-control" placeholder="e.g. Pune" />
                </div>

                <div class="form-group">
                  <label class="form-label">State</label>
                  <input type="text" [(ngModel)]="formModel.state" name="state" class="form-control" placeholder="e.g. Maharashtra" />
                </div>

                <div class="form-group">
                  <label class="form-label">Postal / PIN Code</label>
                  <input type="text" [(ngModel)]="formModel.postalCode" name="postal" class="form-control" placeholder="411026" />
                </div>

                <div class="form-group">
                  <label class="form-label">Credit Terms (Days)</label>
                  <input type="number" [(ngModel)]="formModel.paymentTermsDays" name="terms" min="0" class="form-control" placeholder="30" />
                </div>

                <div class="form-group col-span-2">
                  <label class="form-label">Procurement Notes</label>
                  <textarea [(ngModel)]="formModel.notes" name="notes" rows="2" class="form-control" placeholder="Notes on quality benchmarks or standard delivery lead times..."></textarea>
                </div>
              </div>

              <div class="modal-actions">
                <button type="button" (click)="closeModal()" class="btn btn-secondary">Cancel</button>
                <button type="submit" [disabled]="isSaving()" class="btn btn-primary">
                  {{ isSaving() ? 'Saving...' : (isEditing() ? 'Save Changes' : 'Register Vendor') }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .purchases-page {
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
      max-width: 440px;
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
    .vendor-info, .contact-info {
      display: flex;
      flex-direction: column;
    }
    .btn-icon-subtle {
      background: transparent;
      border: none;
      padding: 0.35rem;
      border-radius: 6px;
      cursor: pointer;
    }
    .btn-icon-subtle:hover {
      background: rgba(255, 255, 255, 0.08);
    }

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
    .col-span-2 { grid-column: span 2; }
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
    .form-control:focus { border-color: var(--primary); }
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
    @keyframes spin { to { transform: rotate(360deg); } }
    .required { color: var(--accent-rose); }
  `]
})
export class SuppliersListComponent implements OnInit {
  private purchasesService = inject(PurchasesService);
  private notify = inject(NotificationService);

  suppliers = signal<Supplier[]>([]);
  isLoading = signal<boolean>(false);
  isSaving = signal<boolean>(false);
  showModal = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  editingSupplierId: string | null = null;
  searchTerm = '';

  formModel: CreateSupplierRequest = {
    name: '',
    supplierCode: '',
    contactPerson: '',
    email: '',
    phone: '',
    gstin: '',
    pan: '',
    billingAddress: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    paymentTermsDays: 30,
    notes: ''
  };

  ngOnInit(): void {
    this.loadSuppliers();
  }

  loadSuppliers(): void {
    this.isLoading.set(true);
    this.purchasesService.getSuppliers(this.searchTerm).subscribe({
      next: res => {
        if (res.success && res.data) {
          this.suppliers.set(res.data.items);
        }
        this.isLoading.set(false);
      },
      error: err => {
        this.notify.error(err?.error?.message || 'Failed to fetch suppliers.');
        this.isLoading.set(false);
      }
    });
  }

  onSearch(): void {
    this.loadSuppliers();
  }

  totalPayables(): number {
    return this.suppliers().reduce((sum, s) => sum + (s.outstandingPayable || 0), 0);
  }

  openCreateModal(): void {
    this.isEditing.set(false);
    this.editingSupplierId = null;
    this.formModel = {
      name: '',
      supplierCode: '',
      contactPerson: '',
      email: '',
      phone: '',
      gstin: '',
      pan: '',
      billingAddress: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'India',
      paymentTermsDays: 30,
      notes: ''
    };
    this.showModal.set(true);
  }

  openEditModal(s: Supplier): void {
    this.isEditing.set(true);
    this.editingSupplierId = s.id;
    this.formModel = {
      name: s.name,
      supplierCode: s.supplierCode,
      contactPerson: s.contactPerson || '',
      email: s.email || '',
      phone: s.phone || '',
      gstin: s.gstin || '',
      pan: s.pan || '',
      billingAddress: s.billingAddress || '',
      city: s.city || '',
      state: s.state || '',
      postalCode: s.postalCode || '',
      country: s.country || 'India',
      paymentTermsDays: s.paymentTermsDays,
      notes: s.notes || ''
    };
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  saveSupplier(): void {
    if (!this.formModel.name.trim()) {
      this.notify.warning('Supplier name is required.');
      return;
    }

    this.isSaving.set(true);

    if (this.isEditing() && this.editingSupplierId) {
      this.purchasesService.updateSupplier(this.editingSupplierId, { ...this.formModel, isActive: true }).subscribe({
        next: () => {
          this.notify.success('Vendor profile updated.');
          this.isSaving.set(false);
          this.closeModal();
          this.loadSuppliers();
        },
        error: err => {
          this.notify.error(err?.error?.message || 'Failed to update vendor.');
          this.isSaving.set(false);
        }
      });
    } else {
      this.purchasesService.createSupplier(this.formModel).subscribe({
        next: () => {
          this.notify.success('Vendor registered successfully.');
          this.isSaving.set(false);
          this.closeModal();
          this.loadSuppliers();
        },
        error: err => {
          this.notify.error(err?.error?.message || 'Failed to create vendor.');
          this.isSaving.set(false);
        }
      });
    }
  }
}
