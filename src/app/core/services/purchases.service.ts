import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ApiResponse } from '../models/api-response.model';
import { PagedResult } from './sales.service';
import {
  Supplier,
  CreateSupplierRequest,
  PurchaseOrder,
  CreatePurchaseOrderRequest,
  GoodsReceiptNote,
  CreateGoodsReceiptNoteRequest,
  PurchaseBill,
  CreatePurchaseBillRequest,
  VendorPayment,
  RecordVendorPaymentRequest,
  PurchaseSummary
} from '../models/purchases.models';

@Injectable({
  providedIn: 'root'
})
export class PurchasesService {
  private api = inject(ApiService);

  // Suppliers
  getSuppliers(search?: string, isActive?: boolean, page: number = 1, pageSize: number = 20): Observable<ApiResponse<PagedResult<Supplier>>> {
    return this.api.get<PagedResult<Supplier>>('suppliers', { search, isActive, page, pageSize });
  }

  getSupplierById(id: string): Observable<ApiResponse<Supplier>> {
    return this.api.get<Supplier>(`suppliers/${id}`);
  }

  createSupplier(dto: CreateSupplierRequest): Observable<ApiResponse<Supplier>> {
    return this.api.post<Supplier>('suppliers', dto);
  }

  updateSupplier(id: string, dto: any): Observable<ApiResponse<Supplier>> {
    return this.api.put<Supplier>(`suppliers/${id}`, dto);
  }

  deleteSupplier(id: string): Observable<ApiResponse<boolean>> {
    return this.api.delete<boolean>(`suppliers/${id}`);
  }

  // Purchase Orders
  getOrders(supplierId?: string, status?: number, page: number = 1, pageSize: number = 20): Observable<ApiResponse<PagedResult<PurchaseOrder>>> {
    return this.api.get<PagedResult<PurchaseOrder>>('purchase-orders', { supplierId, status, page, pageSize });
  }

  getOrderById(id: string): Observable<ApiResponse<PurchaseOrder>> {
    return this.api.get<PurchaseOrder>(`purchase-orders/${id}`);
  }

  createOrder(dto: CreatePurchaseOrderRequest): Observable<ApiResponse<PurchaseOrder>> {
    return this.api.post<PurchaseOrder>('purchase-orders', dto);
  }

  updateOrderStatus(id: string, status: number): Observable<ApiResponse<PurchaseOrder>> {
    return this.api.patch<PurchaseOrder>(`purchase-orders/${id}/status`, { status });
  }

  // Goods Receipt Notes (GRN)
  getGRNs(purchaseOrderId?: string, supplierId?: string, page: number = 1, pageSize: number = 20): Observable<ApiResponse<PagedResult<GoodsReceiptNote>>> {
    return this.api.get<PagedResult<GoodsReceiptNote>>('goods-receipt-notes', { purchaseOrderId, supplierId, page, pageSize });
  }

  getGRNById(id: string): Observable<ApiResponse<GoodsReceiptNote>> {
    return this.api.get<GoodsReceiptNote>(`goods-receipt-notes/${id}`);
  }

  createGRN(dto: CreateGoodsReceiptNoteRequest): Observable<ApiResponse<GoodsReceiptNote>> {
    return this.api.post<GoodsReceiptNote>('goods-receipt-notes', dto);
  }

  // Purchase Bills
  getBills(supplierId?: string, status?: number, page: number = 1, pageSize: number = 20): Observable<ApiResponse<PagedResult<PurchaseBill>>> {
    return this.api.get<PagedResult<PurchaseBill>>('purchase-bills', { supplierId, status, page, pageSize });
  }

  getBillById(id: string): Observable<ApiResponse<PurchaseBill>> {
    return this.api.get<PurchaseBill>(`purchase-bills/${id}`);
  }

  getSummary(): Observable<ApiResponse<PurchaseSummary>> {
    return this.api.get<PurchaseSummary>('purchase-bills/summary');
  }

  createBill(dto: CreatePurchaseBillRequest): Observable<ApiResponse<PurchaseBill>> {
    return this.api.post<PurchaseBill>('purchase-bills', dto);
  }

  cancelBill(id: string): Observable<ApiResponse<boolean>> {
    return this.api.post<boolean>(`purchase-bills/${id}/cancel`, {});
  }

  recordPayment(dto: RecordVendorPaymentRequest): Observable<ApiResponse<VendorPayment>> {
    return this.api.post<VendorPayment>('purchase-bills/payments', dto);
  }
}
