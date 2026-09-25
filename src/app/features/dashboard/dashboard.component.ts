import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DashboardService } from '../../core/services/dashboard.service';
import { DashboardMetrics } from '../../core/models/dashboard.models';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="dashboard-page animate-fade-in">
      <!-- Top Title & Controls -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Executive Command Center</h1>
          <p class="page-subtitle">Real-time consolidated analytics across Commercial Sales, Procurement, Inventory & General Ledger.</p>
        </div>
        <div class="header-actions">
          <button (click)="loadStats()" class="btn btn-secondary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Data
          </button>
          <a routerLink="/sales/create" class="btn btn-primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Tax Invoice
          </a>
        </div>
      </div>

      <!-- Live Multi-Module Architecture Banner -->
      <div class="arch-banner glass-panel">
        <div class="arch-left">
          <span class="live-dot"></span>
          <div class="arch-badge">Live Enterprise Hub Active</div>
          <span class="arch-text">ASP.NET Core Web API (net9.0) &bull; SQL Server 2022 &bull; Multi-Tenant Scoped &bull; Double-Entry GL Synced</span>
        </div>
        <div class="arch-right">
          <span class="badge badge-emerald">Real-Time Operational Sync</span>
          <span class="badge badge-indigo">INR (₹) Base Currency</span>
        </div>
      </div>

      <!-- 6 Live Financial & Operational KPI Cards -->
      <div class="stats-grid">
        <!-- 1. Revenue -->
        <div class="glass-card stat-card">
          <div class="stat-header">
            <span class="stat-title">Revenue YTD</span>
            <div class="stat-icon icon-revenue">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" class="w-5 h-5 text-amber-400">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div class="stat-body">
            <span class="stat-value font-mono">₹{{ stats()?.totalRevenue | number:'1.2-2' }}</span>
            <div class="stat-trend positive">
              <span>Sales Tax Invoices Billed</span>
            </div>
          </div>
        </div>

        <!-- 2. Accounts Receivable -->
        <div class="glass-card stat-card">
          <div class="stat-header">
            <span class="stat-title">Accounts Receivable</span>
            <div class="stat-icon icon-ar">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" class="w-5 h-5 text-emerald-400">
                <path stroke-linecap="round" stroke-linejoin="round" d="M7 11l5-5m0 0l5 5m-5-5v12" />
              </svg>
            </div>
          </div>
          <div class="stat-body">
            <span class="stat-value font-mono text-emerald-400">₹{{ stats()?.totalReceivables | number:'1.2-2' }}</span>
            <div class="stat-trend neutral">
              <span>Customer Balance Outstanding</span>
            </div>
          </div>
        </div>

        <!-- 3. Accounts Payable -->
        <div class="glass-card stat-card">
          <div class="stat-header">
            <span class="stat-title">Accounts Payable</span>
            <div class="stat-icon icon-ap">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" class="w-5 h-5 text-rose-400">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17 13l-5 5m0 0l-5-5m5 5V6" />
              </svg>
            </div>
          </div>
          <div class="stat-body">
            <span class="stat-value font-mono text-rose-400">₹{{ stats()?.totalPayables | number:'1.2-2' }}</span>
            <div class="stat-trend neutral">
              <span>Vendor Bills Pending Payment</span>
            </div>
          </div>
        </div>

        <!-- 4. Inventory Valuation -->
        <div class="glass-card stat-card">
          <div class="stat-header">
            <span class="stat-title">Inventory Valuation</span>
            <div class="stat-icon icon-inventory">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" class="w-5 h-5 text-indigo-400">
                <path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
          <div class="stat-body">
            <span class="stat-value font-mono">₹{{ stats()?.inventoryValuation | number:'1.2-2' }}</span>
            <div class="stat-trend neutral">
              <span>{{ stats()?.totalStockQuantity | number:'1.0-0' }} Units across Warehouses</span>
            </div>
          </div>
        </div>

        <!-- 5. Cash & Bank Liquidity -->
        <div class="glass-card stat-card">
          <div class="stat-header">
            <span class="stat-title">Cash & Bank Liquidity</span>
            <div class="stat-icon icon-cash">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" class="w-5 h-5 text-teal-400">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
          </div>
          <div class="stat-body">
            <span class="stat-value font-mono text-teal-400">₹{{ stats()?.cashBankBalance | number:'1.2-2' }}</span>
            <div class="stat-trend positive">
              <span>Liquid Funds in GL Accounts</span>
            </div>
          </div>
        </div>

        <!-- 6. Net Profit YTD -->
        <div class="glass-card stat-card">
          <div class="stat-header">
            <span class="stat-title">Net Operating Profit YTD</span>
            <div class="stat-icon icon-profit">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" class="w-5 h-5 text-emerald-400">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
          <div class="stat-body">
            <span class="stat-value font-mono" [class.text-emerald-400]="(stats()?.netProfitYTD ?? 0) >= 0" [class.text-rose-400]="(stats()?.netProfitYTD ?? 0) < 0">
              ₹{{ stats()?.netProfitYTD | number:'1.2-2' }}
            </span>
            <div class="stat-trend positive">
              <span>Revenue minus Expenses</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Critical Low Stock Alerts Banner (if any) -->
      @if (stats()?.lowStockAlerts && stats()!.lowStockAlerts.length > 0) {
        <div class="alert-strip">
          <div class="alert-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-5 h-5 text-amber-400">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div class="alert-text">
            <span class="alert-title">{{ stats()!.lowStockCount + stats()!.outOfStockCount }} Inventory Items at or below Reorder Threshold</span>
            <span class="alert-desc">Immediate replenishment recommended: {{ getLowStockSummary() }}</span>
          </div>
          <a routerLink="/purchases/orders" class="btn btn-warning btn-sm ml-auto">Generate PO</a>
        </div>
      }

      <!-- Main Visual Analytics: 6-Month Inflow/Outflow & Quick Operations -->
      <div class="content-grid">
        <!-- 6-Month Visual Cash Flow Comparison -->
        <div class="glass-panel trend-card">
          <div class="card-header">
            <div>
              <h2 class="card-title">Commercial Trajectory (Last 6 Months)</h2>
              <span class="card-subtitle">Comparison of Invoiced Sales Revenue vs. Procurement Spend.</span>
            </div>
            <div class="legend-group">
              <span class="legend-item"><span class="legend-dot dot-sales"></span> Sales Revenue</span>
              <span class="legend-item"><span class="legend-dot dot-purchases"></span> Purchases</span>
            </div>
          </div>

          <div class="chart-bars-wrap">
            @for (m of stats()?.monthlyTrends; track m.monthName) {
              <div class="bar-col">
                <div class="bar-pair">
                  <!-- Sales Bar -->
                  <div
                    class="bar bar-sales"
                    [style.height.%]="getBarHeight(m.salesRevenue)"
                    [title]="'Sales: ₹' + (m.salesRevenue | number:'1.2-2')"
                  ></div>
                  <!-- Purchases Bar -->
                  <div
                    class="bar bar-purchases"
                    [style.height.%]="getBarHeight(m.purchaseExpense)"
                    [title]="'Purchases: ₹' + (m.purchaseExpense | number:'1.2-2')"
                  ></div>
                </div>
                <span class="bar-label">{{ m.monthName }}</span>
              </div>
            }
          </div>
        </div>

        <!-- Quick Operational Actions Card -->
        <div class="glass-panel actions-card">
          <div class="card-header">
            <h2 class="card-title">Quick Operations</h2>
            <span class="badge badge-indigo">Shortcuts</span>
          </div>

          <div class="quick-actions-list">
            <a routerLink="/sales/create" class="action-btn">
              <div class="action-icon icon-blue">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-5 h-5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div class="action-info">
                <span class="action-title">Create Sales Invoice</span>
                <span class="action-desc">Issue GST invoice & deplete stock</span>
              </div>
            </a>

            <a routerLink="/purchases/orders" class="action-btn">
              <div class="action-icon icon-purple">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-5 h-5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div class="action-info">
                <span class="action-title">Issue Purchase Order</span>
                <span class="action-desc">Order goods from suppliers</span>
              </div>
            </a>

            <a routerLink="/accounts/journals" class="action-btn">
              <div class="action-icon icon-emerald">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-5 h-5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div class="action-info">
                <span class="action-title">Post Journal Voucher</span>
                <span class="action-desc">Balanced double-entry adjustments</span>
              </div>
            </a>

            <a routerLink="/inventory/products" class="action-btn">
              <div class="action-icon icon-amber">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-5 h-5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div class="action-info">
                <span class="action-title">Manage Product SKUs</span>
                <span class="action-desc">Catalog, pricing & reorder levels</span>
              </div>
            </a>
          </div>
        </div>
      </div>

      <!-- Real-Time Cross-Module Activity Stream -->
      <div class="glass-panel table-card">
        <div class="card-header">
          <div>
            <h2 class="card-title">Live Cross-Module Activity Stream</h2>
            <span class="card-subtitle">Real-time transactions recorded across sales, vendor procurement, and general ledger.</span>
          </div>
          <span class="badge badge-emerald">Real-Time Sync</span>
        </div>

        <div class="table-container">
          <table class="erp-table">
            <thead>
              <tr>
                <th>Module</th>
                <th>Transaction Title</th>
                <th>Counterparty / Narration</th>
                <th>Date & Time</th>
                <th class="text-right">Amount (₹)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              @if (stats()?.recentActivities && stats()!.recentActivities.length > 0) {
                @for (act of stats()!.recentActivities; track act.referenceId) {
                  <tr>
                    <td>
                      <span class="module-tag" [ngClass]="getModuleTagClass(act.activityType)">
                        {{ act.activityType }}
                      </span>
                    </td>
                    <td class="font-semibold text-primary">{{ act.title }}</td>
                    <td class="text-secondary text-sm">{{ act.subtitle }}</td>
                    <td class="text-muted text-xs">{{ act.timestamp | date:'dd MMM yyyy, HH:mm' }}</td>
                    <td class="text-right font-mono font-bold text-emerald-400">
                      ₹{{ act.amount | number:'1.2-2' }}
                    </td>
                    <td>
                      <span class="badge badge-indigo">{{ act.statusBadge }}</span>
                    </td>
                  </tr>
                }
              } @else {
                <tr>
                  <td colspan="6" class="text-center py-4 text-muted">
                    No transactions recorded yet in current business session.
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
    .dashboard-page {
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
    .arch-banner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.85rem 1.25rem;
      border-radius: 12px;
      border: 1px solid var(--border-subtle);
      background: var(--bg-surface);
      flex-wrap: wrap;
      gap: 0.75rem;
    }
    .arch-left {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .live-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 10px #10b981;
    }
    .arch-badge {
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
      background: rgba(99, 102, 241, 0.2);
      color: #818cf8;
      border: 1px solid rgba(99, 102, 241, 0.3);
    }
    .arch-text {
      font-size: 0.8rem;
      color: var(--text-secondary);
    }
    .arch-right {
      display: flex;
      gap: 0.5rem;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1rem;
    }
    .stat-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: 12px;
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      transition: all 0.2s ease;
    }
    .stat-card:hover {
      transform: translateY(-2px);
      border-color: rgba(99, 102, 241, 0.4);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    }
    .stat-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .stat-title {
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .stat-icon {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.06);
    }
    .stat-value {
      font-size: 1.35rem;
      font-weight: 800;
      color: var(--text-primary);
      display: block;
    }
    .stat-trend {
      font-size: 0.75rem;
      margin-top: 0.25rem;
    }
    .stat-trend.positive { color: #34d399; }
    .stat-trend.neutral { color: var(--text-muted); }
    .alert-strip {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.25rem;
      background: rgba(245, 158, 11, 0.1);
      border: 1px solid rgba(245, 158, 11, 0.3);
      border-radius: 12px;
    }
    .alert-icon {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      background: rgba(245, 158, 11, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .alert-text {
      display: flex;
      flex-direction: column;
    }
    .alert-title {
      font-size: 0.9rem;
      font-weight: 700;
      color: #fbbf24;
    }
    .alert-desc {
      font-size: 0.8rem;
      color: var(--text-secondary);
    }
    .btn-warning {
      background: #f59e0b;
      color: #000;
      font-weight: 700;
      border: none;
      padding: 0.4rem 0.85rem;
      border-radius: 6px;
      cursor: pointer;
    }
    .btn-sm { font-size: 0.75rem; }
    .ml-auto { margin-left: auto; }
    .content-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 1.5rem;
    }
    @media (max-width: 1024px) {
      .content-grid { grid-template-columns: 1fr; }
    }
    .trend-card, .actions-card, .table-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: 16px;
      padding: 1.5rem;
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
    }
    .card-title {
      font-size: 1.1rem;
      font-weight: 800;
      color: var(--text-primary);
    }
    .card-subtitle {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .legend-group {
      display: flex;
      gap: 1rem;
      font-size: 0.75rem;
      color: var(--text-secondary);
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }
    .legend-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
    .dot-sales { background: #6366f1; }
    .dot-purchases { background: #f43f5e; }
    .chart-bars-wrap {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      height: 180px;
      padding-top: 1rem;
      border-bottom: 1px solid var(--border-subtle);
    }
    .bar-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      height: 100%;
      flex: 1;
    }
    .bar-pair {
      display: flex;
      align-items: flex-end;
      gap: 4px;
      height: calc(100% - 20px);
      width: 36px;
      justify-content: center;
    }
    .bar {
      width: 12px;
      border-radius: 4px 4px 0 0;
      min-height: 4px;
      transition: height 0.5s ease;
    }
    .bar-sales {
      background: linear-gradient(180deg, #818cf8 0%, #4f46e5 100%);
    }
    .bar-purchases {
      background: linear-gradient(180deg, #fb7185 0%, #e11d48 100%);
    }
    .bar-label {
      font-size: 0.75rem;
      color: var(--text-muted);
      font-weight: 600;
    }
    .quick-actions-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .action-btn {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.85rem;
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid var(--border-subtle);
      text-decoration: none;
      transition: all 0.2s ease;
    }
    .action-btn:hover {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(99, 102, 241, 0.4);
      transform: translateX(3px);
    }
    .action-icon {
      width: 38px;
      height: 38px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .icon-blue { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }
    .icon-purple { background: rgba(168, 85, 247, 0.15); color: #c084fc; }
    .icon-emerald { background: rgba(16, 185, 129, 0.15); color: #34d399; }
    .icon-amber { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
    .action-info {
      display: flex;
      flex-direction: column;
    }
    .action-title {
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--text-primary);
    }
    .action-desc {
      font-size: 0.7rem;
      color: var(--text-muted);
    }
    .erp-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;
    }
    .erp-table th {
      padding: 0.75rem 1rem;
      text-transform: uppercase;
      font-size: 0.75rem;
      color: var(--text-secondary);
      border-bottom: 1px solid var(--border-subtle);
      background: rgba(255, 255, 255, 0.02);
      text-align: left;
    }
    .erp-table td {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--border-subtle);
    }
    .module-tag {
      font-size: 0.65rem;
      font-weight: 700;
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
      text-transform: uppercase;
    }
    .tag-invoice { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }
    .tag-bill { background: rgba(244, 63, 94, 0.15); color: #fb7185; }
    .tag-journal { background: rgba(16, 185, 129, 0.15); color: #34d399; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .py-4 { padding-top: 1rem; padding-bottom: 1rem; }
    .text-muted { color: var(--text-muted); }
  `]
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private notification = inject(NotificationService);

  stats = signal<DashboardMetrics | null>(null);
  loading = signal(false);

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.loading.set(true);
    this.dashboardService.getDashboardStats().subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.isSuccess && res.data) {
          this.stats.set(res.data);
        }
      },
      error: () => {
        this.loading.set(false);
        this.notification.error('Failed to load dashboard metrics.');
      }
    });
  }

  getBarHeight(value: number): number {
    const list = this.stats()?.monthlyTrends || [];
    const maxVal = Math.max(...list.map(m => Math.max(m.salesRevenue, m.purchaseExpense)), 10000);
    return Math.max(8, Math.min(100, Math.round((value / maxVal) * 100)));
  }

  getLowStockSummary(): string {
    const alerts = this.stats()?.lowStockAlerts || [];
    return alerts.map(a => `${a.productName} (${a.quantityOnHand}/${a.reorderLevel})`).join(', ');
  }

  getModuleTagClass(type: string): string {
    switch (type?.toLowerCase()) {
      case 'invoice': return 'tag-invoice';
      case 'bill': return 'tag-bill';
      case 'journal': return 'tag-journal';
      default: return '';
    }
  }
}
