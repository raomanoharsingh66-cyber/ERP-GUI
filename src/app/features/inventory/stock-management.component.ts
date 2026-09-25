import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';
import { HasPermissionDirective } from '../../core/directives/has-permission.directive';

interface StockRow {
  productId: string;
  sku: string;
  productName: string;
  uom: string;
  onHand: number;
  reserved: number;
  available: number;
  averageCost: number;
  totalValue: number;
}

interface TransactionRow {
  id: string;
  timestamp: string;
  sku: string;
  productName: string;
  type: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  reference: string;
}

@Component({
  selector: 'app-stock-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HasPermissionDirective],
  template: `
    <div class="stock-page animate-fade-in">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Warehouse Inventory & Stock Adjustments</h1>
          <p class="page-subtitle">Track physical stock balances, perform cycle counts, and execute multi-location transfers.</p>
        </div>

        <div class="header-actions">
          <a routerLink="/inventory" class="btn btn-secondary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Products Catalog
          </a>
          <button *hasPermission="'Inventory.AdjustStock'" (click)="openTransferModal()" class="btn btn-secondary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            Transfer Stock
          </button>
          <button *hasPermission="'Inventory.AdjustStock'" (click)="openAdjustModal()" class="btn btn-primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Adjust Stock
          </button>
        </div>
      </div>

      <!-- Warehouse Selection & KPI Strip -->
      <div class="warehouse-header glass-panel">
        <div class="warehouse-select-box">
          <label class="warehouse-label">Active Storage Location:</label>
          <div class="warehouse-badge">
            <span class="location-dot"></span>
            <strong>Central Warehouse (Mumbai Hub) - WH-01 [Default]</strong>
          </div>
        </div>

        <div class="warehouse-stats">
          <div class="wstat-item">
            <span class="wstat-label">Total SKUs Stored</span>
            <span class="wstat-val text-indigo">{{ stocks().length }}</span>
          </div>
          <div class="wstat-item">
            <span class="wstat-label">Stock Valuation</span>
            <span class="wstat-val text-emerald">₹ {{ totalInventoryValue().toLocaleString('en-IN') }}</span>
          </div>
        </div>
      </div>

      <!-- Stock Table -->
      <div class="table-card glass-panel">
        <div class="card-header">
          <h2 class="card-title">Real-Time Stock Breakdown</h2>
          <span class="badge badge-emerald">Live Physical Count</span>
        </div>

        <div class="table-container">
          <table class="erp-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Product Name</th>
                <th>On Hand</th>
                <th>Reserved</th>
                <th>Available</th>
                <th>Avg Unit Cost</th>
                <th class="text-right">Total Valuation</th>
              </tr>
            </thead>
            <tbody>
              @for (item of stocks(); track item.sku) {
                <tr>
                  <td>
                    <span class="sku-badge">{{ item.sku }}</span>
                  </td>
                  <td>
                    <span class="font-medium text-white">{{ item.productName }}</span>
                  </td>
                  <td class="font-semibold">{{ item.onHand }} {{ item.uom }}</td>
                  <td class="text-muted">{{ item.reserved }} {{ item.uom }}</td>
                  <td>
                    <span class="badge badge-emerald font-semibold">{{ item.available }} {{ item.uom }}</span>
                  </td>
                  <td class="font-mono">₹ {{ item.averageCost.toFixed(2) }}</td>
                  <td class="font-mono text-right font-semibold text-emerald">
                    ₹ {{ item.totalValue.toLocaleString('en-IN') }}
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Stock Transaction Ledger -->
      <div class="table-card glass-panel">
        <div class="card-header">
          <h2 class="card-title">Recent Stock Transaction Log (Audit Trail)</h2>
          <span class="badge badge-indigo">Immutable Ledger</span>
        </div>

        <div class="table-container">
          <table class="erp-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Product SKU</th>
                <th>Type</th>
                <th>Quantity</th>
                <th>Unit Value</th>
                <th>Total Value</th>
                <th>Reference</th>
              </tr>
            </thead>
            <tbody>
              @for (tx of transactions(); track tx.id) {
                <tr>
                  <td class="text-muted text-sm">{{ tx.timestamp }}</td>
                  <td class="font-mono font-medium">{{ tx.sku }}</td>
                  <td>
                    <span class="badge" 
                      [class.badge-emerald]="tx.type === 'Inward'"
                      [class.badge-rose]="tx.type === 'Outward'"
                      [class.badge-indigo]="tx.type === 'Adjustment' || tx.type === 'Transfer'">
                      {{ tx.type }}
                    </span>
                  </td>
                  <td class="font-semibold" [class.text-emerald]="tx.type === 'Inward'" [class.text-rose]="tx.type === 'Outward'">
                    {{ tx.type === 'Outward' ? '-' : '+' }}{{ tx.quantity }}
                  </td>
                  <td class="font-mono">₹ {{ tx.unitPrice.toFixed(2) }}</td>
                  <td class="font-mono font-semibold">₹ {{ tx.totalAmount.toLocaleString('en-IN') }}</td>
                  <td class="text-secondary text-sm">{{ tx.reference }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Adjust Stock Modal -->
      @if (showAdjustModal()) {
        <div class="modal-backdrop animate-fade-in">
          <div class="modal-card glass-card">
            <div class="modal-header">
              <h2 class="modal-title">Stock Inward / Adjustment</h2>
              <button (click)="closeAdjustModal()" class="modal-close">&times;</button>
            </div>

            <form (ngSubmit)="submitAdjustment()" class="modal-form">
              <div class="form-group">
                <label class="form-label">Select SKU Item *</label>
                <select [(ngModel)]="adjustForm.sku" name="sku" class="form-input">
                  @for (s of stocks(); track s.sku) {
                    <option [value]="s.sku">{{ s.sku }} - {{ s.productName }}</option>
                  }
                </select>
              </div>

              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Adjustment Type *</label>
                  <select [(ngModel)]="adjustForm.type" name="type" class="form-input">
                    <option value="Inward">Inward (Stock In / Receipt)</option>
                    <option value="Outward">Outward (Damage / Write-Off)</option>
                    <option value="Adjustment">Set Physical Count (Audit)</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Quantity *</label>
                  <input type="number" [(ngModel)]="adjustForm.quantity" name="quantity" required class="form-input" />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Reason / Reference *</label>
                <input type="text" [(ngModel)]="adjustForm.reason" name="reason" placeholder="e.g. Stock Count Reconciliation" required class="form-input" />
              </div>

              <div class="modal-actions">
                <button type="button" (click)="closeAdjustModal()" class="btn btn-secondary">Cancel</button>
                <button type="submit" class="btn btn-primary">Apply Adjustment</button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Transfer Stock Modal -->
      @if (showTransferModal()) {
        <div class="modal-backdrop animate-fade-in">
          <div class="modal-card glass-card">
            <div class="modal-header">
              <h2 class="modal-title">Transfer Stock Between Locations</h2>
              <button (click)="closeTransferModal()" class="modal-close">&times;</button>
            </div>

            <form (ngSubmit)="submitTransfer()" class="modal-form">
              <div class="form-group">
                <label class="form-label">Select SKU *</label>
                <select [(ngModel)]="transferForm.sku" name="sku" class="form-input">
                  @for (s of stocks(); track s.sku) {
                    <option [value]="s.sku">{{ s.sku }} - {{ s.productName }}</option>
                  }
                </select>
              </div>

              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">From Warehouse</label>
                  <input type="text" value="Central Warehouse (WH-01)" disabled class="form-input text-muted" />
                </div>
                <div class="form-group">
                  <label class="form-label">To Destination Warehouse *</label>
                  <select [(ngModel)]="transferForm.toWarehouse" name="toWarehouse" class="form-input">
                    <option value="Pune Facility (WH-02)">Pune Facility (WH-02)</option>
                    <option value="Delhi Logistics Center (WH-03)">Delhi Logistics Center (WH-03)</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Transfer Quantity *</label>
                <input type="number" [(ngModel)]="transferForm.quantity" name="quantity" required class="form-input" />
              </div>

              <div class="modal-actions">
                <button type="button" (click)="closeTransferModal()" class="btn btn-secondary">Cancel</button>
                <button type="submit" class="btn btn-primary">Authorize Transfer</button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .stock-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .page-title {
      font-size: 1.75rem;
      font-weight: 800;
    }
    .page-subtitle {
      font-size: 0.875rem;
      color: var(--text-secondary);
      margin-top: 0.25rem;
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .warehouse-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.5rem;
      flex-wrap: wrap;
      gap: 1rem;
      border-left: 4px solid #6366f1;
    }
    .warehouse-select-box {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    .warehouse-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .warehouse-badge {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.95rem;
      color: var(--text-primary);
    }
    .location-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 8px #10b981;
    }
    .warehouse-stats {
      display: flex;
      align-items: center;
      gap: 2rem;
    }
    .wstat-item {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
      text-align: right;
    }
    .wstat-label {
      font-size: 0.725rem;
      color: var(--text-muted);
      text-transform: uppercase;
    }
    .wstat-val {
      font-size: 1.25rem;
      font-weight: 800;
      font-family: var(--font-heading);
    }
    .text-indigo { color: #818cf8; }
    .text-emerald { color: #34d399; }
    .text-rose { color: #fb7185; }

    .table-card {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .card-title {
      font-size: 1.15rem;
      font-weight: 700;
    }
    .table-container {
      overflow-x: auto;
    }
    .erp-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }
    .erp-table th {
      text-align: left;
      padding: 0.75rem 1rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid var(--border-subtle);
    }
    .erp-table td {
      padding: 0.875rem 1rem;
      border-bottom: 1px solid var(--border-subtle);
      vertical-align: middle;
    }
    .sku-badge {
      font-family: monospace;
      font-size: 0.775rem;
      font-weight: 700;
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
      background: rgba(99, 102, 241, 0.15);
      color: #818cf8;
      border: 1px solid rgba(99, 102, 241, 0.3);
    }
    .font-mono { font-family: monospace; }
    .font-semibold { font-weight: 600; }
    .font-medium { font-weight: 500; }
    .text-secondary { color: var(--text-secondary); }
    .text-muted { color: var(--text-muted); }
    .text-right { text-align: right; }
    .text-sm { font-size: 0.75rem; }
    .w-4 { width: 1rem; }
    .h-4 { height: 1rem; }

    /* Modal */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999;
      padding: 1.5rem;
    }
    .modal-card {
      width: 100%;
      max-width: 520px;
      padding: 2rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .modal-title {
      font-size: 1.25rem;
      font-weight: 700;
    }
    .modal-close {
      background: none;
      border: none;
      color: var(--text-muted);
      font-size: 1.5rem;
      cursor: pointer;
    }
    .modal-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    .form-label {
      font-size: 0.775rem;
      font-weight: 600;
      color: var(--text-secondary);
    }
    .form-input {
      padding: 0.625rem 0.875rem;
      background: var(--bg-surface-elevated);
      border: 1px solid var(--border-subtle);
      border-radius: 8px;
      color: var(--text-primary);
      font-size: 0.85rem;
      outline: none;
    }
    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 0.5rem;
    }
  `]
})
export class StockManagementComponent implements OnInit {
  private api = inject(ApiService);
  private notification = inject(NotificationService);

  stocks = signal<StockRow[]>([]);
  transactions = signal<TransactionRow[]>([]);

  showAdjustModal = signal<boolean>(false);
  showTransferModal = signal<boolean>(false);

  adjustForm = {
    sku: 'PROD-STEEL-01',
    type: 'Inward',
    quantity: 50,
    reason: 'Goods Receipt Note (GRN)'
  };

  transferForm = {
    sku: 'PROD-STEEL-01',
    toWarehouse: 'Pune Facility (WH-02)',
    quantity: 20
  };

  ngOnInit(): void {
    this.loadStock();
    this.loadTransactions();
  }

  loadStock(): void {
    // Demo stock list matching seeder
    this.stocks.set([
      {
        productId: '1',
        sku: 'PROD-STEEL-01',
        productName: 'Industrial Steel Bearings 6205',
        uom: 'PCS',
        onHand: 120,
        reserved: 15,
        available: 105,
        averageCost: 320.00,
        totalValue: 120 * 320.00
      },
      {
        productId: '2',
        sku: 'PROD-VALVE-02',
        productName: 'Brass Gate Valve 2-Inch',
        uom: 'BOX',
        onHand: 8,
        reserved: 0,
        available: 8,
        averageCost: 1250.00,
        totalValue: 8 * 1250.00
      },
      {
        productId: '3',
        sku: 'RAW-ALUM-ROD',
        productName: 'Aluminum Alloy Extrusion Rod 6061',
        uom: 'KG',
        onHand: 450,
        reserved: 50,
        available: 400,
        averageCost: 280.00,
        totalValue: 450 * 280.00
      }
    ]);
  }

  loadTransactions(): void {
    this.transactions.set([
      {
        id: 'TX-101',
        timestamp: '16 Sep 2026, 10:15',
        sku: 'PROD-STEEL-01',
        productName: 'Industrial Steel Bearings 6205',
        type: 'Inward',
        quantity: 120,
        unitPrice: 320.00,
        totalAmount: 38400.00,
        reference: 'SYS-INIT'
      },
      {
        id: 'TX-102',
        timestamp: '15 Sep 2026, 16:40',
        sku: 'RAW-ALUM-ROD',
        productName: 'Aluminum Alloy Extrusion Rod 6061',
        type: 'Inward',
        quantity: 450,
        unitPrice: 280.00,
        totalAmount: 126000.00,
        reference: 'PO-2026-089'
      },
      {
        id: 'TX-103',
        timestamp: '14 Sep 2026, 14:20',
        sku: 'PROD-VALVE-02',
        productName: 'Brass Gate Valve 2-Inch',
        type: 'Adjustment',
        quantity: 8,
        unitPrice: 1250.00,
        totalAmount: 10000.00,
        reference: 'AUDIT-COUNT'
      }
    ]);
  }

  totalInventoryValue(): number {
    return this.stocks().reduce((sum, item) => sum + item.totalValue, 0);
  }

  openAdjustModal(): void {
    this.showAdjustModal.set(true);
  }

  closeAdjustModal(): void {
    this.showAdjustModal.set(false);
  }

  submitAdjustment(): void {
    const item = this.stocks().find(s => s.sku === this.adjustForm.sku);
    if (!item) return;

    if (this.adjustForm.type === 'Inward') {
      item.onHand += this.adjustForm.quantity;
      item.available = item.onHand - item.reserved;
      item.totalValue = item.onHand * item.averageCost;
    } else if (this.adjustForm.type === 'Outward') {
      if (item.available < this.adjustForm.quantity) {
        this.notification.error('Stock Error', 'Insufficient available stock to write off.');
        return;
      }
      item.onHand -= this.adjustForm.quantity;
      item.available = item.onHand - item.reserved;
      item.totalValue = item.onHand * item.averageCost;
    } else {
      item.onHand = this.adjustForm.quantity;
      item.available = item.onHand - item.reserved;
      item.totalValue = item.onHand * item.averageCost;
    }

    const tx: TransactionRow = {
      id: `TX-${Math.floor(Math.random() * 900) + 100}`,
      timestamp: 'Just now',
      sku: item.sku,
      productName: item.productName,
      type: this.adjustForm.type,
      quantity: this.adjustForm.quantity,
      unitPrice: item.averageCost,
      totalAmount: this.adjustForm.quantity * item.averageCost,
      reference: this.adjustForm.reason
    };

    this.transactions.update(cur => [tx, ...cur]);
    this.notification.success('Stock Adjusted', `Stock adjusted for SKU: ${item.sku}`);
    this.closeAdjustModal();
  }

  openTransferModal(): void {
    this.showTransferModal.set(true);
  }

  closeTransferModal(): void {
    this.showTransferModal.set(false);
  }

  submitTransfer(): void {
    const item = this.stocks().find(s => s.sku === this.transferForm.sku);
    if (!item) return;

    if (item.available < this.transferForm.quantity) {
      this.notification.error('Transfer Error', 'Insufficient available stock for warehouse transfer.');
      return;
    }

    item.onHand -= this.transferForm.quantity;
    item.available = item.onHand - item.reserved;
    item.totalValue = item.onHand * item.averageCost;

    const tx: TransactionRow = {
      id: `TX-${Math.floor(Math.random() * 900) + 100}`,
      timestamp: 'Just now',
      sku: item.sku,
      productName: item.productName,
      type: 'Transfer',
      quantity: this.transferForm.quantity,
      unitPrice: item.averageCost,
      totalAmount: this.transferForm.quantity * item.averageCost,
      reference: `Transferred to ${this.transferForm.toWarehouse}`
    };

    this.transactions.update(cur => [tx, ...cur]);
    this.notification.success('Stock Transferred', `${this.transferForm.quantity} units of ${item.sku} dispatched to ${this.transferForm.toWarehouse}.`);
    this.closeTransferModal();
  }
}
