export interface Customer {
  id: string;
  customerCode: string;
  name: string;
  email?: string;
  phone?: string;
  gstin?: string;
  pan?: string;
  billingAddress?: string;
  billingCity?: string;
  billingState?: string;
  billingPostalCode?: string;
  billingCountry?: string;
  shippingAddress?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingPostalCode?: string;
  shippingCountry?: string;
  creditLimit: number;
  outstandingBalance: number;
  isActive: boolean;
  notes?: string;
  createdOn: string;
}

export interface CreateCustomerRequest {
  name: string;
  customerCode?: string;
  email?: string;
  phone?: string;
  gstin?: string;
  pan?: string;
  billingAddress?: string;
  billingCity?: string;
  billingState?: string;
  billingPostalCode?: string;
  billingCountry?: string;
  shippingAddress?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingPostalCode?: string;
  shippingCountry?: string;
  creditLimit: number;
  notes?: string;
}

export interface SalesOrderItem {
  id?: string;
  productId: string;
  productSKU?: string;
  productName?: string;
  unitOfMeasure?: string;
  quantity: number;
  unitPrice: number;
  discountPercentage: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  notes?: string;
}

export interface SalesOrder {
  id: string;
  orderNumber: string;
  orderDate: string;
  expectedDeliveryDate?: string;
  customerId: string;
  customerName: string;
  customerCode: string;
  warehouseId: string;
  warehouseName: string;
  status: number;
  statusName: string;
  subTotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  notes?: string;
  items: SalesOrderItem[];
  createdOn: string;
}

export interface SalesInvoiceItem {
  id?: string;
  productId: string;
  productSKU?: string;
  productName?: string;
  unitOfMeasure?: string;
  quantity: number;
  unitPrice: number;
  discountPercentage: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  notes?: string;
}

export interface SalesPayment {
  id: string;
  paymentNumber: string;
  salesInvoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  paymentDate: string;
  amount: number;
  method: number;
  methodName: string;
  referenceNumber?: string;
  notes?: string;
  createdOn: string;
}

export interface SalesInvoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  salesOrderId?: string;
  orderNumber?: string;
  customerId: string;
  customerName: string;
  customerCode: string;
  customerGSTIN?: string;
  customerBillingAddress?: string;
  customerBillingCity?: string;
  customerBillingState?: string;
  warehouseId: string;
  warehouseName: string;
  status: number;
  statusName: string;
  subTotal: number;
  discountAmount: number;
  taxAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  notes?: string;
  items: SalesInvoiceItem[];
  payments: SalesPayment[];
  createdOn: string;
}

export interface CreateSalesInvoiceItemRequest {
  productId: string;
  quantity: number;
  unitPrice: number;
  discountPercentage: number;
  taxRate: number;
  notes?: string;
}

export interface CreateSalesInvoiceRequest {
  customerId: string;
  warehouseId: string;
  salesOrderId?: string;
  invoiceDate: string;
  dueDate: string;
  isInterstate: boolean;
  notes?: string;
  items: CreateSalesInvoiceItemRequest[];
}

export interface RecordPaymentRequest {
  salesInvoiceId: string;
  amount: number;
  method: number;
  paymentDate: string;
  referenceNumber?: string;
  notes?: string;
}

export interface SalesSummary {
  totalSales: number;
  totalPaid: number;
  totalOutstanding: number;
  totalOverdue: number;
  totalInvoicesCount: number;
  pendingOrdersCount: number;
  activeCustomersCount: number;
}
