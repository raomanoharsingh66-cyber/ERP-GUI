import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SalesService } from '../../core/services/sales.service';
import { SalesInvoice, SalesSummary, RecordPaymentRequest } from '../../core/models/sales.models';
import { NotificationService } from '../../core/services/notification.service';
import { HasPermissionDirective } from '../../core/directives/has-permission.directive';

@Component({
  selector: 'app-sales-invoices-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HasPermissionDirective],
  template: `
    <div class="sales-page animate-fade-in">
      <!-- Page Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Sales Invoices & Commercial Billing</h1>
          <p class="page-subtitle">Generate GST tax invoices, monitor receivables, track payment receipts, and restock cancelled orders.</p>
        </div>

        <div class="header-actions">
          <a routerLink="/sales/customers" class="btn btn-secondary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Customer Directory
          </a>
          <a *hasPermission="'Sales.Create'" routerLink="/sales/create" class="btn btn-primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Generate Tax Invoice
          </a>
        </div>
      </div>

      <!-- Financial KPI Summary Cards -->
      <div class="kpi-strip">
        <div class="glass-panel kpi-card">
          <span class="kpi-label">Total Invoiced Revenue</span>
          <span class="kpi-val text-indigo">₹{{ summary()?.totalSales || 0 | number:'1.2-2' }}</span>
        </div>
        <div class="glass-panel kpi-card">
          <span class="kpi-label">Total Collected</span>
          <span class="kpi-val text-emerald">₹{{ summary()?.totalPaid || 0 | number:'1.2-2' }}</span>
        </div>
        <div class="glass-panel kpi-card">
          <span class="kpi-label">Pending Receivables</span>
          <span class="kpi-val text-amber">₹{{ summary()?.totalOutstanding || 0 | number:'1.2-2' }}</span>
        </div>
        <div class="glass-panel kpi-card">
          <span class="kpi-label">Overdue Balance</span>
          <span class="kpi-val text-rose">₹{{ summary()?.totalOverdue || 0 | number:'1.2-2' }}</span>
        </div>
      </div>

      <!-- Filter Controls -->
      <div class="glass-panel filter-bar">
        <div class="status-tabs">
          <button (click)="filterByStatus(undefined)" [class.active]="selectedStatus === undefined" class="tab-btn">All Invoices</button>
          <button (click)="filterByStatus(2)" [class.active]="selectedStatus === 2" class="tab-btn">Issued</button>
          <button (click)="filterByStatus(3)" [class.active]="selectedStatus === 3" class="tab-btn">Partially Paid</button>
          <button (click)="filterByStatus(4)" [class.active]="selectedStatus === 4" class="tab-btn">Paid</button>
          <button (click)="filterByStatus(6)" [class.active]="selectedStatus === 6" class="tab-btn">Cancelled</button>
        </div>

        <button (click)="loadData()" class="btn btn-secondary btn-icon" title="Refresh Invoices">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      <!-- Invoices Data Table -->
      <div class="glass-panel table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Customer</th>
              <th>Date / Due</th>
              <th class="text-right">Total (Inc. Tax)</th>
              <th class="text-right">Balance Due</th>
              <th class="text-center">Status</th>
              <th class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            @if (isLoading()) {
              <tr>
                <td colspan="7" class="text-center py-8">
                  <div class="spinner"></div>
                  <span class="text-muted text-sm mt-2 block">Loading invoices...</span>
                </td>
              </tr>
            } @else if (invoices().length === 0) {
              <tr>
                <td colspan="7" class="text-center py-8 text-muted">
                  No invoices found matching current filter.
                </td>
              </tr>
            } @else {
              @for (inv of invoices(); track inv.id) {
                <tr class="table-row">
                  <td>
                    <div class="invoice-num-cell">
                      <span class="font-mono font-semibold text-primary-light">{{ inv.invoiceNumber }}</span>
                      @if (inv.orderNumber) {
                        <span class="text-xs text-muted">SO: {{ inv.orderNumber }}</span>
                      }
                    </div>
                  </td>
                  <td>
                    <div class="customer-cell">
                      <span class="font-medium text-primary">{{ inv.customerName }}</span>
                      <span class="text-xs text-muted font-mono">{{ inv.customerGSTIN || inv.customerCode }}</span>
                    </div>
                  </td>
                  <td>
                    <div class="date-cell">
                      <span class="text-sm">{{ inv.invoiceDate | date:'mediumDate' }}</span>
                      <span class="text-xs text-muted">Due: {{ inv.dueDate | date:'mediumDate' }}</span>
                    </div>
                  </td>
                  <td class="text-right font-mono font-medium">
                    ₹{{ inv.totalAmount | number:'1.2-2' }}
                  </td>
                  <td class="text-right font-mono font-semibold">
                    <span [class.text-amber]="inv.balanceAmount > 0" [class.text-emerald]="inv.balanceAmount === 0">
                      ₹{{ inv.balanceAmount | number:'1.2-2' }}
                    </span>
                  </td>
                  <td class="text-center">
                    <span class="badge" [ngClass]="getStatusBadgeClass(inv.status)">
                      {{ inv.statusName }}
                    </span>
                  </td>
                  <td class="text-right">
                    <div class="action-btn-group">
                      <!-- Record Payment -->
                      @if (inv.balanceAmount > 0 && inv.status !== 6) {
                        <button (click)="openPaymentModal(inv)" class="btn-action-emerald" title="Record Payment">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          Pay
                        </button>
                      }

                      <!-- View / Print Invoice -->
                      <button (click)="viewInvoice(inv)" class="btn-icon-subtle" title="View & Print Tax Invoice">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4 text-indigo">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>

                      <!-- Cancel Invoice -->
                      @if (inv.paidAmount === 0 && inv.status !== 6) {
                        <button (click)="cancelInvoice(inv)" class="btn-icon-subtle" title="Cancel Invoice">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4 text-rose">
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

      <!-- Record Payment Modal -->
      @if (showPaymentModal() && activeInvoice()) {
        <div class="modal-overlay animate-fade-in" (click)="closePaymentModal()">
          <div class="modal-dialog glass-panel" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div>
                <h2 class="modal-title">Record Payment Receipt</h2>
                <span class="text-xs text-muted">Invoice: {{ activeInvoice()!.invoiceNumber }} &bull; Client: {{ activeInvoice()!.customerName }}</span>
              </div>
              <button (click)="closePaymentModal()" class="close-btn">&times;</button>
            </div>

            <form (ngSubmit)="submitPayment()" class="modal-form">
              <div class="payment-highlight-box mb-4">
                <div class="highlight-item">
                  <span class="label">Invoice Total</span>
                  <span class="val font-mono">₹{{ activeInvoice()!.totalAmount | number:'1.2-2' }}</span>
                </div>
                <div class="highlight-item">
                  <span class="label">Already Paid</span>
                  <span class="val font-mono text-emerald">₹{{ activeInvoice()!.paidAmount | number:'1.2-2' }}</span>
                </div>
                <div class="highlight-item">
                  <span class="label">Remaining Balance</span>
                  <span class="val font-mono text-amber font-bold">₹{{ activeInvoice()!.balanceAmount | number:'1.2-2' }}</span>
                </div>
              </div>

              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Payment Amount (₹) <span class="required">*</span></label>
                  <input
                    type="number"
                    [(ngModel)]="paymentForm.amount"
                    name="amount"
                    [max]="activeInvoice()!.balanceAmount"
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
                  <label class="form-label">Reference # / UTR / Cheque No</label>
                  <input type="text" [(ngModel)]="paymentForm.referenceNumber" name="ref" class="form-control font-mono" placeholder="e.g. HDFC-NEFT-88712" />
                </div>

                <div class="form-group">
                  <label class="form-label">Receipt Date</label>
                  <input type="date" [(ngModel)]="paymentFormDate" name="paymentDate" class="form-control" />
                </div>

                <div class="form-group col-span-2">
                  <label class="form-label">Receipt Notes</label>
                  <input type="text" [(ngModel)]="paymentForm.notes" name="notes" class="form-control" placeholder="Optional internal notes" />
                </div>
              </div>

              <div class="modal-actions">
                <button type="button" (click)="closePaymentModal()" class="btn btn-secondary">Cancel</button>
                <button type="submit" [disabled]="isSubmittingPayment()" class="btn btn-primary">
                  {{ isSubmittingPayment() ? 'Recording...' : 'Record Payment' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Print / View Tax Invoice Modal -->
      @if (showInvoiceModal() && activeInvoice()) {
        <div class="modal-overlay animate-fade-in" (click)="closeInvoiceModal()">
          <div class="invoice-preview-dialog glass-panel" (click)="$event.stopPropagation()">
            <div class="preview-actions">
              <button (click)="printInvoice()" class="btn btn-primary">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print Invoice
              </button>
              <button (click)="closeInvoiceModal()" class="btn btn-secondary">Close</button>
            </div>

            <!-- Tax Invoice Document Container -->
            <div class="invoice-sheet" id="print-area">
              <!-- Invoice Header -->
              <div class="inv-header">
                <div class="inv-brand">
                  <h1 class="company-name">Acme Global Ltd</h1>
                  <p class="company-address">Logistics Park, Phase 1, Bhiwandi, Maharashtra - 421302</p>
                  <p class="company-gst">GSTIN: <span class="font-mono">27AAACA0000A1Z5</span> &bull; State: Maharashtra (27)</p>
                </div>
                <div class="inv-meta">
                  <div class="tax-inv-badge">TAX INVOICE</div>
                  <div class="meta-row">
                    <span class="meta-label">Invoice No:</span>
                    <span class="meta-val font-mono font-bold">{{ activeInvoice()!.invoiceNumber }}</span>
                  </div>
                  <div class="meta-row">
                    <span class="meta-label">Date:</span>
                    <span class="meta-val">{{ activeInvoice()!.invoiceDate | date:'mediumDate' }}</span>
                  </div>
                  <div class="meta-row">
                    <span class="meta-label">Due Date:</span>
                    <span class="meta-val">{{ activeInvoice()!.dueDate | date:'mediumDate' }}</span>
                  </div>
                </div>
              </div>

              <!-- Bill To & Ship To -->
              <div class="inv-parties">
                <div class="party-box">
                  <span class="party-title">Billed To:</span>
                  <p class="party-name">{{ activeInvoice()!.customerName }}</p>
                  <p class="party-detail">{{ activeInvoice()!.customerBillingAddress || 'Address on file' }}</p>
                  <p class="party-detail">{{ activeInvoice()!.customerBillingCity }}, {{ activeInvoice()!.customerBillingState }}</p>
                  <p class="party-gst mt-2">GSTIN: <span class="font-mono">{{ activeInvoice()!.customerGSTIN || 'UNREGISTERED' }}</span></p>
                </div>
                <div class="party-box">
                  <span class="party-title">Dispatched From:</span>
                  <p class="party-name">{{ activeInvoice()!.warehouseName }}</p>
                  <p class="party-detail">Bhiwandi Hub, Maharashtra</p>
                  <p class="party-detail">Fulfillment Mode: Standard Roadway Transport</p>
                </div>
              </div>

              <!-- Items Table -->
              <table class="inv-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Item Description</th>
                    <th>HSN</th>
                    <th class="text-right">Qty</th>
                    <th class="text-right">Unit Price</th>
                    <th class="text-right">Disc %</th>
                    <th class="text-right">Tax %</th>
                    <th class="text-right">Total (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of activeInvoice()!.items; track item.id; let idx = $index) {
                    <tr>
                      <td>{{ idx + 1 }}</td>
                      <td>
                        <span class="font-medium">{{ item.productName }}</span>
                        <span class="font-mono text-xs text-muted block">{{ item.productSKU }}</span>
                      </td>
                      <td class="font-mono text-xs">848210</td>
                      <td class="text-right font-mono">{{ item.quantity }} {{ item.unitOfMeasure }}</td>
                      <td class="text-right font-mono">₹{{ item.unitPrice | number:'1.2-2' }}</td>
                      <td class="text-right font-mono">{{ item.discountPercentage }}%</td>
                      <td class="text-right font-mono">{{ item.taxRate }}%</td>
                      <td class="text-right font-mono font-medium">₹{{ item.totalAmount | number:'1.2-2' }}</td>
                    </tr>
                  }
                </tbody>
              </table>

              <!-- Invoice Totals & GST Summary -->
              <div class="inv-totals-section">
                <div class="tax-summary-panel">
                  <span class="font-bold text-xs uppercase text-muted mb-2 block">Tax Distribution</span>
                  @if (activeInvoice()!.igstAmount > 0) {
                    <div class="tax-row">
                      <span>IGST (Integrated Tax)</span>
                      <span class="font-mono">₹{{ activeInvoice()!.igstAmount | number:'1.2-2' }}</span>
                    </div>
                  } @else {
                    <div class="tax-row">
                      <span>CGST (Central Tax - 50%)</span>
                      <span class="font-mono">₹{{ activeInvoice()!.cgstAmount | number:'1.2-2' }}</span>
                    </div>
                    <div class="tax-row">
                      <span>SGST (State Tax - 50%)</span>
                      <span class="font-mono">₹{{ activeInvoice()!.sgstAmount | number:'1.2-2' }}</span>
                    </div>
                  }
                </div>

                <div class="grand-totals-panel">
                  <div class="total-row">
                    <span>Taxable Subtotal:</span>
                    <span class="font-mono">₹{{ activeInvoice()!.subTotal | number:'1.2-2' }}</span>
                  </div>
                  <div class="total-row">
                    <span>Total Tax:</span>
                    <span class="font-mono">₹{{ activeInvoice()!.taxAmount | number:'1.2-2' }}</span>
                  </div>
                  <div class="total-row grand-total">
                    <span>Invoice Total:</span>
                    <span class="font-mono text-primary font-bold">₹{{ activeInvoice()!.totalAmount | number:'1.2-2' }}</span>
                  </div>
                  <div class="total-row">
                    <span>Paid to Date:</span>
                    <span class="font-mono text-emerald font-semibold">₹{{ activeInvoice()!.paidAmount | number:'1.2-2' }}</span>
                  </div>
                  <div class="total-row balance-row">
                    <span>Net Balance Due:</span>
                    <span class="font-mono text-amber font-bold">₹{{ activeInvoice()!.balanceAmount | number:'1.2-2' }}</span>
                  </div>
                </div>
              </div>

              <!-- Payment Ledger in Invoice -->
              @if (activeInvoice()!.payments.length > 0) {
                <div class="mt-6 pt-4 border-t border-subtle">
                  <h4 class="text-xs font-bold uppercase text-muted mb-2">Recorded Payments</h4>
                  <div class="payment-pills">
                    @for (p of activeInvoice()!.payments; track p.id) {
                      <div class="payment-pill">
                        <span class="font-mono font-medium">{{ p.paymentNumber }}</span> &bull;
                        <span>{{ p.methodName }}</span> &bull;
                        <span class="font-mono text-emerald">₹{{ p.amount | number:'1.2-2' }}</span>
                        <span class="text-xs text-muted">({{ p.paymentDate | date:'shortDate' }})</span>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
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
      grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
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
    .invoice-num-cell {
      display: flex;
      flex-direction: column;
    }
    .customer-cell {
      display: flex;
      flex-direction: column;
    }
    .date-cell {
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
      transition: all var(--transition-fast);
    }
    .btn-action-emerald:hover {
      background: rgba(16, 185, 129, 0.25);
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

    /* Modal dialogs */
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

    /* Print Preview Dialog */
    .invoice-preview-dialog {
      width: 100%;
      max-width: 820px;
      max-height: 92vh;
      overflow-y: auto;
      background: var(--bg-surface);
      border-radius: 16px;
      padding: 2rem;
      border: 1px solid var(--border-active);
    }
    .preview-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
    }
    .invoice-sheet {
      background: #ffffff;
      color: #0f172a;
      border-radius: 8px;
      padding: 2.5rem;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    }
    .inv-header {
      display: flex;
      justify-content: space-between;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 1.5rem;
      margin-bottom: 1.5rem;
    }
    .company-name {
      font-size: 1.5rem;
      font-weight: 800;
      color: #1e1b4b;
    }
    .company-address, .company-gst {
      font-size: 0.8125rem;
      color: #475569;
    }
    .tax-inv-badge {
      font-size: 1rem;
      font-weight: 800;
      color: #4338ca;
      letter-spacing: 0.1em;
      text-align: right;
      margin-bottom: 0.5rem;
    }
    .meta-row {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      font-size: 0.8125rem;
    }
    .meta-label { color: #64748b; }
    .meta-val { color: #0f172a; }

    .inv-parties {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
      margin-bottom: 1.5rem;
    }
    .party-title {
      font-size: 0.75rem;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .party-name {
      font-size: 1rem;
      font-weight: 700;
      color: #1e293b;
      margin-top: 0.25rem;
    }
    .party-detail {
      font-size: 0.8125rem;
      color: #475569;
    }
    .party-gst {
      font-size: 0.8125rem;
      font-weight: 600;
      color: #1e293b;
    }

    .inv-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 1.5rem;
    }
    .inv-table th {
      background: #f1f5f9;
      color: #475569;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      padding: 0.625rem 0.75rem;
      border: 1px solid #e2e8f0;
    }
    .inv-table td {
      padding: 0.625rem 0.75rem;
      font-size: 0.8125rem;
      color: #1e293b;
      border: 1px solid #e2e8f0;
    }

    .inv-totals-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
      align-items: start;
    }
    .tax-summary-panel {
      background: #f8fafc;
      padding: 1rem;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
    }
    .tax-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.8125rem;
      color: #475569;
      margin-bottom: 0.25rem;
    }
    .grand-totals-panel {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.875rem;
      color: #475569;
    }
    .total-row.grand-total {
      border-top: 2px solid #cbd5e1;
      border-bottom: 2px solid #cbd5e1;
      padding: 0.5rem 0;
      font-size: 1.125rem;
      color: #0f172a;
    }
    .payment-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .payment-pill {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      font-size: 0.75rem;
      padding: 0.25rem 0.5rem;
      border-radius: 6px;
      color: #334155;
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
export class SalesInvoicesListComponent implements OnInit {
  private salesService = inject(SalesService);
  private notify = inject(NotificationService);

  invoices = signal<SalesInvoice[]>([]);
  summary = signal<SalesSummary | null>(null);
  isLoading = signal<boolean>(false);

  selectedStatus: number | undefined = undefined;

  // Payment Modal
  showPaymentModal = signal<boolean>(false);
  activeInvoice = signal<SalesInvoice | null>(null);
  isSubmittingPayment = signal<boolean>(false);
  paymentForm: RecordPaymentRequest = {
    salesInvoiceId: '',
    amount: 0,
    method: 2,
    paymentDate: new Date().toISOString(),
    referenceNumber: '',
    notes: ''
  };
  paymentFormDate = new Date().toISOString().split('T')[0];

  // Print Modal
  showInvoiceModal = signal<boolean>(false);

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    this.salesService.getInvoices(undefined, this.selectedStatus).subscribe({
      next: res => {
        if (res.success && res.data) {
          this.invoices.set(res.data.items);
        }
        this.isLoading.set(false);
      },
      error: err => {
        this.notify.error(err?.error?.message || 'Failed to fetch invoices.');
        this.isLoading.set(false);
      }
    });

    this.salesService.getSummary().subscribe({
      next: res => {
        if (res.success && res.data) {
          this.summary.set(res.data);
        }
      }
    });
  }

  filterByStatus(status?: number): void {
    this.selectedStatus = status;
    this.loadData();
  }

  getStatusBadgeClass(status: number): string {
    switch (status) {
      case 2: return 'badge-indigo';      // Issued
      case 3: return 'badge-amber';       // PartiallyPaid
      case 4: return 'badge-emerald';     // Paid
      case 5: return 'badge-rose';        // Overdue
      case 6: return 'badge-slate';       // Cancelled
      default: return 'badge-slate';
    }
  }

  openPaymentModal(inv: SalesInvoice): void {
    this.activeInvoice.set(inv);
    this.paymentForm = {
      salesInvoiceId: inv.id,
      amount: inv.balanceAmount,
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
      this.notify.warning('Payment amount must be greater than zero.');
      return;
    }

    this.isSubmittingPayment.set(true);
    this.paymentForm.paymentDate = new Date(this.paymentFormDate).toISOString();

    this.salesService.recordPayment(this.paymentForm).subscribe({
      next: res => {
        this.notify.success(`Payment receipt recorded: ${res.data?.paymentNumber}`);
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

  viewInvoice(inv: SalesInvoice): void {
    this.activeInvoice.set(inv);
    this.showInvoiceModal.set(true);
  }

  closeInvoiceModal(): void {
    this.showInvoiceModal.set(false);
  }

  printInvoice(): void {
    window.print();
  }

  cancelInvoice(inv: SalesInvoice): void {
    if (!confirm(`Are you sure you want to cancel invoice ${inv.invoiceNumber}? Stock will be restocked to warehouse.`)) {
      return;
    }

    this.salesService.cancelInvoice(inv.id).subscribe({
      next: () => {
        this.notify.success(`Invoice ${inv.invoiceNumber} cancelled and inventory restocked.`);
        this.loadData();
      },
      error: err => {
        this.notify.error(err?.error?.message || 'Failed to cancel invoice.');
      }
    });
  }
}
