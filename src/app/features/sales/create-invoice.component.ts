import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SalesService } from '../../core/services/sales.service';
import { ApiService } from '../../core/services/api.service';
import { Customer, CreateSalesInvoiceRequest, CreateSalesInvoiceItemRequest } from '../../core/models/sales.models';
import { NotificationService } from '../../core/services/notification.service';

interface LineItemRow {
  productId: string;
  productName: string;
  sku: string;
  uom: string;
  quantity: number;
  unitPrice: number;
  discountPercentage: number;
  taxRate: number;
  netAmount: number;
  taxAmount: number;
  totalAmount: number;
  notes?: string;
}

interface ProductOption {
  id: string;
  name: string;
  sku: string;
  sellingPrice: number;
  taxRate: number;
  unitOfMeasureCode: string;
}

interface WarehouseOption {
  id: string;
  name: string;
  code: string;
}

@Component({
  selector: 'app-create-invoice',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="create-invoice-page animate-fade-in">
      <!-- Header -->
      <div class="page-header">
        <div>
          <a routerLink="/sales/invoices" class="back-link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Invoices
          </a>
          <h1 class="page-title mt-1">Generate Sales Tax Invoice</h1>
          <p class="page-subtitle">Create commercial GST invoice, apply automatic tax distribution, and reserve stock.</p>
        </div>

        <div class="header-actions">
          <button type="button" (click)="submitInvoice()" [disabled]="isSubmitting()" class="btn btn-primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {{ isSubmitting() ? 'Issuing Invoice...' : 'Issue & Authorize Invoice' }}
          </button>
        </div>
      </div>

      <!-- Main Form -->
      <div class="invoice-grid">
        <!-- Left Side: Parties & Configuration -->
        <div class="glass-panel form-card">
          <h3 class="card-section-title">Invoice Details & Parties</h3>

          <div class="form-grid-inner">
            <!-- Customer Selector -->
            <div class="form-group col-span-2">
              <label class="form-label">Customer Account <span class="required">*</span></label>
              <select [(ngModel)]="selectedCustomerId" (ngModelChange)="onCustomerChange()" class="form-control">
                <option value="">-- Select Customer --</option>
                @for (c of customers(); track c.id) {
                  <option [value]="c.id">{{ c.name }} ({{ c.customerCode }})</option>
                }
              </select>
            </div>

            <!-- Customer Details Card -->
            @if (selectedCustomer()) {
              <div class="customer-preview col-span-2">
                <div class="preview-item">
                  <span class="preview-label">GSTIN / Tax ID:</span>
                  <span class="font-mono text-xs">{{ selectedCustomer()!.gstin || 'Unregistered' }}</span>
                </div>
                <div class="preview-item">
                  <span class="preview-label">Billing Location:</span>
                  <span class="text-xs">{{ selectedCustomer()!.billingCity || '—' }}, {{ selectedCustomer()!.billingState || '—' }}</span>
                </div>
                <div class="preview-item">
                  <span class="preview-label">Current Balance:</span>
                  <span class="text-xs font-mono font-bold" [class.text-amber]="selectedCustomer()!.outstandingBalance > 0">
                    ₹{{ selectedCustomer()!.outstandingBalance | number:'1.2-2' }}
                  </span>
                </div>
              </div>
            }

            <!-- Dispatch Warehouse -->
            <div class="form-group">
              <label class="form-label">Fulfillment Warehouse <span class="required">*</span></label>
              <select [(ngModel)]="selectedWarehouseId" class="form-control">
                <option value="">-- Select Warehouse --</option>
                @for (w of warehouses(); track w.id) {
                  <option [value]="w.id">{{ w.name }} ({{ w.code }})</option>
                }
              </select>
            </div>

            <!-- Tax Treatment (Intrastate vs Interstate) -->
            <div class="form-group">
              <label class="form-label">Tax Regime (GST)</label>
              <select [(ngModel)]="isInterstate" (ngModelChange)="recalculateTotals()" class="form-control">
                <option [ngValue]="false">Intrastate (CGST 50% + SGST 50%)</option>
                <option [ngValue]="true">Interstate (IGST 100%)</option>
              </select>
            </div>

            <!-- Invoice Date -->
            <div class="form-group">
              <label class="form-label">Invoice Date <span class="required">*</span></label>
              <input type="date" [(ngModel)]="invoiceDate" class="form-control" />
            </div>

            <!-- Due Date -->
            <div class="form-group">
              <label class="form-label">Payment Due Date <span class="required">*</span></label>
              <input type="date" [(ngModel)]="dueDate" class="form-control" />
            </div>

            <!-- Notes -->
            <div class="form-group col-span-2">
              <label class="form-label">Commercial Notes / Terms</label>
              <textarea [(ngModel)]="notes" rows="2" class="form-control" placeholder="e.g. Terms: 30 days net, Goods once sold will not be taken back"></textarea>
            </div>
          </div>
        </div>

        <!-- Right Side: Real-time Tax & Commercial Calculation -->
        <div class="glass-panel summary-card">
          <h3 class="card-section-title">Commercial Summary</h3>

          <div class="summary-breakdown">
            <div class="summary-line">
              <span class="label">Taxable Subtotal:</span>
              <span class="val font-mono">₹{{ subTotal | number:'1.2-2' }}</span>
            </div>

            <div class="summary-line">
              <span class="label">Trade Discount:</span>
              <span class="val font-mono text-emerald">-₹{{ totalDiscount | number:'1.2-2' }}</span>
            </div>

            <div class="summary-separator"></div>

            @if (isInterstate) {
              <div class="summary-line">
                <span class="label">Integrated Tax (IGST):</span>
                <span class="val font-mono">₹{{ totalTax | number:'1.2-2' }}</span>
              </div>
            } @else {
              <div class="summary-line">
                <span class="label">Central Tax (CGST):</span>
                <span class="val font-mono">₹{{ (totalTax / 2) | number:'1.2-2' }}</span>
              </div>
              <div class="summary-line">
                <span class="label">State Tax (SGST):</span>
                <span class="val font-mono">₹{{ (totalTax / 2) | number:'1.2-2' }}</span>
              </div>
            }

            <div class="summary-separator"></div>

            <div class="summary-line grand-total-line">
              <span class="label">Invoice Total:</span>
              <span class="val font-mono text-indigo">₹{{ grandTotal | number:'1.2-2' }}</span>
            </div>
          </div>

          <div class="mt-6 pt-4 border-t border-subtle">
            <button type="button" (click)="submitInvoice()" [disabled]="isSubmitting()" class="btn btn-primary w-full justify-center">
              {{ isSubmitting() ? 'Processing...' : 'Confirm & Authorize Invoice' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Line Items Section -->
      <div class="glass-panel items-card mt-6">
        <div class="items-header">
          <h3 class="card-section-title">Invoice Line Items</h3>
          <button type="button" (click)="addLineItem()" class="btn btn-secondary btn-sm">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Item Row
          </button>
        </div>

        <div class="table-responsive">
          <table class="line-items-table">
            <thead>
              <tr>
                <th style="width: 30%">Product / SKU</th>
                <th style="width: 12%">Quantity</th>
                <th style="width: 14%">Unit Price (₹)</th>
                <th style="width: 10%">Disc %</th>
                <th style="width: 10%">Tax %</th>
                <th class="text-right" style="width: 18%">Net Total (₹)</th>
                <th style="width: 6%"></th>
              </tr>
            </thead>
            <tbody>
              @for (row of lineItems; track $index; let idx = $index) {
                <tr>
                  <td>
                    <select [(ngModel)]="row.productId" (ngModelChange)="onProductSelect(row)" class="form-control text-sm">
                      <option value="">-- Choose Product --</option>
                      @for (p of products(); track p.id) {
                        <option [value]="p.id">{{ p.name }} ({{ p.sku }})</option>
                      }
                    </select>
                    @if (row.sku) {
                      <span class="text-xs text-muted font-mono block mt-1">UOM: {{ row.uom }}</span>
                    }
                  </td>
                  <td>
                    <input
                      type="number"
                      [(ngModel)]="row.quantity"
                      (ngModelChange)="recalculateRow(row)"
                      min="1"
                      step="1"
                      class="form-control text-sm font-mono"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      [(ngModel)]="row.unitPrice"
                      (ngModelChange)="recalculateRow(row)"
                      min="0"
                      step="0.01"
                      class="form-control text-sm font-mono"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      [(ngModel)]="row.discountPercentage"
                      (ngModelChange)="recalculateRow(row)"
                      min="0"
                      max="100"
                      class="form-control text-sm font-mono"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      [(ngModel)]="row.taxRate"
                      (ngModelChange)="recalculateRow(row)"
                      min="0"
                      max="100"
                      class="form-control text-sm font-mono"
                    />
                  </td>
                  <td class="text-right font-mono font-semibold">
                    ₹{{ row.totalAmount | number:'1.2-2' }}
                  </td>
                  <td class="text-center">
                    @if (lineItems.length > 1) {
                      <button type="button" (click)="removeLineItem(idx)" class="btn-icon-subtle text-rose" title="Remove Row">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .create-invoice-page {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.8125rem;
      color: var(--text-muted);
      text-decoration: none;
      transition: color var(--transition-fast);
    }
    .back-link:hover {
      color: var(--primary);
    }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
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
    }
    .invoice-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 1.5rem;
    }
    .form-card, .summary-card, .items-card {
      border-radius: 14px;
      padding: 1.5rem;
    }
    .card-section-title {
      font-family: var(--font-heading);
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 1.25rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid var(--border-subtle);
    }
    .form-grid-inner {
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
      padding: 0.55rem 0.75rem;
      color: var(--text-primary);
      font-size: 0.875rem;
      outline: none;
      transition: border-color var(--transition-fast);
      width: 100%;
    }
    .form-control:focus {
      border-color: var(--primary);
    }
    .customer-preview {
      background: var(--bg-surface-elevated);
      border-radius: 8px;
      padding: 0.75rem;
      border: 1px solid var(--border-subtle);
      display: flex;
      justify-content: space-between;
      gap: 1rem;
    }
    .preview-item {
      display: flex;
      flex-direction: column;
    }
    .preview-label {
      font-size: 0.6875rem;
      color: var(--text-muted);
      text-transform: uppercase;
    }

    .summary-breakdown {
      display: flex;
      flex-direction: column;
      gap: 0.625rem;
    }
    .summary-line {
      display: flex;
      justify-content: space-between;
      font-size: 0.875rem;
      color: var(--text-secondary);
    }
    .summary-separator {
      height: 1px;
      background: var(--border-subtle);
      margin: 0.25rem 0;
    }
    .grand-total-line {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .items-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    .items-header .card-section-title {
      margin-bottom: 0;
      border-bottom: none;
      padding-bottom: 0;
    }
    .table-responsive {
      overflow-x: auto;
    }
    .line-items-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }
    .line-items-table th {
      padding: 0.625rem 0.75rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      border-bottom: 1px solid var(--border-subtle);
    }
    .line-items-table td {
      padding: 0.75rem;
      vertical-align: top;
      border-bottom: 1px solid var(--border-subtle);
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
    .w-full { width: 100%; }
    .justify-center { justify-content: center; }
    .required { color: var(--accent-rose); }
    .text-indigo { color: #818cf8; }
    .text-emerald { color: #34d399; }
    .text-amber { color: #fbbf24; }
    .text-rose { color: #f87171; }
  `]
})
export class CreateInvoiceComponent implements OnInit {
  private salesService = inject(SalesService);
  private api = inject(ApiService);
  private notify = inject(NotificationService);
  private router = inject(Router);

  customers = signal<Customer[]>([]);
  warehouses = signal<WarehouseOption[]>([]);
  products = signal<ProductOption[]>([]);

  selectedCustomerId = '';
  selectedCustomer = signal<Customer | null>(null);
  selectedWarehouseId = '';

  invoiceDate = new Date().toISOString().split('T')[0];
  dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  isInterstate = false;
  notes = '';

  lineItems: LineItemRow[] = [
    {
      productId: '',
      productName: '',
      sku: '',
      uom: '',
      quantity: 1,
      unitPrice: 0,
      discountPercentage: 0,
      taxRate: 18,
      netAmount: 0,
      taxAmount: 0,
      totalAmount: 0
    }
  ];

  subTotal = 0;
  totalDiscount = 0;
  totalTax = 0;
  grandTotal = 0;

  isSubmitting = signal<boolean>(false);

  ngOnInit(): void {
    this.loadInitialData();
  }

  loadInitialData(): void {
    // Load customers
    this.salesService.getCustomers(undefined, true).subscribe(res => {
      if (res.success && res.data) {
        this.customers.set(res.data.items);
      }
    });

    // Load warehouses
    this.api.get<any>('warehouses').subscribe(res => {
      if (res.success && res.data) {
        this.warehouses.set(res.data);
        if (res.data.length > 0) {
          this.selectedWarehouseId = res.data[0].id;
        }
      }
    });

    // Load products
    this.api.get<any>('products', { pageSize: 100 }).subscribe(res => {
      if (res.success && res.data) {
        this.products.set(res.data.items);
      }
    });
  }

  onCustomerChange(): void {
    const cust = this.customers().find(c => c.id === this.selectedCustomerId) || null;
    this.selectedCustomer.set(cust);
    if (cust && cust.billingState) {
      // Auto determine interstate if billing state is not Maharashtra
      this.isInterstate = cust.billingState.toLowerCase() !== 'maharashtra';
      this.recalculateTotals();
    }
  }

  addLineItem(): void {
    this.lineItems.push({
      productId: '',
      productName: '',
      sku: '',
      uom: '',
      quantity: 1,
      unitPrice: 0,
      discountPercentage: 0,
      taxRate: 18,
      netAmount: 0,
      taxAmount: 0,
      totalAmount: 0
    });
  }

  removeLineItem(index: number): void {
    if (this.lineItems.length > 1) {
      this.lineItems.splice(index, 1);
      this.recalculateTotals();
    }
  }

  onProductSelect(row: LineItemRow): void {
    const prod = this.products().find(p => p.id === row.productId);
    if (prod) {
      row.productName = prod.name;
      row.sku = prod.sku;
      row.uom = prod.unitOfMeasureCode;
      row.unitPrice = prod.sellingPrice;
      row.taxRate = prod.taxRate;
      this.recalculateRow(row);
    }
  }

  recalculateRow(row: LineItemRow): void {
    const gross = (row.quantity || 0) * (row.unitPrice || 0);
    const disc = gross * ((row.discountPercentage || 0) / 100);
    const net = gross - disc;
    const tax = net * ((row.taxRate || 0) / 100);

    row.netAmount = net;
    row.taxAmount = tax;
    row.totalAmount = net + tax;

    this.recalculateTotals();
  }

  recalculateTotals(): void {
    let sub = 0;
    let disc = 0;
    let tax = 0;
    let grand = 0;

    for (const item of this.lineItems) {
      const gross = (item.quantity || 0) * (item.unitPrice || 0);
      const itemDisc = gross * ((item.discountPercentage || 0) / 100);
      sub += gross;
      disc += itemDisc;
      tax += item.taxAmount;
      grand += item.totalAmount;
    }

    this.subTotal = sub;
    this.totalDiscount = disc;
    this.totalTax = tax;
    this.grandTotal = grand;
  }

  submitInvoice(): void {
    if (!this.selectedCustomerId) {
      this.notify.warning('Please select a customer.');
      return;
    }

    if (!this.selectedWarehouseId) {
      this.notify.warning('Please select a dispatch warehouse.');
      return;
    }

    const validItems = this.lineItems.filter(i => i.productId && i.quantity > 0);
    if (validItems.length === 0) {
      this.notify.warning('Invoice must contain at least one valid product line.');
      return;
    }

    this.isSubmitting.set(true);

    const invoicePayload: CreateSalesInvoiceRequest = {
      customerId: this.selectedCustomerId,
      warehouseId: this.selectedWarehouseId,
      invoiceDate: new Date(this.invoiceDate).toISOString(),
      dueDate: new Date(this.dueDate).toISOString(),
      isInterstate: this.isInterstate,
      notes: this.notes,
      items: validItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountPercentage: item.discountPercentage,
        taxRate: item.taxRate,
        notes: item.notes
      }))
    };

    this.salesService.createInvoice(invoicePayload).subscribe({
      next: res => {
        this.notify.success(`Invoice ${res.data?.invoiceNumber} authorized and stock depleted.`);
        this.isSubmitting.set(false);
        this.router.navigate(['/sales/invoices']);
      },
      error: err => {
        this.notify.error(err?.error?.message || 'Failed to issue sales invoice.');
        this.isSubmitting.set(false);
      }
    });
  }
}
