import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AccountingService } from '../../core/services/accounting.service';
import {
  TrialBalanceReport,
  ProfitLossReport,
  BalanceSheetReport,
  GstSummaryReport
} from '../../core/models/accounting.models';
import { NotificationService } from '../../core/services/notification.service';

type ReportTab = 'trial-balance' | 'profit-loss' | 'balance-sheet' | 'gst-summary';

@Component({
  selector: 'app-financial-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="reports-page animate-fade-in">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Executive Financial Statements</h1>
          <p class="page-subtitle">Real-time Trial Balance, Profit & Loss (Income Statement), Balance Sheet, and GST Tax Summary.</p>
        </div>

        <div class="header-actions">
          <a routerLink="/accounts/chart" class="btn btn-secondary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            Chart of Accounts
          </a>
          <a routerLink="/accounts/journals" class="btn btn-secondary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Journal Vouchers
          </a>
          <button (click)="printReport()" class="btn btn-primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print Statement
          </button>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="tabs-bar">
        <button
          class="nav-tab"
          [class.active]="activeTab() === 'trial-balance'"
          (click)="switchTab('trial-balance')"
        >
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" class="w-4 h-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
          </svg>
          Trial Balance
        </button>

        <button
          class="nav-tab"
          [class.active]="activeTab() === 'profit-loss'"
          (click)="switchTab('profit-loss')"
        >
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" class="w-4 h-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          Profit & Loss Statement
        </button>

        <button
          class="nav-tab"
          [class.active]="activeTab() === 'balance-sheet'"
          (click)="switchTab('balance-sheet')"
        >
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" class="w-4 h-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Balance Sheet
        </button>

        <button
          class="nav-tab"
          [class.active]="activeTab() === 'gst-summary'"
          (click)="switchTab('gst-summary')"
        >
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" class="w-4 h-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
          </svg>
          GST Tax Summary
        </button>
      </div>

      <!-- Loading State -->
      @if (loading()) {
        <div class="loading-wrap">
          <div class="spinner"></div>
          <span>Computing Financial Statement...</span>
        </div>
      }

      <!-- TAB 1: TRIAL BALANCE -->
      @if (!loading() && activeTab() === 'trial-balance') {
        <div class="statement-card">
          <div class="statement-header">
            <div>
              <h2 class="statement-title">Trial Balance</h2>
              <span class="statement-meta">As of {{ trialBalance()?.asOfDate | date:'dd MMMM yyyy' }}</span>
            </div>
            <div class="statement-status">
              @if (trialBalance()?.isBalanced) {
                <span class="badge-balanced">✓ Balanced Double-Entry</span>
              } @else {
                <span class="badge-imbalanced">⚠ Out of Balance</span>
              }
            </div>
          </div>

          <table class="report-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Account Title</th>
                <th>Category</th>
                <th class="text-right">Debit (₹)</th>
                <th class="text-right">Credit (₹)</th>
              </tr>
            </thead>
            <tbody>
              @for (item of trialBalance()?.items; track item.accountId) {
                <tr>
                  <td class="font-mono font-bold text-accent">{{ item.accountCode }}</td>
                  <td class="font-semibold text-primary">{{ item.accountName }}</td>
                  <td>
                    <span class="cat-tag">{{ item.typeName }}</span>
                  </td>
                  <td class="text-right font-mono">
                    {{ item.debit > 0 ? ('₹' + (item.debit | number:'1.2-2')) : '—' }}
                  </td>
                  <td class="text-right font-mono">
                    {{ item.credit > 0 ? ('₹' + (item.credit | number:'1.2-2')) : '—' }}
                  </td>
                </tr>
              }
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td colspan="3" class="text-right uppercase font-bold">Total Trial Balance:</td>
                <td class="text-right font-mono font-bold text-emerald-400">
                  ₹{{ trialBalance()?.totalDebit | number:'1.2-2' }}
                </td>
                <td class="text-right font-mono font-bold text-emerald-400">
                  ₹{{ trialBalance()?.totalCredit | number:'1.2-2' }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      }

      <!-- TAB 2: PROFIT & LOSS STATEMENT -->
      @if (!loading() && activeTab() === 'profit-loss') {
        <div class="statement-card">
          <div class="statement-header">
            <div>
              <h2 class="statement-title">Statement of Profit & Loss (Income Statement)</h2>
              <span class="statement-meta">
                Period: {{ profitLoss()?.fromDate | date:'dd MMM yyyy' }} to {{ profitLoss()?.toDate | date:'dd MMM yyyy' }}
              </span>
            </div>
          </div>

          <div class="pnl-section">
            <!-- 1. Revenue -->
            <div class="pnl-group">
              <div class="group-title-row">
                <span class="group-title">1. Operating Revenue</span>
                <span class="group-total font-mono">₹{{ profitLoss()?.revenue?.subtotal | number:'1.2-2' }}</span>
              </div>
              <ul class="pnl-item-list">
                @for (item of profitLoss()?.revenue?.items; track item.accountCode) {
                  <li class="pnl-item">
                    <span>{{ item.accountCode }} - {{ item.accountName }}</span>
                    <span class="font-mono">₹{{ item.amount | number:'1.2-2' }}</span>
                  </li>
                }
              </ul>
            </div>

            <!-- 2. Cost of Goods Sold -->
            <div class="pnl-group">
              <div class="group-title-row">
                <span class="group-title">2. Cost of Goods Sold (COGS)</span>
                <span class="group-total font-mono text-rose-400">₹{{ profitLoss()?.costOfGoodsSold?.subtotal | number:'1.2-2' }}</span>
              </div>
              <ul class="pnl-item-list">
                @for (item of profitLoss()?.costOfGoodsSold?.items; track item.accountCode) {
                  <li class="pnl-item">
                    <span>{{ item.accountCode }} - {{ item.accountName }}</span>
                    <span class="font-mono">₹{{ item.amount | number:'1.2-2' }}</span>
                  </li>
                }
              </ul>
            </div>

            <!-- Gross Profit Highlight -->
            <div class="highlight-strip gross-profit">
              <div>
                <span class="highlight-label">Gross Operating Profit</span>
                <span class="highlight-meta">Gross Margin: {{ getGrossMargin() | number:'1.2-2' }}%</span>
              </div>
              <span class="highlight-val font-mono">₹{{ profitLoss()?.grossProfit | number:'1.2-2' }}</span>
            </div>

            <!-- 3. Operating Expenses -->
            <div class="pnl-group">
              <div class="group-title-row">
                <span class="group-title">3. Operating Expenses</span>
                <span class="group-total font-mono text-rose-400">₹{{ profitLoss()?.totalOperatingExpenses | number:'1.2-2' }}</span>
              </div>
              <ul class="pnl-item-list">
                @for (item of profitLoss()?.operatingExpenses?.items; track item.accountCode) {
                  <li class="pnl-item">
                    <span>{{ item.accountCode }} - {{ item.accountName }}</span>
                    <span class="font-mono">₹{{ item.amount | number:'1.2-2' }}</span>
                  </li>
                }
              </ul>
            </div>

            <!-- Net Profit Highlight -->
            <div class="highlight-strip net-profit">
              <div>
                <span class="highlight-label">Net Operating Profit</span>
                <span class="highlight-meta">Net Margin: {{ profitLoss()?.netProfitMarginPercentage }}%</span>
              </div>
              <span class="highlight-val font-mono">₹{{ profitLoss()?.netProfit | number:'1.2-2' }}</span>
            </div>
          </div>
        </div>
      }

      <!-- TAB 3: BALANCE SHEET -->
      @if (!loading() && activeTab() === 'balance-sheet') {
        <div class="statement-card">
          <div class="statement-header">
            <div>
              <h2 class="statement-title">Balance Sheet</h2>
              <span class="statement-meta">As of {{ balanceSheet()?.asOfDate | date:'dd MMMM yyyy' }}</span>
            </div>
            <div>
              @if (balanceSheet()?.isBalanced) {
                <span class="badge-balanced">✓ Balanced: Assets = Liabilities + Equity</span>
              } @else {
                <span class="badge-imbalanced">⚠ Imbalanced Equation</span>
              }
            </div>
          </div>

          <div class="balance-sheet-grid">
            <!-- Left Side: ASSETS -->
            <div class="bs-column">
              <div class="bs-col-header">
                <h3>ASSETS</h3>
                <span class="font-mono font-bold">₹{{ balanceSheet()?.totalAssets | number:'1.2-2' }}</span>
              </div>

              <!-- Current Assets -->
              <div class="bs-subgroup">
                <div class="bs-sub-title">Current Assets</div>
                @for (item of balanceSheet()?.currentAssets?.items; track item.accountCode) {
                  <div class="bs-line">
                    <span>{{ item.accountCode }} - {{ item.accountName }}</span>
                    <span class="font-mono font-semibold">₹{{ item.balance | number:'1.2-2' }}</span>
                  </div>
                }
                <div class="bs-sub-total">
                  <span>Subtotal Current Assets:</span>
                  <span class="font-mono">₹{{ balanceSheet()?.currentAssets?.subtotal | number:'1.2-2' }}</span>
                </div>
              </div>

              <!-- Non-Current Assets -->
              <div class="bs-subgroup">
                <div class="bs-sub-title">Non-Current & Fixed Assets</div>
                @for (item of balanceSheet()?.nonCurrentAssets?.items; track item.accountCode) {
                  <div class="bs-line">
                    <span>{{ item.accountCode }} - {{ item.accountName }}</span>
                    <span class="font-mono font-semibold">₹{{ item.balance | number:'1.2-2' }}</span>
                  </div>
                }
                <div class="bs-sub-total">
                  <span>Subtotal Fixed Assets:</span>
                  <span class="font-mono">₹{{ balanceSheet()?.nonCurrentAssets?.subtotal | number:'1.2-2' }}</span>
                </div>
              </div>

              <div class="bs-col-footer">
                <span>TOTAL ASSETS:</span>
                <span class="font-mono text-emerald-400">₹{{ balanceSheet()?.totalAssets | number:'1.2-2' }}</span>
              </div>
            </div>

            <!-- Right Side: LIABILITIES & EQUITY -->
            <div class="bs-column">
              <div class="bs-col-header">
                <h3>LIABILITIES & EQUITY</h3>
                <span class="font-mono font-bold">₹{{ balanceSheet()?.totalLiabilitiesAndEquity | number:'1.2-2' }}</span>
              </div>

              <!-- Current Liabilities -->
              <div class="bs-subgroup">
                <div class="bs-sub-title">Current Liabilities</div>
                @for (item of balanceSheet()?.currentLiabilities?.items; track item.accountCode) {
                  <div class="bs-line">
                    <span>{{ item.accountCode }} - {{ item.accountName }}</span>
                    <span class="font-mono font-semibold">₹{{ item.balance | number:'1.2-2' }}</span>
                  </div>
                }
                <div class="bs-sub-total">
                  <span>Subtotal Current Liabilities:</span>
                  <span class="font-mono">₹{{ balanceSheet()?.currentLiabilities?.subtotal | number:'1.2-2' }}</span>
                </div>
              </div>

              <!-- Non-Current Liabilities -->
              <div class="bs-subgroup">
                <div class="bs-sub-title">Long Term Liabilities</div>
                @for (item of balanceSheet()?.nonCurrentLiabilities?.items; track item.accountCode) {
                  <div class="bs-line">
                    <span>{{ item.accountCode }} - {{ item.accountName }}</span>
                    <span class="font-mono font-semibold">₹{{ item.balance | number:'1.2-2' }}</span>
                  </div>
                }
                <div class="bs-sub-total">
                  <span>Subtotal Long Term Liabilities:</span>
                  <span class="font-mono">₹{{ balanceSheet()?.nonCurrentLiabilities?.subtotal | number:'1.2-2' }}</span>
                </div>
              </div>

              <!-- Equity -->
              <div class="bs-subgroup">
                <div class="bs-sub-title">Capital & Reserves</div>
                @for (item of balanceSheet()?.equity?.items; track item.accountCode) {
                  <div class="bs-line">
                    <span>{{ item.accountCode }} - {{ item.accountName }}</span>
                    <span class="font-mono font-semibold">₹{{ item.balance | number:'1.2-2' }}</span>
                  </div>
                }
                <div class="bs-line text-emerald-400 font-bold">
                  <span>Retained Earnings (YTD Net Profit)</span>
                  <span class="font-mono">₹{{ balanceSheet()?.retainedEarnings | number:'1.2-2' }}</span>
                </div>
                <div class="bs-sub-total">
                  <span>Total Equity:</span>
                  <span class="font-mono">₹{{ balanceSheet()?.totalEquity | number:'1.2-2' }}</span>
                </div>
              </div>

              <div class="bs-col-footer">
                <span>TOTAL LIABILITIES & EQUITY:</span>
                <span class="font-mono text-emerald-400">₹{{ balanceSheet()?.totalLiabilitiesAndEquity | number:'1.2-2' }}</span>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- TAB 4: GST TAX SUMMARY -->
      @if (!loading() && activeTab() === 'gst-summary') {
        <div class="statement-card">
          <div class="statement-header">
            <div>
              <h2 class="statement-title">Goods & Services Tax (GST) Summary</h2>
              <span class="statement-meta">
                Reporting Period: {{ gstSummary()?.fromDate | date:'dd MMM yyyy' }} to {{ gstSummary()?.toDate | date:'dd MMM yyyy' }}
              </span>
            </div>
          </div>

          <div class="gst-grid">
            <!-- 1. Outward Tax Liability Card -->
            <div class="gst-box outward">
              <div class="gst-box-header">
                <h3>1. Outward Supplies (Sales)</h3>
                <span class="gst-total font-mono">₹{{ gstSummary()?.totalOutputTax | number:'1.2-2' }}</span>
              </div>
              <div class="gst-details">
                <div class="gst-line">
                  <span>Total Taxable Value:</span>
                  <span class="font-mono font-bold">₹{{ gstSummary()?.outwardTaxableAmount | number:'1.2-2' }}</span>
                </div>
                <div class="gst-line">
                  <span>CGST (Central Tax 9% / 2.5% / 14%):</span>
                  <span class="font-mono">₹{{ gstSummary()?.cgstOutput | number:'1.2-2' }}</span>
                </div>
                <div class="gst-line">
                  <span>SGST (State Tax 9% / 2.5% / 14%):</span>
                  <span class="font-mono">₹{{ gstSummary()?.sgstOutput | number:'1.2-2' }}</span>
                </div>
                <div class="gst-line">
                  <span>IGST (Integrated Interstate Tax):</span>
                  <span class="font-mono">₹{{ gstSummary()?.igstOutput | number:'1.2-2' }}</span>
                </div>
              </div>
            </div>

            <!-- 2. Input Tax Credit (ITC) Card -->
            <div class="gst-box inward">
              <div class="gst-box-header">
                <h3>2. Inward Supplies (Input Tax Credit)</h3>
                <span class="gst-total font-mono">₹{{ gstSummary()?.totalInputCredit | number:'1.2-2' }}</span>
              </div>
              <div class="gst-details">
                <div class="gst-line">
                  <span>Total Inward Taxable Value:</span>
                  <span class="font-mono font-bold">₹{{ gstSummary()?.inwardTaxableAmount | number:'1.2-2' }}</span>
                </div>
                <div class="gst-line">
                  <span>CGST Input Credit (ITC):</span>
                  <span class="font-mono">₹{{ gstSummary()?.cgstInputCredit | number:'1.2-2' }}</span>
                </div>
                <div class="gst-line">
                  <span>SGST Input Credit (ITC):</span>
                  <span class="font-mono">₹{{ gstSummary()?.sgstInputCredit | number:'1.2-2' }}</span>
                </div>
                <div class="gst-line">
                  <span>IGST Input Credit (ITC):</span>
                  <span class="font-mono">₹{{ gstSummary()?.igstInputCredit | number:'1.2-2' }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Net GST Payable Settlement Banner -->
          <div class="gst-settlement-card">
            <div class="settle-left">
              <span class="settle-title">Net GST Payable / (Credit Carried Forward)</span>
              <p class="settle-subtitle">Output Tax Liability minus Eligible Input Tax Credit across state and central heads.</p>
              <div class="settle-breakdown">
                <span>Net CGST: <b>₹{{ gstSummary()?.netCgstPayable | number:'1.2-2' }}</b></span>
                <span>•</span>
                <span>Net SGST: <b>₹{{ gstSummary()?.netSgstPayable | number:'1.2-2' }}</b></span>
                <span>•</span>
                <span>Net IGST: <b>₹{{ gstSummary()?.netIgstPayable | number:'1.2-2' }}</b></span>
              </div>
            </div>
            <div class="settle-right">
              <span class="settle-val-label">TOTAL NET TAX PAYABLE</span>
              <span class="settle-amount font-mono">₹{{ gstSummary()?.netTotalTaxPayable | number:'1.2-2' }}</span>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .reports-page {
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
    .tabs-bar {
      display: flex;
      gap: 0.5rem;
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: 12px;
      padding: 0.4rem;
      overflow-x: auto;
    }
    .nav-tab {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.55rem 1rem;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 600;
      background: transparent;
      color: var(--text-secondary);
      border: 1px solid transparent;
      cursor: pointer;
      transition: all 0.15s ease;
      white-space: nowrap;
    }
    .nav-tab:hover {
      color: var(--text-primary);
      background: rgba(255, 255, 255, 0.04);
    }
    .nav-tab.active {
      background: rgba(99, 102, 241, 0.15);
      color: #818cf8;
      border-color: rgba(99, 102, 241, 0.3);
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
    }
    .loading-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      padding: 4rem 1rem;
      color: var(--text-secondary);
    }
    .statement-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: 16px;
      padding: 1.75rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    }
    .statement-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 1.25rem;
      border-bottom: 1px solid var(--border-subtle);
    }
    .statement-title {
      font-size: 1.35rem;
      font-weight: 800;
      color: var(--text-primary);
    }
    .statement-meta {
      font-size: 0.8rem;
      color: var(--text-muted);
    }
    .badge-balanced {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.3rem 0.75rem;
      border-radius: 8px;
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }
    .badge-imbalanced {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.3rem 0.75rem;
      border-radius: 8px;
      background: rgba(244, 63, 94, 0.15);
      color: #fb7185;
      border: 1px solid rgba(244, 63, 94, 0.3);
    }
    .report-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }
    .report-table th {
      padding: 0.75rem 1rem;
      text-transform: uppercase;
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--text-secondary);
      border-bottom: 1px solid var(--border-subtle);
      background: rgba(255, 255, 255, 0.02);
      text-align: left;
    }
    .report-table td {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--border-subtle);
    }
    .cat-tag {
      font-size: 0.7rem;
      font-weight: 600;
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
      background: rgba(255, 255, 255, 0.05);
      color: var(--text-secondary);
    }
    .total-row {
      border-top: 2px solid var(--border-subtle);
      background: rgba(255, 255, 255, 0.03);
    }
    .total-row td {
      font-size: 0.95rem;
      padding: 1rem;
    }
    .pnl-section {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .pnl-group {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .group-title-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.6rem 0.85rem;
      background: rgba(255, 255, 255, 0.03);
      border-radius: 8px;
    }
    .group-title {
      font-size: 0.9rem;
      font-weight: 700;
      color: var(--text-primary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .group-total {
      font-size: 1.05rem;
      font-weight: 800;
      color: var(--text-primary);
    }
    .pnl-item-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      padding-left: 0.85rem;
    }
    .pnl-item {
      display: flex;
      justify-content: space-between;
      padding: 0.35rem 0.85rem;
      font-size: 0.85rem;
      color: var(--text-secondary);
      border-bottom: 1px dashed rgba(255, 255, 255, 0.05);
    }
    .highlight-strip {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem 1.5rem;
      border-radius: 12px;
    }
    .gross-profit {
      background: rgba(99, 102, 241, 0.1);
      border: 1px solid rgba(99, 102, 241, 0.3);
      color: #818cf8;
    }
    .net-profit {
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: #34d399;
    }
    .highlight-label {
      font-size: 1rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      display: block;
    }
    .highlight-meta {
      font-size: 0.75rem;
      opacity: 0.8;
    }
    .highlight-val {
      font-size: 1.5rem;
      font-weight: 900;
    }
    .balance-sheet-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }
    .bs-column {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      background: rgba(255, 255, 255, 0.015);
      border: 1px solid var(--border-subtle);
      border-radius: 12px;
      padding: 1.25rem;
    }
    .bs-col-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 0.75rem;
      border-bottom: 2px solid var(--border-subtle);
    }
    .bs-col-header h3 {
      font-size: 1rem;
      font-weight: 800;
      color: var(--text-primary);
    }
    .bs-subgroup {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .bs-sub-title {
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
    }
    .bs-line {
      display: flex;
      justify-content: space-between;
      font-size: 0.85rem;
      color: var(--text-secondary);
      padding: 0.2rem 0;
    }
    .bs-sub-total {
      display: flex;
      justify-content: space-between;
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--text-primary);
      padding-top: 0.4rem;
      border-top: 1px dashed rgba(255, 255, 255, 0.1);
    }
    .bs-col-footer {
      margin-top: auto;
      padding-top: 1rem;
      border-top: 2px solid var(--border-subtle);
      display: flex;
      justify-content: space-between;
      font-size: 1rem;
      font-weight: 800;
    }
    .gst-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }
    .gst-box {
      background: rgba(255, 255, 255, 0.015);
      border: 1px solid var(--border-subtle);
      border-radius: 12px;
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .gst-box.outward { border-left: 4px solid #6366f1; }
    .gst-box.inward { border-left: 4px solid #10b981; }
    .gst-box-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid var(--border-subtle);
    }
    .gst-box-header h3 {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--text-primary);
    }
    .gst-total {
      font-size: 1.15rem;
      font-weight: 800;
      color: var(--text-primary);
    }
    .gst-details {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .gst-line {
      display: flex;
      justify-content: space-between;
      font-size: 0.85rem;
      color: var(--text-secondary);
    }
    .gst-settlement-card {
      background: rgba(99, 102, 241, 0.08);
      border: 1px solid rgba(99, 102, 241, 0.3);
      border-radius: 14px;
      padding: 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1.5rem;
    }
    .settle-left {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .settle-title {
      font-size: 1.1rem;
      font-weight: 800;
      color: var(--text-primary);
    }
    .settle-subtitle {
      font-size: 0.8rem;
      color: var(--text-secondary);
    }
    .settle-breakdown {
      display: flex;
      gap: 0.75rem;
      align-items: center;
      font-size: 0.8rem;
      color: var(--text-secondary);
      margin-top: 0.5rem;
    }
    .settle-right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }
    .settle-val-label {
      font-size: 0.7rem;
      font-weight: 700;
      color: var(--text-muted);
      letter-spacing: 0.05em;
    }
    .settle-amount {
      font-size: 1.75rem;
      font-weight: 900;
      color: #34d399;
    }
    .text-right { text-align: right; }
    .text-accent { color: #818cf8; }
    .text-rose-400 { color: #fb7185; }
    .text-emerald-400 { color: #34d399; }
  `]
})
export class FinancialReportsComponent implements OnInit {
  private accountingService = inject(AccountingService);
  private notification = inject(NotificationService);

  activeTab = signal<ReportTab>('trial-balance');
  loading = signal(false);

  trialBalance = signal<TrialBalanceReport | null>(null);
  profitLoss = signal<ProfitLossReport | null>(null);
  balanceSheet = signal<BalanceSheetReport | null>(null);
  gstSummary = signal<GstSummaryReport | null>(null);

  ngOnInit(): void {
    this.fetchCurrentReport();
  }

  switchTab(tab: ReportTab): void {
    this.activeTab.set(tab);
    this.fetchCurrentReport();
  }

  fetchCurrentReport(): void {
    this.loading.set(true);
    switch (this.activeTab()) {
      case 'trial-balance':
        this.accountingService.getTrialBalance().subscribe({
          next: (res) => {
            this.loading.set(false);
            if (res.isSuccess && res.data) {
              this.trialBalance.set(res.data);
            }
          },
          error: () => {
            this.loading.set(false);
            this.notification.error('Failed to load Trial Balance.');
          }
        });
        break;

      case 'profit-loss':
        this.accountingService.getProfitLoss().subscribe({
          next: (res) => {
            this.loading.set(false);
            if (res.isSuccess && res.data) {
              this.profitLoss.set(res.data);
            }
          },
          error: () => {
            this.loading.set(false);
            this.notification.error('Failed to load Profit & Loss statement.');
          }
        });
        break;

      case 'balance-sheet':
        this.accountingService.getBalanceSheet().subscribe({
          next: (res) => {
            this.loading.set(false);
            if (res.isSuccess && res.data) {
              this.balanceSheet.set(res.data);
            }
          },
          error: () => {
            this.loading.set(false);
            this.notification.error('Failed to load Balance Sheet.');
          }
        });
        break;

      case 'gst-summary':
        this.accountingService.getGstSummary().subscribe({
          next: (res) => {
            this.loading.set(false);
            if (res.isSuccess && res.data) {
              this.gstSummary.set(res.data);
            }
          },
          error: () => {
            this.loading.set(false);
            this.notification.error('Failed to load GST Summary.');
          }
        });
        break;
    }
  }

  getGrossMargin(): number {
    const pnl = this.profitLoss();
    if (!pnl || pnl.revenue.subtotal <= 0) return 0;
    return (pnl.grossProfit / pnl.revenue.subtotal) * 100;
  }

  printReport(): void {
    window.print();
  }
}
