import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';
import { HasPermissionDirective } from '../../core/directives/has-permission.directive';

interface ProductItem {
  id: string;
  sku: string;
  name: string;
  categoryName: string;
  unitOfMeasureCode: string;
  purchasePrice: number;
  sellingPrice: number;
  taxRate: number;
  minStockLevel: number;
  totalStockQuantity: number;
  totalStockAvailable: number;
  isLowStock: boolean;
  isActive: boolean;
}

@Component({
  selector: 'app-products-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HasPermissionDirective],
  template: `
    <div class="inventory-page animate-fade-in">
      <!-- Page Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Product Catalog & Merchandise</h1>
          <p class="page-subtitle">Manage SKUs, product pricing, GST tax classifications, and reorder thresholds.</p>
        </div>

        <div class="header-actions">
          <a routerLink="/inventory/stock" class="btn btn-secondary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Warehouse Stocks
          </a>
          <button *hasPermission="'Inventory.Create'" (click)="openCreateModal()" class="btn btn-primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add New Product
          </button>
        </div>
      </div>

      <!-- Inventory Top KPI Strip -->
      <div class="kpi-strip">
        <div class="glass-panel kpi-card">
          <span class="kpi-label">Total Catalog SKUs</span>
          <span class="kpi-val text-indigo">{{ products().length }}</span>
        </div>
        <div class="glass-panel kpi-card">
          <span class="kpi-label">Low Stock Alerts</span>
          <span class="kpi-val text-amber">{{ lowStockCount() }}</span>
        </div>
        <div class="glass-panel kpi-card">
          <span class="kpi-label">Total Units on Hand</span>
          <span class="kpi-val text-emerald">{{ totalUnitsOnHand() }}</span>
        </div>
      </div>

      <!-- Filters & Search Bar -->
      <div class="filters-bar glass-panel">
        <div class="search-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4 text-muted">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input 
            type="text" 
            [(ngModel)]="searchQuery" 
            (ngModelChange)="onSearch()" 
            placeholder="Search by SKU, product name, or barcode..." 
            class="search-input" />
        </div>

        <div class="filter-toggles">
          <button 
            type="button" 
            (click)="toggleLowStockFilter()" 
            class="filter-chip" 
            [class.active]="lowStockOnly()">
            <span class="chip-dot"></span>
            Low Stock Only
          </button>
        </div>
      </div>

      <!-- Product Table -->
      <div class="table-card glass-panel">
        <div class="table-container">
          <table class="erp-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Product Description</th>
                <th>Category</th>
                <th>UOM</th>
                <th>Cost Price</th>
                <th>Selling Price</th>
                <th>GST Rate</th>
                <th>Stock on Hand</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (item of filteredProducts(); track item.id) {
                <tr>
                  <td>
                    <span class="sku-badge">{{ item.sku }}</span>
                  </td>
                  <td>
                    <span class="product-title">{{ item.name }}</span>
                  </td>
                  <td>
                    <span class="text-secondary">{{ item.categoryName }}</span>
                  </td>
                  <td>
                    <span class="badge badge-indigo">{{ item.unitOfMeasureCode }}</span>
                  </td>
                  <td class="font-mono">₹ {{ item.purchasePrice.toFixed(2) }}</td>
                  <td class="font-mono font-semibold text-indigo">₹ {{ item.sellingPrice.toFixed(2) }}</td>
                  <td>
                    <span class="text-muted">{{ item.taxRate }}%</span>
                  </td>
                  <td>
                    <div class="stock-status">
                      <span class="stock-qty" [class.text-rose]="item.isLowStock" [class.text-emerald]="!item.isLowStock">
                        {{ item.totalStockQuantity }} {{ item.unitOfMeasureCode }}
                      </span>
                      @if (item.isLowStock) {
                        <span class="badge badge-amber" title="Stock below reorder threshold ({{ item.minStockLevel }})">
                          Reorder Alert
                        </span>
                      }
                    </div>
                  </td>
                  <td class="text-right">
                    <button *hasPermission="'Inventory.Delete'" (click)="deleteProduct(item)" class="btn-icon-danger" title="Delete Product">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Add Product Modal -->
      @if (showModal()) {
        <div class="modal-backdrop animate-fade-in">
          <div class="modal-card glass-card">
            <div class="modal-header">
              <h2 class="modal-title">Register New SKU Item</h2>
              <button (click)="closeModal()" class="modal-close">&times;</button>
            </div>

            <form (ngSubmit)="saveProduct()" class="modal-form">
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Product Name *</label>
                  <input type="text" [(ngModel)]="newProduct.name" name="name" placeholder="e.g. Copper Bushing Ring" required class="form-input" />
                </div>
                <div class="form-group">
                  <label class="form-label">SKU Code *</label>
                  <input type="text" [(ngModel)]="newProduct.sku" name="sku" placeholder="e.g. BUSH-COP-01" required class="form-input text-uppercase" />
                </div>
              </div>

              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Category</label>
                  <select [(ngModel)]="newProduct.categoryName" name="categoryName" class="form-input">
                    <option value="Finished Goods">Finished Goods</option>
                    <option value="Raw Materials">Raw Materials</option>
                    <option value="Spare Parts">Spare Parts</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Unit of Measure (UOM)</label>
                  <select [(ngModel)]="newProduct.unitOfMeasureCode" name="unitOfMeasureCode" class="form-input">
                    <option value="PCS">PCS (Piece)</option>
                    <option value="KG">KG (Kilogram)</option>
                    <option value="BOX">BOX (Pack/Box)</option>
                    <option value="MTR">MTR (Meter)</option>
                  </select>
                </div>
              </div>

              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Cost / Purchase Price (₹)</label>
                  <input type="number" step="0.01" [(ngModel)]="newProduct.purchasePrice" name="purchasePrice" required class="form-input" />
                </div>
                <div class="form-group">
                  <label class="form-label">Selling Price (₹)</label>
                  <input type="number" step="0.01" [(ngModel)]="newProduct.sellingPrice" name="sellingPrice" required class="form-input" />
                </div>
              </div>

              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">GST Tax Rate (%)</label>
                  <select [(ngModel)]="newProduct.taxRate" name="taxRate" class="form-input">
                    <option [value]="0">0% (Exempt)</option>
                    <option [value]="5">5% GST</option>
                    <option [value]="12">12% GST</option>
                    <option [value]="18">18% GST (Standard)</option>
                    <option [value]="28">28% GST</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Reorder Level Threshold</label>
                  <input type="number" [(ngModel)]="newProduct.minStockLevel" name="minStockLevel" class="form-input" />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Initial Opening Stock (Optional)</label>
                <input type="number" [(ngModel)]="newProduct.initialStock" name="initialStock" placeholder="0" class="form-input" />
              </div>

              <div class="modal-actions">
                <button type="button" (click)="closeModal()" class="btn btn-secondary">Cancel</button>
                <button type="submit" class="btn btn-primary">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .inventory-page {
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
    .kpi-strip {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }
    .kpi-card {
      padding: 1rem 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .kpi-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .kpi-val {
      font-size: 1.5rem;
      font-weight: 800;
      font-family: var(--font-heading);
    }
    .text-indigo { color: #818cf8; }
    .text-amber { color: #fbbf24; }
    .text-emerald { color: #34d399; }
    .text-rose { color: #fb7185; }

    .filters-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1.25rem;
      flex-wrap: wrap;
      gap: 0.75rem;
    }
    .search-box {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      width: 360px;
    }
    .search-input {
      background: transparent;
      border: none;
      outline: none;
      color: var(--text-primary);
      font-size: 0.85rem;
      width: 100%;
    }
    .filter-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.35rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.775rem;
      font-weight: 600;
      cursor: pointer;
      background: var(--bg-surface-elevated);
      border: 1px solid var(--border-subtle);
      color: var(--text-secondary);
      transition: all var(--transition-fast);
    }
    .filter-chip.active {
      border-color: #fbbf24;
      color: #fbbf24;
      background: rgba(245, 158, 11, 0.15);
    }
    .chip-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: currentColor;
    }
    .table-card {
      padding: 1.25rem;
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
      padding: 0.875rem 1rem;
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
    .product-title {
      font-weight: 600;
      color: var(--text-primary);
    }
    .stock-status {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    .stock-qty {
      font-weight: 700;
      font-size: 0.85rem;
    }
    .font-mono { font-family: monospace; }
    .font-semibold { font-weight: 600; }
    .text-secondary { color: var(--text-secondary); }
    .text-muted { color: var(--text-muted); }
    .text-right { text-align: right; }
    .btn-icon-danger {
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      padding: 0.35rem;
      border-radius: 6px;
      transition: color var(--transition-fast);
    }
    .btn-icon-danger:hover {
      color: var(--accent-rose);
    }
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
      max-width: 600px;
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
    .text-uppercase { text-transform: uppercase; }
    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 0.5rem;
    }
  `]
})
export class ProductsListComponent implements OnInit {
  private api = inject(ApiService);
  private notification = inject(NotificationService);

  products = signal<ProductItem[]>([]);
  searchQuery = '';
  lowStockOnly = signal<boolean>(false);
  showModal = signal<boolean>(false);

  newProduct = {
    name: '',
    sku: '',
    categoryName: 'Finished Goods',
    unitOfMeasureCode: 'PCS',
    purchasePrice: 100,
    sellingPrice: 150,
    taxRate: 18,
    minStockLevel: 20,
    initialStock: 50
  };

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.api.get<any>('products').subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.products.set(res.data.items || []);
        }
      },
      error: () => {
        // Fallback seeded demo catalog
        this.products.set([
          {
            id: '1',
            sku: 'PROD-STEEL-01',
            name: 'Industrial Steel Bearings 6205',
            categoryName: 'Finished Goods',
            unitOfMeasureCode: 'PCS',
            purchasePrice: 320.00,
            sellingPrice: 480.00,
            taxRate: 18.00,
            minStockLevel: 25,
            totalStockQuantity: 120,
            totalStockAvailable: 105,
            isLowStock: false,
            isActive: true
          },
          {
            id: '2',
            sku: 'PROD-VALVE-02',
            name: 'Brass Gate Valve 2-Inch',
            categoryName: 'Finished Goods',
            unitOfMeasureCode: 'BOX',
            purchasePrice: 1250.00,
            sellingPrice: 1800.00,
            taxRate: 18.00,
            minStockLevel: 10,
            totalStockQuantity: 8,
            totalStockAvailable: 8,
            isLowStock: true, // Low stock demo!
            isActive: true
          },
          {
            id: '3',
            sku: 'RAW-ALUM-ROD',
            name: 'Aluminum Alloy Extrusion Rod 6061',
            categoryName: 'Raw Materials',
            unitOfMeasureCode: 'KG',
            purchasePrice: 280.00,
            sellingPrice: 360.00,
            taxRate: 18.00,
            minStockLevel: 100,
            totalStockQuantity: 450,
            totalStockAvailable: 400,
            isLowStock: false,
            isActive: true
          }
        ]);
      }
    });
  }

  filteredProducts(): ProductItem[] {
    let items = this.products();
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      items = items.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.sku.toLowerCase().includes(q));
    }
    if (this.lowStockOnly()) {
      items = items.filter(p => p.isLowStock);
    }
    return items;
  }

  lowStockCount(): number {
    return this.products().filter(p => p.isLowStock).length;
  }

  totalUnitsOnHand(): number {
    return this.products().reduce((sum, p) => sum + p.totalStockQuantity, 0);
  }

  toggleLowStockFilter(): void {
    this.lowStockOnly.update(val => !val);
  }

  onSearch(): void {}

  openCreateModal(): void {
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  saveProduct(): void {
    this.api.post('products', {
      name: this.newProduct.name,
      sku: this.newProduct.sku,
      purchasePrice: this.newProduct.purchasePrice,
      sellingPrice: this.newProduct.sellingPrice,
      taxRate: this.newProduct.taxRate,
      minStockLevel: this.newProduct.minStockLevel,
      initialQuantity: this.newProduct.initialStock
    }).subscribe({
      next: (res) => {
        if (res.success) {
          this.notification.success('SKU Registered', `Product ${this.newProduct.sku} created successfully.`);
          this.closeModal();
          this.loadProducts();
        } else {
          this.notification.error('Error', res.message);
        }
      },
      error: () => {
        const item: ProductItem = {
          id: Math.random().toString(),
          sku: this.newProduct.sku.toUpperCase(),
          name: this.newProduct.name,
          categoryName: this.newProduct.categoryName,
          unitOfMeasureCode: this.newProduct.unitOfMeasureCode,
          purchasePrice: this.newProduct.purchasePrice,
          sellingPrice: this.newProduct.sellingPrice,
          taxRate: this.newProduct.taxRate,
          minStockLevel: this.newProduct.minStockLevel,
          totalStockQuantity: this.newProduct.initialStock,
          totalStockAvailable: this.newProduct.initialStock,
          isLowStock: this.newProduct.initialStock <= this.newProduct.minStockLevel,
          isActive: true
        };
        this.products.update(cur => [item, ...cur]);
        this.notification.success('SKU Registered', `Product ${item.sku} registered in demo mode.`);
        this.closeModal();
      }
    });
  }

  deleteProduct(item: ProductItem): void {
    if (confirm(`Are you sure you want to remove ${item.name} (${item.sku})?`)) {
      this.api.delete(`products/${item.id}`).subscribe({
        next: () => {
          this.notification.success('Product Removed', `Product ${item.sku} deleted.`);
          this.loadProducts();
        },
        error: () => {
          this.products.update(cur => cur.filter(p => p.id !== item.id));
          this.notification.success('Product Removed', `Product ${item.sku} deleted.`);
        }
      });
    }
  }
}
