export interface Supplier {
  id: string;
  supplierCode: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  gstin?: string;
  pan?: string;
  billingAddress?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  paymentTermsDays: number;
  outstandingPayable: number;
  isActive: boolean;
  notes?: string;
  createdOn: string;
}

export interface CreateSupplierRequest {
  name: string;
  supplierCode?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  gstin?: string;
  pan?: string;
  billingAddress?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  paymentTermsDays: number;
  notes?: string;
}

export interface PurchaseOrderItem {
  id?: string;
  productId: string;
  productSKU?: string;
  productName?: string;
  unitOfMeasure?: string;
  orderedQuantity: number;
  receivedQuantity: number;
  pendingQuantity?: number;
  unitPrice: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  notes?: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  orderDate: string;
  expectedDeliveryDate?: string;
  supplierId: string;
  supplierName: string;
  supplierCode: string;
  warehouseId: string;
  warehouseName: string;
  status: number;
  statusName: string;
  subTotal: number;
  taxAmount: number;
  totalAmount: number;
  notes?: string;
  items: PurchaseOrderItem[];
  createdOn: string;
}

export interface CreatePurchaseOrderItemRequest {
  productId: string;
  orderedQuantity: number;
  unitPrice: number;
  taxRate: number;
  notes?: string;
}

export interface CreatePurchaseOrderRequest {
  supplierId: string;
  warehouseId: string;
  orderDate: string;
  expectedDeliveryDate?: string;
  notes?: string;
  items: CreatePurchaseOrderItemRequest[];
}

export interface GoodsReceiptNoteItem {
  id?: string;
  productId: string;
  productSKU?: string;
  productName?: string;
  unitOfMeasure?: string;
  purchaseOrderItemId?: string;
  receivedQuantity: number;
  acceptedQuantity: number;
  rejectedQuantity: number;
  unitPrice: number;
  rejectionReason?: string;
  notes?: string;
}

export interface GoodsReceiptNote {
  id: string;
  grnNumber: string;
  receiptDate: string;
  purchaseOrderId?: string;
  poNumber?: string;
  supplierId: string;
  supplierName: string;
  warehouseId: string;
  warehouseName: string;
  supplierDeliveryNoteNo?: string;
  status: number;
  statusName: string;
  notes?: string;
  items: GoodsReceiptNoteItem[];
  createdOn: string;
}

export interface CreateGoodsReceiptNoteRequest {
  purchaseOrderId?: string;
  supplierId: string;
  warehouseId: string;
  receiptDate: string;
  supplierDeliveryNoteNo?: string;
  notes?: string;
  items: {
    productId: string;
    purchaseOrderItemId?: string;
    receivedQuantity: number;
    acceptedQuantity: number;
    rejectedQuantity: number;
    unitPrice: number;
    rejectionReason?: string;
    notes?: string;
  }[];
}

export interface PurchaseBillItem {
  id?: string;
  productId: string;
  productSKU?: string;
  productName?: string;
  unitOfMeasure?: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  notes?: string;
}

export interface VendorPayment {
  id: string;
  paymentNumber: string;
  purchaseBillId: string;
  billNumber: string;
  supplierId: string;
  supplierName: string;
  paymentDate: string;
  amount: number;
  method: number;
  methodName: string;
  referenceNumber?: string;
  notes?: string;
  createdOn: string;
}

export interface PurchaseBill {
  id: string;
  billNumber: string;
  vendorInvoiceNumber?: string;
  billDate: string;
  dueDate: string;
  purchaseOrderId?: string;
  poNumber?: string;
  supplierId: string;
  supplierName: string;
  supplierCode: string;
  supplierGSTIN?: string;
  warehouseId: string;
  warehouseName: string;
  status: number;
  statusName: string;
  subTotal: number;
  taxAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  notes?: string;
  items: PurchaseBillItem[];
  payments: VendorPayment[];
  createdOn: string;
}

export interface CreatePurchaseBillRequest {
  supplierId: string;
  warehouseId: string;
  purchaseOrderId?: string;
  vendorInvoiceNumber?: string;
  billDate: string;
  dueDate: string;
  isInterstate: boolean;
  notes?: string;
  items: {
    productId: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
    notes?: string;
  }[];
}

export interface RecordVendorPaymentRequest {
  purchaseBillId: string;
  amount: number;
  method: number;
  paymentDate: string;
  referenceNumber?: string;
  notes?: string;
}

export interface PurchaseSummary {
  totalPurchases: number;
  totalDisbursed: number;
  totalOutstandingPayables: number;
  totalOverduePayables: number;
  totalBillsCount: number;
  pendingOrdersCount: number;
  activeSuppliersCount: number;
}
