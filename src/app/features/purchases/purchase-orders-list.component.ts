import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PurchasesService } from '../../core/services/purchases.service';
import { ApiService } from '../../core/services/api.service';
import {
  PurchaseOrder,
  Supplier,
  CreatePurchaseOrderRequest,
  CreateGoodsReceiptNoteRequest,
  GoodsReceiptNote
} from '../../core/models/purchases.models';
import { NotificationService } from '../../core/services/notification.service';
import { HasPermissionDirective } from '../../core/directives/has-permission.directive';

interface POLineItemRow {
  productId: string;
  orderedQuantity: number;
  unitPrice: number;
  taxRate: number;
  totalAmount: number;
}

interface GRNReceiptLineRow {
  productId: string;
  productName: string;
  sku: string;
  poItemId?: string;
  orderedQuantity: number;
  previouslyReceived: number;
  receivedQuantity: number;
  acceptedQuantity: number;
  rejectedQuantity: number;
  unitPrice: number;
  notes?: string;
}

@Component({
  selector: 'app-purchase-orders-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="purchases-page animate-fade-in">
      <!-- Page Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Purchase Orders & Goods Inward</h1>
          <p class="page-subtitle">Track vendor procurement orders, approve supplier requisitions, and record Goods Receipt Notes (GRN).</p>
        </div>

        <div class="header-actions">
          <a routerLink="/purchases/suppliers" class="btn btn-secondary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Vendors
          </a>
          <a routerLink="/purchases/bills" class="btn btn-secondary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Vendor Bills
          </a>
          <button *hasPermission="'Purchases.Create'" (click)="openCreateModal()" class="btn btn-primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Create Purchase Order
          </button>
        </div>
      </div>

      <!-- Filter Controls -->
      <div class="glass-panel filter-bar">
        <div class="status-tabs">
          <button (click)="filterByStatus(undefined)" [class.active]="selectedStatus === undefined" class="tab-btn">All Orders</button>
          <button (click)="filterByStatus(1)" [class.active]="selectedStatus === 1" class="tab-btn">Draft</button>
          <button (click)="filterByStatus(2)" [class.active]="selectedStatus === 2" class="tab-btn">Approved</button>
          <button (click)="filterByStatus(3)" [class.active]="selectedStatus === 3" class="tab-btn">Partially Received</button>
          <button (click)="filterByStatus(4)" [class.active]="selectedStatus === 4" class="tab-btn">Received</button>
        </div>

        <button (click)="loadOrders()" class="btn btn-secondary btn-icon" title="Refresh">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      <!-- Orders Table -->
      <div class="glass-panel table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>PO Number</th>
              <th>Supplier</th>
              <th>Order Date</th>
              <th>Warehouse</th>
              <th class="text-right">Total (₹)</th>
              <th class="text-center">Status</th>
              <th class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            @if (isLoading()) {
              <tr>
                <td colspan="7" class="text-center py-8">
                  <div class="spinner"></div>
                  <span class="text-muted text-sm mt-2 block">Loading purchase orders...</span>
                </td>
              </tr>
            } @else if (orders().length === 0) {
              <tr>
                <td colspan="7" class="text-center py-8 text-muted">
                  No purchase orders found matching current filters.
                </td>
              </tr>
            } @else {
              @for (po of orders(); track po.id) {
                <tr class="table-row">
                  <td>
                    <div class="po-info">
                      <span class="font-mono font-semibold text-primary-light">{{ po.poNumber }}</span>
                      <span class="text-xs text-muted">{{ po.items.length }} line items</span>
                    </div>
                  </td>
                  <td>
                    <div class="vendor-info">
                      <span class="font-medium text-primary">{{ po.supplierName }}</span>
                      <span class="text-xs text-muted font-mono">{{ po.supplierCode }}</span>
                    </div>
                  </td>
                  <td>
                    <span class="text-sm">{{ po.orderDate | date:'mediumDate' }}</span>
                  </td>
                  <td>
                    <span class="text-sm text-secondary">{{ po.warehouseName }}</span>
                  </td>
                  <td class="text-right font-mono font-medium">
                    ₹{{ po.totalAmount | number:'1.2-2' }}
                  </td>
                  <td class="text-center">
                    <span class="badge" [ngClass]="getStatusBadge(po.status)">
                      {{ po.statusName }}
                    </span>
                  </td>
                  <td class="text-right">
                    <div class="action-btn-group">
                      <!-- View / Print PO -->
                      <button (click)="viewPrintPO(po)" class="btn-action-slate" title="View & Print Purchase Order">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-3.5 h-3.5">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        Print PO
                      </button>

                      <!-- View & Print GRNs (if goods received or partially received) -->
                      @if (po.status === 3 || po.status === 4) {
                        <button (click)="viewPOGRNs(po)" class="btn-action-indigo" title="View & Print Goods Receipt Notes">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-3.5 h-3.5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          GRNs
                        </button>
                      }

                      <!-- Approve PO -->
                      @if (po.status === 1) {
                        <button (click)="approvePO(po)" class="btn-action-amber" title="Approve Order">
                          Approve
                        </button>
                      }

                      <!-- Receive Goods (GRN) -->
                      @if (po.status === 2 || po.status === 3) {
                        <button (click)="openGRNModal(po)" class="btn-action-emerald" title="Log Goods Receipt (GRN)">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-3.5 h-3.5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                          </svg>
                          Receive GRN
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

      <!-- Create Purchase Order Modal -->
      @if (showCreateModal()) {
        <div class="modal-overlay animate-fade-in" (click)="closeCreateModal()">
          <div class="modal-dialog-large glass-panel" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2 class="modal-title">Generate Purchase Order</h2>
              <button (click)="closeCreateModal()" class="close-btn">&times;</button>
            </div>

            <form (ngSubmit)="submitPO()" class="modal-form">
              <div class="form-grid-inner mb-4">
                <div class="form-group">
                  <label class="form-label">Supplier / Vendor <span class="required">*</span></label>
                  <select [(ngModel)]="newPOSupplierId" name="supp" required class="form-control">
                    <option value="">-- Choose Vendor --</option>
                    @for (s of suppliers(); track s.id) {
                      <option [value]="s.id">{{ s.name }} ({{ s.supplierCode }})</option>
                    }
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label">Destination Warehouse <span class="required">*</span></label>
                  <select [(ngModel)]="newPOWarehouseId" name="wh" required class="form-control">
                    <option value="">-- Choose Warehouse --</option>
                    @for (w of warehouses(); track w.id) {
                      <option [value]="w.id">{{ w.name }} ({{ w.code }})</option>
                    }
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label">Order Date</label>
                  <input type="date" [(ngModel)]="newPOOrderDate" name="od" class="form-control" />
                </div>

                <div class="form-group">
                  <label class="form-label">Expected Delivery Date</label>
                  <input type="date" [(ngModel)]="newPODeliveryDate" name="dd" class="form-control" />
                </div>

                <div class="form-group col-span-2">
                  <label class="form-label">Procurement Instructions</label>
                  <input type="text" [(ngModel)]="newPONotes" name="notes" class="form-control" placeholder="e.g. Standard test certificate required upon delivery" />
                </div>
              </div>

              <!-- Lines -->
              <div class="po-lines-section">
                <div class="flex justify-between items-center mb-2">
                  <h4 class="text-xs font-bold uppercase text-muted">Purchase Line Items</h4>
                  <button type="button" (click)="addPOLine()" class="btn btn-secondary btn-sm">Add Item</button>
                </div>

                <table class="line-items-table">
                  <thead>
                    <tr>
                      <th style="width: 40%">Product / SKU</th>
                      <th style="width: 15%">Qty</th>
                      <th style="width: 20%">Price (₹)</th>
                      <th style="width: 15%">Tax %</th>
                      <th class="text-right" style="width: 10%">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (row of poLines; track $index; let idx = $index) {
                      <tr>
                        <td>
                          <select [(ngModel)]="row.productId" (ngModelChange)="onProductSelect(row)" [name]="'prod_' + idx" class="form-control text-sm">
                            <option value="">-- Select Product --</option>
                            @for (p of products(); track p.id) {
                              <option [value]="p.id">{{ p.name }} ({{ p.sku }})</option>
                            }
                          </select>
                        </td>
                        <td>
                          <input type="number" [(ngModel)]="row.orderedQuantity" (ngModelChange)="recalculatePOLine(row)" [name]="'qty_' + idx" min="1" class="form-control text-sm font-mono" />
                        </td>
                        <td>
                          <input type="number" [(ngModel)]="row.unitPrice" (ngModelChange)="recalculatePOLine(row)" [name]="'price_' + idx" min="0" step="0.01" class="form-control text-sm font-mono" />
                        </td>
                        <td>
                          <input type="number" [(ngModel)]="row.taxRate" (ngModelChange)="recalculatePOLine(row)" [name]="'tax_' + idx" min="0" max="100" class="form-control text-sm font-mono" />
                        </td>
                        <td class="text-right font-mono font-semibold">
                          ₹{{ row.totalAmount | number:'1.2-2' }}
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>

              <div class="modal-actions">
                <button type="button" (click)="closeCreateModal()" class="btn btn-secondary">Cancel</button>
                <button type="submit" [disabled]="isSubmittingPO()" class="btn btn-primary">
                  {{ isSubmittingPO() ? 'Creating PO...' : 'Create Purchase Order' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Goods Receipt Note (GRN) Inward Modal -->
      @if (showGRNModal() && activePO()) {
        <div class="modal-overlay animate-fade-in" (click)="closeGRNModal()">
          <div class="modal-dialog-large glass-panel" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div>
                <h2 class="modal-title">Record Goods Receipt Note (GRN)</h2>
                <span class="text-xs text-muted">Against PO: {{ activePO()!.poNumber }} &bull; Supplier: {{ activePO()!.supplierName }}</span>
              </div>
              <button (click)="closeGRNModal()" class="close-btn">&times;</button>
            </div>

            <form (ngSubmit)="submitGRN()" class="modal-form">
              <div class="form-grid-inner mb-4">
                <div class="form-group">
                  <label class="form-label">Delivery Note / Challan # <span class="required">*</span></label>
                  <input type="text" [(ngModel)]="grnChallanNo" name="dc" required class="form-control font-mono" placeholder="e.g. DC-BHM-9912" />
                </div>

                <div class="form-group">
                  <label class="form-label">Receipt Date</label>
                  <input type="date" [(ngModel)]="grnReceiptDate" name="rd" class="form-control" />
                </div>
              </div>

              <table class="line-items-table mb-4">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th class="text-center">Ordered</th>
                    <th class="text-center">Prev. Recv</th>
                    <th style="width: 20%">Now Receiving</th>
                    <th style="width: 20%">Accepted (Inward)</th>
                  </tr>
                </thead>
                <tbody>
                  @for (row of grnLines; track $index; let idx = $index) {
                    <tr>
                      <td>
                        <span class="font-medium">{{ row.productName }}</span>
                        <span class="font-mono text-xs text-muted block">{{ row.sku }}</span>
                      </td>
                      <td class="text-center font-mono">{{ row.orderedQuantity }}</td>
                      <td class="text-center font-mono text-muted">{{ row.previouslyReceived }}</td>
                      <td>
                        <input
                          type="number"
                          [(ngModel)]="row.receivedQuantity"
                          (ngModelChange)="row.acceptedQuantity = row.receivedQuantity"
                          [name]="'recv_' + idx"
                          min="0"
                          class="form-control text-sm font-mono"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          [(ngModel)]="row.acceptedQuantity"
                          [name]="'acc_' + idx"
                          min="0"
                          [max]="row.receivedQuantity"
                          class="form-control text-sm font-mono text-emerald"
                        />
                      </td>
                    </tr>
                  }
                </tbody>
              </table>

              <div class="bg-surface-elevated p-3 rounded-lg text-xs text-muted mb-4 border border-subtle">
                <span class="font-bold text-emerald block mb-1">&bull; Real-time Stock Replenishment:</span>
                Submitting this GRN will automatically credit physical stock in <strong class="text-primary">{{ activePO()!.warehouseName }}</strong> and recalculate Weighted Average Cost based on unit purchase rates.
              </div>

              <div class="modal-actions">
                <button type="button" (click)="closeGRNModal()" class="btn btn-secondary">Cancel</button>
                <button type="submit" [disabled]="isSubmittingGRN()" class="btn btn-primary">
                  {{ isSubmittingGRN() ? 'Verifying & Inwarding...' : 'Verify GRN & Restock Warehouse' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Print / View Purchase Order Modal (Dynamic ERP Format) -->
      @if (showPrintPOModal() && activePrintPO()) {
        <div class="modal-overlay print-modal-overlay animate-fade-in" (click)="closePrintPOModal()">
          <div class="invoice-preview-dialog glass-panel" (click)="$event.stopPropagation()">
            <div class="preview-actions no-print" style="display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 12px;">
              <div class="company-customizer" style="display: flex; align-items: center; gap: 8px;">
                <label style="color: #cbd5e1; font-size: 12px; font-weight: 600; white-space: nowrap;">Company Name:</label>
                <input type="text" [(ngModel)]="companyName" class="form-control" style="width: 220px; padding: 4px 8px; font-size: 12px; height: 32px; background: rgba(30, 41, 59, 0.8); border: 1px solid rgba(255, 255, 255, 0.2); color: #fff; border-radius: 4px;" placeholder="SHIDHARTH TEXTILE" />
              </div>
              <div style="display: flex; gap: 8px;">
                <button (click)="printPO()" class="btn btn-primary">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print Purchase Order
                </button>
                <button (click)="closePrintPOModal()" class="btn btn-secondary">Close</button>
              </div>
            </div>

            <!-- Professional ERP PO Document Sheet (Print Area) -->
            <div class="erp-print-sheet" id="print-area">
              <!-- Header -->
              <div class="doc-header">
                <div class="company-brand">
                  <div class="brand-monogram">S</div>
                  <div>
                    <h1 class="company-name">{{ companyName }}</h1>
                    <p class="company-sub">{{ companyAddress1 }} {{ companyAddress2 }}</p>
                    <p class="company-tax">GSTIN: <span class="font-mono">{{ companyGST }}</span> &bull; {{ companyCityState }} &bull; {{ companyPhone }}</p>
                  </div>
                </div>
                <div class="doc-meta">
                  <div class="doc-badge po-badge">PURCHASE ORDER</div>
                  <div class="meta-row">
                    <span class="meta-label">PO Number:</span>
                    <span class="meta-val font-mono">{{ activePrintPO()!.poNumber }}</span>
                  </div>
                  <div class="meta-row">
                    <span class="meta-label">Order Date:</span>
                    <span class="meta-val">{{ activePrintPO()!.orderDate | date:'mediumDate' }}</span>
                  </div>
                  @if (activePrintPO()!.expectedDeliveryDate) {
                    <div class="meta-row">
                      <span class="meta-label">Expected Delivery:</span>
                      <span class="meta-val">{{ activePrintPO()!.expectedDeliveryDate | date:'mediumDate' }}</span>
                    </div>
                  }
                  <div class="meta-row">
                    <span class="meta-label">Status:</span>
                    <span class="meta-val badge-text">{{ activePrintPO()!.statusName }}</span>
                  </div>
                </div>
              </div>

              <!-- Parties Details -->
              <div class="parties-grid">
                <div class="party-card">
                  <span class="party-title">Vendor / Supplier:</span>
                  <h3 class="party-name">{{ activePrintPO()!.supplierName }}</h3>
                  <p class="party-detail">Vendor Code: <span class="font-mono font-semibold">{{ activePrintPO()!.supplierCode }}</span></p>
                  @if (getSupplier(activePrintPO()!.supplierId)?.contactPerson) {
                    <p class="party-detail">Attn: {{ getSupplier(activePrintPO()!.supplierId)?.contactPerson }}</p>
                  }
                  @if (getSupplier(activePrintPO()!.supplierId)?.phone) {
                    <p class="party-detail">Phone: {{ getSupplier(activePrintPO()!.supplierId)?.phone }}</p>
                  }
                  @if (getSupplier(activePrintPO()!.supplierId)?.email) {
                    <p class="party-detail">Email: {{ getSupplier(activePrintPO()!.supplierId)?.email }}</p>
                  }
                  @if (getSupplier(activePrintPO()!.supplierId)?.gstin) {
                    <p class="party-detail">GSTIN: <span class="font-mono font-semibold">{{ getSupplier(activePrintPO()!.supplierId)?.gstin }}</span></p>
                  }
                  @if (getSupplier(activePrintPO()!.supplierId)?.billingAddress) {
                    <p class="party-detail">{{ getSupplier(activePrintPO()!.supplierId)?.billingAddress }}, {{ getSupplier(activePrintPO()!.supplierId)?.city }}</p>
                  }
                </div>

                <div class="party-card">
                  <span class="party-title">Delivery &amp; Billing Location:</span>
                  <h3 class="party-name">{{ activePrintPO()!.warehouseName }}</h3>
                  <p class="party-detail">{{ companyAddress1 }}</p>
                  <p class="party-detail">{{ companyAddress2 }}, {{ companyCityState }}</p>
                  <p class="party-detail">Authorized Phone: {{ companyPhone }}</p>
                  <p class="party-detail">Email: {{ companyEmail }}</p>
                </div>
              </div>

              <!-- Line Items Table -->
              <table class="doc-table">
                <thead>
                  <tr>
                    <th style="width: 36px; text-align: center;">#</th>
                    <th>Product Name &amp; Description</th>
                    <th style="width: 100px;">SKU</th>
                    <th style="width: 75px; text-align: right;">Qty</th>
                    <th style="width: 55px; text-align: center;">Unit</th>
                    <th style="width: 95px; text-align: right;">Unit Price (₹)</th>
                    <th style="width: 65px; text-align: right;">Tax (%)</th>
                    <th style="width: 110px; text-align: right;">Total Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of activePrintPO()!.items; track item.productId || $index; let idx = $index) {
                    <tr>
                      <td style="text-align: center; color: #64748b;">{{ idx + 1 }}</td>
                      <td>
                        <div style="font-weight: 700; color: #0f172a;">{{ item.productName }}</div>
                        @if (item.notes) {
                          <div style="font-size: 11px; color: #64748b;">{{ item.notes }}</div>
                        }
                      </td>
                      <td class="font-mono" style="font-size: 11px;">{{ item.productSKU || '-' }}</td>
                      <td style="text-align: right; font-weight: 700;">{{ item.orderedQuantity }}</td>
                      <td style="text-align: center;">{{ item.unitOfMeasure || 'Nos' }}</td>
                      <td style="text-align: right;" class="font-mono">₹{{ item.unitPrice | number:'1.2-2' }}</td>
                      <td style="text-align: right;" class="font-mono">{{ item.taxRate }}%</td>
                      <td style="text-align: right; font-weight: 700;" class="font-mono">₹{{ item.totalAmount | number:'1.2-2' }}</td>
                    </tr>
                  }
                </tbody>
              </table>

              <!-- Totals & Notes -->
              <div class="totals-and-terms">
                <div>
                  <div class="amount-words-box">
                    <span class="terms-title">Amount In Words:</span>
                    <p class="amount-words-text">(INR) {{ getAmountInWords(activePrintPO()!.totalAmount) }}</p>
                  </div>
                  @if (activePrintPO()!.notes) {
                    <div class="order-notes-box">
                      <span class="terms-title">Order Notes / Terms:</span>
                      <p class="notes-text">{{ activePrintPO()!.notes }}</p>
                    </div>
                  }
                </div>

                <div class="totals-panel">
                  <div class="total-row">
                    <span>Sub Total:</span>
                    <span class="font-mono">₹{{ activePrintPO()!.subTotal | number:'1.2-2' }}</span>
                  </div>
                  <div class="total-row">
                    <span>Tax Amount:</span>
                    <span class="font-mono">₹{{ activePrintPO()!.taxAmount | number:'1.2-2' }}</span>
                  </div>
                  <div class="total-row grand-total-row">
                    <span>Total Amount:</span>
                    <span class="font-mono">₹{{ activePrintPO()!.totalAmount | number:'1.2-2' }}</span>
                  </div>
                </div>
              </div>

              <!-- Signatures -->
              <div class="signatures-grid">
                <div class="sig-box">
                  <div class="sig-line"></div>
                  <span class="sig-label">Prepared By</span>
                </div>
                <div class="sig-box">
                  <div class="sig-line"></div>
                  <span class="sig-label">Verified By</span>
                </div>
                <div class="sig-box">
                  <div class="sig-line"></div>
                  <span class="sig-label">For {{ companyName }}<br>(Authorized Signatory)</span>
                </div>
              </div>

              <!-- Footer -->
              <div class="doc-footer">
                <span>PO: {{ activePrintPO()!.poNumber }}</span>
                <span>Computer generated official document</span>
                <span>Date: {{ activePrintPO()!.createdOn | date:'medium' }}</span>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Print / View Goods Receipt Note (Dynamic ERP Format) -->
      @if (showPrintGRNModal() && activePrintGRN()) {
        <div class="modal-overlay print-modal-overlay animate-fade-in" (click)="closePrintGRNModal()">
          <div class="invoice-preview-dialog glass-panel" (click)="$event.stopPropagation()">
            <div class="preview-actions no-print" style="display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 12px;">
              <div class="company-customizer" style="display: flex; align-items: center; gap: 8px;">
                <label style="color: #cbd5e1; font-size: 12px; font-weight: 600; white-space: nowrap;">Company Name:</label>
                <input type="text" [(ngModel)]="companyName" class="form-control" style="width: 220px; padding: 4px 8px; font-size: 12px; height: 32px; background: rgba(30, 41, 59, 0.8); border: 1px solid rgba(255, 255, 255, 0.2); color: #fff; border-radius: 4px;" placeholder="SHIDHARTH TEXTILE" />
              </div>
              <div style="display: flex; gap: 8px;">
                @if (activePO()) {
                  <button (click)="backToGRNHistory()" class="btn btn-secondary" title="Back to GRN History">
                    &larr; Back to GRN List
                  </button>
                }
                <button (click)="printGRN()" class="btn btn-primary">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print Goods Receipt Note (GRN)
                </button>
                <button (click)="closePrintGRNModal()" class="btn btn-secondary">Close</button>
              </div>
            </div>

            <!-- Professional ERP GRN Document Sheet (Print Area) -->
            <div class="erp-print-sheet" id="print-area">
              <!-- Header -->
              <div class="doc-header">
                <div class="company-brand">
                  <div class="brand-monogram">S</div>
                  <div>
                    <h1 class="company-name">{{ companyName }}</h1>
                    <p class="company-sub">{{ companyAddress1 }} {{ companyAddress2 }}</p>
                    <p class="company-tax">GSTIN: <span class="font-mono">{{ companyGST }}</span> &bull; {{ companyCityState }}</p>
                  </div>
                </div>
                <div class="doc-meta">
                  <div class="doc-badge grn-badge">GOODS RECEIPT NOTE</div>
                  <div class="meta-row">
                    <span class="meta-label">GRN Number:</span>
                    <span class="meta-val font-mono">{{ activePrintGRN()!.grnNumber }}</span>
                  </div>
                  <div class="meta-row">
                    <span class="meta-label">Receipt Date:</span>
                    <span class="meta-val">{{ activePrintGRN()!.receiptDate | date:'mediumDate' }}</span>
                  </div>
                  <div class="meta-row">
                    <span class="meta-label">PO Reference:</span>
                    <span class="meta-val font-mono">{{ activePrintGRN()!.poNumber || 'Direct' }}</span>
                  </div>
                  <div class="meta-row">
                    <span class="meta-label">Status:</span>
                    <span class="meta-val badge-text">{{ activePrintGRN()!.statusName }}</span>
                  </div>
                </div>
              </div>

              <!-- Parties Details -->
              <div class="parties-grid">
                <div class="party-card">
                  <span class="party-title">Supplier / Vendor:</span>
                  <h3 class="party-name">{{ activePrintGRN()!.supplierName }}</h3>
                  <p class="party-detail">Vendor Challan / LR Ref: <span class="font-mono font-bold">{{ activePrintGRN()!.supplierDeliveryNoteNo || 'N/A' }}</span></p>
                  @if (getSupplier(activePrintGRN()!.supplierId)?.phone) {
                    <p class="party-detail">Contact: {{ getSupplier(activePrintGRN()!.supplierId)?.phone }}</p>
                  }
                  @if (getSupplier(activePrintGRN()!.supplierId)?.gstin) {
                    <p class="party-detail">GSTIN: <span class="font-mono font-semibold">{{ getSupplier(activePrintGRN()!.supplierId)?.gstin }}</span></p>
                  }
                </div>

                <div class="party-card">
                  <span class="party-title">Receiving Location / Warehouse:</span>
                  <h3 class="party-name">{{ activePrintGRN()!.warehouseName }}</h3>
                  <p class="party-detail">Physical Stock Inward Confirmed</p>
                  <p class="party-detail">{{ companyAddress1 }}, {{ companyAddress2 }}</p>
                </div>
              </div>

              <!-- Received Line Items Table -->
              <table class="doc-table">
                <thead>
                  <tr>
                    <th style="width: 36px; text-align: center;">#</th>
                    <th>Product Name &amp; Description</th>
                    <th style="width: 100px;">SKU</th>
                    <th style="width: 75px; text-align: right;">Received</th>
                    <th style="width: 75px; text-align: right;">Accepted</th>
                    <th style="width: 75px; text-align: right;">Rejected</th>
                    <th style="width: 55px; text-align: center;">Unit</th>
                    <th style="width: 90px; text-align: right;">Rate (₹)</th>
                    <th style="width: 120px;">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of activePrintGRN()!.items; track item.productId || $index; let idx = $index) {
                    <tr>
                      <td style="text-align: center; color: #64748b;">{{ idx + 1 }}</td>
                      <td>
                        <div style="font-weight: 700; color: #0f172a;">{{ item.productName }}</div>
                        @if (item.notes) {
                          <div style="font-size: 11px; color: #64748b;">{{ item.notes }}</div>
                        }
                      </td>
                      <td class="font-mono" style="font-size: 11px;">{{ item.productSKU || '-' }}</td>
                      <td style="text-align: right; font-weight: 700;">{{ item.receivedQuantity }}</td>
                      <td style="text-align: right; font-weight: 700; color: #059669;">{{ item.acceptedQuantity }}</td>
                      <td style="text-align: right; font-weight: 700;" [style.color]="item.rejectedQuantity > 0 ? '#dc2626' : '#64748b'">
                        {{ item.rejectedQuantity }}
                      </td>
                      <td style="text-align: center;">{{ item.unitOfMeasure || 'Nos' }}</td>
                      <td style="text-align: right;" class="font-mono">₹{{ item.unitPrice | number:'1.2-2' }}</td>
                      <td style="font-size: 11px;">
                        @if (item.rejectionReason) {
                          <span style="color: #dc2626; font-weight: 600;">Rej: {{ item.rejectionReason }}</span>
                        } @else if (item.rejectedQuantity === 0 && item.acceptedQuantity > 0) {
                          <span style="color: #059669; font-weight: 600;">Verified OK</span>
                        } @else {
                          <span style="color: #94a3b8;">-</span>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>

              <!-- Notes -->
              @if (activePrintGRN()!.notes) {
                <div class="order-notes-box" style="margin-bottom: 1.5rem;">
                  <span class="terms-title">Inspection / Receipt Notes:</span>
                  <p class="notes-text">{{ activePrintGRN()!.notes }}</p>
                </div>
              }

              <!-- Signatures -->
              <div class="signatures-grid">
                <div class="sig-box">
                  <div class="sig-line"></div>
                  <span class="sig-label">Received By (Store Keeper)</span>
                </div>
                <div class="sig-box">
                  <div class="sig-line"></div>
                  <span class="sig-label">Inspected &amp; Quality Checked By</span>
                </div>
                <div class="sig-box">
                  <div class="sig-line"></div>
                  <span class="sig-label">For {{ companyName }}<br>(Warehouse Incharge)</span>
                </div>
              </div>

              <!-- Footer -->
              <div class="doc-footer">
                <span>GRN: {{ activePrintGRN()!.grnNumber }}</span>
                <span>PO Ref: {{ activePrintGRN()!.poNumber || 'Direct' }}</span>
                <span>Computer generated Goods Receipt Note &bull; {{ activePrintGRN()!.createdOn | date:'medium' }}</span>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- PO GRNs History Modal -->
      @if (showGRNHistoryModal() && activePO()) {
        <div class="modal-overlay animate-fade-in" (click)="closeGRNHistoryModal()">
          <div class="modal-dialog-large glass-panel" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div>
                <h2 class="modal-title">Goods Receipt Notes (GRN)</h2>
                <span class="text-xs text-muted">PO Ref: {{ activePO()!.poNumber }} &bull; Supplier: {{ activePO()!.supplierName }}</span>
              </div>
              <button (click)="closeGRNHistoryModal()" class="close-btn">&times;</button>
            </div>

            @if (isLoadingGRNs()) {
              <div class="text-center py-8">
                <div class="spinner"></div>
                <span class="text-muted text-sm mt-2 block">Loading GRN records...</span>
              </div>
            } @else if (poGRNs().length === 0) {
              <div class="text-center py-8 text-muted">
                No Goods Receipt Notes have been logged against this PO yet.
              </div>
            } @else {
              <table class="data-table">
                <thead>
                  <tr>
                    <th>GRN Number</th>
                    <th>Receipt Date</th>
                    <th>Vendor Challan #</th>
                    <th>Items</th>
                    <th class="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  @for (grn of poGRNs(); track grn.id) {
                    <tr>
                      <td class="font-mono font-bold text-primary-light">{{ grn.grnNumber }}</td>
                      <td>{{ grn.receiptDate | date:'mediumDate' }}</td>
                      <td class="font-mono">{{ grn.supplierDeliveryNoteNo || '-' }}</td>
                      <td>{{ grn.items.length }} items</td>
                      <td class="text-right">
                        <button (click)="viewPrintGRN(grn)" class="btn btn-secondary btn-sm" title="View & Print GRN">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-3.5 h-3.5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                          </svg>
                          Print GRN
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            }
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
    .po-info, .vendor-info {
      display: flex;
      flex-direction: column;
    }
    .action-btn-group {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 0.5rem;
    }
    .btn-action-amber {
      background: rgba(245, 158, 11, 0.15);
      border: 1px solid rgba(245, 158, 11, 0.4);
      color: #fbbf24;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.25rem 0.6rem;
      border-radius: 6px;
      cursor: pointer;
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
    .print-modal-overlay {
      z-index: 1100 !important;
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
    .text-primary-light { color: #a5b4fc; }
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
    .btn-action-slate {
      background: rgba(148, 163, 184, 0.15);
      border: 1px solid rgba(148, 163, 184, 0.4);
      color: #94a3b8;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.25rem 0.6rem;
      border-radius: 6px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
    }
    .btn-action-indigo {
      background: rgba(99, 102, 241, 0.15);
      border: 1px solid rgba(99, 102, 241, 0.4);
      color: #818cf8;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.25rem 0.6rem;
      border-radius: 6px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
    }

    /* Print Preview Dialog & Sheet */
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
      font-size: 1.4rem;
      font-weight: 800;
      color: #1e1b4b;
    }
    .company-address, .company-gst {
      font-size: 0.8125rem;
      color: #475569;
    }
    .tax-inv-badge {
      font-size: 0.95rem;
      font-weight: 800;
      letter-spacing: 0.08em;
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
    .party-box {
      background: #f8fafc;
      padding: 1rem;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
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
    .inv-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 1.5rem;
      font-size: 0.875rem;
    }
    .inv-table th {
      background: #f1f5f9;
      color: #475569;
      font-weight: 700;
      font-size: 0.75rem;
      text-transform: uppercase;
      padding: 0.65rem 0.5rem;
      border-bottom: 2px solid #cbd5e1;
    }
    .inv-table td {
      padding: 0.65rem 0.5rem;
      border-bottom: 1px solid #f1f5f9;
      color: #1e293b;
    }
    .inv-totals {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 1.5rem;
    }
    .totals-col {
      width: 280px;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .tot-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.875rem;
      color: #475569;
    }
    .grand-total {
      font-size: 1.1rem;
      font-weight: 800;
      color: #0f172a;
      border-top: 2px solid #cbd5e1;
      padding-top: 0.5rem;
    }
    .inv-notes {
      background: #f8fafc;
      padding: 0.85rem;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
      color: #334155;
    }
    .inv-signatures {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 2rem;
      margin-top: 2.5rem;
      text-align: center;
    }
    .sig-line {
      border-top: 1px dashed #94a3b8;
      margin-bottom: 0.5rem;
    }
    .sig-block span {
      font-size: 0.75rem;
      color: #64748b;
      font-weight: 600;
      text-transform: uppercase;
    }
    .text-rose { color: #f43f5e; }
    .text-emerald { color: #10b981; }
    .btn-sm {
      padding: 0.25rem 0.6rem;
      font-size: 0.75rem;
    }
  `]
})
export class PurchaseOrdersListComponent implements OnInit {
  private purchasesService = inject(PurchasesService);
  private api = inject(ApiService);
  private notify = inject(NotificationService);

  orders = signal<PurchaseOrder[]>([]);
  suppliers = signal<Supplier[]>([]);
  warehouses = signal<any[]>([]);
  products = signal<any[]>([]);

  isLoading = signal<boolean>(false);
  selectedStatus: number | undefined = undefined;

  // Print PO modal
  showPrintPOModal = signal<boolean>(false);
  activePrintPO = signal<PurchaseOrder | null>(null);

  // Print GRN modal
  showPrintGRNModal = signal<boolean>(false);
  activePrintGRN = signal<GoodsReceiptNote | null>(null);

  // Company Profile for Printing
  companyName = 'SHIDHARTH TEXTILE';
  companyAddress1 = 'PLOT NO. 12, INDUSTRIAL AREA, MIDC,';
  companyAddress2 = 'DAREGAON, JALNA - 431203';
  companyCityState = 'MAHARASHTRA - INDIA.';
  companyPhone = 'TELE FAX - (02482) 220044';
  companyEmail = 'info@shidharthtextile.com';
  companyGST = '27AADCS1234F1Z5';
  companyPAN = 'AADCS1234F';
  companyContactPerson = 'Store & Procurement Dept';
  companyContactNo = '+91 9022906902';

  // GRN History modal
  showGRNHistoryModal = signal<boolean>(false);
  poGRNs = signal<GoodsReceiptNote[]>([]);
  isLoadingGRNs = signal<boolean>(false);

  // Create PO modal
  showCreateModal = signal<boolean>(false);
  isSubmittingPO = signal<boolean>(false);
  newPOSupplierId = '';
  newPOWarehouseId = '';
  newPOOrderDate = new Date().toISOString().split('T')[0];
  newPODeliveryDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  newPONotes = '';
  poLines: POLineItemRow[] = [];

  // GRN Receipt Modal
  showGRNModal = signal<boolean>(false);
  isSubmittingGRN = signal<boolean>(false);
  activePO = signal<PurchaseOrder | null>(null);
  grnChallanNo = '';
  grnReceiptDate = new Date().toISOString().split('T')[0];
  grnLines: GRNReceiptLineRow[] = [];

  ngOnInit(): void {
    this.loadOrders();
    this.loadMetadata();
  }

  loadOrders(): void {
    this.isLoading.set(true);
    this.purchasesService.getOrders(undefined, this.selectedStatus).subscribe({
      next: res => {
        if (res.success && res.data) {
          this.orders.set(res.data.items);
        }
        this.isLoading.set(false);
      },
      error: err => {
        this.notify.error(err?.error?.message || 'Failed to fetch purchase orders.');
        this.isLoading.set(false);
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

  getSupplier(supplierId?: string): Supplier | undefined {
    if (!supplierId) return undefined;
    return this.suppliers().find(s => s.id === supplierId);
  }

  filterByStatus(status?: number): void {
    this.selectedStatus = status;
    this.loadOrders();
  }

  getStatusBadge(status: number): string {
    switch (status) {
      case 1: return 'badge-slate';       // Draft
      case 2: return 'badge-indigo';      // Approved
      case 3: return 'badge-amber';       // PartiallyReceived
      case 4: return 'badge-emerald';     // Received
      case 5: return 'badge-rose';        // Cancelled
      default: return 'badge-slate';
    }
  }

  approvePO(po: PurchaseOrder): void {
    this.purchasesService.updateOrderStatus(po.id, 2).subscribe({
      next: () => {
        this.notify.success(`Purchase Order ${po.poNumber} approved.`);
        this.loadOrders();
      },
      error: err => this.notify.error(err?.error?.message || 'Failed to approve order.')
    });
  }

  openCreateModal(): void {
    this.newPOSupplierId = '';
    this.newPOWarehouseId = this.warehouses().length > 0 ? this.warehouses()[0].id : '';
    this.newPONotes = '';
    this.poLines = [{ productId: '', orderedQuantity: 10, unitPrice: 0, taxRate: 18, totalAmount: 0 }];
    this.showCreateModal.set(true);
  }

  closeCreateModal(): void {
    this.showCreateModal.set(false);
  }

  addPOLine(): void {
    this.poLines.push({ productId: '', orderedQuantity: 10, unitPrice: 0, taxRate: 18, totalAmount: 0 });
  }

  onProductSelect(row: POLineItemRow): void {
    const p = this.products().find(item => item.id === row.productId);
    if (p) {
      row.unitPrice = p.purchasePrice || p.sellingPrice || 0;
      row.taxRate = p.taxRate || 18;
      this.recalculatePOLine(row);
    }
  }

  recalculatePOLine(row: POLineItemRow): void {
    const gross = (row.orderedQuantity || 0) * (row.unitPrice || 0);
    const tax = gross * ((row.taxRate || 0) / 100);
    row.totalAmount = gross + tax;
  }

  submitPO(): void {
    if (!this.newPOSupplierId) {
      this.notify.warning('Please select a supplier.');
      return;
    }

    const validLines = this.poLines.filter(l => l.productId && l.orderedQuantity > 0);
    if (validLines.length === 0) {
      this.notify.warning('Please add at least one line item with valid product and quantity.');
      return;
    }

    this.isSubmittingPO.set(true);
    const payload: CreatePurchaseOrderRequest = {
      supplierId: this.newPOSupplierId,
      warehouseId: this.newPOWarehouseId,
      orderDate: new Date(this.newPOOrderDate).toISOString(),
      expectedDeliveryDate: new Date(this.newPODeliveryDate).toISOString(),
      notes: this.newPONotes,
      items: validLines.map(l => ({
        productId: l.productId,
        orderedQuantity: l.orderedQuantity,
        unitPrice: l.unitPrice,
        taxRate: l.taxRate
      }))
    };

    this.purchasesService.createOrder(payload).subscribe({
      next: res => {
        this.notify.success(`Purchase Order ${res.data?.poNumber} generated.`);
        this.isSubmittingPO.set(false);
        this.closeCreateModal();
        this.loadOrders();
      },
      error: err => {
        this.notify.error(err?.error?.message || 'Failed to create purchase order.');
        this.isSubmittingPO.set(false);
      }
    });
  }

  openGRNModal(po: PurchaseOrder): void {
    this.activePO.set(po);
    this.grnChallanNo = '';
    this.grnReceiptDate = new Date().toISOString().split('T')[0];

    this.grnLines = po.items.map(item => {
      const pending = Math.max(0, item.orderedQuantity - item.receivedQuantity);
      return {
        productId: item.productId,
        productName: item.productName || 'Product',
        sku: item.productSKU || '',
        poItemId: item.id,
        orderedQuantity: item.orderedQuantity,
        previouslyReceived: item.receivedQuantity,
        receivedQuantity: pending,
        acceptedQuantity: pending,
        rejectedQuantity: 0,
        unitPrice: item.unitPrice
      };
    });

    this.showGRNModal.set(true);
  }

  closeGRNModal(): void {
    this.showGRNModal.set(false);
  }

  submitGRN(): void {
    if (!this.grnChallanNo.trim()) {
      this.notify.warning('Vendor Delivery Challan / LR number is required.');
      return;
    }

    const validLines = this.grnLines.filter(l => l.receivedQuantity > 0);
    if (validLines.length === 0) {
      this.notify.warning('At least one item must have received quantity.');
      return;
    }

    this.isSubmittingGRN.set(true);
    const po = this.activePO()!;

    const payload: CreateGoodsReceiptNoteRequest = {
      purchaseOrderId: po.id,
      supplierId: po.supplierId,
      warehouseId: po.warehouseId,
      receiptDate: new Date(this.grnReceiptDate).toISOString(),
      supplierDeliveryNoteNo: this.grnChallanNo.trim(),
      items: validLines.map(l => ({
        productId: l.productId,
        purchaseOrderItemId: l.poItemId,
        receivedQuantity: l.receivedQuantity,
        acceptedQuantity: l.acceptedQuantity,
        rejectedQuantity: l.rejectedQuantity,
        unitPrice: l.unitPrice
      }))
    };

    this.purchasesService.createGRN(payload).subscribe({
      next: res => {
        this.notify.success(`GRN ${res.data?.grnNumber} verified. Physical inventory restocked in warehouse.`);
        this.isSubmittingGRN.set(false);
        this.closeGRNModal();
        this.loadOrders();
        if (res.data) {
          this.viewPrintGRN(res.data);
        }
      },
      error: err => {
        this.notify.error(err?.error?.message || 'Failed to log Goods Receipt Note.');
        this.isSubmittingGRN.set(false);
      }
    });
  }

  // Print PO methods
  viewPrintPO(po: PurchaseOrder): void {
    this.activePrintPO.set(po);
    this.showPrintPOModal.set(true);
  }

  closePrintPOModal(): void {
    this.showPrintPOModal.set(false);
    this.activePrintPO.set(null);
  }

  printPO(): void {
    window.print();
  }

  // Print GRN methods
  viewPrintGRN(grn: GoodsReceiptNote): void {
    this.showGRNHistoryModal.set(false);
    this.activePrintGRN.set(grn);
    this.showPrintGRNModal.set(true);
  }

  backToGRNHistory(): void {
    this.showPrintGRNModal.set(false);
    this.activePrintGRN.set(null);
    if (this.activePO()) {
      this.showGRNHistoryModal.set(true);
    }
  }

  closePrintGRNModal(): void {
    this.showPrintGRNModal.set(false);
    this.activePrintGRN.set(null);
  }

  printGRN(): void {
    window.print();
  }

  // View PO GRNs History
  viewPOGRNs(po: PurchaseOrder): void {
    this.activePO.set(po);
    this.isLoadingGRNs.set(true);
    this.showGRNHistoryModal.set(true);
    this.purchasesService.getGRNs(po.id).subscribe({
      next: res => {
        if (res.success && res.data) {
          this.poGRNs.set(res.data.items);
        } else {
          this.poGRNs.set([]);
        }
        this.isLoadingGRNs.set(false);
      },
      error: () => {
        this.poGRNs.set([]);
        this.isLoadingGRNs.set(false);
      }
    });
  }

  closeGRNHistoryModal(): void {
    this.showGRNHistoryModal.set(false);
  }

  getAmountInWords(amount: number | null | undefined): string {
    if (amount == null || isNaN(amount) || amount === 0) return 'Zero Only';

    const singleDigits = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teenDigits = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tensDigits = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const convertTwoDigits = (n: number): string => {
      if (n === 0) return '';
      if (n < 10) return singleDigits[n];
      if (n < 20) return teenDigits[n - 10];
      const unit = n % 10;
      return tensDigits[Math.floor(n / 10)] + (unit !== 0 ? ' ' + singleDigits[unit] : '');
    };

    const convertThreeDigits = (n: number): string => {
      let str = '';
      const hundreds = Math.floor(n / 100);
      const remainder = n % 100;
      if (hundreds > 0) {
        str += singleDigits[hundreds] + ' Hundred';
        if (remainder > 0) str += ' And ';
      }
      if (remainder > 0) {
        str += convertTwoDigits(remainder);
      }
      return str.trim();
    };

    const wholePart = Math.floor(amount);
    const decimalPart = Math.round((amount - wholePart) * 100);

    const crores = Math.floor(wholePart / 10000000);
    const lakhs = Math.floor((wholePart % 10000000) / 100000);
    const thousands = Math.floor((wholePart % 100000) / 1000);
    const hundredsAndBelow = wholePart % 1000;

    let words = '';

    if (crores > 0) {
      words += convertTwoDigits(crores) + ' Crore ';
    }
    if (lakhs > 0) {
      words += convertTwoDigits(lakhs) + ' Lakh ';
    }
    if (thousands > 0) {
      words += convertTwoDigits(thousands) + ' Thousand ';
    }
    if (hundredsAndBelow > 0) {
      words += convertThreeDigits(hundredsAndBelow) + ' ';
    }

    words = words.trim();
    if (!words) words = 'Zero';

    if (decimalPart > 0) {
      return words + ' And ' + convertTwoDigits(decimalPart) + ' Paise Only';
    } else {
      return words + ' Only';
    }
  }
}
