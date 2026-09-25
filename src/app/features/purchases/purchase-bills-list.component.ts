import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PurchasesService } from '../../core/services/purchases.service';
import { ApiService } from '../../core/services/api.service';
import {
  PurchaseBill,
  PurchaseSummary,
  Supplier,
  CreatePurchaseBillRequest,
  RecordVendorPaymentRequest
} from '../../core/models/purchases.models';
import { NotificationService } from '../../core/services/notification.service';
import { HasPermissionDirective } from '../../core/directives/has-permission.directive';

interface BillLineItemRow {
  productId: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  totalAmount: number;
}

@Component({
  selector: 'app-purchase-bills-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HasPermissionDirective],
  template: `
    <div class="purchases-page animate-fade-in">
      <!-- Page Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Vendor Bills & Accounts Payable</h1>
          <p class="page-subtitle">Track supplier tax invoices, claim GST Input Tax Credits (ITC), and manage outgoing disbursements.</p>
        </div>

        <div class="header-actions">
          <a routerLink="/purchases/suppliers" class="btn btn-secondary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Vendors
          </a>
          <a routerLink="/purchases/orders" class="btn btn-secondary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Purchase Orders
          </a>
          <button *hasPermission="'Purchases.Create'" (click)="openCreateBillModal()" class="btn btn-primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Record Vendor Bill
          </button>
        </div>
      </div>

      <!-- KPI Summary Strip -->
      <div class="kpi-strip">
        <div class="glass-panel kpi-card">
          <span class="kpi-label">Total Procurement Spend</span>
          <span class="kpi-val text-indigo">₹{{ summary()?.totalPurchases || 0 | number:'1.2-2' }}</span>
        </div>
        <div class="glass-panel kpi-card">
          <span class="kpi-label">Total Disbursed</span>
          <span class="kpi-val text-emerald">₹{{ summary()?.totalDisbursed || 0 | number:'1.2-2' }}</span>
        </div>
        <div class="glass-panel kpi-card">
          <span class="kpi-label">Outstanding Payables</span>
          <span class="kpi-val text-rose">₹{{ summary()?.totalOutstandingPayables || 0 | number:'1.2-2' }}</span>
        </div>
        <div class="glass-panel kpi-card">
          <span class="kpi-label">Overdue Balance</span>
          <span class="kpi-val text-amber">₹{{ summary()?.totalOverduePayables || 0 | number:'1.2-2' }}</span>
        </div>
      </div>

      <!-- Filter Controls -->
      <div class="glass-panel filter-bar">
        <div class="status-tabs">
          <button (click)="filterByStatus(undefined)" [class.active]="selectedStatus === undefined" class="tab-btn">All Bills</button>
          <button (click)="filterByStatus(2)" [class.active]="selectedStatus === 2" class="tab-btn">Posted</button>
          <button (click)="filterByStatus(3)" [class.active]="selectedStatus === 3" class="tab-btn">Partially Paid</button>
          <button (click)="filterByStatus(4)" [class.active]="selectedStatus === 4" class="tab-btn">Paid</button>
          <button (click)="filterByStatus(5)" [class.active]="selectedStatus === 5" class="tab-btn">Cancelled</button>
        </div>

        <button (click)="loadData()" class="btn btn-secondary btn-icon" title="Refresh">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      <!-- Bills Table -->
      <div class="glass-panel table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Bill #</th>
              <th>Vendor Invoice #</th>
              <th>Supplier</th>
              <th>Bill Date / Due</th>
              <th class="text-right">Total (₹)</th>
              <th class="text-right">Balance Due</th>
              <th class="text-center">Status</th>
              <th class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            @if (isLoading()) {
              <tr>
                <td colspan="8" class="text-center py-8">
                  <div class="spinner"></div>
                  <span class="text-muted text-sm mt-2 block">Loading vendor bills...</span>
                </td>
              </tr>
            } @else if (bills().length === 0) {
              <tr>
                <td colspan="8" class="text-center py-8 text-muted">
                  No vendor bills found matching current filter.
                </td>
              </tr>
            } @else {
              @for (bill of bills(); track bill.id) {
                <tr class="table-row">
                  <td>
                    <span class="font-mono font-semibold text-primary-light">{{ bill.billNumber }}</span>
                  </td>
                  <td>
                    <span class="font-mono text-sm text-primary">{{ bill.vendorInvoiceNumber || '—' }}</span>
                  </td>
                  <td>
                    <div class="vendor-cell">
                      <span class="font-medium text-primary">{{ bill.supplierName }}</span>
                      <span class="text-xs text-muted font-mono">{{ bill.supplierGSTIN || bill.supplierCode }}</span>
                    </div>
                  </td>
                  <td>
                    <div class="date-cell">
                      <span class="text-sm">{{ bill.billDate | date:'mediumDate' }}</span>
                      <span class="text-xs text-muted">Due: {{ bill.dueDate | date:'mediumDate' }}</span>
                    </div>
                  </td>
                  <td class="text-right font-mono font-medium">
                    ₹{{ bill.totalAmount | number:'1.2-2' }}
                  </td>
                  <td class="text-right font-mono font-semibold">
                    <span [class.text-rose]="bill.balanceAmount > 0" [class.text-emerald]="bill.balanceAmount === 0">
                      ₹{{ bill.balanceAmount | number:'1.2-2' }}
                    </span>
                  </td>
                  <td class="text-center">
                    <span class="badge" [ngClass]="getStatusBadge(bill.status)">
                      {{ bill.statusName }}
                    </span>
                  </td>
                  <td class="text-right">
                    <div class="action-btn-group">
                      <!-- Pay Bill -->
                      @if (bill.balanceAmount > 0 && bill.status !== 5) {
                        <button (click)="openPaymentModal(bill)" class="btn-action-emerald" title="Disburse Payment">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          Pay
                        </button>
                      }

                      <!-- Cancel Bill -->
                      @if (bill.paidAmount === 0 && bill.status !== 5) {
                        <button (click)="cancelBill(bill)" class="btn-icon-subtle text-rose" title="Cancel Bill">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      }
                    </div>
                  </td>
                </tr>
              }
            }
          </tbody>
        </table>
      </div>

      <!-- Record Vendor Payment Modal -->
      @if (showPaymentModal() && activeBill()) {
        <div class="modal-overlay animate-fade-in" (click)="closePaymentModal()">
          <div class="modal-dialog glass-panel" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div>
                <h2 class="modal-title">Record Vendor Disbursement</h2>
                <span class="text-xs text-muted">Bill: {{ activeBill()!.billNumber }} &bull; Vendor: {{ activeBill()!.supplierName }}</span>
              </div>
              <button (click)="closePaymentModal()" class="close-btn">&times;</button>
            </div>

            <form (ngSubmit)="submitPayment()" class="modal-form">
              <div class="payment-highlight-box mb-4">
                <div class="highlight-item">
                  <span class="label">Bill Total</span>
                  <span class="val font-mono">₹{{ activeBill()!.totalAmount | number:'1.2-2' }}</span>
                </div>
                <div class="highlight-item">
                  <span class="label">Disbursed</span>
                  <span class="val font-mono text-emerald">₹{{ activeBill()!.paidAmount | number:'1.2-2' }}</span>
                </div>
                <div class="highlight-item">
                  <span class="label">Balance Due</span>
                  <span class="val font-mono text-rose font-bold">₹{{ activeBill()!.balanceAmount | number:'1.2-2' }}</span>
                </div>
              </div>

              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Payment Amount (₹) <span class="required">*</span></label>
                  <input
                    type="number"
                    [(ngModel)]="paymentForm.amount"
                    name="amount"
                    [max]="activeBill()!.balanceAmount"
                    min="1"
                    step="0.01"
                    required
                    class="form-control font-mono"
                  />
                </div>

                <div class="form-group">
                  <label class="form-label">Payment Method <span class="required">*</span></label>
                  <select [(ngModel)]="paymentForm.method" name="method" class="form-control">
                    <option [value]="2">Bank Transfer (NEFT / RTGS)</option>
                    <option [value]="3">UPI</option>
                    <option [value]="1">Cash</option>
                    <option [value]="4">Cheque</option>
                    <option [value]="5">Card</option>
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label">Transaction Reference / UTR #</label>
                  <input type="text" [(ngModel)]="paymentForm.referenceNumber" name="ref" class="form-control font-mono" placeholder="e.g. ICICI-RTGS-99120" />
                </div>

                <div class="form-group">
                  <label class="form-label">Disbursement Date</label>
                  <input type="date" [(ngModel)]="paymentFormDate" name="paymentDate" class="form-control" />
                </div>

                <div class="form-group col-span-2">
                  <label class="form-label">Internal Disbursement Notes</label>
                  <input type="text" [(ngModel)]="paymentForm.notes" name="notes" class="form-control" placeholder="Optional notes" />
                </div>
              </div>

              <div class="modal-actions">
                <button type="button" (click)="closePaymentModal()" class="btn btn-secondary">Cancel</button>
                <button type="submit" [disabled]="isSubmittingPayment()" class="btn btn-primary">
                  {{ isSubmittingPayment() ? 'Recording...' : 'Disburse Payment' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Record Vendor Bill Modal -->
      @if (showCreateBillModal()) {
        <div class="modal-overlay animate-fade-in" (click)="closeCreateBillModal()">
          <div class="modal-dialog-large glass-panel" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2 class="modal-title">Record Incoming Vendor Bill</h2>
              <button (click)="closeCreateBillModal()" class="close-btn">&times;</button>
            </div>

            <form (ngSubmit)="submitBill()" class="modal-form">
              <div class="form-grid-inner mb-4">
                <div class="form-group">
                  <label class="form-label">Supplier / Vendor <span class="required">*</span></label>
                  <select [(ngModel)]="newBillSupplierId" name="bsupp" required class="form-control">
                    <option value="">-- Choose Vendor --</option>
                    @for (s of suppliers(); track s.id) {
                      <option [value]="s.id">{{ s.name }} ({{ s.supplierCode }})</option>
                    }
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label">Vendor's Invoice #</label>
                  <input type="text" [(ngModel)]="newBillVendorInvNo" name="vno" class="form-control font-mono" placeholder="e.g. INV-BHM-8812" />
                </div>

                <div class="form-group">
                  <label class="form-label">Warehouse <span class="required">*</span></label>
                  <select [(ngModel)]="newBillWarehouseId" name="bwh" required class="form-control">
                    <option value="">-- Choose Warehouse --</option>
                    @for (w of warehouses(); track w.id) {
                      <option [value]="w.id">{{ w.name }} ({{ w.code }})</option>
                    }
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label">Tax Regime</label>
                  <select [(ngModel)]="newBillIsInterstate" (ngModelChange)="recalculateBillTotals()" name="isInter" class="form-control">
                    <option [ngValue]="false">Intrastate (CGST 50% + SGST 50%)</option>
                    <option [ngValue]="true">Interstate (IGST 100%)</option>
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label">Bill Date</label>
                  <input type="date" [(ngModel)]="newBillDate" name="bdate" class="form-control" />
                </div>

                <div class="form-group">
                  <label class="form-label">Payment Due Date</label>
                  <input type="date" [(ngModel)]="newBillDueDate" name="bduedate" class="form-control" />
                </div>
              </div>

              <!-- Lines -->
              <div class="po-lines-section mb-4">
                <div class="flex justify-between items-center mb-2">
                  <h4 class="text-xs font-bold uppercase text-muted">Billed Line Items</h4>
                  <button type="button" (click)="addBillLine()" class="btn btn-secondary btn-sm">Add Row</button>
                </div>

                <table class="line-items-table">
                  <thead>
                    <tr>
                      <th style="width: 40%">Product</th>
                      <th style="width: 15%">Qty</th>
                      <th style="width: 20%">Price (₹)</th>
                      <th style="width: 15%">Tax %</th>
                      <th class="text-right" style="width: 10%">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (row of billLines; track $index; let idx = $index) {
                      <tr>
                        <td>
                          <select [(ngModel)]="row.productId" (ngModelChange)="onProductSelect(row)" [name]="'bprod_' + idx" class="form-control text-sm">
                            <option value="">-- Select Product --</option>
                            @for (p of products(); track p.id) {
                              <option [value]="p.id">{{ p.name }} ({{ p.sku }})</option>
                            }
                          </select>
                        </td>
                        <td>
                          <input type="number" [(ngModel)]="row.quantity" (ngModelChange)="recalculateBillLine(row)" [name]="'bqty_' + idx" min="1" class="form-control text-sm font-mono" />
                        </td>
                        <td>
                          <input type="number" [(ngModel)]="row.unitPrice" (ngModelChange)="recalculateBillLine(row)" [name]="'bprice_' + idx" min="0" step="0.01" class="form-control text-sm font-mono" />
                        </td>
                        <td>
                          <input type="number" [(ngModel)]="row.taxRate" (ngModelChange)="recalculateBillLine(row)" [name]="'btax_' + idx" min="0" max="100" class="form-control text-sm font-mono" />
                        </td>
                        <td class="text-right font-mono font-semibold">
                          ₹{{ row.totalAmount | number:'1.2-2' }}
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>

              <!-- Summary line -->
              <div class="flex justify-end gap-6 text-sm py-2 border-t border-subtle">
                <div>Subtotal: <strong class="font-mono">₹{{ billSubTotal | number:'1.2-2' }}</strong></div>
                <div>Tax: <strong class="font-mono">₹{{ billTaxTotal | number:'1.2-2' }}</strong></div>
                <div>Grand Total: <strong class="font-mono text-primary font-bold">₹{{ billGrandTotal | number:'1.2-2' }}</strong></div>
              </div>

              <div class="modal-actions">
                <button type="button" (click)="closeCreateBillModal()" class="btn btn-secondary">Cancel</button>
                <button type="submit" [disabled]="isSubmittingBill()" class="btn btn-primary">
                  {{ isSubmittingBill() ? 'Saving...' : 'Post Vendor Bill' }}
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
    .text-primary-light { color: #a5b4fc; }

    .filter-bar {
      padding: 0.75rem 1.25rem;
      border-radius: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
    }
    .status-tabs {
      display: flex;
      gap: 0.5rem;
    }
    .tab-btn {
      background: transparent;
      border: 1px solid transparent;
      color: var(--text-secondary);
      padding: 0.35rem 0.75rem;
      border-radius: 6px;
      font-size: 0.8125rem;
      font-weight: 500;
      cursor: pointer;
      transition: all var(--transition-fast);
    }
    .tab-btn:hover {
      color: var(--text-primary);
      background: rgba(255, 255, 255, 0.05);
    }
    .tab-btn.active {
      color: #fff;
      background: var(--primary);
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
    .vendor-cell, .date-cell {
      display: flex;
      flex-direction: column;
    }
    .action-btn-group {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 0.5rem;
    }
    .btn-action-emerald {
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.4);
      color: #34d399;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.25rem 0.6rem;
      border-radius: 6px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
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
      background: rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1.5rem;
    }
    .modal-dialog {
      width: 100%;
      max-width: 520px;
      background: var(--bg-surface);
      border-radius: 16px;
      padding: 1.75rem;
      border: 1px solid var(--border-active);
      box-shadow: var(--shadow-lg);
    }
    .modal-dialog-large {
      width: 100%;
      max-width: 780px;
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
      align-items: flex-start;
      margin-bottom: 1.25rem;
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
    .payment-highlight-box {
      background: var(--bg-surface-elevated);
      border-radius: 10px;
      padding: 0.875rem;
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 0.5rem;
      border: 1px solid var(--border-subtle);
    }
    .highlight-item {
      display: flex;
      flex-direction: column;
    }
    .highlight-item .label {
      font-size: 0.6875rem;
      color: var(--text-muted);
      text-transform: uppercase;
    }
    .highlight-item .val {
      font-size: 0.9375rem;
    }
    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    .form-grid-inner {
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
      padding: 0.55rem 0.75rem;
      color: var(--text-primary);
      font-size: 0.875rem;
      outline: none;
      width: 100%;
    }
    .line-items-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 0.5rem;
    }
    .line-items-table th {
      font-size: 0.75rem;
      color: var(--text-muted);
      text-transform: uppercase;
      padding: 0.5rem;
      border-bottom: 1px solid var(--border-subtle);
    }
    .line-items-table td {
      padding: 0.5rem;
      border-bottom: 1px solid var(--border-subtle);
    }
    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1.5rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border-subtle);
    }
    .required { color: var(--accent-rose); }
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
  `]
})
export class PurchaseBillsListComponent implements OnInit {
  private purchasesService = inject(PurchasesService);
  private api = inject(ApiService);
  private notify = inject(NotificationService);

  bills = signal<PurchaseBill[]>([]);
  summary = signal<PurchaseSummary | null>(null);
  suppliers = signal<Supplier[]>([]);
  warehouses = signal<any[]>([]);
  products = signal<any[]>([]);

  isLoading = signal<boolean>(false);
  selectedStatus: number | undefined = undefined;

  // Payment Modal
  showPaymentModal = signal<boolean>(false);
  activeBill = signal<PurchaseBill | null>(null);
  isSubmittingPayment = signal<boolean>(false);
  paymentForm: RecordVendorPaymentRequest = {
    purchaseBillId: '',
    amount: 0,
    method: 2,
    paymentDate: new Date().toISOString(),
    referenceNumber: '',
    notes: ''
  };
  paymentFormDate = new Date().toISOString().split('T')[0];

  // Create Bill Modal
  showCreateBillModal = signal<boolean>(false);
  isSubmittingBill = signal<boolean>(false);
  newBillSupplierId = '';
  newBillVendorInvNo = '';
  newBillWarehouseId = '';
  newBillDate = new Date().toISOString().split('T')[0];
  newBillDueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  newBillIsInterstate = false;
  billLines: BillLineItemRow[] = [];
  billSubTotal = 0;
  billTaxTotal = 0;
  billGrandTotal = 0;

  ngOnInit(): void {
    this.loadData();
    this.loadMetadata();
  }

  loadData(): void {
    this.isLoading.set(true);
    this.purchasesService.getBills(undefined, this.selectedStatus).subscribe({
      next: res => {
        if (res.success && res.data) {
          this.bills.set(res.data.items);
        }
        this.isLoading.set(false);
      },
      error: err => {
        this.notify.error(err?.error?.message || 'Failed to fetch vendor bills.');
        this.isLoading.set(false);
      }
    });

    this.purchasesService.getSummary().subscribe({
      next: res => {
        if (res.success && res.data) {
          this.summary.set(res.data);
        }
      }
    });
  }

  loadMetadata(): void {
    this.purchasesService.getSuppliers(undefined, true).subscribe(res => {
      if (res.success && res.data) {
        this.suppliers.set(res.data.items);
      }
    });

    this.api.get<any>('warehouses').subscribe(res => {
      if (res.success && res.data) {
        this.warehouses.set(res.data);
      }
    });

    this.api.get<any>('products', { pageSize: 100 }).subscribe(res => {
      if (res.success && res.data) {
        this.products.set(res.data.items);
      }
    });
  }

  filterByStatus(status?: number): void {
    this.selectedStatus = status;
    this.loadData();
  }

  getStatusBadge(status: number): string {
    switch (status) {
      case 1: return 'badge-slate';       // Draft
      case 2: return 'badge-indigo';      // Posted
      case 3: return 'badge-amber';       // PartiallyPaid
      case 4: return 'badge-emerald';     // Paid
      case 5: return 'badge-rose';        // Cancelled
      default: return 'badge-slate';
    }
  }

  openPaymentModal(bill: PurchaseBill): void {
    this.activeBill.set(bill);
    this.paymentForm = {
      purchaseBillId: bill.id,
      amount: bill.balanceAmount,
      method: 2,
      paymentDate: new Date().toISOString(),
      referenceNumber: '',
      notes: ''
    };
    this.paymentFormDate = new Date().toISOString().split('T')[0];
    this.showPaymentModal.set(true);
  }

  closePaymentModal(): void {
    this.showPaymentModal.set(false);
  }

  submitPayment(): void {
    if (!this.paymentForm.amount || this.paymentForm.amount <= 0) {
      this.notify.warning('Disbursement amount must be greater than zero.');
      return;
    }

    this.isSubmittingPayment.set(true);
    this.paymentForm.paymentDate = new Date(this.paymentFormDate).toISOString();

    this.purchasesService.recordPayment(this.paymentForm).subscribe({
      next: res => {
        this.notify.success(`Disbursement voucher recorded: ${res.data?.paymentNumber}`);
        this.isSubmittingPayment.set(false);
        this.closePaymentModal();
        this.loadData();
      },
      error: err => {
        this.notify.error(err?.error?.message || 'Failed to record payment.');
        this.isSubmittingPayment.set(false);
      }
    });
  }

  openCreateBillModal(): void {
    this.newBillSupplierId = '';
    this.newBillVendorInvNo = '';
    this.newBillWarehouseId = this.warehouses().length > 0 ? this.warehouses()[0].id : '';
    this.billLines = [{ productId: '', quantity: 10, unitPrice: 0, taxRate: 18, totalAmount: 0 }];
    this.recalculateBillTotals();
    this.showCreateBillModal.set(true);
  }

  closeCreateBillModal(): void {
    this.showCreateBillModal.set(false);
  }

  addBillLine(): void {
    this.billLines.push({ productId: '', quantity: 10, unitPrice: 0, taxRate: 18, totalAmount: 0 });
  }

  onProductSelect(row: BillLineItemRow): void {
    const p = this.products().find(item => item.id === row.productId);
    if (p) {
      row.unitPrice = p.purchasePrice || p.sellingPrice || 0;
      row.taxRate = p.taxRate || 18;
      this.recalculateBillLine(row);
    }
  }

  recalculateBillLine(row: BillLineItemRow): void {
    const gross = (row.quantity || 0) * (row.unitPrice || 0);
    const tax = gross * ((row.taxRate || 0) / 100);
    row.totalAmount = gross + tax;
    this.recalculateBillTotals();
  }

  recalculateBillTotals(): void {
    let sub = 0;
    let tax = 0;
    let grand = 0;
    for (const line of this.billLines) {
      const gross = (line.quantity || 0) * (line.unitPrice || 0);
      const lineTax = gross * ((line.taxRate || 0) / 100);
      sub += gross;
      tax += lineTax;
      grand += gross + lineTax;
    }
    this.billSubTotal = sub;
    this.billTaxTotal = tax;
    this.billGrandTotal = grand;
  }

  submitBill(): void {
    if (!this.newBillSupplierId) {
      this.notify.warning('Please select a supplier.');
      return;
    }

    const validLines = this.billLines.filter(l => l.productId && l.quantity > 0);
    if (validLines.length === 0) {
      this.notify.warning('Please add at least one valid line item.');
      return;
    }

    this.isSubmittingBill.set(true);
    const payload: CreatePurchaseBillRequest = {
      supplierId: this.newBillSupplierId,
      warehouseId: this.newBillWarehouseId,
      vendorInvoiceNumber: this.newBillVendorInvNo.trim(),
      billDate: new Date(this.newBillDate).toISOString(),
      dueDate: new Date(this.newBillDueDate).toISOString(),
      isInterstate: this.newBillIsInterstate,
      items: validLines.map(l => ({
        productId: l.productId,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        taxRate: l.taxRate
      }))
    };

    this.purchasesService.createBill(payload).subscribe({
      next: res => {
        this.notify.success(`Vendor Bill ${res.data?.billNumber} posted. Accounts payable updated.`);
        this.isSubmittingBill.set(false);
        this.closeCreateBillModal();
        this.loadData();
      },
      error: err => {
        this.notify.error(err?.error?.message || 'Failed to post vendor bill.');
        this.isSubmittingBill.set(false);
      }
    });
  }

  cancelBill(bill: PurchaseBill): void {
    if (!confirm(`Are you sure you want to cancel bill ${bill.billNumber}?`)) {
      return;
    }

    this.purchasesService.cancelBill(bill.id).subscribe({
      next: () => {
        this.notify.success(`Bill ${bill.billNumber} cancelled.`);
        this.loadData();
      },
      error: err => this.notify.error(err?.error?.message || 'Failed to cancel bill.')
    });
  }
}
