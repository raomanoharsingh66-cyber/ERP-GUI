import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ApiResponse } from '../models/api-response.model';
import { PagedResult } from './sales.service';
import {
  Account,
  AccountType,
  CreateAccountRequest,
  UpdateAccountRequest,
  JournalEntry,
  CreateJournalEntryRequest,
  TrialBalanceReport,
  ProfitLossReport,
  BalanceSheetReport,
  GstSummaryReport
} from '../models/accounting.models';

@Injectable({
  providedIn: 'root'
})
export class AccountingService {
  private api = inject(ApiService);

  // Chart of Accounts
  getAccounts(type?: AccountType): Observable<ApiResponse<Account[]>> {
    return this.api.get<Account[]>('accounts', { type });
  }

  getAccountById(id: string): Observable<ApiResponse<Account>> {
    return this.api.get<Account>(`accounts/${id}`);
  }

  createAccount(dto: CreateAccountRequest): Observable<ApiResponse<Account>> {
    return this.api.post<Account>('accounts', dto);
  }

  updateAccount(id: string, dto: UpdateAccountRequest): Observable<ApiResponse<Account>> {
    return this.api.put<Account>(`accounts/${id}`, dto);
  }

  // Journal Entries
  getJournalEntries(filter?: {
    fromDate?: string;
    toDate?: string;
    accountId?: string;
    entryType?: number;
    search?: string;
    pageIndex?: number;
    pageSize?: number;
  }): Observable<ApiResponse<PagedResult<JournalEntry>>> {
    return this.api.get<PagedResult<JournalEntry>>('journalentries', filter);
  }

  getJournalEntryById(id: string): Observable<ApiResponse<JournalEntry>> {
    return this.api.get<JournalEntry>(`journalentries/${id}`);
  }

  createJournalEntry(dto: CreateJournalEntryRequest): Observable<ApiResponse<JournalEntry>> {
    return this.api.post<JournalEntry>('journalentries', dto);
  }

  // Financial Reports
  getTrialBalance(asOfDate?: string): Observable<ApiResponse<TrialBalanceReport>> {
    return this.api.get<TrialBalanceReport>('reports/trial-balance', { asOfDate });
  }

  getProfitLoss(fromDate?: string, toDate?: string): Observable<ApiResponse<ProfitLossReport>> {
    return this.api.get<ProfitLossReport>('reports/profit-loss', { fromDate, toDate });
  }

  getBalanceSheet(asOfDate?: string): Observable<ApiResponse<BalanceSheetReport>> {
    return this.api.get<BalanceSheetReport>('reports/balance-sheet', { asOfDate });
  }

  getGstSummary(fromDate?: string, toDate?: string): Observable<ApiResponse<GstSummaryReport>> {
    return this.api.get<GstSummaryReport>('reports/gst-summary', { fromDate, toDate });
  }
}
