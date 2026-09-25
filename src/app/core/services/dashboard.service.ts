import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ApiResponse } from '../models/api-response.model';
import { PagedResult } from './sales.service';
import { DashboardMetrics, AuditLog, BusinessProfile } from '../models/dashboard.models';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private api = inject(ApiService);

  getDashboardStats(): Observable<ApiResponse<DashboardMetrics>> {
    return this.api.get<DashboardMetrics>('dashboard/stats');
  }

  getAuditLogs(filter?: {
    search?: string;
    fromDate?: string;
    toDate?: string;
    page?: number;
    pageSize?: number;
  }): Observable<ApiResponse<PagedResult<AuditLog>>> {
    return this.api.get<PagedResult<AuditLog>>('auditlogs', filter);
  }

  getBusinessProfile(): Observable<ApiResponse<BusinessProfile>> {
    return this.api.get<BusinessProfile>('business/profile');
  }

  updateBusinessProfile(dto: Partial<BusinessProfile>): Observable<ApiResponse<BusinessProfile>> {
    return this.api.put<BusinessProfile>('business/profile', dto);
  }
}
