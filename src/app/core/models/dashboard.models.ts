export interface MonthlyTrendItem {
  monthName: string;
  year: number;
  salesRevenue: number;
  purchaseExpense: number;
}

export interface RecentActivityItem {
  activityType: string;
  title: string;
  subtitle: string;
  amount: number;
  timestamp: string;
  statusBadge: string;
  referenceId: string;
}

export interface LowStockAlertItem {
  productId: string;
  productName: string;
  sku: string;
  quantityOnHand: number;
  reorderLevel: number;
  warehouseName: string;
}

export interface DashboardMetrics {
  totalRevenue: number;
  totalReceivables: number;
  totalPayables: number;
  inventoryValuation: number;
  cashBankBalance: number;
  netProfitYTD: number;
  totalProducts: number;
  totalStockQuantity: number;
  lowStockCount: number;
  outOfStockCount: number;
  monthlyTrends: MonthlyTrendItem[];
  recentActivities: RecentActivityItem[];
  lowStockAlerts: LowStockAlertItem[];
}

export interface AuditLog {
  id: number;
  userId?: string;
  userEmail?: string;
  action: string;
  entity: string;
  entityId: string;
  oldValue?: string;
  newValue?: string;
  ipAddress?: string;
  timestamp: string;
}

export interface BusinessProfile {
  id: string;
  businessCode: string;
  name: string;
  legalName?: string;
  gstNumber?: string;
  panNumber?: string;
  email: string;
  phone?: string;
  address?: string;
  currency: string;
  isActive: boolean;
  createdOn: string;
}
