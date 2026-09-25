import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ApiResponse } from '../models/api-response.model';
import {
  Customer,
  CreateCustomerRequest,
  SalesInvoice,
  CreateSalesInvoiceRequest,
  RecordPaymentRequest,
  SalesPayment,
  SalesSummary,
  SalesOrder
} from '../models/sales.models';

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SalesService {
  private api = inject(ApiService);

  // Customers
  getCustomers(search?: string, isActive?: boolean, page: number = 1, pageSize: number = 20): Observable<ApiResponse<PagedResult<Customer>>> {
    return this.api.get<PagedResult<Customer>>('customers', { search, isActive, page, pageSize });
  }

  getCustomerById(id: string): Observable<ApiResponse<Customer>> {
    return this.api.get<Customer>(`customers/${id}`);
  }

  createCustomer(dto: CreateCustomerRequest): Observable<ApiResponse<Customer>> {
    return this.api.post<Customer>('customers', dto);
  }

  updateCustomer(id: string, dto: any): Observable<ApiResponse<Customer>> {
    return this.api.put<Customer>(`customers/${id}`, dto);
  }

  deleteCustomer(id: string): Observable<ApiResponse<boolean>> {
    return this.api.delete<boolean>(`customers/${id}`);
  }

  // Sales Invoices
  getInvoices(customerId?: string, status?: number, page: number = 1, pageSize: number = 20): Observable<ApiResponse<PagedResult<SalesInvoice>>> {
    return this.api.get<PagedResult<SalesInvoice>>('sales-invoices', { customerId, status, page, pageSize });
  }

  getInvoiceById(id: string): Observable<ApiResponse<SalesInvoice>> {
    return this.api.get<SalesInvoice>(`sales-invoices/${id}`);
  }

  getSummary(): Observable<ApiResponse<SalesSummary>> {
    return this.api.get<SalesSummary>('sales-invoices/summary');
  }

  createInvoice(dto: CreateSalesInvoiceRequest): Observable<ApiResponse<SalesInvoice>> {
    return this.api.post<SalesInvoice>('sales-invoices', dto);
  }

  cancelInvoice(id: string): Observable<ApiResponse<boolean>> {
    return this.api.post<boolean>(`sales-invoices/${id}/cancel`, {});
  }

  recordPayment(dto: RecordPaymentRequest): Observable<ApiResponse<SalesPayment>> {
    return this.api.post<SalesPayment>('sales-invoices/payments', dto);
  }

  // Sales Orders
  getOrders(customerId?: string, status?: number, page: number = 1, pageSize: number = 20): Observable<ApiResponse<PagedResult<SalesOrder>>> {
    return this.api.get<PagedResult<SalesOrder>>('sales-orders', { customerId, status, page, pageSize });
  }
}
